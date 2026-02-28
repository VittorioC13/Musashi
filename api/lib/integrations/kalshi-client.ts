// Kalshi API Client
// Fetches live market data from Kalshi's Trade API

const KALSHI_BASE_URL = 'https://api.elections.kalshi.com/trade-api/v2';

interface KalshiMarketResponse {
  ticker: string;
  yes_bid?: number;
  yes_ask?: number;
  no_bid?: number;
  no_ask?: number;
  last_price?: number;
  volume?: number;
  open_interest?: number;
  status?: string;
}

export interface KalshiPrice {
  yesPrice: number;
  noPrice: number;
  volume: number;
  lastPrice: number;
  isLive: true;
}

/**
 * Fetch live price from Kalshi for a specific market
 * @param ticker - Kalshi market ticker (e.g., "FED-26MAR20-R")
 * @returns Live price data or throws error
 */
export async function getKalshiPrice(ticker: string): Promise<KalshiPrice> {
  try {
    const response = await fetch(`${KALSHI_BASE_URL}/markets/${ticker}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Kalshi API error: ${response.status} ${response.statusText}`);
    }

    const data: KalshiMarketResponse = await response.json();

    // Kalshi provides bid/ask prices
    // Use yes_bid as the current "yes" price, no_bid as "no" price
    // Fallback to last_price if bids unavailable
    const yesPrice = data.yes_bid ?? data.last_price ?? 0.5;
    const noPrice = data.no_bid ?? (1 - yesPrice);

    return {
      yesPrice: yesPrice,
      noPrice: noPrice,
      volume: data.volume ?? 0,
      lastPrice: data.last_price ?? yesPrice,
      isLive: true,
    };
  } catch (error) {
    console.error('[Kalshi Client] Error fetching price:', error);
    throw error;
  }
}

/**
 * Fetch orderbook depth for a Kalshi market
 * @param ticker - Kalshi market ticker
 * @returns Orderbook data with bid/ask levels
 */
export async function getKalshiOrderbook(ticker: string): Promise<any> {
  try {
    const response = await fetch(`${KALSHI_BASE_URL}/markets/${ticker}/orderbook`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Kalshi API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[Kalshi Client] Error fetching orderbook:', error);
    throw error;
  }
}

/**
 * Fetch all active markets from Kalshi (for discovery)
 * @param limit - Maximum number of markets to fetch
 * @returns Array of market data
 */
export async function getKalshiMarkets(limit: number = 100): Promise<KalshiMarketResponse[]> {
  try {
    const response = await fetch(`${KALSHI_BASE_URL}/markets?limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Kalshi API error: ${response.status} ${response.statusText}`);
    }

    const data: { markets: KalshiMarketResponse[] } = await response.json();
    return data.markets.filter(m => m.status !== 'closed');
  } catch (error) {
    console.error('[Kalshi Client] Error fetching markets:', error);
    throw error;
  }
}
