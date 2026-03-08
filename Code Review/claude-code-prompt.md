I'm building Musashi — a prediction market intelligence layer for AI agents. The codebase is a Chrome extension (TypeScript/React/Webpack) that currently:

1. Fetches ~1400 live markets from Polymarket gamma API + Kalshi REST API (see `src/api/polymarket-client.ts` and `src/api/kalshi-client.ts`)
2. Matches tweets to markets using keyword + synonym matching (see `src/analysis/keyword-matcher.ts` — 1184 lines with SYNONYM_MAP, scoring, confidence thresholds)  
3. Injects market cards into Twitter/X timeline (see `src/content/inject-twitter-card.tsx`)
4. Has a backend API client pointing to `https://musashi-api.vercel.app` (see `src/api/musashi-api-client.ts`)
5. Has a DeepSeek sentiment client that's built but NOT wired in (see `src/api/deepseek-client.ts`)
6. Has an external API interface for bots that's defined but mostly empty (see `src/api/external-api.ts`)

The problem: 30% of prediction market volume is from AI agents/bots, and Musashi currently only finds relevant markets but doesn't give agents actionable signals. I need to build the actual agent-facing API that makes this useful for bots.

## What I need you to build (in priority order):

### 1. Cross-Platform Arbitrage Detection

This is the single highest-value feature. Create `src/api/arbitrage-detector.ts`:

- After fetching markets from both Polymarket and Kalshi, match markets that refer to the same underlying event. Use a combination of:
  - Title similarity (fuzzy matching on market titles — same entities + same timeframe = likely same event)
  - Keyword overlap (markets sharing 3+ keywords from `generateKeywords()` output are likely related)
  - Category + date overlap as a filter
- For matched pairs, compute: `spread = abs(polymarket_yes_price - kalshi_yes_price)`
- Store arbitrage opportunities in chrome.storage alongside the market cache
- Expose via service worker message: `{ type: 'GET_ARBITRAGE', minSpread: 0.03 }`

The matching doesn't need to be perfect — even a simple approach (normalize titles, extract entities, compare) catches the obvious ones like "Will Bitcoin hit $100K?" appearing on both platforms.

### 2. Structured Signal API Response

Modify `src/api/musashi-api-client.ts` to return richer data. The `AnalyzeTextResponse` interface already has `signal_type`, `urgency`, `event_id` fields — now actually compute them:

- Wire in `src/analysis/sentiment-analyzer.ts` — when a tweet matches a market, run sentiment analysis on the tweet text
- Compute `edge`: compare sentiment-implied probability against current market price
  - If tweet is bullish and market YES price is low → positive edge on YES
  - If tweet is bearish and market YES price is high → positive edge on NO  
  - `edge = sentiment_confidence * abs(implied_probability - current_price)`
- Compute `urgency`:
  - `critical`: edge > 0.15 AND market volume > $500K AND market expires within 7 days
  - `high`: edge > 0.10 OR (cross-platform spread > 0.05 on this event)
  - `medium`: edge > 0.05
  - `low`: match found but no clear edge
- Compute `signal_type`:
  - `arbitrage`: cross-platform spread detected
  - `news_event`: tweet contains breaking news keywords (see existing keyword patterns)
  - `sentiment_shift`: sentiment strongly disagrees with current market price
  - `user_interest`: default fallback, just a match without strong signal

Add a new field to the response:
```typescript
suggested_action?: {
  direction: 'YES' | 'NO' | 'HOLD';
  confidence: number;
  edge: number;
  reasoning: string;
}
```

### 3. Faster Market Refresh for the Service Worker

In `src/background/service-worker.ts`:
- Drop `CACHE_TTL_MS` from 30 minutes to 5 minutes for the default refresh
- Add a price-polling mechanism: for the top 50 markets by volume, poll Polymarket's price endpoint every 60 seconds (it's just a lightweight GET, no pagination needed)
- Track `previousPrice` for each market so you can compute `priceChange1h` and detect "movers" (markets where price changed >5% in the last hour)
- Store movers separately: `chrome.storage.local.set({ market_movers: [...] })`
- Add message handler: `{ type: 'GET_MOVERS', minChange: 0.05 }` → returns markets with recent large price movements

