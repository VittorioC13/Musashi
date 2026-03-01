/**
 * Polymarket CLOB Price Poller
 *
 * Lightweight price polling for Polymarket markets using the CLOB API.
 * Fetches only price data (not full market objects) for efficient updates.
 *
 * CLOB API: https://clob.polymarket.com
 */

import { Market } from '../types/market';

const CLOB_API = 'https://clob.polymarket.com';

/**
 * CLOB price response format
 */
interface CLOBPriceResponse {
  price: string;  // e.g., "0.67"
}

/**
 * Fetch current price for a single Polymarket market from CLOB API
 *
 * @param numericId - Polymarket numeric ID (from market.numericId)
 * @returns YES price as number (0-1), or null if fetch fails
 */
export async function fetchPolymarketPrice(numericId: string): Promise<number | null> {
  try {
    const url = `${CLOB_API}/price?token_id=${numericId}`;

    // Add 5-second timeout to prevent hanging
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      console.warn(`[Polymarket CLOB] Failed to fetch price for ${numericId}: HTTP ${response.status}`);
      return null;
    }

    const data: CLOBPriceResponse = await response.json();
    const price = parseFloat(data.price);

    if (isNaN(price) || price < 0 || price > 1) {
      console.warn(`[Polymarket CLOB] Invalid price for ${numericId}: ${data.price}`);
      return null;
    }

    return price;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn(`[Polymarket CLOB] Timeout fetching price for ${numericId}`);
    } else {
      console.error(`[Polymarket CLOB] Error fetching price for ${numericId}:`, error);
    }
    return null;
  }
}

/**
 * Batch fetch prices for multiple Polymarket markets
 *
 * Fetches prices sequentially with a small delay to avoid rate limiting.
 * Only updates markets that have numericId set.
 *
 * @param markets - Markets to update prices for
 * @param delayMs - Delay between requests (default: 50ms)
 * @returns Markets with updated prices
 */
export async function batchFetchPolymarketPrices(
  markets: Market[],
  delayMs: number = 50
): Promise<Market[]> {
  const updatedMarkets: Market[] = [];

  for (const market of markets) {
    // Only fetch for Polymarket markets with numericId
    if (market.platform !== 'polymarket' || !market.numericId) {
      updatedMarkets.push(market);
      continue;
    }

    // Fetch fresh price from CLOB
    const freshPrice = await fetchPolymarketPrice(market.numericId);

    if (freshPrice !== null) {
      // Update market with fresh price
      const updated: Market = {
        ...market,
        yesPrice: parseFloat(freshPrice.toFixed(2)),
        noPrice: parseFloat((1 - freshPrice).toFixed(2)),
        lastUpdated: new Date().toISOString(),
      };
      updatedMarkets.push(updated);
    } else {
      // Keep existing price if fetch failed
      updatedMarkets.push(market);
    }

    // Small delay to avoid rate limiting
    if (delayMs > 0 && markets.indexOf(market) < markets.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  const updatedCount = updatedMarkets.filter((m, i) =>
    m.platform === 'polymarket' && m.yesPrice !== markets[i].yesPrice
  ).length;

  console.log(`[Polymarket CLOB] Updated ${updatedCount}/${markets.filter(m => m.platform === 'polymarket').length} Polymarket prices`);

  return updatedMarkets;
}

/**
 * Parallel batch fetch with controlled concurrency
 *
 * Faster than sequential but respects concurrency limits.
 *
 * @param markets - Markets to update prices for
 * @param concurrency - Max concurrent requests (default: 5)
 * @returns Markets with updated prices
 */
export async function parallelFetchPolymarketPrices(
  markets: Market[],
  concurrency: number = 5
): Promise<Market[]> {
  const polymarketMarkets = markets.filter(m =>
    m.platform === 'polymarket' && m.numericId
  );

  if (polymarketMarkets.length === 0) {
    return markets;
  }

  // Fetch prices in batches with controlled concurrency
  const prices: Map<string, number> = new Map();

  for (let i = 0; i < polymarketMarkets.length; i += concurrency) {
    const batch = polymarketMarkets.slice(i, i + concurrency);

    const results = await Promise.allSettled(
      batch.map(async (m) => {
        const price = await fetchPolymarketPrice(m.numericId!);
        return { id: m.id, price };
      })
    );

    // Collect successful results
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value.price !== null) {
        prices.set(result.value.id, result.value.price);
      }
    }
  }

  // Update markets with fetched prices
  const updatedMarkets = markets.map(market => {
    if (market.platform !== 'polymarket' || !prices.has(market.id)) {
      return market;
    }

    const freshPrice = prices.get(market.id)!;
    return {
      ...market,
      yesPrice: parseFloat(freshPrice.toFixed(2)),
      noPrice: parseFloat((1 - freshPrice).toFixed(2)),
      lastUpdated: new Date().toISOString(),
    };
  });

  console.log(`[Polymarket CLOB] Updated ${prices.size}/${polymarketMarkets.length} Polymarket prices (parallel)`);

  return updatedMarkets;
}
