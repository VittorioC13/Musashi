// Price Fetcher Service
// Orchestrates live price fetching from Polymarket and Kalshi with caching

import { getPolymarketPrice, PolymarketPrice } from '../integrations/polymarket-client';
import { getKalshiPrice, KalshiPrice } from '../integrations/kalshi-client';
import { getCachedPrice, setCachedPrice } from './price-cache';
import type { Market } from '../types/market';

export interface LivePrice {
  yesPrice: number;
  noPrice: number;
  volume?: number;
  liquidity?: number;
  lastPrice?: number;
  isLive: boolean;
}

/**
 * Fetch live price for a market, with caching and fallback
 * @param market - Market object with platform and IDs
 * @returns Live price data (or mock if fetch fails)
 */
export async function fetchLivePrice(market: Market): Promise<LivePrice> {
  const cacheKey = `${market.platform}_${market.id}`;

  // 1. Check cache first (fast path)
  const cached = getCachedPrice(cacheKey);
  if (cached) {
    return cached;
  }

  // 2. Fetch live price based on platform
  try {
    let livePrice: LivePrice;

    if (market.platform === 'polymarket') {
      // Check if market has real Polymarket ID
      const polymarketId = (market as any).polymarket_id;
      if (!polymarketId) {
        // No real ID - return mock price
        return {
          yesPrice: market.yesPrice,
          noPrice: market.noPrice,
          volume: market.volume24h,
          isLive: false,
        };
      }

      // Fetch from Polymarket API
      const polyPrice = await getPolymarketPrice(polymarketId);
      livePrice = {
        yesPrice: polyPrice.yesPrice,
        noPrice: polyPrice.noPrice,
        volume: polyPrice.volume,
        liquidity: polyPrice.liquidity,
        isLive: true,
      };
    } else if (market.platform === 'kalshi') {
      // Check if market has real Kalshi ticker
      const ticker = (market as any).ticker;
      if (!ticker) {
        // No real ticker - return mock price
        return {
          yesPrice: market.yesPrice,
          noPrice: market.noPrice,
          volume: market.volume24h,
          isLive: false,
        };
      }

      // Fetch from Kalshi API
      const kalshiPrice = await getKalshiPrice(ticker);
      livePrice = {
        yesPrice: kalshiPrice.yesPrice,
        noPrice: kalshiPrice.noPrice,
        volume: kalshiPrice.volume,
        lastPrice: kalshiPrice.lastPrice,
        isLive: true,
      };
    } else {
      // Unknown platform - return mock price
      return {
        yesPrice: market.yesPrice,
        noPrice: market.noPrice,
        volume: market.volume24h,
        isLive: false,
      };
    }

    // 3. Cache for 5 minutes
    setCachedPrice(cacheKey, livePrice);
    return livePrice;

  } catch (error) {
    console.error(`[Price Fetcher] Failed to fetch price for ${market.id}:`, error);

    // 4. Fallback to mock price on error
    return {
      yesPrice: market.yesPrice,
      noPrice: market.noPrice,
      volume: market.volume24h,
      isLive: false,
    };
  }
}

/**
 * Fetch prices for multiple markets in parallel
 * @param markets - Array of markets
 * @returns Array of live prices
 */
export async function fetchMultiplePrices(markets: Market[]): Promise<LivePrice[]> {
  const pricePromises = markets.map(market => fetchLivePrice(market));
  return await Promise.all(pricePromises);
}
