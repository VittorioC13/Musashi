# Musashi v3 Code Review: Being Picky

## What Changed Since Last Review

**Fixed from my last review:**
- ✅ Root docs consolidated: 24 → 5 markdown files
- ✅ `api/lib/market-cache.ts` created as shared market fetcher for all Vercel endpoints
- ✅ `api/tsconfig.json` updated: `rootDir: ".."` and `include: ["../src/**/*"]` so `../src/` imports resolve
- ✅ Vercel KV integrated for movers endpoint (persistent price history across cold starts)
- ✅ `@vercel/kv` added to `package.json` dependencies
- ✅ KV setup guide written (`VERCEL_KV_SETUP.md`)
- ✅ Category coherence bonus integrated into `keyword-matcher.ts` (was in separate file)
- ✅ Recency boost increased to 0.1-0.2 range (was 0.05-0.1)
- ✅ New `polymarket-price-poller.ts` with CLOB API for lightweight price polling
- ✅ Parallel price fetching with controlled concurrency (5 concurrent requests)

**NOT fixed from my last review:**
- 🔴 `api/lib/` still has 3,092 lines of dead code (9 files nobody imports)
- 🔴 `docs/openapi.yaml` still describes Chrome extension messaging, not REST endpoints
- 🔴 `improved-matcher-additions.ts` still exists as a separate file (though its content IS now integrated into keyword-matcher.ts — so the file itself is the dead code)

---

## Bugs

### BUG 1: Recency Boost — Conditions Are in Wrong Order

```typescript
// src/analysis/keyword-matcher.ts, line ~909
function getRecencyBoost(market: Market): number {
  ...
  if (daysUntilEnd > 0 && daysUntilEnd <= 30) {
    return 0.1;  // ← Markets expiring in 5 days hit THIS first
  }
  if (daysUntilEnd > 0 && daysUntilEnd <= 7) {
    return 0.2;  // ← UNREACHABLE for markets ≤7 days, because ≤30 catches them first
  }
  ...
}
```

A market expiring in 3 days returns 0.1 instead of 0.2. Fix: swap the order — check `<= 7` first, then `<= 30`.

### BUG 2: Missing `host_permissions` for CLOB API

`manifest.json` includes `https://gamma-api.polymarket.com/*` and `https://api.elections.kalshi.com/*`, but the new price poller calls `https://clob.polymarket.com`. The service worker will fail to fetch from the CLOB API because the domain isn't in `host_permissions`. This means the 60-second price polling will silently fail for every Polymarket market.

Add to `manifest.json`:
```json
"host_permissions": [
  "https://twitter.com/*",
  "https://x.com/*",
  "https://gamma-api.polymarket.com/*",
  "https://clob.polymarket.com/*",
  "https://api.elections.kalshi.com/*"
]
```

### BUG 3: Movers Endpoint — Race Condition on First Call

In `api/markets/movers.ts`, line 254-257:
```typescript
// Record price snapshots to KV (async, don't block response)
recordPriceSnapshots(markets).catch(err => { ... });

// Detect movers (reads from KV immediately after)
let movers = await detectMovers(markets, minChangeNum);
```

`recordPriceSnapshots` is fired-and-forgotten (not awaited), but `detectMovers` immediately reads from KV. On the first-ever call, the snapshots haven't been written yet, so `detectMovers` will always return empty. On subsequent calls within the same invocation it's fine, but on cold starts this is a race.

Fix: `await recordPriceSnapshots(markets)` before calling `detectMovers`. The latency cost is acceptable — the batched KV writes take ~100-200ms.

### BUG 4: `getTotalSnapshotCount` — N+1 Query to KV

```typescript
async function getTotalSnapshotCount(): Promise<number> {
  const keys = await kv.keys(`${SNAPSHOT_KEY_PREFIX}*`);  // 1 call
  const snapshots = await Promise.all(
    keys.map(key => kv.get<PriceSnapshot[]>(key))  // N calls
  );
  ...
}
```

If you're tracking 500 markets, this makes 501 KV requests per movers API call just for metadata. On Vercel KV (Upstash Redis), each request has ~5-10ms network overhead. That's 2.5-5 seconds just for the snapshot count.

Fix: Either cache the count, compute it during `recordPriceSnapshots`, or just remove this metadata field — it's not critical for the API consumer.

---

## Dead Code (Should Delete)

### 3,092 Lines in `api/lib/` Nobody Imports

Only `api/lib/market-cache.ts` is imported by any Vercel endpoint. These 9 files are dead:

| File | Lines | Why Dead |
|---|---|---|
| `api/lib/analysis/keyword-matcher.ts` | 1,183 | Endpoints import from `src/analysis/` |
| `api/lib/data/mock-markets.ts` | 1,159 | Endpoints use `market-cache.ts` → live fetch |
| `api/lib/analysis/phase1-enhancements.ts` | 146 | Content integrated into `src/analysis/` |
| `api/lib/integrations/kalshi-client.ts` | 114 | Endpoints import from `src/api/` |
| `api/lib/analysis/arbitrage-detector.ts` | 111 | Endpoints import from `src/api/` |
| `api/lib/services/price-fetcher.ts` | 115 | Not referenced by anything |
| `api/lib/integrations/polymarket-client.ts` | 102 | Endpoints import from `src/api/` |
| `api/lib/services/price-cache.ts` | 85 | Not referenced by anything |
| `api/lib/types/market.ts` | 77 | Has divergent `ArbitrageOpportunity` type |

