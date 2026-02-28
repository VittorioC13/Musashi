// Polymarket CLOB API Client
// Fetches live market data from Polymarket's Gamma API

const POLYMARKET_BASE_URL = 'https://gamma-api.polymarket.com';

interface PolymarketMarketResponse {
  id: string;
  question: string;
  conditionId: string;
  outcomePrices: string; // JSON string like "[\"0.018\", \"0.982\"]"
  outcomes: string;       // JSON string like "[\"Yes\", \"No\"]"
  volume: string;
  liquidity: string;
  active: boolean;
}

export interface PolymarketPrice {
  yesPrice: number;
  noPrice: number;
  volume: number;
  liquidity: number;
  isLive: true;
}

/**
 * Fetch live price from Polymarket for a specific market by condition ID
 * @param conditionId - Polymarket condition ID
 * @returns Live price data or throws error
 */
export async function getPolymarketPrice(conditionId: string): Promise<PolymarketPrice> {
  try {
    // Search for market by conditionId since direct lookup may not work
    const response = await fetch(`${POLYMARKET_BASE_URL}/markets?active=true&closed=false&limit=100`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Polymarket API error: ${response.status} ${response.statusText}`);
    }

    const markets: PolymarketMarketResponse[] = await response.json();

    // Find market with matching conditionId
    const market = markets.find(m => m.conditionId === conditionId);

    if (!market) {
      throw new Error(`Market with conditionId ${conditionId} not found`);
    }

    // Parse outcome prices from JSON string
    const prices = JSON.parse(market.outcomePrices) as string[];
    const outcomes = JSON.parse(market.outcomes) as string[];

    // Find Yes/No indices (typically [0] = Yes, [1] = No)
    const yesIndex = outcomes.findIndex(o => o.toLowerCase() === 'yes');
    const noIndex = outcomes.findIndex(o => o.toLowerCase() === 'no');

    if (yesIndex === -1 || noIndex === -1) {
      throw new Error('Invalid Polymarket response: missing Yes/No outcomes');
    }

    return {
      yesPrice: parseFloat(prices[yesIndex]),
      noPrice: parseFloat(prices[noIndex]),
      volume: parseFloat(market.volume) || 0,
      liquidity: parseFloat(market.liquidity) || 0,
      isLive: true,
    };
  } catch (error) {
    console.error('[Polymarket Client] Error fetching price:', error);
    throw error;
  }
}

/**
 * Fetch all active markets from Polymarket (for discovery)
 * @param limit - Maximum number of markets to fetch
 * @returns Array of market data
 */
export async function getPolymarketMarkets(limit: number = 100): Promise<PolymarketMarketResponse[]> {
  try {
    const response = await fetch(`${POLYMARKET_BASE_URL}/markets?active=true&closed=false&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Polymarket API error: ${response.status} ${response.statusText}`);
    }

    const data: PolymarketMarketResponse[] = await response.json();
    return data.filter(m => m.active);
  } catch (error) {
    console.error('[Polymarket Client] Error fetching markets:', error);
    throw error;
  }
}
