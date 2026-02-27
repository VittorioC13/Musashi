# Musashi AI Agent Integration Guide

**Version:** 1.0.0
**Last Updated:** 2025-02-25

## Overview

Musashi is a Chrome extension that provides real-time AI-powered sentiment analysis and prediction market signals for Twitter/X content. This guide helps AI trading agents integrate with Musashi's external API.

## Quick Start

### Prerequisites
- Chrome browser with Musashi extension installed
- Extension ID: `[your-extension-id-here]`
- Running on localhost or 127.0.0.1 (for security)

### Basic Connection

```javascript
// Send message to Musashi extension
chrome.runtime.sendMessage(
  'YOUR_EXTENSION_ID',
  {
    type: 'API_GET_NEWS_ANALYSES',
    data: {}
  },
  (response) => {
    console.log('News analyses:', response.data);
  }
);
```

## API Endpoints

Musashi exposes 4 core endpoints via Chrome extension messaging:

### 1. Get News Analyses

Retrieve AI sentiment analysis for trending news stories.

**Request:**
```json
{
  "type": "API_GET_NEWS_ANALYSES",
  "data": {}
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "title": "Breaking: Major Political Event",
      "timestamp": 1708876800000,
      "overallSentiment": {
        "sentiment": "bullish",
        "confidence": 0.87,
        "reasoning": "Strong positive indicators from multiple sources...",
        "keyPoints": [
          "Market momentum increasing",
          "High trading volume detected"
        ]
      },
      "relatedMarkets": [
        {
          "market": {
            "id": "market-123",
            "title": "Will X happen by March 2025?",
            "platform": "polymarket",
            "yesPrice": 0.72,
            "url": "https://polymarket.com/event/..."
          },
          "sentiment": "bullish",
          "confidence": 0.85,
          "reasoning": "News directly supports YES outcome",
          "currentPrice": 0.72,
          "suggestedAction": "buy",
          "actionConfidence": 0.78
        }
      ],
      "sentimentTrend": [
        {
          "timestamp": 1708876800000,
          "sentiment": "bullish",
          "confidence": 0.87
        }
      ]
    }
  ]
}
```

### 2. Get Market Signals

Get sentiment signals for specific prediction markets.

**Request:**
```json
{
  "type": "API_GET_MARKET_SIGNALS",
  "data": {
    "marketId": "market-123"  // Optional: filter by market ID
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "market": {
        "id": "market-123",
        "title": "Will Bitcoin reach $100k in 2025?",
        "platform": "polymarket",
        "category": "crypto",
        "yesPrice": 0.45,
        "noPrice": 0.55,
        "volume": 1250000,
        "url": "https://polymarket.com/event/..."
      },
      "sentiment": "bullish",
      "confidence": 0.82,
      "reasoning": "Recent news cycle shows strong positive momentum...",
      "currentPrice": 0.45,
      "suggestedAction": "buy",
      "actionConfidence": 0.78
    }
  ]
}
```

### 3. Get All Markets

Retrieve the complete market database (500+ markets).

**Request:**
```json
{
  "type": "API_GET_MARKETS",
  "data": {}
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "market-123",
      "title": "Will Bitcoin reach $100k in 2025?",
      "platform": "polymarket",
      "category": "crypto",
      "yesPrice": 0.45,
      "noPrice": 0.55,
      "volume": 1250000,
      "liquidity": 500000,
      "endDate": "2025-12-31T23:59:59Z",
      "url": "https://polymarket.com/event/..."
    }
  ]
}
```

### 4. Health Check

Verify Musashi extension is running and responsive.

**Request:**
```json
{
  "type": "API_HEALTH",
  "data": {}
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "version": "1.0.0",
    "marketsLoaded": 700,
    "lastUpdate": 1708876800000
  }
}
```

## Data Models

### Sentiment Values
- `"bullish"` - Positive outlook, price likely to increase
- `"bearish"` - Negative outlook, price likely to decrease
- `"neutral"` - No clear direction

