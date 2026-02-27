# Node.js AI Agent Integration

Complete Node.js/JavaScript example for integrating Musashi with your trading bot.

## Installation

```bash
npm install chrome-remote-interface axios
```

## Complete Trading Bot Example

```javascript
const ChromeRemoteInterface = require('chrome-remote-interface');
const axios = require('axios');

/**
 * Musashi Client - Communicates with Musashi Chrome extension
 */
class MusashiClient {
  constructor(extensionId) {
    this.extensionId = extensionId;
    this.chrome = null;
  }

  /**
   * Connect to Chrome DevTools Protocol
   */
  async connect() {
    try {
      this.chrome = await ChromeRemoteInterface({ port: 9222 });
      console.log('✓ Connected to Chrome');
      return true;
    } catch (error) {
      console.error('✗ Failed to connect to Chrome:', error.message);
      console.log('Make sure Chrome is running with: chrome --remote-debugging-port=9222');
      return false;
    }
  }

  /**
   * Send message to Musashi extension
   */
  async sendMessage(type, data = {}) {
    const message = { type, data };

    try {
      const { Runtime } = this.chrome;

      // Execute in extension context
      const result = await Runtime.evaluate({
        expression: `
          new Promise((resolve) => {
            chrome.runtime.sendMessage(
              '${this.extensionId}',
              ${JSON.stringify(message)},
              (response) => resolve(response)
            );
          })
        `,
        awaitPromise: true,
        returnByValue: true
      });

      return result.result.value;
    } catch (error) {
      console.error(`Error sending message ${type}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get news sentiment analyses
   */
  async getNewsAnalyses() {
    const response = await this.sendMessage('API_GET_NEWS_ANALYSES');
    if (response.success) {
      return response.data || [];
    }
    console.error('Failed to get news analyses:', response.error);
    return [];
  }

  /**
   * Get market sentiment signals
   */
  async getMarketSignals(marketId = null) {
    const data = marketId ? { marketId } : {};
    const response = await this.sendMessage('API_GET_MARKET_SIGNALS', data);

    if (response.success) {
      return response.data || [];
    }
    console.error('Failed to get market signals:', response.error);
    return [];
  }

  /**
   * Get all markets
   */
  async getAllMarkets() {
    const response = await this.sendMessage('API_GET_MARKETS');
    if (response.success) {
      return response.data || [];
    }
    console.error('Failed to get markets:', response.error);
    return [];
  }

  /**
   * Health check
   */
  async healthCheck() {
    const response = await this.sendMessage('API_HEALTH');
    return response.success;
  }

  /**
   * Disconnect
   */
  async disconnect() {
    if (this.chrome) {
      await this.chrome.close();
    }
  }
}

/**
 * Trading Bot - Uses Musashi signals to trade
 */
class TradingBot {
  constructor(musashiClient, options = {}) {
    this.musashi = musashiClient;
    this.minConfidence = options.minConfidence || 0.75;
    this.positions = new Map(); // marketId -> position
    this.scanInterval = options.scanInterval || 60000; // 60 seconds
    this.running = false;
  }

  /**
   * Scan for trading opportunities
   */
  async scanForOpportunities() {
    console.log('\n📊 Scanning for opportunities...');

    const newsAnalyses = await this.musashi.getNewsAnalyses();

    for (const news of newsAnalyses) {
      const sentiment = news.overallSentiment;

      // Check if news has strong signal
      if (sentiment.confidence < this.minConfidence) {
        continue;
      }

      console.log(`\n🔥 High confidence news: ${news.title}`);
      console.log(`   Sentiment: ${sentiment.sentiment} (${(sentiment.confidence * 100).toFixed(1)}%)`);
      console.log(`   Reasoning: ${sentiment.reasoning}`);

      // Check related markets
      for (const signal of news.relatedMarkets) {
        await this.evaluateSignal(signal);
      }
    }
  }

  /**
   * Evaluate a market signal
   */
  async evaluateSignal(signalData) {
    const market = signalData.market;
    const marketId = market.id;

    // Skip if already have position
    if (this.positions.has(marketId)) {
      console.log(`   ⏭️  Already have position in ${market.title}`);
      return;
    }

    // Check signal quality
    const actionConfidence = signalData.actionConfidence;
    if (actionConfidence < this.minConfidence) {
      console.log(`   ⚠️  Signal confidence too low: ${(actionConfidence * 100).toFixed(1)}%`);
      return;
    }

    const suggestedAction = signalData.suggestedAction;
    const currentPrice = signalData.currentPrice;

    console.log('\n' + '='.repeat(60));
    console.log('🎯 TRADING OPPORTUNITY');
    console.log('='.repeat(60));
    console.log(`Market: ${market.title}`);
    console.log(`Platform: ${market.platform}`);
    console.log(`Action: ${suggestedAction.toUpperCase()}`);
    console.log(`Confidence: ${(actionConfidence * 100).toFixed(1)}%`);
    console.log(`Current Price: ${(currentPrice * 100).toFixed(1)}%`);
    console.log(`Reasoning: ${signalData.reasoning}`);
    console.log(`URL: ${market.url}`);
    console.log('='.repeat(60) + '\n');

    // Execute trade
    await this.executeTrade(marketId, market, suggestedAction, currentPrice);
  }

  /**
   * Execute a trade
   */
  async executeTrade(marketId, market, action, price) {
    console.log(`💰 EXECUTING: ${action} at ${(price * 100).toFixed(1)}%`);

    // Example: Place order on Polymarket
    // await this.polymarketAPI.placeOrder({
    //   marketId,
    //   side: action === 'buy' ? 'YES' : 'NO',
    //   amount: 100,  // $100 position
    //   price
    // });

    // Track position
    this.positions.set(marketId, {
      market,
      action,
      entryPrice: price,
      timestamp: new Date(),
    });

    console.log(`✓ Position opened in ${market.title}`);
  }

