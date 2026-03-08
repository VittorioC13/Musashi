# Musashi v6 Code Review

## Previous Issues: All Fixed ✅

- ✅ Arbitrage endpoint now uses `getArbitrage()` from cache
- ✅ `getArbitrage()` caches with `minSpread: 0.01` and filters client-side
- ✅ Text length limit (10,000 chars) on `/api/analyze-text`
- ✅ Snapshot dedup: skips recording if last snapshot < 60 seconds old
- ✅ Dead code deleted: `external-api.ts`, `sidebar-original.css`, `sidebar-improved.css`, `kalshi-rules.json`
- ✅ Health endpoint wrapped in `{ success: true, data: {...} }` shape
- ✅ `batchFetchPolymarketPrices` removed (dead sequential function)
- ✅ `mock-markets.ts` no longer imported by keyword-matcher

The repo is now 28 TypeScript files, 62 total files, ~7K lines of TS. Clean.

---

## Bug

### SDK `checkHealth()` — Two Problems

**Problem 1: Throws on degraded status.**

The health endpoint returns HTTP 503 when services are degraded. The SDK's `request()` method throws on `!response.ok`, which includes 503. So `checkHealth()` throws instead of returning the degraded status — defeating the purpose of a health endpoint.

**Problem 2: Wrong response field access.**

After wrapping the health response in `{ success: true, data: healthData }`, the SDK still accesses top-level fields:

```typescript
// SDK (wrong)
return {
  status: response.status,        // undefined — actual path is response.data.status
  timestamp: response.timestamp,  // undefined — actual path is response.data.timestamp
  services: response.services,    // undefined — actual path is response.data.services
};
```

Even when the endpoint returns 200 (healthy), the SDK returns `{ status: undefined, timestamp: undefined, services: undefined }`.

**Fix:** Two changes needed:
1. `checkHealth()` should catch the throw for 503 and parse the body, OR use a separate fetch that doesn't throw on non-2xx
2. Access `response.data.status`, `response.data.timestamp`, `response.data.services`

---

## Minor Issues

### `docs/schema.json` Is Stale (v1 Types)

The schema defines `MarketSignal`, `NewsAnalysis`, `SentimentPoint` — types from the v1 Chrome extension API. It doesn't define the v2 types that the REST API actually returns: `Signal` (with `event_id`, `signal_type`, `urgency`), `ArbitrageOpportunity` (with `polymarket`, `kalshi`, `spread`, `direction`), `MarketMover`, or the `TradingSignal` response shape.

The `SuggestedAction` enum was fixed to `YES/NO/HOLD`, but the rest of the schema doesn't match the API. An agent developer generating types from this file will get the wrong interfaces.

Not a blocker (the SDK provides correct TypeScript types), but the schema file is misleading if someone uses it directly.

### `minConfidence` / `maxResults` Not Bounds-Checked on analyze-text

```typescript
const { text, minConfidence = 0.3, maxResults = 5 } = body;
```

These are passed directly to `KeywordMatcher` without validation. `minConfidence: -1` would match everything; `maxResults: 999999` is harmless but sloppy. The arbitrage and movers endpoints validate their numeric params — analyze-text should too for consistency.

### Platform Clients Have No Fetch Timeout

`polymarket-client.ts` and `kalshi-client.ts` call `fetch()` with no `AbortController`. The CLOB poller was fixed to have a 5-second timeout, but the main market fetchers that run on cold start don't have one. On Vercel Hobby (10s function timeout), a hanging Polymarket API could consume the entire budget. `Promise.allSettled` prevents one failure from blocking the other, but a hung connection isn't a failure — it's a timeout.

This is a "nice to have" since Vercel's own function timeout will kill it eventually, but adding a per-request timeout would make cold starts more predictable.

### `mock-markets.ts` Is Orphaned

1,134 lines, imported by nothing. It was the fallback dataset when `KeywordMatcher` defaulted to `mockMarkets`. Now that the default is `[]`, this file is dead. It's not harmful (webpack tree-shaking should exclude it), but it's 1,134 lines of noise in the repo.

### Redundant Sort in Arbitrage Endpoint

`getArbitrage()` returns results from `detectArbitrage()` which already sorts by `spread` descending. Then `api/markets/arbitrage.ts` sorts again: `.sort((a, b) => b.spread - a.spread)`. Harmless but redundant.

---

## What the Codebase Looks Like Now

```
api/                    5 files — 4 endpoints + 1 cache module
  analyze-text.ts         POST endpoint, text → signal (cached markets + cached arbitrage)
  markets/arbitrage.ts    GET endpoint, cross-platform arb (cached)
  markets/movers.ts       GET endpoint, KV-backed price tracking with dedup
  health.ts               GET endpoint, platform connectivity check
  lib/market-cache.ts     Shared cache: markets (5min) + arbitrage (5min, low threshold)

src/analysis/           5 files — core matching + signal pipeline
  keyword-matcher.ts      1,200 lines, synonyms + entities + scoring
  entity-extractor.ts     People, tickers, orgs, dates (2x weight)
  sentiment-analyzer.ts   Keyword-based bullish/bearish/neutral
  signal-generator.ts     Edge, urgency, direction, reasoning
  analyze-text.ts         Orchestrator combining all of the above

src/api/                7 files — platform clients + detection
  polymarket-client.ts    Gamma API, pagination, binary market filter
  kalshi-client.ts        Elections API, pagination, parlay filter
  arbitrage-detector.ts   Fuzzy title matching, Jaccard similarity
  price-tracker.ts        Chrome storage-based price history
  polymarket-price-poller.ts  CLOB API with 5s timeout, parallel fetch
  keyword-generator.ts    Title → keywords, synonym expansion
  musashi-api-client.ts   Internal API client for content script

src/background/         1 file — service worker
  service-worker.ts       367 lines, 5min refresh, 60s price poll, message handlers

src/content/            3 files — Chrome extension UI
src/sidebar/            2 files + 1 CSS
src/popup/              3 files + 1 CSS
src/sdk/                1 file — agent SDK (470 lines)
src/types/              1 file — shared type definitions

docs/                   6 files — API reference, schema, examples
```

28 TypeScript files. No dead imports. No dead code except `mock-markets.ts` (arguable) and `docs/schema.json` (stale).

---

## Priority

1. **Fix SDK `checkHealth()`** — it's broken right now (returns undefined fields on 200, throws on 503)
2. **Update `docs/schema.json`** — or delete it, since the SDK provides TypeScript types
3. Everything else is polish

This is a clean, well-structured codebase. Ship it.
