# Musashi: AI Agent Intelligence for Prediction Markets

**Like OKX - the Chrome extension is just a monitoring dashboard (1/10 of the product). The real product is an AI agent service that automatically collects, analyzes, and feeds structured trading signals to your AI trading bots.**

---

## What is Musashi?

Musashi is an **AI agent intelligence service** that:
1. **Collects tweets** from 71+ high-signal accounts every 2 minutes
2. **Analyzes content** using keyword matching, sentiment analysis, and market correlation
3. **Feeds structured signals** to AI trading bots via polling API
4. **Provides Chrome extension** as a human-readable monitoring dashboard

### The Vision

In the future, AI agents will scroll Twitter, find valuable insights, and trade on prediction markets automatically. Musashi is the intelligence layer that feeds analyzed tweets to AI agents - like a Bloomberg Terminal for prediction market bots.

---

## For AI Trading Bots

### Quick Start (Polling Feed)

Get trading signals in 5 lines:

```typescript
import { MusashiAgent } from './musashi-agent';

const agent = new MusashiAgent();

// Poll feed every 30 seconds
const unsubscribe = agent.onFeed(
  (tweets) => {
    for (const tweet of tweets) {
      if (tweet.urgency === 'critical') {
        console.log(`🚨 CRITICAL: @${tweet.tweet.author}`);
        console.log(`Text: ${tweet.tweet.text}`);
        console.log(`Markets: ${tweet.matches.map(m => m.market.title).join(', ')}`);
        console.log(`Action: ${tweet.suggested_action?.direction} (${tweet.suggested_action?.confidence * 100}% confidence)`);

        // Execute trade
        executeTrade(tweet.suggested_action, tweet.matches[0].market);
      }
    }
  },
  { category: 'crypto', minUrgency: 'high' },
  30000 // Poll every 30s
);
```

---

## What Your Bot Gets

Every analyzed tweet includes:

- **Original Tweet**: Author, text, timestamp, URL, engagement metrics (likes, retweets, quotes)
- **Matched Markets**: 1-5 relevant Polymarket/Kalshi markets with confidence scores
- **Sentiment**: Bullish/bearish/neutral with confidence
- **Suggested Action**: YES/NO/HOLD with confidence, edge, and reasoning
- **Urgency**: critical/high/medium/low (based on edge, volume, expiry)
- **Category**: crypto, politics, economics, sports, geopolitics, technology, breaking_news, finance

---

## Feed API Endpoints

### `GET /api/feed`

Get analyzed tweets with filtering and pagination.

**Query Parameters**:
- `limit` (default: 20, max: 100) - Number of tweets to return
- `category` - Filter by category (crypto, politics, economics, etc.)
- `minUrgency` - Filter by urgency (low, medium, high, critical)
- `since` - ISO timestamp, return tweets after this time
- `cursor` - Tweet ID for pagination

**Response**:
```json
{
  "success": true,
  "data": {
    "tweets": [...],
    "count": 20,
    "timestamp": "2026-03-02T12:00:00Z",
    "cursor": "1234567890",
    "filters": {...},
    "metadata": {
      "processing_time_ms": 45,
      "total_in_kv": 1234
    }
  }
}
```

### `GET /api/feed/stats`

Get feed statistics (tweets per timeframe, by category, by urgency, top markets).

### `GET /api/feed/accounts`

Get list of monitored Twitter accounts (transparency for agents).

---

## Monitored Accounts (71)

Musashi monitors 71 high-signal Twitter accounts across 8 categories:

- **Breaking News (5)**: BBCBreaking, Reuters, AP, spectatorindex, BNONews
- **Politics (8)**: Nate Silver, Dave Wasserman, G. Elliott Morris, Punchbowl News, etc.
- **Economics (8)**: Nick Timiraos (Fed whisperer), The Economist, Financial Times, Bloomberg, WSJ
- **Crypto (10)**: Vitalik, Saylor, Pomp, WatcherGuru, Elon Musk, etc.
- **Technology (9)**: Sam Altman, Jensen Huang, NVIDIA, Meta AI, Google DeepMind, etc.
- **Geopolitics (8)**: Bloomberg foreign policy, ELINT News, NATO, AFP, etc.
- **Sports (8)**: Adam Schefter, Woj, Shams, Fabrizio Romano, etc.
- **Finance (7)**: BlackRock, Goldman Sachs, JPMorgan, Bloomberg Markets, Cathie Wood

Full list: `GET /api/feed/accounts`

---

## SDK Reference

### Installation

```bash
curl -O https://raw.githubusercontent.com/VittorioC13/Musashi/main/src/sdk/musashi-agent.ts
```

### Usage

```typescript
import { MusashiAgent } from './musashi-agent';

const agent = new MusashiAgent('https://musashi-api.vercel.app');
```

### Feed Methods

#### `getFeed(options?): Promise<AnalyzedTweet[]>`

Get analyzed tweets with optional filters.

```typescript
const tweets = await agent.getFeed({
  limit: 20,
  category: 'crypto',
  minUrgency: 'high',
  since: '2026-03-02T10:00:00Z'
});
```

#### `getFeedStats(): Promise<FeedStats>`

Get feed statistics.

```typescript
const stats = await agent.getFeedStats();
console.log(`Tweets in last hour: ${stats.tweets.last_1h}`);
```

#### `getFeedAccounts(): Promise<TwitterAccount[]>`

Get monitored accounts.

