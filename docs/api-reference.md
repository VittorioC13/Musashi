# Musashi API Reference

Complete API documentation for AI agents.

**Version:** 1.0.0
**Protocol:** Chrome Extension Messaging
**Base:** `chrome.runtime.sendMessage(extensionId, message, callback)`

---

## Table of Contents

1. [Authentication](#authentication)
2. [Endpoints](#endpoints)
3. [Data Models](#data-models)
4. [Error Handling](#error-handling)
5. [Rate Limits](#rate-limits)
6. [Examples](#examples)

---

## Authentication

**No API key required.** Musashi uses Chrome extension permissions for security.

**Allowed Origins:**
- `localhost`
- `127.0.0.1`

**Security Model:**
- Defined in `manifest.json` under `externally_connectable`
- Only connections from localhost are accepted
- All sentiment analysis is client-side (privacy-preserving)

---

## Endpoints

### 1. Get News Analyses

Retrieve AI-powered sentiment analysis for trending news stories on Twitter/X.

**Request:**
```typescript
{
  type: "API_GET_NEWS_ANALYSES",
  data: {}
}
```

**Response:**
```typescript
{
  success: true,
  data: NewsAnalysis[]
}
```

**NewsAnalysis Interface:**
```typescript
interface NewsAnalysis {
  title: string;                    // News headline
  timestamp: number;                 // Unix timestamp (ms)
  tweetCount: number;               // Number of tweets analyzed
  overallSentiment: {
    sentiment: "bullish" | "bearish" | "neutral";
    confidence: number;             // 0.0 to 1.0
    reasoning: string;              // AI explanation
    keyPoints: string[];            // Bullet points
  };
  relatedMarkets: MarketSignal[];   // Related prediction markets
  sentimentTrend: SentimentPoint[]; // Historical trend
}
```

**Use Cases:**
- Monitor breaking news for trading opportunities
- Detect sentiment shifts in real-time
- Cross-reference news with prediction markets

**Update Frequency:** Poll every 60-120 seconds

---

### 2. Get Market Signals

Retrieve sentiment signals for prediction markets.

**Request:**
```typescript
{
  type: "API_GET_MARKET_SIGNALS",
  data: {
    marketId?: string  // Optional: filter by specific market
  }
}
```

**Response:**
```typescript
{
  success: true,
  data: MarketSignal[]
}
```

**MarketSignal Interface:**
```typescript
interface MarketSignal {
  market: Market;                   // Market metadata
  sentiment: "bullish" | "bearish" | "neutral";
  confidence: number;               // 0.0 to 1.0
  reasoning: string;                // AI explanation
  currentPrice: number;             // Current YES price (0.0 to 1.0)
  suggestedAction: "buy" | "sell" | "hold";
  actionConfidence: number;         // 0.0 to 1.0
}
```

**Use Cases:**
- Monitor specific markets for entry/exit signals
- Track sentiment changes for existing positions
- Find high-confidence trading opportunities

**Update Frequency:** Poll every 30-60 seconds per market

---

### 3. Get All Markets

Retrieve complete market database from Polymarket and Kalshi.

**Request:**
```typescript
{
  type: "API_GET_MARKETS",
  data: {}
}
```

**Response:**
```typescript
{
  success: true,
  data: Market[]
}
```

**Market Interface:**
```typescript
interface Market {
  id: string;                       // Unique market ID
  title: string;                    // Market question
  platform: "polymarket" | "kalshi";
  category: string;                 // e.g., "crypto", "politics"
  yesPrice: number;                 // Current YES price (0.0 to 1.0)
  noPrice: number;                  // Current NO price (0.0 to 1.0)
  volume: number;                   // Total volume in USD
  liquidity?: number;               // Available liquidity
  endDate: string;                  // ISO 8601 date
  url: string;                      // Market URL
}
```

**Use Cases:**
- Discover new markets
- Build market database for analysis
- Filter markets by category/platform

**Update Frequency:** Fetch once on startup, refresh every 15 minutes

---

### 4. Health Check

Verify Musashi extension is running and responsive.

**Request:**
```typescript
{
  type: "API_HEALTH",
  data: {}
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    status: "healthy",
    version: string;                // e.g., "1.0.0"
    marketsLoaded: number;          // Number of markets in database
    lastUpdate: number;             // Unix timestamp (ms)
  }
}
```

**Use Cases:**
- Verify connection on startup
- Monitor extension health
- Debug connection issues

**Update Frequency:** Call once on startup, then as needed

---

## Data Models

### Sentiment

```typescript
type Sentiment = "bullish" | "bearish" | "neutral";
```

**Values:**
- `"bullish"`: Positive outlook, price likely to increase
- `"bearish"`: Negative outlook, price likely to decrease
- `"neutral"`: No clear direction

### Suggested Action

```typescript
type SuggestedAction = "buy" | "sell" | "hold";
```

**Values:**
- `"buy"`: Purchase YES shares (bullish signal)
- `"sell"`: Purchase NO shares (bearish signal)
- `"hold"`: Wait for clearer signal

### Confidence Score

```typescript
type Confidence = number; // 0.0 to 1.0
```

**Interpretation:**
- `0.0 - 0.4`: Low confidence - avoid trading
- `0.4 - 0.7`: Medium confidence - proceed with caution
- `0.7 - 1.0`: High confidence - strong signal

### Sentiment Point

```typescript
interface SentimentPoint {
  timestamp: number;                // Unix timestamp (ms)
  sentiment: Sentiment;
  confidence: number;               // 0.0 to 1.0
}
```

**Use Cases:**
- Track sentiment trends over time
- Detect momentum shifts
- Identify sentiment reversals

### Market

```typescript
interface Market {
  id: string;
  title: string;
  platform: "polymarket" | "kalshi";
  category: string;
  yesPrice: number;                 // 0.0 to 1.0
  noPrice: number;                  // 0.0 to 1.0
  volume: number;                   // USD
  liquidity?: number;               // USD
  endDate: string;                  // ISO 8601
  url: string;
}
```

### Market Signal

```typescript
interface MarketSignal {
  market: Market;
  sentiment: Sentiment;
  confidence: number;
  reasoning: string;
  currentPrice: number;
  suggestedAction: SuggestedAction;
  actionConfidence: number;
}
```

### News Analysis

```typescript
interface NewsAnalysis {
  title: string;
  timestamp: number;
  tweetCount: number;
  overallSentiment: {
    sentiment: Sentiment;
    confidence: number;
    reasoning: string;
    keyPoints: string[];
  };
  relatedMarkets: MarketSignal[];
  sentimentTrend: SentimentPoint[];
}
```

---

## Error Handling

### Error Response Format

```typescript
{
  success: false,
  error: string                     // Error message
}
```

### Common Errors

**Extension Not Installed:**
```json
{
  "success": false,
  "error": "Extension not found"
}
```

**Extension Not Responding:**
```json
{
  "success": false,
  "error": "Extension not responding"
}
```

**Markets Not Loaded:**
```json
{
  "success": false,
  "error": "Markets not yet loaded. Please wait 10-15 seconds."
}
```

**Invalid Market ID:**
```json
{
  "success": false,
  "error": "Market not found: market-123"
}
```

### Error Handling Best Practices

```javascript
chrome.runtime.sendMessage(
  extensionId,
  { type: 'API_GET_NEWS_ANALYSES', data: {} },
  (response) => {
    // Check for Chrome runtime errors
    if (chrome.runtime.lastError) {
      console.error('Chrome error:', chrome.runtime.lastError.message);
      return;
    }

    // Check for response
    if (!response) {
      console.error('No response from Musashi');
      return;
    }

    // Check for API errors
    if (!response.success) {
      console.error('Musashi error:', response.error);
      return;
    }

    // Process data
    const analyses = response.data;
  }
);
```

---

## Rate Limits

**No hard rate limits**, but recommended polling frequencies:

| Endpoint | Recommended Frequency | Max Frequency |
|----------|----------------------|---------------|
| `API_GET_NEWS_ANALYSES` | 60-120s | 30s |
| `API_GET_MARKET_SIGNALS` | 30-60s per market | 15s |
| `API_GET_MARKETS` | 15 minutes | 5 minutes |
| `API_HEALTH` | As needed | No limit |

**Why these limits?**
- News analyses update every 60-90 seconds
- Market prices update every 15-30 seconds
- Excessive polling wastes resources

**Best Practice:**
```javascript
// Cache results to reduce API calls
let newsCache = null;
let newsCacheTime = 0;
const CACHE_TTL = 60000; // 60 seconds

async function getNewsAnalyses() {
  const now = Date.now();

  if (newsCache && (now - newsCacheTime) < CACHE_TTL) {
    return newsCache; // Return cached
  }

  const response = await sendMessage('API_GET_NEWS_ANALYSES');
  if (response.success) {
    newsCache = response.data;
    newsCacheTime = now;
    return newsCache;
  }

  return [];
}
```

---

## Examples

### Example 1: Get High-Confidence News

```javascript
async function getHighConfidenceNews() {
  const response = await sendMessage('API_GET_NEWS_ANALYSES');

  if (!response.success) {
    console.error('Error:', response.error);
    return [];
  }

  return response.data.filter(news =>
    news.overallSentiment.confidence >= 0.75
  );
}
```

### Example 2: Monitor Specific Market

```javascript
async function monitorMarket(marketId) {
  const response = await sendMessage('API_GET_MARKET_SIGNALS', { marketId });

  if (!response.success || response.data.length === 0) {
    return null;
  }

  const signal = response.data[0];

  console.log(`Market: ${signal.market.title}`);
  console.log(`Sentiment: ${signal.sentiment} (${signal.confidence})`);
  console.log(`Action: ${signal.suggestedAction} (${signal.actionConfidence})`);

  return signal;
}
```

### Example 3: Find Trading Opportunities

```javascript
async function findOpportunities(minConfidence = 0.75) {
  const newsResponse = await sendMessage('API_GET_NEWS_ANALYSES');

  if (!newsResponse.success) return [];

  const opportunities = [];

  for (const news of newsResponse.data) {
    // Check news confidence
    if (news.overallSentiment.confidence < minConfidence) {
      continue;
    }

    // Check related markets
    for (const signal of news.relatedMarkets) {
      if (signal.actionConfidence >= minConfidence) {
        opportunities.push({
          newsTitle: news.title,
          market: signal.market,
          action: signal.suggestedAction,
          confidence: signal.actionConfidence,
          reasoning: signal.reasoning
        });
      }
    }
  }

  return opportunities.sort((a, b) => b.confidence - a.confidence);
}
```

### Example 4: Health Check Loop

```javascript
async function ensureHealthy() {
  while (true) {
    const response = await sendMessage('API_HEALTH');

    if (response.success) {
      console.log('✓ Musashi healthy');
      console.log(`  Markets: ${response.data.marketsLoaded}`);
      console.log(`  Version: ${response.data.version}`);
      return true;
    }

    console.log('✗ Musashi not responding, retrying in 5s...');
    await sleep(5000);
  }
}
```

---

## TypeScript Definitions

Complete TypeScript types for Musashi API:

```typescript
// Message Types
type MessageType =
  | "API_GET_NEWS_ANALYSES"
  | "API_GET_MARKET_SIGNALS"
  | "API_GET_MARKETS"
  | "API_HEALTH";

// Request
interface MusashiRequest {
  type: MessageType;
  data: Record<string, any>;
}

// Response
interface MusashiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Sentiment
type Sentiment = "bullish" | "bearish" | "neutral";
type SuggestedAction = "buy" | "sell" | "hold";

// Models
interface Market {
  id: string;
  title: string;
  platform: "polymarket" | "kalshi";
  category: string;
  yesPrice: number;
  noPrice: number;
  volume: number;
  liquidity?: number;
  endDate: string;
  url: string;
}

interface MarketSignal {
  market: Market;
  sentiment: Sentiment;
  confidence: number;
  reasoning: string;
  currentPrice: number;
  suggestedAction: SuggestedAction;
  actionConfidence: number;
}

interface SentimentPoint {
  timestamp: number;
  sentiment: Sentiment;
  confidence: number;
}

interface NewsAnalysis {
  title: string;
  timestamp: number;
  tweetCount: number;
  overallSentiment: {
    sentiment: Sentiment;
    confidence: number;
    reasoning: string;
    keyPoints: string[];
  };
  relatedMarkets: MarketSignal[];
  sentimentTrend: SentimentPoint[];
}

interface HealthData {
  status: "healthy";
  version: string;
  marketsLoaded: number;
  lastUpdate: number;
}

// Helper function
function sendMessage<T = any>(
  type: MessageType,
  data: Record<string, any> = {}
): Promise<MusashiResponse<T>> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      EXTENSION_ID,
      { type, data },
      (response) => resolve(response)
    );
  });
}
```

---

## Support

- **Documentation:** https://musashi.bot/docs
- **Examples:** [Python](./examples/python-agent.md) | [Node.js](./examples/nodejs-agent.md)
- **Strategies:** [Trading Strategies](./examples/trading-strategies.md)
- **Issues:** GitHub Issues

---

## Changelog

### v1.0.0 (2025-02-25)
- Initial API release
- 4 core endpoints
- DeepSeek AI integration
- 500+ markets (Polymarket + Kalshi)
