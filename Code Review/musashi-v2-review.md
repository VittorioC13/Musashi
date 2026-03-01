# Musashi V2 Code Review: What Got Built, What Works, What Needs Fixing

## Scorecard

| Feature I Asked For | Status | Quality |
|---|---|---|
| 1. Cross-platform arbitrage detection | ✅ Built | Solid — Jaccard similarity + keyword overlap + entity matching with configurable thresholds |
| 2. Structured signal responses | ✅ Built | Good — sentiment → edge → urgency → suggested_action pipeline all wired up |
| 3. Entity extraction (people/orgs/tickers/dates) | ✅ Built | Good — integrated into scorer at 2x weight, comprehensive known-entity lists |
| 4. Vercel API endpoints | ✅ Built | Working — `/api/analyze-text`, `/api/markets/arbitrage`, `/api/markets/movers`, `/api/health` |
| 5. Price tracker + movers detection | ✅ Built | Good — chrome.storage-based history with 7-day retention, 60s polling interval |
| 6. Agent SDK | ✅ Built | Clean — `MusashiAgent` class with `analyzeText()`, `getArbitrage()`, `getMovers()`, `onSignal()`, `onArbitrage()` polling wrappers |
| Service worker updates | ✅ Built | Good — 5-min cache TTL (down from 30), price polling, arb detection on refresh, `GET_MOVERS` + `GET_ARBITRAGE` + `ANALYZE_TEXT_WITH_SIGNALS` handlers |
| README-AGENT.md | ✅ Built | Comprehensive — quick start, full API reference, example bots |

**Overall: Everything I asked for was built.** The architecture is correct. Now let me tell you what needs fixing before this is production-ready.

---

## Critical Issues

### 1. Vercel API tsconfig will break on deploy

The `api/tsconfig.json` sets `rootDir: "."` but the API files import from `../src/`. Vercel's `@vercel/node` builder uses the API's own tsconfig, and `rootDir: "."` means it can't resolve `../src/` imports.

**Fix:** Change `api/tsconfig.json`:
```json
{
  "compilerOptions": {
    "rootDir": "..",
    "outDir": "./.vercel/output"
  },
  "include": ["./**/*", "../src/**/*"]
}
```

Or alternatively, delete `api/tsconfig.json` entirely and let Vercel use the root tsconfig (which already includes `src/`).

### 2. `api/lib/` is dead code that will confuse contributors

You have a complete duplicate of the matching engine in `api/lib/` (1183-line keyword matcher, mock markets, Kalshi/Polymarket clients, arbitrage detector, price cache). But the actual Vercel endpoints import from `../src/`, not from `api/lib/`.

**Fix:** Delete the entire `api/lib/` directory. It's 152KB of dead weight. The Vercel endpoints already correctly import from `src/`.

### 3. Movers endpoint will never return data on Vercel serverless

The `api/markets/movers.ts` endpoint uses an in-memory `Map<string, PriceSnapshot[]>` for price history. On Vercel serverless, each invocation can be a fresh cold start — the price history map resets to empty. The endpoint even admits this in its response: `"note": "Serverless movers tracking uses in-memory storage"`.

This means an agent calling `GET /api/markets/movers` will almost always get `{ movers: [], count: 0 }` because there's never historical data to diff against.

**Options to fix:**
- **Quick:** Use Vercel KV (Redis) to persist price snapshots across invocations. Add `@vercel/kv` as a dependency and replace the in-memory Map with KV get/set.
- **Medium:** Use a Vercel Cron Job to snapshot prices every 5 min into KV, then the movers endpoint reads from KV.
- **Minimum viable:** Add a `note` to the API docs that movers only work reliably via the Chrome extension (which has persistent chrome.storage), not via the REST API.

### 4. Duplicate market-fetching logic across 3 endpoints

`api/analyze-text.ts`, `api/markets/arbitrage.ts`, and `api/markets/movers.ts` each have their own identical `getMarkets()` function with separate in-memory caches. On serverless, these caches are per-function-instance, so:
- The same markets get fetched 3 times if a bot calls all 3 endpoints
- Each endpoint's cache is isolated (one endpoint's cache doesn't warm the others)

**Fix:** Extract a shared `api/lib/market-cache.ts`:
```typescript
let cachedMarkets: Market[] = [];
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function getMarkets(): Promise<Market[]> {
  if (cachedMarkets.length > 0 && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
    return cachedMarkets;
  }
  // ... fetch logic
}
```
This won't share across Vercel function instances (serverless limitation), but it deduplicates the code and ensures consistent behavior. For true sharing, use Vercel KV.

---

## Medium Issues

### 5. Arbitrage matching is O(n×m) — will be slow at scale

`detectArbitrage()` compares every Polymarket market against every Kalshi market. With 1000 Poly × 400 Kalshi = 400,000 comparisons, each involving `normalizeTitle()` + `extractEntities()` + `calculateKeywordOverlap()`. This will be slow.

**Current:** Probably ~200-500ms on Vercel. Acceptable for now.

**At scale:** Pre-index markets by category, then only compare within-category pairs. This reduces from O(n×m) to O(n×m/k) where k is the number of categories. Easy 5-10x speedup:
```typescript
const polyByCategory = groupBy(polymarkets, m => m.category);
const kalshiByCategory = groupBy(kalshiMarkets, m => m.category);
for (const category of categories) {
  for (const poly of polyByCategory[category]) {
    for (const kalshi of kalshiByCategory[category]) { ... }
  }
}
```

