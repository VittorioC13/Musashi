# Musashi API - Intelligence for AI Trading Agents

**Build prediction market trading agents powered by real-time social intelligence.**

The Musashi API analyzes text from social media, news, and other sources to identify relevant prediction markets on Polymarket and Kalshi. Perfect for AI agents that need to understand what markets users care about.

---

## Why Musashi API?

**For AI Trading Agents:**
- ⚡ **Sub-second analysis** - Get market matches in <200ms
- 🎯 **High precision matching** - Sophisticated keyword + synonym expansion
- 📊 **Structured JSON output** - Machine-readable, agent-friendly format
- 🔄 **Real-time intelligence** - Analyze tweets, news, conversations as they happen
- 🤖 **Agent-first design** - Built for programmatic access, not humans

**Use Cases:**
- Agent monitors user's Twitter feed → Detects market opportunities → Trades automatically
- Chatbot analyzes conversation → Suggests relevant markets → User trades via agent
- News aggregator → Market matcher → Arbitrage detector → Execute trades
- Sentiment analyzer → Market finder → Position recommender

---

## Quick Start

### 1. Analyze Text

**Endpoint:** `POST /api/analyze-text`

**Request:**
```json
{
  "text": "The Fed is likely to cut interest rates in March after inflation cooled to 2.9%",
  "minConfidence": 0.25,
  "maxResults": 5
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "markets": [
      {
        "market": {
          "id": "kalshi-fed-rate-cut",
          "platform": "kalshi",
          "title": "Will the Fed cut interest rates in March 2026?",
          "description": "Resolves Yes if the Federal Reserve cuts the federal funds rate at their March 2026 meeting.",
          "keywords": ["fed", "federal reserve", "interest rate", "rate cut", "fomc", "jerome powell"],
          "yesPrice": 0.72,
          "noPrice": 0.28,
          "volume24h": 389000,
          "url": "https://kalshi.com/markets",
          "category": "monetary_policy",
          "lastUpdated": "2026-02-27T10:30:00Z"
        },
        "confidence": 0.87,
        "matchedKeywords": ["fed", "interest rate", "rate cut", "inflation"]
      },
      {
        "market": {
          "id": "kalshi-inflation-cpi",
          "platform": "kalshi",
          "title": "Will CPI inflation be above 3% in February?",
          "description": "Resolves Yes if the Consumer Price Index year-over-year change is above 3.0% for February 2026.",
          "keywords": ["inflation", "cpi", "consumer price index"],
          "yesPrice": 0.58,
          "noPrice": 0.42,
          "volume24h": 203000,
          "url": "https://kalshi.com/markets",
          "category": "economics",
          "lastUpdated": "2026-02-27T10:30:00Z"
        },
        "confidence": 0.64,
        "matchedKeywords": ["inflation", "cpi"]
      }
    ],
    "matchCount": 2,
    "timestamp": "2026-02-27T10:30:15.234Z"
  }
}
```

---

## API Reference

### POST /api/analyze-text

Analyzes text and returns matching prediction markets.

**Request Body:**
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `text` | string | ✅ Yes | - | Text to analyze (tweet, article, message, etc.) |
| `minConfidence` | number | ❌ No | 0.25 | Minimum confidence threshold (0.0-1.0) |
| `maxResults` | number | ❌ No | 5 | Maximum number of markets to return |

**Response:**
```typescript
{
  success: boolean;
  data?: {
    markets: MarketMatch[];    // Array of matched markets
    matchCount: number;        // Number of matches found
    timestamp: string;         // ISO 8601 timestamp
  };
  error?: string;              // Error message if success = false
}
```

**Market Match Schema:**
```typescript
{
  market: {
    id: string;                // Unique market ID
    platform: 'kalshi' | 'polymarket';
    title: string;             // Market question
    description: string;       // Resolution criteria
    keywords: string[];        // Match keywords
    yesPrice: number;          // Current YES price (0.0-1.0)
    noPrice: number;           // Current NO price (0.0-1.0)
    volume24h: number;         // 24h trading volume ($)
    url: string;               // Direct link to trade
    category: string;          // Market category
    lastUpdated: string;       // ISO timestamp
    endDate?: string;          // Market resolution date
  };
  confidence: number;          // Match quality (0.0-1.0)
  matchedKeywords: string[];   // Which keywords matched
}
```

---

## Code Examples

### cURL
```bash
curl -X POST https://musashi-api.vercel.app/api/analyze-text \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Bitcoin just crossed $100k!",
    "maxResults": 3
  }'
```

### Python
```python
import requests

response = requests.post(
    'https://musashi-api.vercel.app/api/analyze-text',
    json={
        'text': 'Will SpaceX launch Starship to Mars this year?',
        'minConfidence': 0.3,
        'maxResults': 5
    }
)

data = response.json()
if data['success']:
    for match in data['data']['markets']:
        print(f"{match['confidence']:.0%} - {match['market']['title']}")
        print(f"  → {match['market']['url']}")
```

### JavaScript / TypeScript
```typescript
const response = await fetch('https://musashi-api.vercel.app/api/analyze-text', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: 'Trump announces new tariffs on China',
    minConfidence: 0.25,
    maxResults: 5
  })
});

const { success, data, error } = await response.json();

if (success) {
  data.markets.forEach(match => {
    console.log(`${(match.confidence * 100).toFixed(0)}% - ${match.market.title}`);
    console.log(`  Platform: ${match.market.platform}`);
    console.log(`  YES: ${(match.market.yesPrice * 100).toFixed(0)}%`);
  });
}
```

