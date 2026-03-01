# Musashi Agent SDK

**Build AI trading bots that monitor prediction markets in real-time.**

The Musashi Agent SDK is a TypeScript/JavaScript library that lets you build automated trading bots for Polymarket and Kalshi prediction markets. Get real-time signals on arbitrage opportunities, sentiment shifts, and market movers.

---

## Quick Start

Get your first trading signal in 5 lines:

```typescript
import { MusashiAgent } from './src/sdk/musashi-agent';

const agent = new MusashiAgent();
const signal = await agent.analyzeText('Bitcoin just hit $100k!');

if (signal.urgency === 'critical') {
  console.log('TRADE NOW:', signal.suggested_action);
}
```

---

## Installation

### Option 1: Copy SDK File (Recommended)

Copy `src/sdk/musashi-agent.ts` into your project:

```bash
curl -O https://raw.githubusercontent.com/VittorioC13/Musashi/main/src/sdk/musashi-agent.ts
```

Then import it:

```typescript
import { MusashiAgent } from './musashi-agent';
```

### Option 2: Clone Repository

```bash
git clone https://github.com/VittorioC13/Musashi.git
cd Musashi
npm install
```

---

## Core Concepts

### Trading Signals

Every text analysis returns a **Signal** with:

- **`signal_type`**: `arbitrage` | `news_event` | `sentiment_shift` | `user_interest`
- **`urgency`**: `critical` | `high` | `medium` | `low`
- **`matches`**: Prediction markets related to the text
- **`suggested_action`**: Trade direction (`YES`/`NO`/`HOLD`), confidence, edge, reasoning
- **`sentiment`**: Bullish/bearish/neutral classification
- **`arbitrage`**: Cross-platform price discrepancy if detected

### Urgency Levels

- **`critical`**: Strong edge (>15%) + high volume + expires soon OR arbitrage >5%
- **`high`**: Good edge (>10%) OR moderate arbitrage (>3%)
- **`medium`**: Decent edge (>5%)
- **`low`**: Match without clear edge

---

## API Reference

### MusashiAgent Class

```typescript
const agent = new MusashiAgent(baseUrl?, apiKey?);
```

**Parameters:**
- `baseUrl` (optional): API endpoint (default: `https://musashi-api.vercel.app`)
- `apiKey` (optional): API key for authenticated requests (future use)

---

### Methods

#### `analyzeText(text, options?)`

Analyze text and return trading signal with matched markets.

```typescript
const signal = await agent.analyzeText(
  'Fed announces rate cut!',
  {
    minConfidence: 0.3,  // Min match confidence (0-1)
    maxResults: 5        // Max markets to return
  }
);

console.log(signal.urgency);              // 'high'
console.log(signal.suggested_action);     // { direction: 'YES', confidence: 0.75, edge: 0.12, ... }
console.log(signal.sentiment);            // { sentiment: 'bullish', confidence: 0.85 }
```

**Returns:** `Promise<Signal>`

---

#### `getArbitrage(options?)`

Get cross-platform arbitrage opportunities.

```typescript
const arbs = await agent.getArbitrage({
  minSpread: 0.03,       // Min price difference (3%)
  minConfidence: 0.5,    // Min match confidence
  limit: 20,             // Max results
  category: 'crypto'     // Filter by category
});

arbs.forEach(arb => {
  console.log(`${arb.spread * 100}% spread - Buy on ${arb.direction.split('_')[1]}`);
  console.log(`Profit potential: ${arb.profitPotential * 100}%`);
});
```

**Returns:** `Promise<ArbitrageOpportunity[]>`

---

#### `getMovers(options?)`

Get markets with significant price changes.

```typescript
const movers = await agent.getMovers({
  timeframe: '1h',       // '1h' | '6h' | '24h'
  minChange: 0.05,       // Min price change (5%)
  limit: 20,             // Max results
  category: 'us_politics'
});

movers.forEach(mover => {
  const arrow = mover.direction === 'up' ? '↑' : '↓';
  console.log(`${arrow} ${mover.market.title}: ${mover.priceChange1h * 100}%`);
});
```

