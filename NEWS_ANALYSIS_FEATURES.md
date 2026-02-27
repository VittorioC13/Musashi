# Musashi AI - Today's News Analysis Features 📊

## Overview

Musashi now includes advanced sentiment analysis and trading signal features powered by DeepSeek AI. These features analyze Twitter's "Today's News" sections and provide actionable insights for prediction market trading.

---

## 🎯 Key Features

### 1. **Today's News Analysis Banner**
- Automatically detects Twitter's "Today's News" sections
- Displays a **collapsible, non-intrusive banner** at the top of news threads
- Shows overall sentiment, market action recommendations, and confidence scores
- Click to expand for detailed analysis

**What you get:**
- ✅ Sentiment analysis (Bullish/Bearish/Neutral)
- ✅ Market action recommendations (Buy/Sell/Hold) with confidence scores
- ✅ Key insights extracted from tweets
- ✅ Sentiment trend tracking over time
- ✅ Related Polymarket/Kalshi markets with trading signals
- ✅ Risk assessment (Low/Medium/High)

### 2. **Text Selection Analysis**
- Select any text on Twitter (minimum 10 characters)
- Instant sentiment analysis popup appears
- Get trading recommendations for the selected content

**How to use:**
1. Highlight any text with your mouse
2. Wait for the Musashi analysis popup
3. View sentiment, key points, and related markets
4. Click on markets to trade

### 3. **AI Agent API** (For Automated Trading)
Musashi exposes a REST-like API that AI trading agents can access to get analysis data.

**API Endpoints:**

```javascript
// Get all news analyses
chrome.runtime.sendMessage(
  MUSASHI_EXTENSION_ID,
  { type: 'API_GET_NEWS_ANALYSES' },
  (response) => {
    console.log('Analyses:', response.data);
  }
);

// Get specific news analysis
chrome.runtime.sendMessage(
  MUSASHI_EXTENSION_ID,
  { type: 'API_GET_NEWS_ANALYSIS', newsId: 'news_12345' },
  (response) => {
    console.log('Analysis:', response.data);
  }
);

// Get market signals (filtered)
chrome.runtime.sendMessage(
  MUSASHI_EXTENSION_ID,
  {
    type: 'API_GET_MARKET_SIGNALS',
    filter: { signal: 'buy', minConfidence: 0.7 }
  },
  (response) => {
    console.log('Buy signals:', response.data);
  }
);

// Health check
chrome.runtime.sendMessage(
  MUSASHI_EXTENSION_ID,
  { type: 'API_HEALTH' },
  (response) => {
    console.log('Status:', response.data);
  }
);
```

**API Response Format:**

```typescript
{
  success: true,
  data: {
    newsId: string,
    title: string,
    sentiment: {
      sentiment: 'bullish' | 'bearish' | 'neutral',
      confidence: number,
      marketAction: 'buy' | 'sell' | 'hold',
      actionConfidence: number,
      reasoning: string,
      keyPoints: string[],
      riskLevel: 'low' | 'medium' | 'high'
    },
    relatedMarkets: [{
      marketId: string,
      title: string,
      platform: 'polymarket' | 'kalshi',
      signal: 'buy' | 'sell' | 'hold',
      confidence: number,
      currentPrice: number,
      potentialReturn: number,
      url: string
    }],
    sentimentTrend: [{
      timestamp: number,
      sentiment: string,
      confidence: number
    }]
  },
  timestamp: number
}
```

---

## 🚀 Setup Instructions

### 🎉 ALL FEATURES ARE FREE!

**No API key required!** All advanced features are enabled for everyone at no cost.

### How to Use:

1. **Install Musashi** - Load the extension in Chrome
2. **Go to Twitter/X** - Navigate to any "Today's News" article
3. **See the magic!** - Musashi automatically analyzes and shows insights
4. **Select text** - Highlight any text to get instant sentiment analysis
5. **AI Agents** - Your trading bots can access the API immediately

That's it! All features work out of the box. 🚀

---

## 📊 Understanding the Analysis

### Sentiment Types
- **Bullish** 🟢: Positive sentiment toward the event/outcome
- **Bearish** 🔴: Negative sentiment toward the event/outcome
- **Neutral** ⚪: Mixed or unclear sentiment

### Market Actions
- **Buy**: High confidence the event will happen (YES side looks good)
- **Sell**: High confidence the event won't happen (NO side looks good)
- **Hold**: Unclear or insufficient confidence to take a position

### Confidence Scores
- **0-40%**: Low confidence, risky position
- **40-70%**: Medium confidence, moderate risk
- **70-100%**: High confidence, strong signal

