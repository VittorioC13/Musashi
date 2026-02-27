# Debugging Musashi AI

## Issue: "No markets received"

If you see the error: **"[Musashi] No markets received. Check the Service Worker console for errors."**

Follow these steps:

### Step 1: Check Service Worker Console

1. Go to `chrome://extensions`
2. Find **Musashi** extension
3. Click "service worker" link (blue text)
4. A new DevTools window opens - this is the Service Worker console
5. Look for errors in red

### What to look for:

**Good signs:**
```
[Musashi SW] Service worker initialized
[Musashi SW] Starting market fetch...
[Musashi SW] Fetched 500 Polymarket + 200 Kalshi = 700 total markets
[Musashi SW] Stored 700 markets
```

**Bad signs:**
```
[Musashi SW] Polymarket fetch failed: [error message]
[Musashi SW] Kalshi fetch failed: [error message]
[Musashi SW] WARNING: No markets fetched!
```

### Step 2: Check Network Tab

1. In the Service Worker console, go to **Network** tab
2. Reload the extension
3. Look for requests to:
   - `gamma-api.polymarket.com` - Should return HTTP 200
   - `api.elections.kalshi.com` - Should return HTTP 200

**If blocked or failing:**
- Check if your network/firewall blocks these APIs
- Try accessing https://gamma-api.polymarket.com/markets directly
- Check if you're in a restricted region

### Step 3: Force Reload Extension

1. Go to `chrome://extensions`
2. Click the **reload** button (circular arrow) on Musashi
3. Go back to Service Worker console
4. Watch the logs as it fetches markets

### Step 4: Manual Test

Open the Service Worker console and run:

```javascript
// Test Polymarket API directly
fetch('https://gamma-api.polymarket.com/markets?closed=false&active=true&limit=10')
  .then(r => r.json())
  .then(data => console.log('Polymarket test:', data.length, 'markets'))
  .catch(err => console.error('Polymarket test failed:', err));

// Test storage
chrome.storage.local.get(['markets_v2'], (result) => {
  console.log('Stored markets:', result.markets_v2?.length || 0);
});
```

### Step 5: Check Content Script

1. Go to Twitter/X
2. Press F12 to open DevTools
3. Go to **Console** tab
4. Look for `[Musashi]` messages

**Good signs:**
```
[Musashi] Content script loaded
[Musashi] Running on Twitter/X
[Musashi] Requesting markets from service worker...
[Musashi] Received 700 markets from service worker
[Musashi] 700 markets loaded. Starting tweet scanner...
[Musashi] Enabling advanced features - DeepSeek AI analysis
```

**Bad signs:**
```
[Musashi] No markets received. Check the Service Worker console for errors.
[Musashi] No markets on first try, retrying in 3 seconds...
```

---

## Issue: "Today's News" banner not showing

### Check these:

1. **Are you viewing a news article?**
   - Go to Twitter's Explore tab
   - Click on a trending news story
   - Look for articles with headlines and multiple tweets

2. **Check console for detection logs:**
   ```
   [Musashi] Scanning X potential news sections...
   [Musashi] Found potential news section with 5 tweets
   [Musashi] Analyzing news: "Title" (5 tweets)
   ```

3. **Minimum requirements:**
   - Section must have a headline (h2 or heading element)
   - Must contain 3+ tweets
   - OR have a news card layout

### Force detection:

Open console on Twitter and run:
```javascript
// Check what Musashi can see
document.querySelectorAll('[data-testid="tweet"]').length; // How many tweets?
document.querySelectorAll('h2, [role="heading"]').length; // Headlines?
document.querySelectorAll('[data-testid="primaryColumn"] article').length; // Articles?
```

---

## Issue: Text selection not working

1. **Select more than 10 characters**
2. **Wait 1-2 seconds** for analysis
3. **Check console for errors:**
   ```
   [Musashi] Sentiment analysis error: [error]
   ```

4. **Test DeepSeek API directly:**
   Open Service Worker console and run:
   ```javascript
   // Test DeepSeek API
   fetch('https://api.deepseek.com/v1/chat/completions', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'Authorization': 'Bearer sk-16e2f4dcccef43d9ad17e66607bf4b82'
     },
     body: JSON.stringify({
       model: 'deepseek-chat',
       messages: [{role: 'user', content: 'test'}],
       max_tokens: 10
     })
   })
   .then(r => r.json())
   .then(data => console.log('DeepSeek test:', data))
   .catch(err => console.error('DeepSeek test failed:', err));
   ```

---

## Common Fixes

### 1. Completely reload extension
```
1. chrome://extensions
2. Remove Musashi
3. Load unpacked again from dist/ folder
```

### 2. Clear extension storage
Service Worker console:
```javascript
chrome.storage.local.clear(() => console.log('Storage cleared'));
```

### 3. Check manifest permissions
File: `manifest.json`
```json
"host_permissions": [
  "https://twitter.com/*",
  "https://x.com/*",
  "https://gamma-api.polymarket.com/*",
  "https://api.elections.kalshi.com/*"
]
```

### 4. Network/Firewall issues
- Disable VPN temporarily
- Check corporate firewall
- Try different network

---

## Still not working?

1. Export console logs:
   - Right-click in console → Save as...
   - Share the log file

2. Check browser version:
   - Chrome/Edge should be version 120+

3. Try incognito mode:
   - Disable other extensions
   - Test if there's a conflict

---

## Success Checklist

✅ Service Worker shows 500+ markets fetched
✅ Content script receives markets
✅ Advanced features enabled
✅ News sections detected
✅ Text selection works
✅ DeepSeek API responding

If all checked, Musashi is working perfectly! 🎉
