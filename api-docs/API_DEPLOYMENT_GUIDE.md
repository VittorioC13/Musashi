# Musashi API Deployment Guide

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Vercel CLI**: Install globally
   ```bash
   npm install -g vercel
   ```

## Local Development

### 1. Install Dependencies
```bash
cd "C:\Users\rotciv\Desktop\Musashi ai"
npm install
```

### 2. Run API Locally
```bash
vercel dev
```

This starts the API at `http://localhost:3000`

### 3. Test the API
```bash
curl -X POST http://localhost:3000/api/analyze-text \
  -H "Content-Type: application/json" \
  -d "{\"text\": \"Bitcoin just hit $100k!\"}"
```

Or use the test script:
```bash
node test-api.js
```

## Deploy to Vercel

### Option 1: Vercel CLI (Recommended)

1. **Login to Vercel**
   ```bash
   vercel login
   ```

2. **Deploy**
   ```bash
   vercel --prod
   ```

3. **Note Your URL**
   Vercel will give you a URL like: `https://musashi-api-[random].vercel.app`

### Option 2: GitHub Integration

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial API deployment"
   git remote add origin https://github.com/rotciv/musashi.git
   git push -u origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Click "Deploy"

3. **Auto-Deploy on Push**
   - Every push to `main` will auto-deploy
   - Preview deployments for branches

## Configuration

### Environment Variables

Create `.env.local` for local development:
```bash
MUSASHI_API_URL=http://localhost:3000
```

For production, set in Vercel dashboard:
1. Go to your project → Settings → Environment Variables
2. Add: `MUSASHI_API_URL` = `https://your-deployed-url.vercel.app`

### Custom Domain (Optional)

1. Go to Vercel project → Settings → Domains
2. Add your custom domain (e.g., `api.musashi.ai`)
3. Update DNS records as instructed

## Update Extension to Use Deployed API

### 1. Update API Client

Edit `src/api/musashi-api-client.ts`:
```typescript
export const musashiApi = new MusashiApiClient(
  'https://your-deployed-url.vercel.app'  // Replace with your Vercel URL
);
```

### 2. Rebuild Extension
```bash
npm run build
```

### 3. Reload Extension
1. Go to `chrome://extensions`
2. Click reload icon on Musashi
3. Refresh Twitter/X tab

## Testing

### Test API Endpoint
```javascript
// test-api.js
const fetch = require('node-fetch');

async function testAPI() {
  const response = await fetch('https://your-url.vercel.app/api/analyze-text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: 'The Fed is cutting interest rates',
      maxResults: 3
    })
  });

  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
}

testAPI();
```

### Test Extension Integration
1. Open Twitter/X
2. Find a tweet about markets (e.g., "Bitcoin", "Fed rates", "Trump election")
3. Check browser console for `[Musashi API]` logs
4. Verify card appears under tweet

## Monitoring

### Vercel Analytics
- Go to your project → Analytics
- View:
  - Request count
  - Response times
  - Error rates
  - Geographic distribution

### Logs
```bash
# Stream real-time logs
vercel logs --follow

# View recent errors
vercel logs --since 1h
```

## Troubleshooting

### API Not Responding
1. Check Vercel deployment status
2. Verify endpoint URL is correct
3. Check CORS headers in browser console

### Extension Still Using Local Matcher
1. Check console for `[Musashi API]` vs `[Musashi LOCAL]`
2. Verify API URL in `musashi-api-client.ts`
3. Rebuild extension: `npm run build`
4. Reload extension in Chrome

### High Latency
1. Check Vercel region (should be close to users)
2. Consider upgrading Vercel plan for better performance
3. Implement caching in extension

### CORS Errors
API already includes CORS headers. If errors persist:
1. Check `api/analyze-text.ts` has:
   ```typescript
   res.setHeader('Access-Control-Allow-Origin', '*');
   ```
2. Redeploy: `vercel --prod`

## Performance Optimization

### 1. Enable Caching
Add cache headers to API responses (future enhancement)

### 2. Rate Limiting
Implement Redis-based rate limiting (future)

### 3. CDN
Vercel automatically uses CDN for all endpoints

## Cost Estimates

**Vercel Free Tier:**
- 100GB bandwidth/month
- ~100k requests/month
- Enough for MVP testing

**Hobby Plan ($20/month):**
- 1TB bandwidth
- ~1M requests/month
- Custom domains

**Pro Plan ($50/month):**
- 10TB bandwidth
- ~10M requests/month
- Team collaboration

## Next Steps

1. ✅ Deploy API to Vercel
2. ✅ Update extension to use deployed URL
3. [ ] Test with real Twitter usage
4. [ ] Monitor performance and errors
5. [ ] Add API key auth (Phase 2)
6. [ ] Implement webhook subscriptions (Phase 2)
7. [ ] Add real-time WebSocket stream (Phase 2)

## Support

- Vercel Docs: https://vercel.com/docs
- Musashi GitHub: https://github.com/rotciv/musashi
- Vercel Discord: https://vercel.com/discord