### 4. REST API Endpoints (Vercel Backend)

Create `api/` directory at the project root for Vercel serverless functions:

**`api/analyze-text.ts`** — Already referenced by the client. Implement it:
- Accept `POST { text: string, minConfidence?: number, maxResults?: number }`
- Import and run the matching engine server-side (port `KeywordMatcher` to work in Node.js — it's pure TypeScript with no browser deps)
- Run sentiment analysis on the text
- Return the full structured signal response from step 2

**`api/markets/arbitrage.ts`** — GET endpoint
- Fetch markets from both platforms (cache server-side with 5-min TTL using in-memory cache or Vercel KV)
- Run the arbitrage detector from step 1
- Return sorted by spread descending
- Query params: `?minSpread=0.03&category=crypto&limit=20`

**`api/markets/movers.ts`** — GET endpoint  
- Track market prices over time (store snapshots every 5 min)
- Return markets with largest absolute price change in last 1h / 6h / 24h
- Query params: `?timeframe=1h&minChange=0.05&limit=20`

**`api/health.ts`** — GET endpoint
- Return market counts, last refresh time, API status

### 5. Improve the Matching Engine

In `src/analysis/keyword-matcher.ts`:

- Add **entity extraction** before keyword matching. Use simple regex patterns to extract:
  - People names (capitalized word pairs: "Jerome Powell", "Sam Altman")
  - Ticker symbols ($BTC, $NVDA, etc.)
  - Organizations (known list: "Federal Reserve", "OpenAI", "NATO", etc.)
  - Dates and timeframes ("March 2026", "Q1", "next week")
- Entity matches should get 2x weight vs regular keyword matches in the scoring
- Add a **recency bias**: when multiple markets match, prefer markets that expire sooner (you already have `getRecencyBoost()` but it only adds 0.05-0.1 — increase it to 0.1-0.2 for markets expiring within 7 days)

### 6. Agent SDK / Quick Integration

Create `src/sdk/musashi-agent.ts` — a standalone client library that an agent developer can copy into their project:

```typescript
class MusashiAgent {
  constructor(baseUrl?: string) // defaults to the Vercel API
  
  // Core methods
  async analyzeText(text: string): Promise<Signal>
  async getArbitrage(opts?: { minSpread?: number, category?: string }): Promise<ArbitrageOpportunity[]>
  async getMovers(opts?: { timeframe?: '1h'|'6h'|'24h', minChange?: number }): Promise<MarketMover[]>
  async getMarkets(opts?: { category?: string, platform?: string }): Promise<Market[]>
  
  // Streaming (polling-based initially)
  onSignal(callback: (signal: Signal) => void, intervalMs?: number): () => void  // returns unsubscribe
  onArbitrage(callback: (arb: ArbitrageOpportunity) => void, opts?: { minSpread: number }): () => void
}
```

Include a `README-AGENT.md` at the project root with:
- Quick start code snippet (5 lines to get first signal)
- Full API reference
- Example: "Build a bot that buys YES on Polymarket when Musashi detects bullish sentiment with >10% edge"
- Example: "Build an arbitrage bot that buys on the cheaper platform when spread >5%"

## Important constraints:
- Keep the Chrome extension working — don't break existing functionality
- The Vercel API should work without requiring the extension to be installed (standalone)
- Use the existing TypeScript/Node.js stack — no new languages
- The matching engine must remain fast (<100ms per match) — if adding entity extraction slows it down, make it optional
- All new API endpoints should return proper error responses with status codes
- Start with the cross-platform arbitrage detection (#1) and structured signals (#2) — those deliver the most value fastest. The rest can be iterated on.