  /**
   * Monitor existing positions
   */
  async monitorPositions() {
    if (this.positions.size === 0) {
      return;
    }

    console.log(`\n👀 Monitoring ${this.positions.size} position(s)...`);

    for (const [marketId, position] of this.positions.entries()) {
      const signals = await this.musashi.getMarketSignals(marketId);

      if (signals.length === 0) {
        continue;
      }

      const signal = signals[0];

      // Exit if sentiment reversed
      if (signal.suggestedAction !== position.action) {
        if (signal.actionConfidence > 0.6) {
          console.log(`\n⚠️  SENTIMENT REVERSED for ${position.market.title}`);
          console.log(`   Original: ${position.action}, Now: ${signal.suggestedAction}`);
          console.log(`   Confidence: ${(signal.actionConfidence * 100).toFixed(1)}%`);

          await this.closePosition(marketId);
        }
      }
    }
  }

  /**
   * Close a position
   */
  async closePosition(marketId) {
    const position = this.positions.get(marketId);
    if (!position) return;

    console.log(`🔒 CLOSING position in ${position.market.title}`);

    // Implement your close logic here
    // await this.polymarketAPI.closePosition(marketId);

    this.positions.delete(marketId);
    console.log('✓ Position closed');
  }

  /**
   * Run the trading bot
   */
  async start() {
    console.log('🚀 Starting Musashi Trading Bot...');

    // Connect to Musashi
    const connected = await this.musashi.connect();
    if (!connected) {
      console.error('Failed to connect to Musashi');
      return;
    }

    // Health check
    const healthy = await this.musashi.healthCheck();
    if (!healthy) {
      console.error('Musashi extension not responding!');
      return;
    }

    console.log('✓ Musashi connected successfully');
    console.log(`📈 Min confidence: ${(this.minConfidence * 100).toFixed(0)}%`);
    console.log(`⏱️  Scan interval: ${this.scanInterval / 1000}s\n`);

    this.running = true;

    // Main loop
    while (this.running) {
      try {
        await this.scanForOpportunities();
        await this.monitorPositions();

        console.log(`\n💤 Sleeping for ${this.scanInterval / 1000}s...\n`);
        await this.sleep(this.scanInterval);

      } catch (error) {
        console.error('Error in main loop:', error);
        await this.sleep(this.scanInterval);
      }
    }
  }

  /**
   * Stop the bot
   */
  async stop() {
    console.log('\n🛑 Shutting down...');
    this.running = false;
    await this.musashi.disconnect();
  }

  /**
   * Sleep helper
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  // Configuration
  const EXTENSION_ID = 'your-extension-id-here';  // Get from chrome://extensions
  const MIN_CONFIDENCE = 0.75;  // 75% minimum confidence
  const SCAN_INTERVAL = 60000;  // 60 seconds

  // Initialize Musashi client
  const musashi = new MusashiClient(EXTENSION_ID);

  // Create trading bot
  const bot = new TradingBot(musashi, {
    minConfidence: MIN_CONFIDENCE,
    scanInterval: SCAN_INTERVAL
  });

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    await bot.stop();
    process.exit(0);
  });

  // Start bot
  await bot.start();
}

// Run
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { MusashiClient, TradingBot };
```

## Simple Example: Query Musashi

```javascript
const MusashiClient = require('./musashi-client');

async function getMarketSignals() {
  const musashi = new MusashiClient('YOUR_EXTENSION_ID');

  await musashi.connect();

  const signals = await musashi.getMarketSignals();

  for (const signal of signals) {
    console.log(`\nMarket: ${signal.market.title}`);
    console.log(`Sentiment: ${signal.sentiment}`);
    console.log(`Confidence: ${(signal.confidence * 100).toFixed(1)}%`);
    console.log(`Action: ${signal.suggestedAction}`);
    console.log(`Reasoning: ${signal.reasoning}`);
  }

  await musashi.disconnect();
}

getMarketSignals();
```

## Setup Instructions

### 1. Start Chrome with Remote Debugging

**macOS/Linux:**
```bash
google-chrome --remote-debugging-port=9222
```

**Windows:**
```bash
"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222
```

### 2. Get Extension ID

1. Go to `chrome://extensions`
2. Enable "Developer mode"
3. Find Musashi extension
4. Copy the ID (e.g., `abcdefghijklmnop...`)

### 3. Run the Bot

```bash
node trading-bot.js
```

## Alternative: Direct Extension Messaging

For simpler integration without Chrome DevTools Protocol:

```javascript
// In a Chrome extension context page
function queryMusashi() {
  const EXTENSION_ID = 'your-extension-id';

  chrome.runtime.sendMessage(
    EXTENSION_ID,
    { type: 'API_GET_MARKET_SIGNALS', data: {} },
    (response) => {
      if (response.success) {
        console.log('Signals:', response.data);
      }
    }
  );
}
```

## Production Tips

1. **Error Handling**: Wrap all API calls in try-catch blocks
2. **Reconnection Logic**: Auto-reconnect if Chrome disconnects
3. **Rate Limiting**: Don't query more than once per 30 seconds
4. **Logging**: Use proper logging library (winston, pino)
5. **Testing**: Test with small positions first

## Next Steps

- See [Trading Strategies Guide](./trading-strategies.md)
- See [API Reference](../api-reference.md)
- See [Python Example](./python-agent.md)
