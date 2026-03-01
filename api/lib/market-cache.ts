/**
 * Shared market cache for Vercel API endpoints
 * Prevents duplicate market fetching across endpoints
 */

import { Market } from '../../src/types/market';
import { fetchPolymarkets } from '../../src/api/polymarket-client';
import { fetchKalshiMarkets } from '../../src/api/kalshi-client';

// In-memory cache for markets (5 minutes TTL)
let cachedMarkets: Market[] = [];
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Fetch and cache markets from both platforms
 * Shared across all API endpoints to avoid duplicate fetches
 */
export async function getMarkets(): Promise<Market[]> {
  const now = Date.now();

  // Return cached if fresh
  if (cachedMarkets.length > 0 && (now - cacheTimestamp) < CACHE_TTL_MS) {
    console.log(`[Market Cache] Using cached ${cachedMarkets.length} markets`);
    return cachedMarkets;
  }

  // Fetch fresh markets
  console.log('[Market Cache] Fetching fresh markets...');

  try {
    const [polyResult, kalshiResult] = await Promise.allSettled([
      fetchPolymarkets(500, 10),
      fetchKalshiMarkets(400, 10),
    ]);

    const polyMarkets = polyResult.status === 'fulfilled' ? polyResult.value : [];
    const kalshiMarkets = kalshiResult.status === 'fulfilled' ? kalshiResult.value : [];

    cachedMarkets = [...polyMarkets, ...kalshiMarkets];
    cacheTimestamp = now;

    console.log(`[Market Cache] Cached ${cachedMarkets.length} markets (${polyMarkets.length} Poly + ${kalshiMarkets.length} Kalshi)`);
    return cachedMarkets;
  } catch (error) {
    console.error('[Market Cache] Failed to fetch markets:', error);
    // Return stale cache if available
    return cachedMarkets;
  }
}