### Claude Desktop (MCP)
```typescript
// Example tool use for Claude Desktop
{
  "name": "analyze_market_relevance",
  "description": "Analyze text to find relevant prediction markets",
  "parameters": {
    "text": "The Fed just announced a surprise rate cut",
    "maxResults": 3
  }
}
```

---

## Agent Integration Patterns

### Pattern 1: Twitter Monitor → Trade Executor
```python
# AI agent monitors user's Twitter feed
def on_new_tweet(tweet_text):
    # Analyze with Musashi API
    response = requests.post('https://musashi-api.vercel.app/api/analyze-text',
                            json={'text': tweet_text})

    markets = response.json()['data']['markets']

    for match in markets:
        if match['confidence'] > 0.7:  # High confidence only
            # Execute trade on Polymarket
            place_order(
                market_id=match['market']['id'],
                side='YES' if should_buy_yes(tweet_text) else 'NO',
                amount=calculate_position_size(match['confidence'])
            )
```

### Pattern 2: Chatbot Market Assistant
```python
# User asks: "What markets are related to AI regulation?"
user_query = "What markets are related to AI regulation?"

# Query Musashi API
response = requests.post('https://musashi-api.vercel.app/api/analyze-text',
                        json={'text': user_query, 'maxResults': 10})

markets = response.json()['data']['markets']

# Present to user via chatbot
for match in markets:
    send_message(f"""
    📊 {match['market']['title']}
    🎯 Confidence: {match['confidence']:.0%}
    💰 Current odds: YES {match['market']['yesPrice']:.0%} / NO {match['market']['noPrice']:.0%}
    📈 24h volume: ${match['market']['volume24h']:,}
    🔗 Trade: {match['market']['url']}
    """)
```

### Pattern 3: News Aggregator → Arbitrage Detector
```python
# Scrape news headlines → Find markets → Detect arbitrage
headlines = fetch_latest_news()

for headline in headlines:
    # Find related markets
    response = requests.post('https://musashi-api.vercel.app/api/analyze-text',
                            json={'text': headline})

    markets = response.json()['data']['markets']

    # Check for arbitrage across platforms
    for market in markets:
        polymarket_price = get_polymarket_price(market['market']['title'])
        kalshi_price = get_kalshi_price(market['market']['title'])

        if abs(polymarket_price - kalshi_price) > 0.05:  # 5% spread
            log_arbitrage_opportunity(market, polymarket_price, kalshi_price)
```

---

## Rate Limits

**Current (MVP):**
- ✅ No rate limits
- ✅ No authentication required

**Future:**
- Free tier: 100 requests/day
- Pro tier: 10,000 requests/day ($29/month)
- Enterprise: Custom limits

---

## Supported Markets

Currently analyzing **100+ markets** across:
- 🏛️ **US Politics** - Elections, Congress, Executive actions
- 💰 **Economics** - Fed policy, inflation, recession, unemployment
- 💻 **Technology** - AI, earnings, IPOs, valuations
- ₿ **Crypto** - Bitcoin, Ethereum, ETFs, regulations
- ⚽ **Sports** - NFL, NBA, Soccer, Tennis
- 🌍 **Geopolitics** - Conflicts, peace deals, international relations
- 🎬 **Entertainment** - Movies, music, streaming, anime, gaming
- 🌡️ **Climate** - Temperature records, policy, energy

Markets updated daily from Polymarket and Kalshi APIs.

---

## Response Times

Average latency by text length:
- **Short tweet (100 chars):** ~80ms
- **Medium post (500 chars):** ~120ms
- **Long article (2000 chars):** ~180ms

All processing done server-side. No client-side ML required.

---

## Error Handling

**Common Errors:**
```json
// Missing text field
{
  "success": false,
  "error": "Missing or invalid \"text\" field in request body."
}

// Invalid confidence threshold
{
  "success": false,
  "error": "minConfidence must be between 0.0 and 1.0"
}

// Server error
{
  "success": false,
  "error": "Internal server error"
}
```

**Best Practices:**
- Always check `success` field before accessing `data`
- Implement retry logic with exponential backoff
- Cache results for identical queries (TTL: 5 minutes)
- Handle empty results gracefully (no matches found)

---

## Roadmap

**Q1 2026:**
- ✅ MVP API launch
- [ ] Webhook subscriptions
- [ ] Real-time WebSocket stream
- [ ] Historical market data endpoint

**Q2 2026:**
- [ ] Multi-source intelligence (Twitter + Reddit + News)
- [ ] Arbitrage detection endpoint
- [ ] Market sentiment analysis
- [ ] GPT-4 enhanced matching

**Q3 2026:**
- [ ] Polymarket CLOB integration (live prices)
- [ ] Kalshi API integration (live prices)
- [ ] Custom market watchlists
- [ ] Agent performance analytics

---

## Support

**Issues & Feedback:**
- GitHub: [github.com/rotciv/musashi](https://github.com/rotciv/musashi)
- Email: support@musashi.ai
- Discord: [Join our community](https://discord.gg/musashi)

**For AI Agents:**
- This API is **agent-friendly by design**
- Structured JSON, no rate limits (MVP)
- Feel free to build cool stuff! 🚀

---

**Built for agents. Powered by prediction markets.**

*Last updated: February 27, 2026*
