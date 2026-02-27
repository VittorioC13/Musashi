# Musashi Quickstart for AI Agents

Get your AI trading bot connected to Musashi in 5 minutes.

## Prerequisites

- Chrome browser
- Musashi extension installed
- Programming knowledge (Python or JavaScript)

## Step 1: Install Musashi Extension

1. Download Musashi extension
2. Go to `chrome://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `dist/` folder

## Step 2: Get Extension ID

1. Go to `chrome://extensions`
2. Find Musashi extension
3. Copy the Extension ID (e.g., `abcdefghijklmnopqrstuvwxyz`)

## Step 3: Choose Your Language

### Python

**Install Dependencies:**
```bash
pip install requests websocket-client
```

**Create `musashi_test.py`:**
```python
import json
import subprocess

EXTENSION_ID = "YOUR_EXTENSION_ID_HERE"

def send_message(message_type, data=None):
    """Send message to Musashi extension"""
    message = {
        "type": message_type,
        "data": data or {}
    }

    # This is a simplified example
    # In production, use Chrome Native Messaging or WebSocket bridge
    print(f"Sending: {message}")

    # For testing, manually query via Chrome DevTools
    # See full integration in docs/examples/python-agent.md

def test_musashi():
    """Test Musashi connection"""

    # Get news analyses
    print("\n📰 Fetching news analyses...")
    # response = send_message("API_GET_NEWS_ANALYSES")

    # Get market signals
    print("\n📊 Fetching market signals...")
    # response = send_message("API_GET_MARKET_SIGNALS")

    # Health check
    print("\n❤️  Health check...")
    # response = send_message("API_HEALTH")

    print("\n✓ Musashi test complete!")
    print("\nNext steps:")
    print("1. Read full Python guide: docs/examples/python-agent.md")
    print("2. Set up Chrome Native Messaging")
    print("3. Build your trading bot")

if __name__ == "__main__":
    test_musashi()
```

**Run:**
```bash
python musashi_test.py
```

---

### JavaScript/Node.js

**Install Dependencies:**
```bash
npm install chrome-remote-interface
```

**Create `musashi_test.js`:**
```javascript
const EXTENSION_ID = 'YOUR_EXTENSION_ID_HERE';

async function sendMessage(type, data = {}) {
  const message = { type, data };

  // This requires Chrome Remote Interface
  // See full setup in docs/examples/nodejs-agent.md

  console.log('Sending:', message);
}

async function testMusashi() {
  console.log('\n🚀 Testing Musashi...\n');

  // Get news analyses
  console.log('📰 Fetching news analyses...');
  // await sendMessage('API_GET_NEWS_ANALYSES');

  // Get market signals
  console.log('📊 Fetching market signals...');
  // await sendMessage('API_GET_MARKET_SIGNALS');

  // Health check
  console.log('❤️  Health check...');
  // await sendMessage('API_HEALTH');

  console.log('\n✓ Musashi test complete!\n');
  console.log('Next steps:');
  console.log('1. Read full Node.js guide: docs/examples/nodejs-agent.md');
  console.log('2. Start Chrome with remote debugging');
  console.log('3. Build your trading bot');
}

testMusashi();
```

**Run:**
```bash
node musashi_test.js
```

## Step 4: Verify Connection

### Check Extension is Running

1. Go to `chrome://extensions`
2. Find Musashi
3. Click "service worker" (blue link)
4. Look for console logs:
   ```
   [Musashi SW] Service worker initialized
   [Musashi SW] Stored 700 markets
   ```

### Test API Call

Open Chrome DevTools console on any localhost page:

```javascript
// Replace with your extension ID
const EXTENSION_ID = 'your-extension-id-here';

chrome.runtime.sendMessage(
  EXTENSION_ID,
  { type: 'API_HEALTH', data: {} },
  (response) => {
    console.log('Health check:', response);
  }
);
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "version": "1.0.0",
    "marketsLoaded": 700,
    "lastUpdate": 1708876800000
  }
}
```

## Step 5: Get Your First Signal

### Get News Analyses

```javascript
chrome.runtime.sendMessage(
  EXTENSION_ID,
  { type: 'API_GET_NEWS_ANALYSES', data: {} },
  (response) => {
    if (response.success) {
      response.data.forEach(news => {
        console.log('\n📰 News:', news.title);
        console.log('   Sentiment:', news.overallSentiment.sentiment);
        console.log('   Confidence:', news.overallSentiment.confidence);
        console.log('   Reasoning:', news.overallSentiment.reasoning);
      });
    }
  }
);
```

### Get Market Signals

```javascript
chrome.runtime.sendMessage(
  EXTENSION_ID,
  { type: 'API_GET_MARKET_SIGNALS', data: {} },
  (response) => {
    if (response.success) {
      response.data.slice(0, 5).forEach(signal => {
        console.log('\n📊 Market:', signal.market.title);
        console.log('   Sentiment:', signal.sentiment);
        console.log('   Action:', signal.suggestedAction);
        console.log('   Confidence:', signal.actionConfidence);
      });
    }
  }
);
```

## Step 6: Build Your Bot

Now that you've verified the connection, build your trading bot:

### Python
See: [docs/examples/python-agent.md](./docs/examples/python-agent.md)

### Node.js
See: [docs/examples/nodejs-agent.md](./docs/examples/nodejs-agent.md)

## Common Issues

### "Extension not found"
- Make sure Musashi extension is installed and enabled
- Double-check the Extension ID
- Restart Chrome

### "No response"
- Verify you're calling from `localhost` or `127.0.0.1`
- Check that extension service worker is running
- Look for errors in service worker console

### "Markets not yet loaded"
- Wait 10-15 seconds after extension loads
- Markets are fetched on startup
- Check service worker console for "[Musashi SW] Stored X markets"

## Next Steps

1. ✅ **Verified connection** → Build your bot
2. 📚 **Read** [Trading Strategies](./docs/examples/trading-strategies.md)
3. 🧪 **Paper trade** for 1-2 weeks
4. 💰 **Go live** with real money

## Resources

- **Full Documentation**: [AI-AGENTS.md](./AI-AGENTS.md)
- **API Reference**: [docs/api-reference.md](./docs/api-reference.md)
- **Python Example**: [docs/examples/python-agent.md](./docs/examples/python-agent.md)
- **Node.js Example**: [docs/examples/nodejs-agent.md](./docs/examples/nodejs-agent.md)
- **Trading Strategies**: [docs/examples/trading-strategies.md](./docs/examples/trading-strategies.md)

## Support

- Website: https://musashi.bot
- Documentation: https://musashi.bot/docs
- Issues: [GitHub](your-repo-url)

---

**Ready to trade? Let's go! 🚀**