```typescript
const accounts = await agent.getFeedAccounts();
console.log(`Monitoring ${accounts.length} accounts`);
```

#### `onFeed(callback, options?, intervalMs?): () => void`

Poll feed and invoke callback on new tweets.

```typescript
const unsubscribe = agent.onFeed(
  (tweets) => {
    tweets.forEach(tweet => {
      if (tweet.urgency === 'critical') {
        executeTrade(tweet.suggested_action);
      }
    });
  },
  { category: 'crypto', minUrgency: 'high' },
  30000 // Poll every 30 seconds
);

// Later: stop monitoring
unsubscribe();
```

### Analysis Methods (Legacy - "Bring Your Own Text")

#### `analyzeText(text, options?): Promise<Signal>`

Analyze custom text (not from feed).

```typescript
const signal = await agent.analyzeText('Bitcoin just hit $100k!');
```

#### `getArbitrage(options?): Promise<ArbitrageOpportunity[]>`

Get cross-platform arbitrage opportunities.

```typescript
const arbs = await agent.getArbitrage({ minSpread: 0.05 });
```

#### `getMovers(options?): Promise<MarketMover[]>`

Get markets with significant price changes.

```typescript
const movers = await agent.getMovers({ timeframe: '1h', minChange: 0.05 });
```

---

## For Humans (Chrome Extension)

The extension is a **monitoring dashboard** to see what your AI agents see.

**Install**: Download `musashi-v2.0.0.zip`, load unpacked in Chrome.

**Features**:
- View analyzed tweets in sidebar
- See matched markets inline on Twitter
- Monitor feed statistics
- View suggested trading actions

The extension and the feed API show the exact same data - the extension is just a visual representation for humans.

---

## Architecture

```
Twitter API (71 accounts, every 2 min)
    ↓
Cron Collector (analyze via KeywordMatcher → sentiment → signal)
    ↓
Vercel KV (48h TTL, only market-matched tweets)
    ↓
Feed API (polling endpoint with filters)
    ↓
AI Trading Bots (poll every 30-60s)
    ↓
Chrome Extension (human monitoring dashboard)
```

**Key Features**:
- **Automated collection**: No need to scrape Twitter yourself
- **Filtered intelligence**: Only tweets that match ≥1 market (confidence ≥0.3)
- **Structured signals**: Sentiment, urgency, suggested action, arbitrage detection
- **Polling-based**: Simple HTTP GET requests, no WebSockets needed
- **Edge caching**: 30s cache at Vercel edge for fast responses

---

## Python Agent Example

```python
import requests
import time

class MusashiAgent:
    def __init__(self, base_url="https://musashi-api.vercel.app"):
        self.base_url = base_url
        self.last_seen = None

    def get_feed(self, category=None, min_urgency=None, limit=20):
        params = {"limit": limit}
        if self.last_seen:
            params["since"] = self.last_seen
        if category:
            params["category"] = category
        if min_urgency:
            params["minUrgency"] = min_urgency

        resp = requests.get(f"{self.base_url}/api/feed", params=params)
        return resp.json()["data"]["tweets"]

    def on_feed(self, callback, category=None, min_urgency=None, interval=30):
        while True:
            try:
                tweets = self.get_feed(category=category, min_urgency=min_urgency, limit=100)

                if tweets:
                    # Update last_seen
                    self.last_seen = max(t["tweet"]["created_at"] for t in tweets)

                    # Call callback
                    callback(tweets)

                time.sleep(interval)
            except Exception as e:
                print(f"Error: {e}")
                time.sleep(interval)

# Usage
agent = MusashiAgent()

def handle_tweets(tweets):
    for tweet in tweets:
        if tweet["urgency"] in ["critical", "high"]:
            print(f"🔥 @{tweet['tweet']['author']}: {tweet['tweet']['text'][:100]}...")
            print(f"   Action: {tweet.get('suggested_action', {}).get('direction')} ({tweet.get('suggested_action', {}).get('confidence', 0)*100:.0f}%)")

agent.on_feed(handle_tweets, category="crypto", min_urgency="high", interval=30)
```

---

## Setup

1. **Deploy to Vercel**: `vercel deploy`
2. **Configure Twitter API**: Follow [docs/TWITTER_API_SETUP.md](docs/TWITTER_API_SETUP.md)
3. **Set Environment Variables**:
   - `TWITTER_BEARER_TOKEN` (from Twitter Developer Portal)
   - `KV_REST_API_URL` (Vercel KV, auto-configured)
   - `KV_REST_API_TOKEN` (Vercel KV, auto-configured)
4. **Verify Cron**: Check Vercel dashboard → Functions → `collect-tweets`
5. **Test Feed**: `curl https://your-api.vercel.app/api/feed`

---

## Pricing

All **free tiers** are sufficient for Musashi:

- **Vercel**: Free tier (100GB bandwidth, 100GB-hours serverless functions)
- **Vercel KV**: Free tier (30,000 commands/month)
- **Twitter API**: Free tier (500,000 tweets/month)

**Musashi usage**: ~108,000-216,000 tweets/month

**Well within free tiers.** ✅

---

## Documentation

- [Twitter API Setup Guide](docs/TWITTER_API_SETUP.md)
- [Python Agent Example](docs/examples/python-agent.md)
- [Node.js Agent Example](docs/examples/nodejs-agent.md)
- [Trading Strategies](docs/examples/trading-strategies.md)

---

## License

MIT
