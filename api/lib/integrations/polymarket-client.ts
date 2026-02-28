// Polymarket CLOB API Client
// Fetches live market data from Polymarket's Gamma API

const POLYMARKET_BASE_URL = 'https://gamma-api.polymarket.com';

interface PolymarketOutcome {
  name: string;
  price: string;
}

interface PolymarketMarketResponse {
  id: string;
  question: string;
  outcomes: PolymarketOutcome[];
  volume?: string;
  liquidity?: string;
  active?: boolean;
}

export interface PolymarketPrice {
  yesPrice: number;
  noPrice: number;
  volume: number;
  liquidity: number;
  isLive: true;
}

/**
 * Fetch live price from Polymarket for a specific market
 * @param conditionId - Polymarket condition/market ID
 * @returns Live price data or throws error
 */
export async function getPolymarketPrice(conditionId: string): Promise<PolymarketPrice> {
  try {
    const response = await fetch(`${POLYMARKET_BASE_URL}/markets/${conditionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Polymarket API error: ${response.status} ${response.statusText}`);
    }

    const data: PolymarketMarketResponse = await response.json();

    // Polymarket returns outcomes array with prices
    // Typically [0] = Yes, [1] = No, but verify by name
    const yesOutcome = data.outcomes.find(o => o.name.toLowerCase() === 'yes');
    const noOutcome = data.outcomes.find(o => o.name.toLowerCase() === 'no');

    if (!yesOutcome || !noOutcome) {
      throw new Error('Invalid Polymarket response: missing Yes/No outcomes');
    }

    return {
      yesPrice: parseFloat(yesOutcome.price),
      noPrice: parseFloat(noOutcome.price),
      volume: data.volume ? parseInt(data.volume, 10) : 0,
      liquidity: data.liquidity ? parseInt(data.liquidity, 10) : 0,
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
    const response = await fetch(`${POLYMARKET_BASE_URL}/markets?limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Polymarket API error: ${response.status} ${response.statusText}`);
    }

    const data: PolymarketMarketResponse[] = await response.json();
    return data.filter(m => m.active !== false);
  } catch (error) {
    console.error('[Polymarket Client] Error fetching markets:', error);
    throw error;
  }
}