**Returns:** `Promise<MarketMover[]>`

---

#### `checkHealth()`

Check API health status.

```typescript
const health = await agent.checkHealth();
console.log(`API Status: ${health.status}`);
console.log(`Polymarket: ${health.services.polymarket.status}`);
console.log(`Kalshi: ${health.services.kalshi.status}`);
```

**Returns:** `Promise<HealthStatus>`

---

### Monitoring Methods

Monitor markets in real-time using polling-based callbacks.

#### `onSignal(textSource, callback, intervalMs?)`

Monitor text stream and invoke callback on each signal.

```typescript
const unsubscribe = agent.onSignal(
  () => getLatestTweet(),  // Text source function
  (signal) => {
    if (signal.urgency === 'critical') {
      console.log('CRITICAL SIGNAL:', signal.signal_type);
      executeTrade(signal.suggested_action);
    }
  },
  30000  // Poll every 30 seconds
);

// Later: stop monitoring
unsubscribe();
```

**Returns:** `() => void` (unsubscribe function)

---

#### `onArbitrage(callback, options?, intervalMs?)`

Monitor arbitrage opportunities.

```typescript
const unsubscribe = agent.onArbitrage(
  (opportunities) => {
    for (const arb of opportunities) {
      if (arb.spread > 0.05) {
        console.log(`Arbitrage detected: ${arb.spread * 100}% spread`);
        executeArbitrageTrade(arb);
      }
    }
  },
  { minSpread: 0.03 },
  60000  // Check every minute
);
```

**Returns:** `() => void` (unsubscribe function)

---

#### `onMovers(callback, options?, intervalMs?)`

Monitor market movers.

```typescript
const unsubscribe = agent.onMovers(
  (movers) => {
    for (const mover of movers) {
      if (Math.abs(mover.priceChange1h) > 0.1) {
        console.log(`Big move: ${mover.market.title}`);
        handlePriceMovement(mover);
      }
    }
  },
  { minChange: 0.05, timeframe: '1h' },
  120000  // Check every 2 minutes
);
```

**Returns:** `() => void` (unsubscribe function)

---

## Example Bots

### 1. Sentiment Trading Bot

**Build a bot that buys YES on Polymarket when Musashi detects bullish sentiment with >10% edge.**

```typescript
import { MusashiAgent } from './musashi-agent';

const agent = new MusashiAgent();

// Monitor Twitter feed
const unsubscribe = agent.onSignal(
  () => getLatestCryptoTweet(),  // Your Twitter scraper
  async (signal) => {
    // Only trade on high-confidence bullish signals
    if (signal.sentiment?.sentiment === 'bullish' &&
        signal.sentiment.confidence > 0.7 &&
        signal.suggested_action?.edge > 0.10) {

      const action = signal.suggested_action;
      const market = signal.matches[0].market;

      console.log(`\n🎯 TRADE SIGNAL`);
      console.log(`Market: ${market.title}`);
      console.log(`Direction: ${action.direction}`);
      console.log(`Edge: ${(action.edge * 100).toFixed(1)}%`);
      console.log(`Confidence: ${(action.confidence * 100).toFixed(1)}%`);
      console.log(`Reasoning: ${action.reasoning}`);

      // Execute trade on Polymarket
      if (market.platform === 'polymarket') {
        await buyYesOnPolymarket(market.id, calculatePositionSize(action.edge));
        console.log(`✅ Bought YES on Polymarket`);
      }
    }
  },
  30000  // Check every 30 seconds
);

// Helper: Calculate position size based on edge (Kelly Criterion)
function calculatePositionSize(edge: number): number {
  const bankroll = 1000;  // Your total capital
  const kellyFraction = 0.25;  // Use 25% Kelly for safety
  return bankroll * edge * kellyFraction;
}

// Helper: Buy YES position on Polymarket
async function buyYesOnPolymarket(marketId: string, amount: number) {
  // Integration with Polymarket API or wallet
  // See: https://docs.polymarket.com
}

// Helper: Scrape latest crypto tweets
function getLatestCryptoTweet(): string {
  // Your Twitter scraping logic
  return "Bitcoin mooning! $100k incoming!";
}
```