### `src/analysis/improved-matcher-additions.ts` (291 lines)

Its content (category coherence, recency boost) is now inside `keyword-matcher.ts`. The file header still says "These should be integrated" — but they already were. Delete it.

### 8 Python Scripts at Root

`add_synonyms.py`, `fix_false_positives.py`, `fix_false_positives_v2.py`, `increase_market_coverage.py`, `integrate_improvements.py`, `integrate_improvements_v2.py`, `optimize_kalshi_client.py`, `raise_confidence_threshold.py` — these look like one-off migration scripts from past sessions. If they've been applied, they should be removed or moved to a `scripts/` directory.

### 10 Test Files at Root

`test-api.html`, `test-api.js`, `test-arbitrage.html`, `test-bot-view.ps1`, `test-both-perspectives.html`, `test-live.ps1`, `test-movers.html`, `test-phase1.js`, `test-phase2.js`, `test-signals.html` — move to `tests/` or delete.

### `api-docs/` Directory (12 files)

Contains `PHASE1_COMPLETE.md`, `PHASE2_COMPLETE.md`, `PHASE2_IMPLEMENTATION_PLAN.md`, etc. These are implementation logs, not API documentation. The actual API reference is in `API-REFERENCE.md` and `docs/api-reference.md`. Either move these to a `docs/internal/` directory or delete them.

### `docs/openapi.yaml` — Still Stale

Still describes Chrome extension messaging protocol. Either rewrite to describe the REST API or delete it — a stale OpenAPI spec is worse than no spec because it actively misleads.

---

## Architecture Nitpicks

### `mockMarkets` Gets Bundled into Every Vercel Function

`keyword-matcher.ts` has `import { mockMarkets } from '../data/mock-markets'` at the top and uses it as a default parameter: `constructor(markets: Market[] = mockMarkets)`. Even though the Vercel endpoints always pass `markets` explicitly, the 1,134-line `mock-markets.ts` is still imported and bundled. This adds ~50KB to every serverless function.

Fix: Make the default `[]` instead of `mockMarkets`, and move the fallback-to-mock logic to the caller (content-script.tsx already handles this).

### Movers KV — Batching Could Be Smarter

`recordPriceSnapshots` does a read-then-write for each market: `kv.get(key)` → push → `kv.setex(key)`. For 50 markets per batch, that's 100 KV operations (50 reads + 50 writes). Redis has `MGET`/`pipeline` commands that Upstash supports — using a pipeline would cut this to 2 round-trips.

### Sequential Price Polling in `batchFetchPolymarketPrices`

The sequential version (used as fallback) has a 50ms delay between requests. For 50 markets: 50 × 50ms = 2.5 seconds minimum. The parallel version is better (concurrency 5), but the service worker imports `parallelFetchPolymarketPrices` so this isn't actually a problem in practice — just noting that the sequential function exists but isn't used.

### Signal Edge Calculation Could Be More Nuanced

`calculateImpliedProbability` maps sentiment to a range of 0.1-0.9:
```typescript
if (sentiment.sentiment === 'bullish') {
  return 0.5 + (sentiment.confidence * 0.4); // Range: 0.5 to 0.9
}
```

This means even 100% confidence bullish sentiment caps at 0.9 implied probability. For markets where the YES price is already 0.85, the maximum possible edge is 0.05. Meanwhile the `calculateEdge` function multiplies by sentiment confidence *again*: `edge = sentiment.confidence * priceDiff`. So a 100% confident bullish tweet on a market at 0.85 gives edge = 1.0 × 0.05 = 0.05, which barely clears the `medium` urgency threshold.

The double-discounting (confidence caps the implied probability AND weights the edge) makes the system conservative. That's probably fine for a v1 — false negatives (missed trades) are better than false positives (bad trades). But worth knowing.

---

## Vercel Deploy Readiness

| Check | Status |
|---|---|
| `api/tsconfig.json` includes `../src/**/*` | ✅ |
| No `chrome.*` in any `src/` module used by Vercel | ✅ |
| `@vercel/kv` in dependencies | ✅ |
| `vercel.json` routes match all endpoints | ✅ |
| CORS headers on all endpoints | ✅ |
| Error handling with proper status codes | ✅ |
| `host_permissions` for CLOB API | 🔴 Missing |
| OpenAPI spec matches REST endpoints | 🔴 Stale |
| `mock-markets.ts` bundled unnecessarily | ⚠️ Minor |
| Movers race condition on first call | ⚠️ Edge case |

---

## Summary

**This is close to shippable.** The two blocking issues are:

1. **Add `https://clob.polymarket.com/*` to `manifest.json` `host_permissions`** — without this, the 60-second price polling feature you just built won't work at all.

2. **Swap the recency boost conditions** — `<= 7` before `<= 30`. One-line fix.

Everything else is cleanup: delete 3,092 lines of dead code in `api/lib/`, delete the stale files, update the OpenAPI spec, await the KV write before reading. None of these block shipping, but they make the codebase confusing for any future contributor (or future you).

The actual product logic — signal generation, arbitrage detection, entity extraction, CLOB price polling, KV-backed movers — is solid.
