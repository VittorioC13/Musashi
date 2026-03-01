import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Market } from '../../src/types/market';
import { fetchPolymarkets } from '../../src/api/polymarket-client';
import { fetchKalshiMarkets } from '../../src/api/kalshi-client';
import { getTopArbitrage } from '../../src/api/arbitrage-detector';

// In-memory cache for markets (5 minutes TTL)
let cachedMarkets: Market[] = [];
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Fetch and cache markets from both platforms
 */
async function getMarkets(): Promise<Market[]> {
  const now = Date.now();

  // Return cached if fresh
  if (cachedMarkets.length > 0 && (now - cacheTimestamp) < CACHE_TTL_MS) {
    console.log(`[Arbitrage API] Using cached ${cachedMarkets.length} markets`);
    return cachedMarkets;
  }

  // Fetch fresh markets
  console.log('[Arbitrage API] Fetching fresh markets...');

  try {
    const [polyResult, kalshiResult] = await Promise.allSettled([
      fetchPolymarkets(500, 10),
      fetchKalshiMarkets(400, 10),
    ]);

    const polyMarkets = polyResult.status === 'fulfilled' ? polyResult.value : [];
    const kalshiMarkets = kalshiResult.status === 'fulfilled' ? kalshiResult.value : [];

    cachedMarkets = [...polyMarkets, ...kalshiMarkets];
    cacheTimestamp = now;

    console.log(`[Arbitrage API] Cached ${cachedMarkets.length} markets`);
    return cachedMarkets;
  } catch (error) {
    console.error('[Arbitrage API] Failed to fetch markets:', error);
    // Return stale cache if available
    return cachedMarkets;
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
      minSpread = '0.03',
      minConfidence = '0.5',
      limit = '20',
      category,
    } = req.query;

    const minSpreadNum = parseFloat(minSpread as string);
    const minConfidenceNum = parseFloat(minConfidence as string);
    const limitNum = parseInt(limit as string, 10);

    // Validate parameters
    if (isNaN(minSpreadNum) || minSpreadNum < 0 || minSpreadNum > 1) {
      res.status(400).json({
        success: false,
        error: 'Invalid minSpread. Must be between 0 and 1.',
      });
      return;
    }

    if (isNaN(minConfidenceNum) || minConfidenceNum < 0 || minConfidenceNum > 1) {
      res.status(400).json({
        success: false,
        error: 'Invalid minConfidence. Must be between 0 and 1.',
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

    // Detect arbitrage
    const opportunities = getTopArbitrage(markets, {
      minSpread: minSpreadNum,
      minConfidence: minConfidenceNum,
      limit: limitNum,
      category: category as string | undefined,
    });

    // Build response
    const response = {
      success: true,
      data: {
        opportunities,
        count: opportunities.length,
        timestamp: new Date().toISOString(),
        filters: {
          minSpread: minSpreadNum,
          minConfidence: minConfidenceNum,
          limit: limitNum,
          category: category || null,
        },
        metadata: {
          processing_time_ms: Date.now() - startTime,
          markets_analyzed: markets.length,
          polymarket_count: markets.filter(m => m.platform === 'polymarket').length,
          kalshi_count: markets.filter(m => m.platform === 'kalshi').length,
        },
      },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('[Arbitrage API] Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