**Expected Output:**

```
🎯 TRADE SIGNAL
Market: Will Bitcoin reach $100k by March 2026?
Direction: YES
Edge: 12.3%
Confidence: 85.0%
Reasoning: Bullish sentiment (85% confidence) suggests YES is underpriced at 67%
✅ Bought YES on Polymarket
```

---

### 2. Arbitrage Trading Bot

**Build an arbitrage bot that buys on the cheaper platform when spread >5%.**

```typescript
import { MusashiAgent } from './musashi-agent';

const agent = new MusashiAgent();

// Monitor arbitrage opportunities
const unsubscribe = agent.onArbitrage(
  async (opportunities) => {
    for (const arb of opportunities) {
      // Only trade on high-confidence arbitrage with >5% spread
      if (arb.spread > 0.05 && arb.confidence > 0.7) {

        console.log(`\n💰 ARBITRAGE OPPORTUNITY`);
        console.log(`Market: ${arb.polymarket.title}`);
        console.log(`Spread: ${(arb.spread * 100).toFixed(2)}%`);
        console.log(`Profit Potential: ${(arb.profitPotential * 100).toFixed(2)}%`);
        console.log(`Strategy: ${arb.direction}`);
        console.log(`Match Confidence: ${(arb.confidence * 100).toFixed(1)}%`);

        // Execute arbitrage trade
        if (arb.direction === 'buy_poly_sell_kalshi') {
          // Buy YES on Polymarket (cheaper)
          await buyYesOnPolymarket(arb.polymarket.id, 100);
          // Sell YES on Kalshi (expensive) = Buy NO
          await buyNoOnKalshi(arb.kalshi.id, 100);
          console.log(`✅ Arbitrage executed: Long Poly, Short Kalshi`);
        } else {
          // Buy YES on Kalshi (cheaper)
          await buyYesOnKalshi(arb.kalshi.id, 100);
          // Sell YES on Polymarket (expensive) = Buy NO
          await buyNoOnPolymarket(arb.polymarket.id, 100);
          console.log(`✅ Arbitrage executed: Long Kalshi, Short Poly`);
        }

        // Track profit
        trackArbitrageTrade(arb);
      }
    }
  },
  {
    minSpread: 0.03,      // Look for 3%+ spreads
    minConfidence: 0.6,   // Only high-confidence matches
    limit: 50             // Check top 50 opportunities
  },
  60000  // Check every minute
);

// Helper: Buy YES on Polymarket
async function buyYesOnPolymarket(marketId: string, amount: number) {
  // Polymarket API integration
}

// Helper: Buy NO on Polymarket (= Sell YES)
async function buyNoOnPolymarket(marketId: string, amount: number) {
  // Polymarket API integration
}

// Helper: Buy YES on Kalshi
async function buyYesOnKalshi(marketId: string, amount: number) {
  // Kalshi API integration
  // See: https://trading-api.readme.io/reference/getting-started
}

// Helper: Buy NO on Kalshi (= Sell YES)
async function buyNoOnKalshi(marketId: string, amount: number) {
  // Kalshi API integration
}

// Helper: Track arbitrage performance
function trackArbitrageTrade(arb: ArbitrageOpportunity) {
  const trade = {
    timestamp: Date.now(),
    spread: arb.spread,
    profitPotential: arb.profitPotential,
    polyPrice: arb.polymarket.yesPrice,
    kalshiPrice: arb.kalshi.yesPrice,
  };
  console.log('📊 Trade logged:', trade);
  // Save to database for analysis
}
```

**Expected Output:**

```
💰 ARBITRAGE OPPORTUNITY
Market: Will Bitcoin reach $100k by March 2026?
Spread: 7.00%
Profit Potential: 7.00%
Strategy: buy_poly_sell_kalshi
Match Confidence: 85.0%
✅ Arbitrage executed: Long Poly, Short Kalshi
📊 Trade logged: { timestamp: 1709294400000, spread: 0.07, ... }
```