### Suggested Actions
- `"buy"` - Purchase YES shares (bullish signal)
- `"sell"` - Purchase NO shares (bearish signal)
- `"hold"` - Wait for clearer signal

### Confidence Scores
- Range: `0.0` to `1.0`
- `0.0 - 0.4`: Low confidence - avoid trading
- `0.4 - 0.7`: Medium confidence - proceed with caution
- `0.7 - 1.0`: High confidence - strong signal

## Use Cases

### 1. News-Based Trading
Monitor `API_GET_NEWS_ANALYSES` for breaking news with high confidence sentiment signals.

```python
# Poll for news every 60 seconds
while True:
    analyses = get_news_analyses()
    for news in analyses:
        if news['overallSentiment']['confidence'] > 0.75:
            for signal in news['relatedMarkets']:
                if signal['actionConfidence'] > 0.75:
                    execute_trade(signal)
    time.sleep(60)
```

### 2. Market Monitoring
Track specific markets for sentiment shifts.

```python
# Monitor specific market
target_market = "market-123"
signals = get_market_signals(marketId=target_market)

if signals[0]['confidence'] > 0.8:
    if signals[0]['suggestedAction'] == 'buy':
        buy_yes_shares(target_market)
```

### 3. Portfolio Optimization
Cross-reference your portfolio with Musashi signals.

```python
# Check sentiment for your positions
portfolio = get_my_positions()
for position in portfolio:
    signals = get_market_signals(marketId=position['marketId'])
    if signals[0]['suggestedAction'] != position['side']:
        # Consider closing position
        alert_position_mismatch(position, signals[0])
```

## Best Practices

### Rate Limiting
- **News Analyses**: Poll every 60-120 seconds (news updates are not real-time)
- **Market Signals**: Poll every 30-60 seconds per market
- **Markets Database**: Fetch once on startup, refresh every 15 minutes

### Signal Quality
- Always check `confidence` >= 0.7 before executing trades
- Combine multiple signals for higher accuracy
- Consider `sentimentTrend` for momentum trading

### Error Handling
```javascript
chrome.runtime.sendMessage(
  extensionId,
  { type: 'API_GET_NEWS_ANALYSES', data: {} },
  (response) => {
    if (!response || !response.success) {
      console.error('Musashi API error:', response?.error);
      return;
    }
    // Process data
  }
);
```

### Caching
- Cache market data for 5-10 minutes to reduce API calls
- Cache news analyses for 60-90 seconds
- Invalidate cache on new trading signals

## Integration Examples

See:
- [Python Integration](./docs/examples/python-agent.md)
- [JavaScript/Node.js Integration](./docs/examples/nodejs-agent.md)
- [Trading Bot Example](./docs/examples/trading-bot.md)

## Security Notes

- Musashi only accepts connections from `localhost` and `127.0.0.1`
- No API key required (uses Chrome extension permissions)
- All sentiment analysis is client-side (privacy-preserving)
- DeepSeek API costs are covered by Musashi

## Troubleshooting

### Extension Not Responding
1. Check if Musashi extension is installed and enabled
2. Verify you're calling from localhost/127.0.0.1
3. Check Chrome console for extension errors

### No Markets Loaded
1. Wait 10-15 seconds after extension loads
2. Check service worker console: `chrome://extensions` → Musashi → "service worker"
3. Look for "[Musashi SW] Stored X markets" message

### Low Quality Signals
1. Filter by `confidence >= 0.7`
2. Cross-reference multiple news sources
3. Check `sentimentTrend` for consistency

## Support

- GitHub Issues: [your-repo-url]
- Documentation: https://musashi.bot/docs
- API Status: Check `API_HEALTH` endpoint

## Changelog

### v1.0.0 (2025-02-25)
- Initial release
- 4 core API endpoints
- DeepSeek AI sentiment analysis
- 500+ markets (Polymarket + Kalshi)