### Risk Levels
- **Low Risk**: Clear signals, high confidence, stable sentiment
- **Medium Risk**: Moderate confidence or some uncertainty
- **High Risk**: Conflicting signals, low confidence, volatile

---

## 🤖 For AI Trading Agents

### Integration Guide

1. **Install Musashi Extension**
   ```bash
   # Load unpacked extension from Chrome
   # Go to chrome://extensions
   # Enable "Developer mode"
   # Load the dist/ folder
   ```

2. **Get Extension ID**
   ```javascript
   // Find in chrome://extensions
   const MUSASHI_EXTENSION_ID = 'your-extension-id-here';
   ```

3. **Query Analysis Data**
   ```javascript
   function getMarketSignals(signal = 'buy', minConfidence = 0.7) {
     return new Promise((resolve) => {
       chrome.runtime.sendMessage(
         MUSASHI_EXTENSION_ID,
         {
           type: 'API_GET_MARKET_SIGNALS',
           filter: { signal, minConfidence }
         },
         (response) => {
           if (response.success) {
             resolve(response.data);
           } else {
             console.error('API error:', response.error);
             resolve([]);
           }
         }
       );
     });
   }

   // Usage
   const buySignals = await getMarketSignals('buy', 0.75);
   console.log('Strong buy signals:', buySignals);
   ```

4. **Automated Trading Loop**
   ```javascript
   setInterval(async () => {
     // Get high-confidence buy signals
     const signals = await getMarketSignals('buy', 0.8);

     for (const signal of signals) {
       console.log(`Trading opportunity: ${signal.title}`);
       console.log(`Current price: ${signal.currentPrice}`);
       console.log(`Potential return: ${signal.potentialReturn}%`);
       console.log(`URL: ${signal.url}`);

       // Your trading logic here
       // await placeOrder(signal);
     }
   }, 60000); // Check every minute
   ```

---

## 🎨 UI/UX Design Principles

### Non-Intrusive Design
- Banner is subtle and collapsed by default
- Only expands when user clicks
- Uses Twitter's native color scheme
- Respects dark mode

### Clear Visual Hierarchy
- Sentiment indicators use color coding
- Confidence scores prominently displayed
- Risk warnings clearly visible
- Related markets easy to access

### Performance
- Analysis runs in background
- Results cached for 30 minutes
- Minimal impact on page load
- Efficient API usage

---

## 🔧 Troubleshooting

### Features Not Working?

1. **Verify You're on Twitter/X**
   - Features only work on twitter.com or x.com
   - Make sure you're viewing "Today's News" sections

2. **Check Console for Errors**
   - Press F12 in Chrome
   - Look for `[Musashi]` prefixed messages
   - Check for API errors

3. **Common Issues**
   - **"No analysis showing"**: Make sure you're viewing a news thread with multiple tweets
   - **"Text selection not working"**: Select more than 10 characters
   - **"Banner not appearing"**: Look for Twitter's "Today's News" sections (usually has a headline)

4. **All Features Are FREE**
   - ✅ No API key configuration needed
   - ✅ No setup required
   - ✅ Works immediately after installation

---

## 📈 Example Use Cases

### Use Case 1: News Trading
1. See breaking news on Twitter
2. Musashi analyzes sentiment instantly
3. Get buy/sell signal with confidence
4. Click related market to trade
5. Monitor sentiment trend over time

### Use Case 2: AI Trading Bot
1. Bot queries Musashi API every minute
2. Gets high-confidence signals (>75%)
3. Automatically places orders on Polymarket
4. Tracks performance and adjusts strategy

### Use Case 3: Research & Analysis
1. Select interesting tweets
2. Get instant sentiment analysis
3. See related markets
4. Make informed decisions

---

## 🛠️ Technical Architecture

### Components
- **NewsAnalyzer**: Detects and analyzes Today's News sections
- **TextSelectionAnalyzer**: Handles text selection analysis
- **DeepSeekClient**: Communicates with DeepSeek API
- **ExternalAPI**: Exposes data to AI agents

### Data Flow
```
Twitter Page
  ↓
Content Script (NewsAnalyzer)
  ↓
Service Worker (DeepSeek API)
  ↓
Chrome Storage (Cache)
  ↓
UI Components (Banner/Popup)
  ↓
External API (AI Agents)
```

---

## 📝 API Reference

See `src/api/external-api.ts` for complete API documentation.

---

## 🎉 Success!

You now have:
- ✅ Automatic news analysis
- ✅ Text selection insights
- ✅ Trading signals with confidence scores
- ✅ AI agent API access
- ✅ Sentiment trend tracking

Happy trading! 🚀

---

**Built with Claude Code**