---

### 3. Market Movers Alert Bot

**Send alerts when markets move >10% in 1 hour.**

```typescript
import { MusashiAgent } from './musashi-agent';

const agent = new MusashiAgent();

// Monitor market movers
agent.onMovers(
  async (movers) => {
    for (const mover of movers) {
      if (Math.abs(mover.priceChange1h) > 0.10) {

        const arrow = mover.direction === 'up' ? '📈' : '📉';
        const change = (mover.priceChange1h * 100).toFixed(1);

        console.log(`\n${arrow} BIG MOVE DETECTED`);
        console.log(`Market: ${mover.market.title}`);
        console.log(`Change: ${change}% in 1 hour`);
        console.log(`Current Price: ${(mover.currentPrice * 100).toFixed(1)}%`);
        console.log(`Previous Price: ${(mover.previousPrice * 100).toFixed(1)}%`);
        console.log(`Volume: $${mover.market.volume24h.toLocaleString()}`);

        // Send alert (email, Telegram, Discord, etc.)
        await sendTelegramAlert(`
🚨 Market Alert
${mover.market.title}
${arrow} ${change}% move in 1h
Current: ${(mover.currentPrice * 100).toFixed(1)}%
Volume: $${mover.market.volume24h.toLocaleString()}
${mover.market.url}
        `);
      }
    }
  },
  {
    minChange: 0.05,      // 5%+ moves
    limit: 50,
    category: 'us_politics'  // Focus on politics
  },
  120000  // Check every 2 minutes
);

async function sendTelegramAlert(message: string) {
  // Telegram Bot API integration
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: message })
  });
}
```

---

### 4. Multi-Strategy Aggregator Bot

**Combine all strategies into one bot.**

```typescript
import { MusashiAgent } from './musashi-agent';

class MusashiTradingBot {
  private agent: MusashiAgent;
  private unsubscribers: (() => void)[] = [];

  constructor() {
    this.agent = new MusashiAgent();
  }

  start() {
    console.log('🤖 Musashi Trading Bot Started');

    // Strategy 1: Sentiment trading
    this.unsubscribers.push(
      this.agent.onSignal(
        () => this.getLatestNews(),
        (signal) => this.handleSentimentSignal(signal),
        30000
      )
    );

    // Strategy 2: Arbitrage trading
    this.unsubscribers.push(
      this.agent.onArbitrage(
        (opps) => this.handleArbitrage(opps),
        { minSpread: 0.03 },
        60000
      )
    );

    // Strategy 3: Market movers alerts
    this.unsubscribers.push(
      this.agent.onMovers(
        (movers) => this.handleMovers(movers),
        { minChange: 0.05 },
        120000
      )
    );
  }

  stop() {
    console.log('🛑 Musashi Trading Bot Stopped');
    this.unsubscribers.forEach(unsub => unsub());
  }

  private handleSentimentSignal(signal: Signal) {
    if (signal.urgency === 'critical' && signal.suggested_action?.edge > 0.10) {
      console.log('📊 Sentiment trade opportunity:', signal.suggested_action);
      // Execute trade
    }
  }

  private handleArbitrage(opportunities: ArbitrageOpportunity[]) {
    const highValue = opportunities.filter(o => o.spread > 0.05);
    if (highValue.length > 0) {
      console.log(`💰 ${highValue.length} arbitrage opportunities found`);
      // Execute arbitrage
    }
  }

  private handleMovers(movers: MarketMover[]) {
    const bigMoves = movers.filter(m => Math.abs(m.priceChange1h) > 0.10);
    if (bigMoves.length > 0) {
      console.log(`📈 ${bigMoves.length} big market moves detected`);
      // Send alerts
    }
  }

  private getLatestNews(): string {
    // Your news scraping logic
    return '';
  }
}

// Run the bot
const bot = new MusashiTradingBot();
bot.start();

// Graceful shutdown
process.on('SIGINT', () => {
  bot.stop();
  process.exit(0);
});
```

---

