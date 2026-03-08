# Musashi Documentation

AI-powered sentiment analysis and prediction market signals for automated trading.

## 🚀 Quick Start

**For AI Agents:** Start here → [AI-AGENTS.md](../AI-AGENTS.md)

**Get Started in 3 Steps:**
1. Install Musashi Chrome Extension
2. Get your Extension ID from `chrome://extensions`
3. Connect your trading bot using our API

## 📚 Documentation

### Getting Started
- **[AI Agent Integration Guide](../AI-AGENTS.md)** - Complete guide for AI agents
- **[API Reference](./api-reference.md)** - Full API documentation

### Integration Examples
- **[Python Trading Bot](./examples/python-agent.md)** - Complete Python implementation
- **[Node.js Trading Bot](./examples/nodejs-agent.md)** - Complete JavaScript implementation
- **[Trading Strategies](./examples/trading-strategies.md)** - How to interpret and use signals

## 🎯 What is Musashi?

Musashi is a Chrome extension that provides:

- **AI Sentiment Analysis** - DeepSeek-powered analysis of Twitter/X news
- **Market Signals** - Trading signals for 500+ prediction markets
- **Real-time Data** - Polymarket + Kalshi market data
- **External API** - Accessible to AI trading agents via Chrome messaging

## 💡 Use Cases

### News-Based Trading
Monitor breaking news and trade on high-confidence sentiment shifts:

```python
# Get news analyses
analyses = musashi.get_news_analyses()

# Find high-confidence opportunities
for news in analyses:
    if news['overallSentiment']['confidence'] > 0.8:
        # Trade on related markets
        for signal in news['relatedMarkets']:
            if signal['actionConfidence'] > 0.75:
                execute_trade(signal)
```

### Portfolio Monitoring
Track sentiment changes for your existing positions:

```javascript
// Monitor your positions
for (const position of portfolio) {
  const signals = await musashi.getMarketSignals(position.marketId);

  if (signals[0].suggestedAction !== position.action) {
    // Sentiment reversed - consider closing
    closePosition(position);
  }
}
```

### Market Discovery
Find undervalued markets with strong sentiment signals:

```python
# Find mispriced markets
signals = musashi.get_market_signals()

for signal in signals:
    if (signal['sentiment'] == 'bullish' and
        signal['currentPrice'] < 0.4 and
        signal['confidence'] > 0.8):
        # Undervalued opportunity
        buy_yes_shares(signal['market']['id'])
```

## 📊 API Overview

### 4 Core Endpoints

| Endpoint | Purpose | Update Frequency |
|----------|---------|-----------------|
| `API_GET_NEWS_ANALYSES` | Get sentiment analysis for trending news | 60-120s |
| `API_GET_MARKET_SIGNALS` | Get trading signals for markets | 30-60s |
| `API_GET_MARKETS` | Get complete market database | 15 min |
| `API_HEALTH` | Check extension health | As needed |

### Example Request

```javascript
chrome.runtime.sendMessage(
  extensionId,
  { type: 'API_GET_NEWS_ANALYSES', data: {} },
  (response) => {
    if (response.success) {
      console.log('News:', response.data);
    }
  }
);
```

## 🔧 Features

### AI-Powered Analysis
- DeepSeek AI for sentiment analysis
- Confidence scores (0.0 to 1.0)
- Detailed reasoning for every signal
- Key insights extraction

### Market Coverage
- **Polymarket**: 500+ markets
- **Kalshi**: 200+ markets
- Categories: Politics, Crypto, Economics, Sports, etc.
- Real-time price updates

### Trading Signals
- Sentiment: Bullish, Bearish, Neutral
- Action: Buy, Sell, Hold
- Confidence: 0.0 to 1.0
- Reasoning: AI-generated explanations

## 🛠️ Integration Guide

### Python
```bash
pip install websocket-client
```
See: [Python Integration](./examples/python-agent.md)

### Node.js
```bash
npm install chrome-remote-interface
```
See: [Node.js Integration](./examples/nodejs-agent.md)

## 📖 Learn More

### Strategy Guides
- [News-Based Trading](./examples/trading-strategies.md#strategy-1-news-based-trading)
- [Momentum Trading](./examples/trading-strategies.md#strategy-2-momentum-trading)
- [Contrarian Trading](./examples/trading-strategies.md#strategy-3-contrarian-trading)
- [Portfolio Monitoring](./examples/trading-strategies.md#strategy-4-portfolio-monitoring)
- [Multi-Signal Confirmation](./examples/trading-strategies.md#strategy-5-multi-signal-confirmation)

### Best Practices
- **Confidence Thresholds**: Only trade on signals >= 0.7
- **Position Sizing**: Scale with confidence
- **Stop Losses**: Exit on sentiment reversals
- **Diversification**: Max 5% per market

## 🔒 Security

- No API key required
- Client-side sentiment analysis (privacy-preserving)
- Only accepts connections from `localhost`/`127.0.0.1`
- DeepSeek API costs covered by Musashi

## 💰 Costs

**100% Free** - All AI analysis costs are covered by Musashi.

## 🐛 Troubleshooting

### Extension Not Responding
1. Check if extension is installed: `chrome://extensions`
2. Verify you're calling from localhost
3. Check service worker console for errors

### No Markets Loaded
1. Wait 10-15 seconds after extension loads
2. Check service worker: `chrome://extensions` → Musashi → "service worker"
3. Look for "[Musashi SW] Stored X markets" message

### Low Quality Signals
1. Filter by confidence >= 0.7
2. Cross-reference multiple signals
3. Check sentiment trend for consistency

## 📞 Support

- **Website**: https://musashi.bot
- **Documentation**: https://musashi.bot/docs
- **GitHub Issues**: [Report issues](your-repo-url)

## 📄 License

[Your License Here]

## 🎯 Next Steps

1. **Read** [AI Agent Integration Guide](../AI-AGENTS.md)
2. **Choose** your language: [Python](./examples/python-agent.md) | [Node.js](./examples/nodejs-agent.md)
3. **Learn** [Trading Strategies](./examples/trading-strategies.md)
4. **Build** your trading bot
5. **Paper trade** for 1-2 weeks
6. **Go live** with real positions

---

**Built by traders, for traders** 🎯
