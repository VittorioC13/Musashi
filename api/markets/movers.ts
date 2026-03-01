import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Market } from '../../src/types/market';
import { fetchPolymarkets } from '../../src/api/polymarket-client';
import { fetchKalshiMarkets } from '../../src/api/kalshi-client';

// In-memory price tracking (simple implementation for serverless)
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

// In-memory cache for markets and price history
let cachedMarkets: Market[] = [];
let cacheTimestamp = 0;
let priceHistory: Map<string, PriceSnapshot[]> = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;
const HISTORY_TTL_MS = 24 * 60 * 60 * 1000; // Keep 24 hours

/**
 * Fetch and cache markets from both platforms
 */
async function getMarkets(): Promise<Market[]> {
  const now = Date.now();

  // Return cached if fresh
  if (cachedMarkets.length > 0 && (now - cacheTimestamp) < CACHE_TTL_MS) {
    console.log(`[Movers API] Using cached ${cachedMarkets.length} markets`);
    return cachedMarkets;
  }

  // Fetch fresh markets
  console.log('[Movers API] Fetching fresh markets...');

  try {
    const [polyResult, kalshiResult] = await Promise.allSettled([
      fetchPolymarkets(500, 10),
      fetchKalshiMarkets(400, 10),
    ]);

    const polyMarkets = polyResult.status === 'fulfilled' ? polyResult.value : [];
    const kalshiMarkets = kalshiResult.status === 'fulfilled' ? kalshiResult.value : [];

    cachedMarkets = [...polyMarkets, ...kalshiMarkets];
    cacheTimestamp = now;

    // Record price snapshots
    recordPriceSnapshots(cachedMarkets);

    console.log(`[Movers API] Cached ${cachedMarkets.length} markets`);
    return cachedMarkets;
  } catch (error) {
    console.error('[Movers API] Failed to fetch markets:', error);
    // Return stale cache if available
    return cachedMarkets;
  }
}

/**
 * Record price snapshots for markets
 */
function recordPriceSnapshots(markets: Market[]): void {
  const now = Date.now();
  const cutoff = now - HISTORY_TTL_MS;

  for (const market of markets) {
    if (!priceHistory.has(market.id)) {
      priceHistory.set(market.id, []);
    }

    const snapshots = priceHistory.get(market.id)!;

    // Add new snapshot
    snapshots.push({
      marketId: market.id,
      yesPrice: market.yesPrice,
      timestamp: now,
    });

    // Keep only recent snapshots
    const filtered = snapshots.filter(s => s.timestamp >= cutoff);
    priceHistory.set(market.id, filtered);
  }
}

/**
 * Get price change for a market
 */
function getPriceChange(marketId: string, hoursAgo: number): number | null {
  const snapshots = priceHistory.get(marketId);
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
 * Detect market movers
 */
function detectMovers(markets: Market[], minChange: number): MarketMover[] {
  const movers: MarketMover[] = [];

  for (const market of markets) {
    const change1h = getPriceChange(market.id, 1);

    if (change1h === null) continue;

    const absChange = Math.abs(change1h);
    if (absChange >= minChange) {
      const snapshots = priceHistory.get(market.id);
      const previousPrice = snapshots && snapshots.length > 1
        ? snapshots[snapshots.length - 2].yesPrice
        : market.yesPrice;

      movers.push({
        market,
        priceChange1h: change1h,
        previousPrice,
        currentPrice: market.yesPrice,
        direction: change1h > 0 ? 'up' : 'down',
        timestamp: Date.now(),
      });
    }
  }

  // Sort by absolute change
  movers.sort((a, b) => Math.abs(b.priceChange1h) - Math.abs(a.priceChange1h));

  return movers;
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

    // Detect movers
    let movers = detectMovers(markets, minChangeNum);

    // Filter by category if specified
    if (category) {
      movers = movers.filter(m => m.market.category === category);
    }

    // Limit results
    movers = movers.slice(0, limitNum);

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
          price_snapshots_stored: Array.from(priceHistory.values()).reduce((sum, arr) => sum + arr.length, 0),
        },
      },
      note: 'Serverless movers tracking uses in-memory storage. For persistent tracking across requests, use the Chrome extension or a stateful backend.',
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('[Movers API] Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
