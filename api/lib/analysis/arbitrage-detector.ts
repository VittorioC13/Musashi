// Arbitrage Detection
// Detects profitable cross-platform arbitrage opportunities

export interface ArbitrageOpportunity {
  detected: boolean;
  spread: number;
  profit_potential: number;
  buy_platform: string;
  buy_price: number;
  sell_platform: string;
  sell_price: number;
  recommendation: string;
}

// Trading fees (approximate 2% total: 1% buy + 1% sell)
const TRADING_FEE = 0.02;

// Minimum spread to consider worthwhile (5%)
const MIN_SPREAD = 0.05;

/**
 * Detect arbitrage opportunity between two platforms
 * @param polymarketPrice - Yes price on Polymarket (0-1)
 * @param kalshiPrice - Yes price on Kalshi (0-1)
 * @returns Arbitrage opportunity details
 */
export function detectArbitrage(
  polymarketPrice: number,
  kalshiPrice: number
): ArbitrageOpportunity {
  // Calculate price spread
  const spread = Math.abs(polymarketPrice - kalshiPrice);

  // If spread is too small, no arbitrage
  if (spread < MIN_SPREAD) {
    return {
      detected: false,
      spread: 0,
      profit_potential: 0,
      buy_platform: '',
      buy_price: 0,
      sell_platform: '',
      sell_price: 0,
      recommendation: 'No arbitrage opportunity detected',
    };
  }

  // Determine which platform is cheaper (buy) and which is expensive (sell)
  const buyPlatform = polymarketPrice < kalshiPrice ? 'polymarket' : 'kalshi';
  const sellPlatform = polymarketPrice < kalshiPrice ? 'kalshi' : 'polymarket';
  const buyPrice = Math.min(polymarketPrice, kalshiPrice);
  const sellPrice = Math.max(polymarketPrice, kalshiPrice);

  // Calculate profit after fees
  const profitPotential = spread - TRADING_FEE;

  return {
    detected: true,
    spread: spread,
    profit_potential: profitPotential,
    buy_platform: buyPlatform,
    buy_price: buyPrice,
    sell_platform: sellPlatform,
    sell_price: sellPrice,
    recommendation: `Buy ${buyPlatform.toUpperCase()} at ${(buyPrice * 100).toFixed(1)}%, sell ${sellPlatform.toUpperCase()} at ${(sellPrice * 100).toFixed(1)}%`,
  };
}

/**
 * Detect arbitrage across multiple market pairs
 * @param marketPairs - Array of [platform1Price, platform2Price, platform1Name, platform2Name]
 * @returns Array of arbitrage opportunities
 */
export function detectMultipleArbitrage(
  marketPairs: Array<{ platform1: string; price1: number; platform2: string; price2: number }>
): ArbitrageOpportunity[] {
  return marketPairs.map(pair => {
    // Generic arbitrage detection
    const spread = Math.abs(pair.price1 - pair.price2);

    if (spread < MIN_SPREAD) {
      return {
        detected: false,
        spread: 0,
        profit_potential: 0,
        buy_platform: '',
        buy_price: 0,
        sell_platform: '',
        sell_price: 0,
        recommendation: 'No arbitrage opportunity detected',
      };
    }

    const buyPlatform = pair.price1 < pair.price2 ? pair.platform1 : pair.platform2;
    const sellPlatform = pair.price1 < pair.price2 ? pair.platform2 : pair.platform1;
    const buyPrice = Math.min(pair.price1, pair.price2);
    const sellPrice = Math.max(pair.price1, pair.price2);
    const profitPotential = spread - TRADING_FEE;

    return {
      detected: true,
      spread,
      profit_potential: profitPotential,
      buy_platform: buyPlatform,
      buy_price: buyPrice,
      sell_platform: sellPlatform,
      sell_price: sellPrice,
      recommendation: `Buy ${buyPlatform.toUpperCase()} at ${(buyPrice * 100).toFixed(1)}%, sell ${sellPlatform.toUpperCase()} at ${(sellPrice * 100).toFixed(1)}%`,
    };
  });
}
