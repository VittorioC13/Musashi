# Verify Twitter API Credits

## After Adding Payment to Twitter Developer Portal

### Step 1: Wait for Activation (2-5 minutes)

Twitter needs to process your payment and activate credits.

### Step 2: Test with Curl

```bash
# Test if credits are working
curl -X POST "https://musashi-api.vercel.app/api/analyze-text" \
  -H "Content-Type: application/json" \
  -d '{"text": "Bitcoin hits $100k! Ethereum follows. Crypto markets explode."}'
```

Expected: Should return market matches (this doesn't use Twitter API, just tests the system)

### Step 3: Check Feed Stats

```bash
# Check if tweets are being collected
curl "https://musashi-api.vercel.app/api/feed/stats"
```

Look for `last_collection` timestamp updating every 2 minutes.

### Step 4: Wait for First Cron Run (up to 2 minutes)

The Vercel cron runs every 2 minutes. After credits are active:

```bash
# Keep checking until tweets appear
curl "https://musashi-api.vercel.app/api/feed?limit=5"
```

When working, you'll see tweets in the response!

### Step 5: Monitor Vercel Logs

```bash
# Watch live logs
cd "C:\Users\rotciv\Desktop\Musashi ai"
vercel logs --follow
```

Look for:
- ✅ `[Twitter Client] Successfully fetched @username`
- ✅ `[Cron] Complete: X tweets stored`
- ❌ No more 402 errors

### Step 6: Check Feed in Chrome Extension

1. Open Twitter/X in Chrome
2. Find a tweet from monitored accounts (e.g., @VitalikButerin)
3. Look for Musashi market cards appearing below tweets

## Success Indicators

✅ No 402 errors in logs
✅ Tweets being collected (check stats endpoint)
✅ `tweets_stored > 0` in cron responses
✅ Market cards appearing in Chrome extension
✅ Feed endpoint returning analyzed tweets

## If Still Getting 402 Errors

1. Verify payment processed on Twitter billing page
2. Check account status (may need email verification)
3. Wait 10-15 minutes for full activation
4. Contact Twitter support if issues persist

## Monitor Usage

- Check Twitter Developer Portal billing section
- Track API call usage
- Verify you're within tier limits
- Set up billing alerts if available
