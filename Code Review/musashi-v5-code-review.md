# Musashi v5 Code Review

## Previous Issues: All Fixed ✅

Every item from v4 review addressed:

- ✅ Arbitrage caching in Vercel via `getArbitrage()` in `market-cache.ts`
- ✅ `docs/schema.json` updated to `["YES", "NO", "HOLD"]`
- ✅ `.well-known/ai-plugin.json` deleted
- ✅ CLOB poller has 5s `AbortController` timeout with `AbortError` handling
- ✅ `[...markets].sort()` in service worker (no more array mutation)
- ✅ All dead files deleted (backup, news-analysis.ts, card variants, test.ts, api-docs.html)
- ✅ Unused `MarketMatch` import removed from `api/analyze-text.ts`
- ✅ Duplicate KV reads fixed — `getPriceChange` now returns `{ change, previousPrice }`
- ✅ `deepseek-client.ts` deleted

The codebase has gone from ~3,000 lines of dead code to ~1,100. All previous bugs are fixed. What follows is genuinely minor.

---

## Bugs (Minor)

### BUG 1: `getArbitrage()` Cache Ignores `minSpread` Parameter on Cache Hit

```typescript
// api/lib/market-cache.ts
export async function getArbitrage(minSpread: number = 0.03): Promise<ArbitrageOpportunity[]> {
  ...
  // Return cached if fresh and same spread threshold
  if (cachedArbitrage.length > 0 && (now - arbCacheTimestamp) < CACHE_TTL_MS) {
    return cachedArbitrage;  // ← Returns 0.03-filtered results even if called with 0.01
  }
  cachedArbitrage = detectArbitrage(markets, minSpread);  // ← Only runs on cache miss
  ...
}
```

The comment says "same spread threshold" but there's no check. If the first call is `getArbitrage(0.03)`, all subsequent calls within 5 minutes return the 0.03-filtered set regardless of what `minSpread` they pass.

In practice this doesn't matter today since `analyze-text.ts` always calls with `0.03`. But the function signature promises something it doesn't deliver. Fix: either cache with the lowest spread (e.g., `0.01`) and let callers filter, or track the cached minSpread and invalidate on mismatch.

### BUG 2: `/api/markets/arbitrage` Endpoint Bypasses the Cache

```typescript
// api/markets/arbitrage.ts
import { getTopArbitrage } from '../../src/api/arbitrage-detector';  // Direct import
...
const opportunities = getTopArbitrage(markets, { minSpread, ... });  // No cache
```

This endpoint calls `getTopArbitrage()` directly, which internally calls `detectArbitrage()` — the uncached O(n×m) scan. Meanwhile `analyze-text.ts` uses the cached `getArbitrage()`. So you have one endpoint cached and the other not.

Fix: Have the arbitrage endpoint use `getArbitrage()` from `market-cache.ts`, then apply the additional filters (confidence, category, limit) client-side. Cache with the lowest practical minSpread (e.g., `0.01`), since filtering down is cheap but recomputing up is O(n×m).

### BUG 3: Health Endpoint Response Shape Is Inconsistent

All other endpoints return `{ success: true/false, data: {...} }` or `{ success: false, error: "..." }`.

The health endpoint returns `{ status: "healthy", timestamp: ..., services: {...} }` — no `success` wrapper.

An agent using the SDK that checks `response.success` will get `undefined` for health checks. The SDK's `checkHealth()` method may handle this specially, but the inconsistency makes the API harder to use generically.

---

## Remaining Dead Code (~1,100 lines)

| File | Lines | Status |
|---|---|---|
| `src/api/external-api.ts` | 331 | Dead — imported by nothing. References `musashi.bot` URLs. |
| `src/sidebar/sidebar-original.css` | 495 | Dead — only `sidebar.css` is imported |
| `src/sidebar/sidebar-improved.css` | 265 | Dead — only `sidebar.css` is imported |
| `public/kalshi-rules.json` | 19 | Dead — referenced by nothing |
| **Total** | **~1,110** | |

These are all safe to delete. `external-api.ts` is the biggest one — 331 lines of a full API client for `musashi.bot` that nothing uses.

---

## Defensive Coding Suggestions

