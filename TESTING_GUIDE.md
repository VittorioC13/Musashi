# 🧪 How to Test Musashi API

Quick guide to test if live prices and features are working.

---

## Method 1: Simple Browser Test (Easiest)

### Test the API Endpoint:

1. Open your browser
2. Go to: https://musashi-api.vercel.app/api/test
3. You should see:
```json
{
  "success": true,
  "message": "Musashi API is online!",
  "timestamp": "2026-02-28T..."
}
```

✅ If you see this → API is working!

---

## Method 2: Test with PowerShell (Windows)

### Quick Test:

```powershell
# Test API is online
Invoke-RestMethod -Uri "https://musashi-api.vercel.app/api/test" -Method Get

# Test live prices (Trump deportation)
$body = @{
    text = "Trump deportation policy"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://musashi-api.vercel.app/api/analyze-text" -Method Post -Body $body -ContentType "application/json"
```

### What to Look For:

✅ **Live prices working** if you see:
- `"isLive": true`
- `"live_prices_fetched": 1`
- Real prices like `"yesPrice": 0.9635`

❌ **Mock prices** if you see:
- `"isLive": false`
- `"live_prices_fetched": 0`
- `"cache_hits": 1`

---

## Method 3: Use Our Test Scripts (Best for Full Testing)

### Run Phase 1 Tests:

```bash
cd "C:\Users\rotciv\Desktop\Musashi ai"
node test-phase1.js
```

**What this tests:**
- ✅ Event ID generation
- ✅ Signal type classification
- ✅ Urgency detection
- ✅ Metadata tracking

**Expected output:**
```
✅ Phase 1 Fields:
   Event ID: evt_crypto_991b32db
   Signal Type: user_interest
   Urgency: medium
   Processing Time: 23ms
```

### Run Phase 2 Tests:

```bash
cd "C:\Users\rotciv\Desktop\Musashi ai"
node test-phase2.js
```

**What this tests:**
- ✅ Live price fetching
- ✅ Price caching
- ✅ Arbitrage detection
- ✅ Fallback to mock prices

**Expected output:**
```
✅ Phase 2 Fields:
   Live Prices Fetched: 1
   Cache Hits: 0
   isLive: true ✅
```

---

## Method 4: Manual API Testing with curl

### Test 1: Check if API is online

```bash
curl https://musashi-api.vercel.app/api/test
```

Expected: `{"success": true, "message": "Musashi API is online!"}`

---

### Test 2: Test live Polymarket prices

```bash
curl -X POST https://musashi-api.vercel.app/api/analyze-text \
  -H "Content-Type: application/json" \
  -d "{\"text\":\"Trump deportation\"}"
```

**Look for these in the response:**

✅ **WORKING** - Live prices:
```json
{
  "market": {
    "isLive": true,              // 👈 LIVE data!
    "yesPrice": 0.9635,          // 👈 Real price
    "volume24h": 7542018,        // 👈 Real volume
    "polymarket_id": "0x4968..." // 👈 Has real ID
  },
  "metadata": {
    "live_prices_fetched": 1     // 👈 Fetched live!
  }
}
```

❌ **NOT WORKING** - Mock prices:
```json
{
  "market": {
    "isLive": false,             // 👈 Mock data
    "yesPrice": 0.48,            // 👈 Mock price
    "volume24h": 487000          // 👈 Mock volume
  },
  "metadata": {
    "live_prices_fetched": 0     // 👈 No live fetch
  }
}
```

---

### Test 3: Test Bitcoin markets

```bash
curl -X POST https://musashi-api.vercel.app/api/analyze-text \
  -H "Content-Type: application/json" \
  -d "{\"text\":\"Bitcoin price prediction\"}"
```

**Expected:** Should return Bitcoin markets (may be mock if Kalshi tickers expired)

---

### Test 4: Test Fed rate markets

```bash
curl -X POST https://musashi-api.vercel.app/api/analyze-text \
  -H "Content-Type: application/json" \
  -d "{\"text\":\"Fed interest rate cut\"}"
```

**Expected:** Should return Federal Reserve markets

---

### Test 5: Test arbitrage detection

```bash
curl -X POST https://musashi-api.vercel.app/api/analyze-text \
  -H "Content-Type: application/json" \
  -d "{\"text\":\"TikTok ban\"}"
```

**Look for:**
```json
{
  "signal_type": "arbitrage",  // 👈 If cross-platform match
  "urgency": "critical",       // 👈 Critical for arbitrage
  "data": {
    "arbitrage": {             // 👈 Arbitrage detection
      "detected": true,
      "spread": 0.07,
      "profit_potential": 0.05
    }
  }
}
```

---

## Method 5: Interactive Testing with Node

### Quick Interactive Test:

