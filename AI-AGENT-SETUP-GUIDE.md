# AI Agent Setup Guide for Users

## 🎯 The Simplest Way for AI Agents to Use Musashi

When your users install Musashi, their AI agents can automatically discover **everything** they need in **ONE API call**.

---

## How It Works

### For Your Users (3 Steps)

1. **Install Musashi Extension**
   - Load from Chrome Web Store or load unpacked

2. **Get Extension ID**
   - Go to `chrome://extensions`
   - Find Musashi
   - Copy the Extension ID (long string like `abcdefgh...`)

3. **Give ID to Their AI Agent**
   - That's it! No configuration needed.

---

## For AI Agents (Auto-Discovery)

### Step 1: Query Capabilities

```javascript
chrome.runtime.sendMessage(
  'EXTENSION_ID',
  { type: 'API_GET_CAPABILITIES', data: {} },
  (response) => {
    // Response contains EVERYTHING:
    // - Documentation URLs
    // - All API endpoints
    // - Usage examples
    // - Confidence thresholds
    // - Rate limits
    // - Feature list
    console.log(response.data);
  }
);
```

### Step 2: Read Documentation

The response includes direct links to:
- Complete integration guide
- Quickstart (5 minutes)
- API reference
- Python trading bot example
- Node.js trading bot example
- Trading strategies
- JSON Schema
- OpenAPI spec

### Step 3: Start Trading

```javascript
// Get high-confidence trading signals
chrome.runtime.sendMessage(
  'EXTENSION_ID',
  { type: 'API_GET_NEWS_ANALYSES', data: {} },
  (response) => {
    response.data.forEach(news => {
      if (news.overallSentiment.confidence >= 0.8) {
        // Execute trades on high-confidence signals
        executeTrade(news.relatedMarkets);
      }
    });
  }
);
```

---

## What AI Agents Get

### Complete API Capabilities

```json
{
  "name": "Musashi AI",
  "version": "1.0.0",
  "description": "AI-powered sentiment analysis and prediction market signals",
  "documentation": {
    "main": "https://musashi.bot/ai",
    "quickstart": "https://musashi.bot/ai/quickstart",
    "apiReference": "https://musashi.bot/ai/api-reference",
    "examples": {
      "python": "https://musashi.bot/ai/examples/python",
      "nodejs": "https://musashi.bot/ai/examples/nodejs"
    },
    "strategies": "https://musashi.bot/ai/strategies",
    "schema": "https://musashi.bot/ai/schema.json",
    "openapi": "https://musashi.bot/ai/openapi.yaml"
  },
  "endpoints": [
    {
      "type": "API_GET_NEWS_ANALYSES",
      "description": "Get AI sentiment analysis for trending news",
      "example": { "type": "API_GET_NEWS_ANALYSES", "data": {} }
    },
    {
      "type": "API_GET_MARKET_SIGNALS",
      "description": "Get sentiment signals for prediction markets",
      "example": { "type": "API_GET_MARKET_SIGNALS", "data": {} }
    },
    // ... more endpoints
  ],
  "confidenceThresholds": {
    "minimum": 0.7,
    "high": 0.8,
    "veryHigh": 0.9
  },
  "rateLimits": {
    "newsAnalyses": "60-120 seconds",
    "marketSignals": "30-60 seconds per market"
  },
  "features": [
    "Real-time sentiment analysis via DeepSeek AI",
    "Trading signals with Buy/Sell/Hold recommendations",
    "Confidence scores for all signals",
    "500+ markets from Polymarket + Kalshi",
    "Free API access"
  ]
}
```

---

## Website Setup

### Files Already Created

All documentation is in `C:\Users\rotciv\Desktop\musashi-website\ai\`:

```
musashi-website/
├── ai/
│   ├── index.md              # Main guide (AI-AGENTS.md)
│   ├── quickstart.md         # 5-minute setup
│   ├── api-reference.md      # Full API docs
│   ├── strategies.md         # Trading strategies
│   ├── schema.json           # JSON Schema
│   ├── openapi.yaml          # OpenAPI spec
│   ├── discover.html         # Interactive demo page
│   └── examples/
│       ├── python.md         # Python bot
│       └── nodejs.md         # Node.js bot
```

### Deploy to Website

1. Upload `musashi-website/ai/` folder to your server
2. Make sure it's accessible at `https://musashi.bot/ai/`
3. Done!

AI agents can now discover documentation via:
- **Auto-discovery**: `API_GET_CAPABILITIES` endpoint
- **Direct URLs**: `https://musashi.bot/ai/*`

---

## Example: User + AI Agent Workflow

### User Side

```
User: "Hey ChatGPT, I want you to trade on Polymarket using Musashi"
AI: "Sure! I need your Musashi Extension ID. Go to chrome://extensions and copy it."
User: [Gives extension ID]
AI: [Queries API_GET_CAPABILITIES]
AI: "Got it! I can now access 500+ markets. Setting up trading bot..."
```

### AI Agent Side

```javascript
// 1. User gives extension ID
const EXTENSION_ID = 'user-provided-id';

// 2. AI queries capabilities
const capabilities = await queryCapabilities(EXTENSION_ID);

// 3. AI reads documentation
const docs = await fetch(capabilities.documentation.quickstart);

// 4. AI starts trading
setInterval(async () => {
  const signals = await getNewsAnalyses(EXTENSION_ID);

  signals.forEach(signal => {
    if (signal.overallSentiment.confidence >= 0.8) {
      tradOnPolymarket(signal.relatedMarkets);
    }
  });
}, 60000); // Every 60 seconds
```

---

## Benefits

### For Users
- ✅ No configuration needed
- ✅ No API keys to manage
- ✅ 100% free
- ✅ Just install extension + give ID to agent

### For AI Agents
- ✅ Auto-discover API in 1 call
- ✅ Complete documentation links
- ✅ Ready-to-use examples
- ✅ Trading strategies included
- ✅ JSON Schema for validation

### For You (Musashi)
- ✅ Simple user onboarding
- ✅ AI agents can discover everything automatically
- ✅ Documentation is always up-to-date (hosted on your site)
- ✅ One endpoint (`API_GET_CAPABILITIES`) does it all

---

## Alternative Discovery Methods

AI agents can also find docs via:

1. **`.well-known/ai-plugin.json`** (OpenAI standard)
   - Location: `https://musashi.bot/.well-known/ai-plugin.json`
   - Contains plugin manifest for AI discovery

2. **Direct URLs** (simple links)
   - Main: `https://musashi.bot/ai`
   - Quickstart: `https://musashi.bot/ai/quickstart`

3. **Extension Query** (recommended ✅)
   - `API_GET_CAPABILITIES` message type
   - Returns everything inline

---

## Testing the Setup

### Test Auto-Discovery

Open `https://musashi.bot/ai/discover.html` and click "Discover Musashi API"

### Test Direct API Call

```javascript
// In browser console (on localhost page)
chrome.runtime.sendMessage(
  'YOUR_EXTENSION_ID',
  { type: 'API_GET_CAPABILITIES', data: {} },
  (response) => {
    console.log('Capabilities:', response.data);
  }
);
```

---

## Summary

**Simplest way for AI agents:**

1. User installs Musashi → Gets Extension ID
2. User gives ID to AI agent
3. AI agent queries `API_GET_CAPABILITIES`
4. AI agent gets all docs + examples
5. AI agent starts trading

**No configuration. No API keys. One API call. Done.** ✅

---

## Support

- **Website**: https://musashi.bot
- **Docs**: https://musashi.bot/ai
- **Demo**: https://musashi.bot/ai/discover.html
