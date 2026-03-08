# Twitter API Setup Guide

Musashi v3 requires a Twitter Developer account and Bearer Token to collect tweets from curated accounts.

---

## Step 1: Create Twitter Developer Account

1. Go to [https://developer.twitter.com/](https://developer.twitter.com/)
2. Click "Sign up" or "Apply for access"
3. Choose **"Hobbyist"** → **"Exploring the API"**
4. Fill out application form:
   - **App name**: Musashi Prediction Market Intelligence
   - **Use case**: Collect tweets from public accounts to analyze sentiment for prediction markets
   - **Will you make Twitter content available to government entities?**: No
5. Agree to Developer Agreement and Policy
6. Verify your email address

**Note**: Approval is usually instant for hobbyist accounts.

---

## Step 2: Create a Project and App

1. In Developer Portal, click **"Projects & Apps"**
2. Click **"Create Project"**
   - **Project name**: Musashi
   - **Use case**: Building tools for other developers
   - **Description**: AI agent intelligence service for prediction markets
3. Create an App within the project:
   - **App name**: musashi-feed-collector
   - **Environment**: Production

---

## Step 3: Get Bearer Token

1. Go to your app's **"Keys and tokens"** tab
2. Under **"Bearer Token"**, click **"Generate"**
3. **CRITICAL**: Copy the Bearer Token immediately (shown only once!)
4. Store safely in password manager

### Example Bearer Token format:
```
AAAAAAAAAAAAAAAAAAAAxG1jAEAAAA...very_long_string...
```

If you lose it, you'll need to regenerate (invalidates the old one).

---

## Step 4: Configure Vercel Environment Variable

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add new variable:
   - **Key**: `TWITTER_BEARER_TOKEN`
   - **Value**: `<paste your bearer token>`
   - **Environments**: Select **Production**, **Preview**, and **Development**
4. Click **"Save"**
5. **Redeploy** your application for changes to take effect

---

## Step 5: Verify Setup

### Test the Twitter API connection:

```bash
curl "https://your-musashi-api.vercel.app/api/feed/accounts"
```

If successful, you'll see a JSON response with the list of 71 monitored accounts.

### Check cron logs in Vercel dashboard:

1. Go to **Deployments** → **Functions**
2. Find `collect-tweets` function
3. View logs for any errors
4. Wait 2 minutes for first cron run
5. Check logs for "Complete: X tweets stored"

---

## Rate Limits

| Endpoint | Rate Limit |
|----------|-----------|
| User Timeline | 900 requests per 15 minutes |
| User Lookup | 300 requests per 15 minutes |

**Musashi's usage:**
- Cron runs every 2 minutes
- Fetches from ~45-70 accounts per run
- **Total**: ~45-70 requests every 2 minutes = **~1,350-2,100 requests per hour**

This is well within the **900 requests per 15 minutes** (3,600/hour) limit. ✅

---

## Troubleshooting

### Error: "401 Unauthorized"

**Cause**: Bearer token is incorrect or expired

**Solution**:
1. Double-check `TWITTER_BEARER_TOKEN` in Vercel settings
2. Regenerate token in Twitter Developer Portal if needed
3. Update Vercel environment variable
4. Redeploy

---

### Error: "429 Too Many Requests"

**Cause**: Rate limit exceeded

**Solution**:
- Musashi automatically handles this by stopping collection and logging a warning
- Wait 15 minutes for rate limit window to reset
- Check cron logs for "Rate limit hit" message
- Next cron run will resume collection

---

### Error: "403 Forbidden"

**Cause**: App doesn't have access to Twitter API v2

**Solution**:
1. Check your Developer Portal access level
2. You may need to upgrade to **"Elevated" access** (still free)
3. Go to Developer Portal → Your Project → Settings → Apply for Elevated

---

### Error: "404 Not Found" for specific account

**Cause**: Twitter account suspended, deleted, or username changed

**Solution**:
- Check `src/data/twitter-accounts.ts` for outdated usernames
- Remove or update the account
- Musashi automatically skips these accounts and logs a warning

---

### No tweets appearing in feed

**Possible causes**:
1. **Cron not running**: Check Vercel cron logs
2. **No market matches**: Tweets must match ≥1 prediction market with confidence ≥0.3
3. **Bearer token missing**: Check environment variables
4. **Twitter API down**: Check [Twitter API status](https://api.twitterstat.us/)

**Debug steps**:
```bash
# Check if accounts endpoint works
curl "https://your-musashi-api.vercel.app/api/feed/accounts"

# Check feed stats
curl "https://your-musashi-api.vercel.app/api/feed/stats"

# Check cron metadata
# (requires KV access via Vercel dashboard)
```

---

## Cost

### Free Tier (sufficient for Musashi):
- **500,000 tweets per month**
- Musashi collects ~5-10 tweets per 2-minute cron
- **Estimated usage**: ~3,600-7,200 tweets/day = **~108,000-216,000 tweets/month**
- **Well within free tier** ✅

### Paid Tiers (if you need more):
- **Basic**: $100/month - 10M tweets/month
- **Pro**: $5,000/month - 50M tweets/month

---

## Security Best Practices

1. **Never commit** `TWITTER_BEARER_TOKEN` to git
2. Use Vercel environment variables (encrypted at rest)
3. **Don't share** your bearer token
4. **Regenerate** if token is exposed
5. Monitor usage in Twitter Developer Portal

---

## Additional Resources

- [Twitter API v2 Documentation](https://developer.twitter.com/en/docs/twitter-api)
- [Rate Limits Overview](https://developer.twitter.com/en/docs/twitter-api/rate-limits)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)

---

## Next Steps

Once setup is complete:

1. ✅ Deploy to Vercel
2. ✅ Set `TWITTER_BEARER_TOKEN`
3. ✅ Wait 2 minutes for first cron run
4. ✅ Test feed endpoint: `GET /api/feed`
5. ✅ Integrate with your AI agent using the SDK

**Happy trading!** 🚀