```bash
node
```

Then paste:

```javascript
// Test live prices
fetch('https://musashi-api.vercel.app/api/analyze-text', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({text: 'Trump deportation'})
})
.then(r => r.json())
.then(d => {
  console.log('\n🎯 Testing Results:');
  console.log('Markets found:', d.data.matchCount);
  console.log('Live prices fetched:', d.data.metadata.live_prices_fetched);
  console.log('\nFirst market:');
  console.log('- Title:', d.data.markets[0].market.title);
  console.log('- Yes Price:', (d.data.markets[0].market.yesPrice * 100).toFixed(2) + '%');
  console.log('- Is Live:', d.data.markets[0].market.isLive ? '✅ YES' : '❌ NO (mock)');
  console.log('- Volume:', '$' + d.data.markets[0].market.volume24h.toLocaleString());
})
```

---

## 🔍 What to Check For

### ✅ Everything is Working:

1. **API responds** (not 500 error)
2. **`success: true`** in response
3. **`isLive: true`** for at least one market
4. **`live_prices_fetched > 0`** in metadata
5. **Processing time < 500ms**
6. **Real prices** (changing values, not static)

### ⚠️ Partial Working:

1. **Some markets live, some mock** → Normal! Not all markets have real IDs yet
2. **`cache_hits > 0`** → Good! Cache is working
3. **Processing time varies** → Normal (200ms for live, 2ms for cache)

### ❌ Not Working:

1. **500 error** → API broken
2. **`success: false`** → Something crashed
3. **All markets `isLive: false`** → Live prices not fetching
4. **`live_prices_fetched: 0` always** → API integration broken

---

## 🐛 Common Issues and Fixes

### Issue: "Connection timeout"
**Fix:** Check internet connection, Vercel might be down

### Issue: "All prices are mock (isLive: false)"
**Fix:**
1. Check `polymarket_id` or `ticker` exists in market data
2. Verify condition ID is correct
3. Market may have expired

### Issue: "404 Not Found"
**Fix:** Wrong endpoint URL - use `/api/analyze-text` not `/analyze-text`

### Issue: "Slow response (>5 seconds)"
**Fix:**
1. First request is slow (cold start)
2. Second request should be fast (cache)
3. If always slow, check API logs

---

## 📊 Expected Performance

| Test | Expected Time | Status |
|------|---------------|--------|
| Health check (`/api/test`) | <100ms | ✅ |
| First live price fetch | 200-300ms | ✅ |
| Cached price fetch | 2-5ms | ✅ |
| Mock price fetch | 2-10ms | ✅ |
| Full analyze with 3 markets | <500ms | ✅ |

---

## 🎯 Quick Verification Checklist

Run these commands in order:

```bash
# 1. Test API is online
curl https://musashi-api.vercel.app/api/test

# 2. Test live Polymarket prices
curl -X POST https://musashi-api.vercel.app/api/analyze-text \
  -H "Content-Type: application/json" \
  -d "{\"text\":\"Trump deportation\"}"

# 3. Test cache (run same request twice)
curl -X POST https://musashi-api.vercel.app/api/analyze-text \
  -H "Content-Type: application/json" \
  -d "{\"text\":\"Trump deportation\"}"
```

**Second request should show:**
- ✅ `"cache_hits": 1`
- ✅ Faster processing time
- ✅ Same prices

---

## 🚀 Next Level Testing

### Test from Python:

```python
import requests

# Test live prices
response = requests.post(
    'https://musashi-api.vercel.app/api/analyze-text',
    json={'text': 'Trump deportation'}
)

data = response.json()

print(f"Markets found: {data['data']['matchCount']}")
print(f"Live prices: {data['data']['metadata']['live_prices_fetched']}")

for match in data['data']['markets']:
    market = match['market']
    print(f"\n{market['title']}")
    print(f"  Yes: {market['yesPrice']*100:.1f}%")
    print(f"  Live: {'✅' if market.get('isLive') else '❌'}")
    print(f"  Volume: ${market['volume24h']:,.0f}")
```

---

## 📝 Tips

1. **Always check `isLive` flag** - Tells you if data is real or mock
2. **Look at metadata** - Shows cache hits and live fetches
3. **Compare prices to Polymarket website** - Verify accuracy
4. **Test same query twice** - Second should be faster (cached)
5. **Try different topics** - Bitcoin, Fed, Trump, TikTok, AGI

---

## 🆘 Need Help?

If tests fail:
1. Check `api-docs/LIVE_PRICES_STATUS.md` for known issues
2. Look at GitHub issues: https://github.com/VittorioC13/Musashi/issues
3. Check Vercel deployment logs
4. Verify API is deployed: https://musashi-api.vercel.app

---

*Happy testing! 🧪*