## TypeScript Types

All types are exported from the SDK:

```typescript
import {
  MusashiAgent,
  Signal,
  SignalType,
  UrgencyLevel,
  Direction,
  Platform,
  Market,
  MarketMatch,
  SuggestedAction,
  Sentiment,
  ArbitrageOpportunity,
  MarketMover,
  AnalyzeTextOptions,
  GetArbitrageOptions,
  GetMoversOptions,
  HealthStatus
} from './musashi-agent';
```

---

## Standalone Helper Functions

Quick one-off calls without creating an agent instance:

```typescript
import { analyzeText, getArbitrage, getMovers } from './musashi-agent';

// Quick text analysis
const signal = await analyzeText('Bitcoin $100k!');

// Quick arbitrage check
const arbs = await getArbitrage({ minSpread: 0.05 });

// Quick movers check
const movers = await getMovers({ minChange: 0.10 });
```

---

## Platform Integration

### Polymarket API

```typescript
// Use Polymarket's Gamma API for trading
// Documentation: https://docs.polymarket.com

import { ethers } from 'ethers';

async function buyYesOnPolymarket(marketId: string, amount: number) {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  // Polymarket uses CLOB (Central Limit Order Book)
  // See: https://github.com/Polymarket/clob-client
}
```

### Kalshi API

```typescript
// Use Kalshi's REST API for trading
// Documentation: https://trading-api.readme.io/reference/getting-started

async function buyYesOnKalshi(marketId: string, amount: number) {
  const response = await fetch('https://trading-api.kalshi.com/trade-api/v2/portfolio/orders', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.KALSHI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ticker: marketId,
      action: 'buy',
      side: 'yes',
      count: amount,
      type: 'market'
    })
  });

  return response.json();
}
```

---

## Best Practices

### 1. Position Sizing

Use Kelly Criterion for optimal bet sizing:

```typescript
function calculateKellySize(edge: number, confidence: number, bankroll: number): number {
  const kellyFraction = 0.25;  // Use fractional Kelly for safety
  const p = confidence;         // Probability of winning
  const q = 1 - p;              // Probability of losing
  const b = edge / q;           // Odds

  const kelly = (p * b - q) / b;
  return Math.max(0, bankroll * kelly * kellyFraction);
}
```

### 2. Risk Management

```typescript
const MAX_POSITION_SIZE = 0.05;  // Never risk >5% of bankroll per trade
const MIN_EDGE = 0.08;            // Require 8%+ edge
const MIN_CONFIDENCE = 0.70;      // Require 70%+ confidence
const MAX_OPEN_POSITIONS = 10;    // Limit concurrent positions
```

### 3. Error Handling

```typescript
agent.onSignal(
  () => getLatestTweet(),
  async (signal) => {
    try {
      if (signal.urgency === 'critical') {
        await executeTrade(signal);
      }
    } catch (error) {
      console.error('Trade execution failed:', error);
      await sendAlert(`Trade failed: ${error.message}`);
    }
  },
  30000
);
```

### 4. Monitoring & Logging

```typescript
// Log all signals for backtesting
agent.onSignal(
  () => getLatestTweet(),
  async (signal) => {
    await logSignal(signal);  // Save to database

    if (shouldTrade(signal)) {
      const result = await executeTrade(signal);
      await logTradeResult(result);
    }
  }
);
```

---

## Rate Limits

**Current:** No rate limits (subject to change)

**Future:**
- Free tier: 100 requests/hour
- Pro tier: 1000 requests/hour

---

## API Endpoint

**Base URL:** `https://musashi-api.vercel.app`

See [API-REFERENCE.md](./API-REFERENCE.md) for full REST API documentation.

---

## Support

- **GitHub**: https://github.com/VittorioC13/Musashi
- **Issues**: https://github.com/VittorioC13/Musashi/issues
- **Email**: [Create issue on GitHub]

---

## License

MIT License - see [LICENSE](./LICENSE) for details.

---

**Built with ❤️ by rotciv + Claude Code**

Start building your prediction market trading bot today! 🚀
