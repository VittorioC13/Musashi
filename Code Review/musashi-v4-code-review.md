# Musashi v4 Code Review

## Previous Issues: All Fixed ✅

Every item from the last review has been addressed:

- ✅ `api/lib/` dead code: 3,092 lines deleted, only `market-cache.ts` remains
- ✅ `manifest.json`: `https://clob.polymarket.com/*` added to `host_permissions`
- ✅ Recency boost: `<= 7` now checked before `<= 30`
- ✅ `improved-matcher-additions.ts`: deleted (content was already in keyword-matcher)
- ✅ Python scripts: deleted
- ✅ Test HTML/JS/PS1 files: deleted
- ✅ `api-docs/` directory: deleted
- ✅ `docs/openapi.yaml`: deleted
- ✅ Movers race condition: `await recordPriceSnapshots(markets)` now awaited
- ✅ N+1 snapshot count: replaced with `getTrackedMarketCount()` (key count only)
- ✅ `KeywordMatcher` default: now `markets: Market[] = []` instead of `mockMarkets`
- ✅ Root docs: consolidated to 5 files

The codebase is noticeably cleaner. What's left is performance and consistency issues.

---

## Bugs

### BUG 1: `docs/schema.json` Says `buy/sell/hold` — Code Returns `YES/NO/HOLD`

```json
// docs/schema.json
"SuggestedAction": {
  "enum": ["buy", "sell", "hold"]
}
```

```typescript
// src/analysis/signal-generator.ts (actual)
direction = 'YES';   // not 'buy'
direction = 'NO';    // not 'sell'
direction = 'HOLD';  // matches
```

Any agent developer using the JSON schema for type generation will get the wrong enum. Fix the schema to `["YES", "NO", "HOLD"]`.

### BUG 2: `.well-known/ai-plugin.json` References Deleted Files

```json
"documentation": {
    "quickstart": "./QUICKSTART.md",         // DELETED
    "full_guide": "./AI-AGENTS.md",          // DELETED
    "openapi_spec": "./docs/openapi.yaml",   // DELETED
    ...
}
```

These were cleaned up in the last pass, but `ai-plugin.json` still points to them. Also, the entire `ai-plugin.json` still describes the Chrome extension messaging protocol (`"protocol": "chrome.runtime.sendMessage"`) rather than the REST API. This file was clearly written before the v2 upgrade and never updated.

### BUG 3: `MarketMatch` Import Is Unused in `api/analyze-text.ts`

```typescript
import { MarketMatch } from '../src/types/market';  // line 2 — never used
```

The `MarketMatch` type isn't referenced anywhere in the file. The signal generator returns `TradingSignal` which contains matches internally. Minor, but TypeScript strict mode would flag this.

---

## Performance Issues

### PERF 1: `detectArbitrage` Runs on Every `/api/analyze-text` Request (O(n×m), ~200K comparisons)

Line 77 of `api/analyze-text.ts`:
```typescript
const arbitrageOpportunities = detectArbitrage(markets, 0.03);
```

This runs the full O(500×400) = 200,000 pair comparison every time someone calls the analyze endpoint. The service worker caches arbitrage results — the Vercel endpoint should too.

Fix: Add an arbitrage cache alongside the market cache in `api/lib/market-cache.ts`:

```typescript
let cachedArbitrage: ArbitrageOpportunity[] = [];
let arbCacheTimestamp = 0;

export async function getArbitrage(): Promise<ArbitrageOpportunity[]> {
  const markets = await getMarkets();
  const now = Date.now();
  if (cachedArbitrage.length > 0 && (now - arbCacheTimestamp) < CACHE_TTL_MS) {
    return cachedArbitrage;
  }
  cachedArbitrage = detectArbitrage(markets, 0.03);
  arbCacheTimestamp = now;
  return cachedArbitrage;
}
```

This is especially important because the market cache already has a 5-min TTL — running the same arbitrage scan on the same cached markets produces identical results every time within that window.

### PERF 2: Vercel Cold Start May Timeout on Hobby Plan

The first request after a cold start triggers `getMarkets()`, which fetches:
- Polymarket: up to 10 pages × ~1-2s/page = ~10-20s
- Kalshi: up to 10 pages × ~1-2s/page = ~10-20s

Both run in parallel, so ~10-20s total. Vercel Hobby plan has a **10s function timeout**. If either API is slow, the request will timeout with a 504.

Options:
- Reduce page count for the API path (e.g., `fetchPolymarkets(200, 3)` for the API, keep `(500, 10)` for the extension)
- Set `maxDuration` in `vercel.json` (requires Pro plan): `"functions": { "api/**/*.ts": { "maxDuration": 30 } }`
- Accept that cold starts may fail and the second request will hit cache

