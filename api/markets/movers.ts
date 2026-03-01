import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';
import { Market } from '../../src/types/market';
import { getMarkets } from '../lib/market-cache';

/**
 * Vercel KV-based price tracking for persistent movers detection
 *
 * NOTE: @vercel/kv is deprecated. For new projects, use Upstash Redis
 * integration from Vercel Marketplace. Existing KV stores have been
 * migrated to Upstash Redis automatically.
 *
 * Migration path: https://vercel.com/marketplace?category=storage&search=redis
 */

interface PriceSnapshot {
  marketId: string;
  yesPrice: number;
  timestamp: number;
}

interface MarketMover {
  market: Market;
  priceChange1h: number;
  previousPrice: number;
  currentPrice: number;
  direction: 'up' | 'down';
  timestamp: number;
}

const HISTORY_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days
const SNAPSHOT_KEY_PREFIX = 'price_history:';

/**
 * Get KV key for market price history
 */
function getSnapshotKey(marketId: string): string {
  return `${SNAPSHOT_KEY_PREFIX}${marketId}`;
}

/**
 * Record price snapshots for markets in Vercel KV
 */
async function recordPriceSnapshots(markets: Market[]): Promise<void> {
  const now = Date.now();
  const cutoff = now - (HISTORY_TTL_SECONDS * 1000);

  // Process markets in batches to avoid rate limits
  const batchSize = 50;
  for (let i = 0; i < markets.length; i += batchSize) {
    const batch = markets.slice(i, i + batchSize);

    await Promise.allSettled(
      batch.map(async (market) => {
        const key = getSnapshotKey(market.id);

        // Get existing snapshots
        const snapshots = await kv.get<PriceSnapshot[]>(key) || [];

        // Add new snapshot
        const newSnapshot: PriceSnapshot = {
          marketId: market.id,
          yesPrice: market.yesPrice,
          timestamp: now,
        };

        snapshots.push(newSnapshot);

        // Keep only recent snapshots (within TTL)
        const filtered = snapshots.filter(s => s.timestamp >= cutoff);

        // Store back to KV with TTL
        await kv.setex(key, HISTORY_TTL_SECONDS, filtered);
      })
    );
  }
}

/**
 * Get price change for a market from KV
 */
async function getPriceChange(marketId: string, hoursAgo: number): Promise<number | null> {
  const key = getSnapshotKey(marketId);
  const snapshots = await kv.get<PriceSnapshot[]>(key);

  if (!snapshots || snapshots.length < 2) {
    return null;
  }

  const current = snapshots[snapshots.length - 1];
  const targetTime = Date.now() - (hoursAgo * 60 * 60 * 1000);

  // Find closest snapshot to target time
  let closestSnapshot = snapshots[0];
  let closestDiff = Math.abs(closestSnapshot.timestamp - targetTime);

  for (const snapshot of snapshots) {
    const diff = Math.abs(snapshot.timestamp - targetTime);
    if (diff < closestDiff) {
      closestDiff = diff;
      closestSnapshot = snapshot;
    }
  }

  // If too far from target, return null
  if (closestDiff > (hoursAgo * 60 * 60 * 1000 * 2)) {
    return null;
  }

  return current.yesPrice - closestSnapshot.yesPrice;
}

/**
 * Detect market movers using KV-stored price history
 */