### No Text Length Validation on `/api/analyze-text`

The endpoint validates that `text` exists and is a string, but doesn't cap its length. The `KeywordMatcher` processes text by splitting on whitespace, extracting bigrams/trigrams, running synonym lookups, and entity extraction. A 1MB text payload would be slow.

Suggestion: Add a length cap (e.g., 10,000 characters) with a 400 response:
```typescript
if (body.text.length > 10000) {
  res.status(400).json({ ... error: 'Text exceeds 10,000 character limit.' });
}
```

### No Rate Limiting on Any Endpoint

All four endpoints are publicly accessible with `Access-Control-Allow-Origin: *` and no authentication. A bot polling `/api/markets/movers` every second would hammer KV with hundreds of reads per request. The SDK's `onMovers()` defaults to 60-second polling, but nothing enforces this server-side.

For now this is fine (you're not paying for traffic yet), but when you deploy, consider Vercel's edge middleware or Upstash rate limiter.

### `recordPriceSnapshots` Grows Unboundedly Within TTL Window

Each call to `/api/markets/movers` records a new snapshot for every market. If someone calls the endpoint every 5 seconds, each market accumulates 12 snapshots/minute × 60 minutes × 24 hours × 7 days = 120,960 snapshots per key. Each snapshot is ~50 bytes JSON, so ~6MB per market. With 500 markets, that's 3GB of KV data.

The TTL cleanup only removes snapshots older than 7 days. There's no deduplication ("don't record if price hasn't changed") or rate limiting ("record at most once per minute").

Suggestion: Skip recording if the latest snapshot for that market is less than 60 seconds old:
```typescript
const latestTs = snapshots.length > 0 ? snapshots[snapshots.length - 1].timestamp : 0;
if (now - latestTs < 60000) return; // Skip — already recorded recently
```

---

## Consistency Nitpicks

### Service Worker Fetches 1000+400, API Fetches 500+400

```typescript
// service-worker.ts (Chrome extension)
fetchPolymarkets(1000, 15), fetchKalshiMarkets(400, 15)

// market-cache.ts (Vercel API)
fetchPolymarkets(500, 10), fetchKalshiMarkets(400, 10)
```

Same user querying via the extension vs the API may get different market matches because the extension has 2x the Polymarket coverage. This is probably intentional (API has tighter timeout constraints), but it's undocumented.

### `batchFetchPolymarketPrices` Is Never Called

The sequential version (`batchFetchPolymarketPrices`) in `polymarket-price-poller.ts` is exported but nothing imports it. Only `parallelFetchPolymarketPrices` is used (by the service worker). The sequential function is 43 lines of dead code.

---

## What's Good

This is a clean codebase now. The file inventory:

```
api/                          4 endpoints + 1 shared cache module
src/analysis/                 5 modules (matcher, entities, sentiment, signals, orchestrator)
src/api/                      7 modules (2 platform clients, arbitrage, price tracker, CLOB poller, keyword gen, API client)
src/background/               1 service worker
src/content/                  3 modules (content script, card injection, tweet extraction)
src/sdk/                      1 agent SDK
src/sidebar/                  2 components + 1 CSS (+ 2 dead CSS)
src/types/                    1 type file
docs/                         5 files (reference, schema, examples)
```

The architecture is sound:
- Chrome extension path: tweet detection → keyword matching → signal generation → card injection
- Vercel API path: text input → cached markets → keyword matching → cached arbitrage → signal generation
- Both paths share `src/analysis/` and `src/api/` core logic
- No `chrome.*` dependencies in shared modules
- Proper error handling with `Promise.allSettled` throughout
- Caching at every level (market cache, arbitrage cache, KV for price history)

---

## Priority Fix List

1. **Wire arbitrage endpoint through cache** — it's the last uncached O(n×m) path
2. **Cache arbitrage with lowest minSpread** — fixes the misleading parameter + enables shared cache
3. **Add text length limit** — prevents abuse on the public API
4. **Add snapshot dedup in movers** — prevents unbounded KV growth
5. **Delete remaining dead code** — 1,110 lines across 4 files
6. **Consistent health response shape** — add `success` wrapper to match other endpoints

None of these are blockers. The codebase is deployable as-is.