### PERF 3: Duplicate KV Reads in `detectMovers`

For each market that IS a mover, the snapshots array is read from KV twice:
1. `getPriceChange()` at line 84 reads the full snapshot array
2. `detectMovers()` at line 133 reads it again to get `previousPrice`

Fix: Have `getPriceChange` return both the change value and the previous price, avoiding the second KV read.

---

## Dead Code (Remaining)

| File | Lines | Status |
|---|---|---|
| `src/analysis/keyword-matcher.ts.backup` | 955 | Dead — old backup |
| `src/types/news-analysis.ts` | 45 | Dead — imports from deepseek-client, nothing imports it |
| `src/sidebar/TwitterNativeCard-improved.tsx` | 283 | Dead — unused variant |
| `src/sidebar/TwitterNativeCard-original.tsx` | 170 | Dead — unused variant |
| `src/api/deepseek-client.ts` | ? | Dead — only referenced by dead `news-analysis.ts` |
| `.well-known/ai-plugin.json` | ~130 | Stale — describes deleted architecture |
| `api/test.ts` | 17 | Probably meant to be temporary |
| `public/api-docs.html` | ~300 | Stale — old pre-v2 API docs page |
| **Total** | **~1,900** | |

These don't break anything, but 1,900 lines of dead code is still noise. The backup file alone is 955 lines.

---

## Consistency Issues

### `external-api.ts` References `musashi.bot` URLs That Don't Exist

```typescript
main: 'https://musashi.bot/ai',
quickstart: 'https://musashi.bot/ai/quickstart',
schema: 'https://musashi.bot/ai/schema.json',
openapi: 'https://musashi.bot/ai/openapi.yaml',
```

Unless `musashi.bot` is a real domain you own and plan to deploy to, these will 404. The SDK points to `https://musashi-api.vercel.app` — that's the real URL. These should match.

### Service Worker Fetches 1000+400 Markets, API Fetches 500+400

```typescript
// service-worker.ts
fetchPolymarkets(1000, 15), fetchKalshiMarkets(400, 15)

// api/lib/market-cache.ts
fetchPolymarkets(500, 10), fetchKalshiMarkets(400, 10)
```

The service worker gets up to 1000 Polymarket markets (15 pages); the API gets 500 (10 pages). This means the extension and API may return different results for the same query. Either make them match, or document the difference. The API should probably fetch fewer (it's constrained by timeout), but it should be explicit.

### `.sort()` Mutates Array In-Place

Line 318 of `service-worker.ts`:
```typescript
const topMarkets = markets
  .sort((a, b) => b.volume24h - a.volume24h)
  .slice(0, TOP_MARKETS_COUNT);
```

`.sort()` mutates the original `markets` array. Since `markets` came from `chrome.storage.local.get()`, this likely works fine (Chrome returns a copy), but it's fragile. Use `[...markets].sort(...)` to be safe.

### CLOB Price Poller Has No Timeout

`fetchPolymarketPrice()` in `polymarket-price-poller.ts` calls `fetch()` with no timeout. If the CLOB API hangs, the entire price polling cycle blocks indefinitely. Add an `AbortController` with a 5-second timeout:

```typescript
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 5000);
const response = await fetch(url, { signal: controller.signal });
clearTimeout(timeout);
```

---

## What's Good

The codebase is materially better than the last review. Specific improvements:

- **Clean file structure**: no more 24 markdown files, no Python scripts, no test files scattered at root
- **`api/lib/`**: reduced from 10 files (3,092 lines) to 1 file (50 lines) — clean single responsibility
- **KV integration**: movers endpoint properly persists price history with TTL, batch processing, and error handling
- **CLOB price poller**: lightweight parallel fetching with controlled concurrency
- **Service worker**: well-organized message handlers with consistent error patterns

The architecture is correct. The extension path (Chrome storage + service worker) and API path (Vercel + KV) are properly separated with shared core logic in `src/analysis/` and `src/api/`.

---

## Priority Fix List

1. **Cache arbitrage results in Vercel** — 200K comparisons per request is unnecessary when markets are cached for 5 minutes
2. **Fix `docs/schema.json`** — `buy/sell/hold` → `YES/NO/HOLD`
3. **Update or delete `.well-known/ai-plugin.json`** — references deleted files and old architecture
4. **Add fetch timeout to CLOB poller** — prevents hanging price polls
5. **Use `[...markets].sort()`** — prevents array mutation
6. **Delete remaining dead files** — ~1,900 lines (backup, unused card variants, stale types)
7. **Remove unused `MarketMatch` import** — line 2 of `api/analyze-text.ts`

None of these are blockers. #1 is a real performance issue; #2 will confuse agent developers; the rest are cleanup.
