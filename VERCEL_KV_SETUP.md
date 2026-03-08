# Vercel KV Setup Guide

The Musashi API uses Vercel KV (Redis) to persist price history for market movers detection across serverless function invocations.

## Quick Setup

### 1. Create a Vercel KV Store

**Option A: Via Vercel Dashboard**

1. Go to your Vercel project dashboard
2. Navigate to "Storage" tab
3. Click "Create Database"
4. Select "KV" (Redis)
5. Choose a region (recommended: same as your deployment region)
6. Click "Create"

**Option B: Via Vercel CLI**

```bash
vercel env add KV_REST_API_URL
vercel env add KV_REST_API_TOKEN
vercel env add KV_REST_API_READ_ONLY_TOKEN
```

### 2. Environment Variables

Vercel will automatically add these environment variables to your project:

- `KV_REST_API_URL` - KV REST API endpoint
- `KV_REST_API_TOKEN` - Authentication token
- `KV_REST_API_READ_ONLY_TOKEN` - Read-only token (optional)

### 3. Deploy

```bash
vercel --prod
```

The movers endpoint will automatically use KV for persistent storage.

---

## How It Works

### Price Snapshot Storage

The movers endpoint stores price snapshots in KV with the following structure:

**Key Format**: `price_history:{marketId}`

**Value**: Array of `PriceSnapshot` objects
```typescript
interface PriceSnapshot {
  marketId: string;
  yesPrice: number;
  timestamp: number;
}
```

**TTL**: 7 days

**Example**:
```
Key: price_history:polymarket-0x123abc
Value: [
  { marketId: "polymarket-0x123abc", yesPrice: 0.65, timestamp: 1709294400000 },
  { marketId: "polymarket-0x123abc", yesPrice: 0.67, timestamp: 1709298000000 },
  { marketId: "polymarket-0x123abc", yesPrice: 0.72, timestamp: 1709301600000 }
]
```

### Snapshot Recording

Every time the movers endpoint is called:

1. Fetches current markets from Polymarket/Kalshi
2. For each market, retrieves existing snapshots from KV
3. Appends new snapshot with current price + timestamp
4. Filters out snapshots older than 7 days
5. Stores back to KV with 7-day TTL

**Processing**: Batched in groups of 50 markets to avoid rate limits

### Movers Detection

1. For each market, retrieves snapshot history from KV
2. Finds snapshot from ~1 hour ago (closest match)
3. Calculates price change: `currentPrice - priceOneHourAgo`
4. Returns markets with change >= `minChange` threshold (default: 5%)

**Performance**: Batched queries, processed in parallel

---

## Storage Costs

Vercel KV pricing (as of 2025):

- **Free tier**: 256 MB storage, 100K commands/month
- **Pro tier**: 512 MB storage, 1M commands/month
- **Enterprise**: Custom limits

### Estimated Usage (Musashi)

With 1000 markets and snapshots every 5 minutes:

- **Snapshots per day**: 1000 markets × 288 snapshots = 288,000 snapshots
- **Snapshots stored (7 days)**: 2,016,000 snapshots
- **Storage per snapshot**: ~50 bytes
- **Total storage**: ~100 MB
- **Commands per day**: ~300K reads + 300K writes = 600K

**Recommendation**: Pro tier ($20/month) for production use

---

## Testing Locally

To test KV locally, you'll need to set up a local Redis instance or use Upstash Redis.

### Option 1: Local Redis (Docker)

```bash
# Start Redis
docker run -d -p 6379:6379 redis:alpine

# Set environment variables
export KV_REST_API_URL="redis://localhost:6379"
export KV_REST_API_TOKEN=""
```

### Option 2: Upstash Redis (Cloud)

1. Create free account at https://upstash.com
2. Create a Redis database
3. Copy REST API URL and token
4. Set environment variables:

```bash
export KV_REST_API_URL="https://your-db.upstash.io"
export KV_REST_API_TOKEN="your-token"
```

### Run Locally

```bash
vercel dev
```

Test the movers endpoint:
```bash
curl http://localhost:3000/api/markets/movers?minChange=0.05
```

---

## Migration from @vercel/kv to Upstash

**NOTE**: `@vercel/kv` is deprecated. Vercel has migrated existing KV stores to Upstash Redis automatically.

For new projects, use Upstash Redis integration directly:

1. Install Upstash Redis from Vercel Marketplace
2. Replace imports:

```typescript
// Old (deprecated)
import { kv } from '@vercel/kv';

// New (recommended)
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

// API is identical
await redis.get('key');
await redis.set('key', 'value');
await redis.setex('key', 3600, 'value');
```

---

## Troubleshooting

### Error: "KV_REST_API_URL is not defined"

**Solution**: Ensure KV environment variables are set in Vercel dashboard or `.env.local` for local development.

### Error: "Failed to connect to KV"

**Solution**:
- Check that KV store is created in Vercel dashboard
- Verify environment variables are correctly set
- Ensure your Vercel deployment region matches KV region

### Empty movers response

**Causes**:
1. First request - no price history yet (need 2+ snapshots 1 hour apart)
2. Markets haven't moved (all changes < `minChange` threshold)
3. KV storage error (check logs)

**Solution**:
- Wait 1 hour after first deployment
- Lower `minChange` threshold: `?minChange=0.01`
- Check Vercel logs for KV errors

### High KV costs

**Solution**:
- Reduce snapshot frequency (increase endpoint call interval)
- Reduce history retention (change `HISTORY_TTL_SECONDS`)
- Filter markets before recording snapshots (only top 100 by volume)

---

## Alternative: Chrome Extension for Movers

If you don't want to use KV, the Chrome extension has built-in movers tracking using `chrome.storage.local`:

- **Persistent**: Survives browser restarts
- **Free**: No storage costs
- **7-day history**: Same retention as KV
- **Local only**: Data stays on user's machine

To use extension movers:

1. Install Chrome extension
2. Let it run for 1+ hour
3. Check sidebar for market movers
4. Or use background script: `chrome.runtime.sendMessage({ action: 'GET_MOVERS' })`

---

## Summary

✅ **Pros of KV**:
- Persistent across serverless invocations
- Accessible via REST API for bots
- Scales automatically
- No local setup needed

❌ **Cons of KV**:
- Costs money (Pro tier needed)
- Requires Vercel account
- Network latency for reads/writes

**Recommendation**: Use KV for production API. Use Chrome extension for personal use.