### 6. Sentiment → edge calculation is naive

`calculateImpliedProbability()` maps sentiment to probability via a linear formula: `0.5 + (confidence * 0.4)`. This means a 100% confident bullish sentiment implies 90% YES probability, and that's compared against the market price to compute edge.

The problem: a random bullish tweet about Bitcoin doesn't mean Bitcoin will hit $100K with 90% probability. The sentiment of one tweet is weak evidence. The current formula would generate false "high edge" signals on every confident bullish/bearish tweet.

**Fix for later:** Scale the implied probability by the source credibility (e.g., verified accounts, follower count, historical accuracy). For now, at minimum, increase the HOLD threshold from 5% edge to 10%:
```typescript
if (edge < 0.10) {  // was 0.05
  return { direction: 'HOLD', ... };
}
```

### 7. No rate limiting on API endpoints

All endpoints are open with `Access-Control-Allow-Origin: *` and no authentication. A bot could hammer `/api/analyze-text` thousands of times per minute, and each call triggers Polymarket + Kalshi API fetches (if cache is cold).

**Fix for now:** Add Vercel's built-in rate limiting in `vercel.json`, or add a simple in-memory rate limiter per IP. For production, add API key auth.

---

## Minor Issues

### 8. Service worker price polling doesn't actually fetch fresh prices

In `pollTopMarketPrices()`, the comment says "For now, we'll record the current prices as snapshots... In a production system, you'd fetch fresh prices from the APIs here." It just re-records the cached market prices, not fresh ones. So `priceChange1h` will always be 0 between full refreshes (every 5 min).

**Fix:** For Polymarket, you can poll individual market prices cheaply via the CLOB API: `GET https://clob.polymarket.com/price?token_id={numericId}`. The `numericId` field is already in your Market type. Add a lightweight price-only fetch for the top 50 markets.

### 9. `generateEventId()` includes `Date.now()` making it non-deterministic

The event ID hash includes a timestamp, so the same tweet analyzed twice gets different event IDs. If an agent is deduplicating signals, this breaks dedup.

**Fix:** Remove the timestamp from the event ID, or make it optional:
```typescript
function generateEventId(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash = hash & hash;
  }
  return `evt_${Math.abs(hash).toString(36)}`;
}
```

### 10. Doc overload

There are 25+ markdown files in the repo root. Many are overlapping: `QUICKSTART.md`, `QUICK_REFERENCE.md`, `QUICK_REFERENCE_SHEET.md`, `QUICK_INTEGRATION.md`, `AI-AGENTS.md`, `AI-AGENT-SETUP-GUIDE.md`, `README-AGENT.md`, `API-REFERENCE.md`, `api-docs/API_DOCUMENTATION.md`, `docs/api-reference.md`...

An agent developer hitting the repo will be confused about which doc to read. Consolidate to 3 files max: `README.md` (project overview), `README-AGENT.md` (agent/API docs), `CHANGELOG.md`.

---

## What's Actually Good

Let me be specific about what was done well:

1. **The signal pipeline is complete end-to-end.** Tweet → tokenize → match → sentiment → edge → urgency → suggested_action. This is the core thing I asked for and it's wired up correctly.

2. **Arbitrage detection architecture is sound.** Jaccard similarity on normalized titles + keyword overlap + entity matching is the right approach before investing in embeddings. The configurable thresholds (`minSpread`, `minConfidence`) give agents control.

3. **The SDK is clean and ergonomic.** `MusashiAgent` class with typed methods, JSDoc examples, standalone helper functions, default export. The `onSignal()` / `onArbitrage()` / `onMovers()` polling wrappers with unsubscribe functions are exactly what bot developers expect.

4. **The service worker was properly upgraded.** 5-min TTL, price polling every 60s, arbitrage detection on refresh, new message handlers for `GET_ARBITRAGE` / `GET_MOVERS` / `ANALYZE_TEXT_WITH_SIGNALS`. Backward compatible with existing content script.

5. **Entity extraction is actually integrated into scoring**, not just a standalone module. The 2x weight boost for entities in `keyword-matcher.ts` means "Jerome Powell" matching a Fed market gets scored higher than a random keyword match. This directly improves match quality.

6. **Type safety throughout.** `ArbitrageOpportunity`, `TradingSignal`, `MarketMover`, `SuggestedAction` — all properly typed with discriminated unions for `signal_type` and `urgency`. SDK re-exports all types.

---

## Priority Fix Order

1. **Delete `api/lib/`** — 5 seconds, removes confusion
2. **Fix `api/tsconfig.json`** — 1 minute, unblocks Vercel deploy
3. **Extract shared market cache** — 30 minutes, deduplicates code
4. **Raise HOLD threshold to 10% edge** — 1 minute, reduces false signals
5. **Fix event ID determinism** — 1 minute, enables agent dedup
6. **Add Vercel KV for movers** — 2-3 hours, makes movers endpoint actually work
7. **Consolidate docs** — 1 hour, improves developer experience
8. **Add lightweight Polymarket price polling** — 2-3 hours, enables real movers detection