async function detectMovers(markets: Market[], minChange: number): Promise<MarketMover[]> {
  const movers: MarketMover[] = [];

  // Process markets in batches for performance
  const batchSize = 50;
  for (let i = 0; i < markets.length; i += batchSize) {
    const batch = markets.slice(i, i + batchSize);

    const results = await Promise.allSettled(
      batch.map(async (market) => {
        const change1h = await getPriceChange(market.id, 1);

        if (change1h === null) return null;

        const absChange = Math.abs(change1h);
        if (absChange >= minChange) {
          const key = getSnapshotKey(market.id);
          const snapshots = await kv.get<PriceSnapshot[]>(key);
          const previousPrice = snapshots && snapshots.length > 1
            ? snapshots[snapshots.length - 2].yesPrice
            : market.yesPrice;

          return {
            market,
            priceChange1h: change1h,
            previousPrice,
            currentPrice: market.yesPrice,
            direction: change1h > 0 ? 'up' : 'down' as 'up' | 'down',
            timestamp: Date.now(),
          };
        }

        return null;
      })
    );

    // Collect successful results
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value !== null) {
        movers.push(result.value);
      }
    }
  }

  // Sort by absolute change
  movers.sort((a, b) => Math.abs(b.priceChange1h) - Math.abs(a.priceChange1h));

  return movers;
}

/**
 * Get total snapshot count across all markets (for metadata)
 */
async function getTotalSnapshotCount(): Promise<number> {
  try {
    // Scan for all price_history keys
    const keys = await kv.keys(`${SNAPSHOT_KEY_PREFIX}*`);

    if (keys.length === 0) return 0;

    // Get all snapshots
    const snapshots = await Promise.all(
      keys.map(key => kv.get<PriceSnapshot[]>(key))
    );

    // Count total snapshots
    return snapshots.reduce((sum, arr) => sum + (arr?.length || 0), 0);
  } catch (error) {
    console.error('[Movers API] Failed to get snapshot count:', error);
    return 0;
  }
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only accept GET
  if (req.method !== 'GET') {
    res.status(405).json({
      success: false,
      error: 'Method not allowed. Use GET.',
    });
    return;
  }

  const startTime = Date.now();

  try {
    // Parse query parameters
    const {
      minChange = '0.05',
      limit = '20',
      category,
    } = req.query;

    const minChangeNum = parseFloat(minChange as string);
    const limitNum = parseInt(limit as string, 10);

    // Validate parameters
    if (isNaN(minChangeNum) || minChangeNum < 0 || minChangeNum > 1) {
      res.status(400).json({
        success: false,
        error: 'Invalid minChange. Must be between 0 and 1.',
      });
      return;
    }

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      res.status(400).json({
        success: false,
        error: 'Invalid limit. Must be between 1 and 100.',
      });
      return;
    }

    // Get markets
    const markets = await getMarkets();

    if (markets.length === 0) {
      res.status(503).json({
        success: false,
        error: 'No markets available. Service temporarily unavailable.',
      });
      return;
    }

    // Record price snapshots to KV (async, don't block response)
    recordPriceSnapshots(markets).catch(err => {
      console.error('[Movers API] Failed to record snapshots:', err);
    });

    // Detect movers
    let movers = await detectMovers(markets, minChangeNum);

    // Filter by category if specified
    if (category) {
      movers = movers.filter(m => m.market.category === category);
    }

    // Limit results
    movers = movers.slice(0, limitNum);

    // Get snapshot count for metadata
    const snapshotCount = await getTotalSnapshotCount();

    // Build response
    const response = {
      success: true,
      data: {
        movers,
        count: movers.length,
        timestamp: new Date().toISOString(),
        filters: {
          minChange: minChangeNum,
          limit: limitNum,
          category: category || null,
        },
        metadata: {
          processing_time_ms: Date.now() - startTime,
          markets_analyzed: markets.length,
          price_snapshots_stored: snapshotCount,
          storage: 'Vercel KV (Redis)',
          history_retention: '7 days',
        },
      },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('[Movers API] Error:', error);

    // Check if it's a KV error
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    const isKVError = errorMessage.includes('KV') || errorMessage.includes('Redis');

    res.status(500).json({
      success: false,
      error: errorMessage,
      ...(isKVError && {
        note: 'Vercel KV storage error. Ensure KV_REST_API_URL and KV_REST_API_TOKEN are set in Vercel environment variables.',
      }),
    });
  }
}
