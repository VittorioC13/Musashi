# Python AI Agent Integration

Complete Python example for integrating Musashi with your trading bot.

## Installation

```bash
pip install websocket-client requests
```

## Complete Trading Bot Example

```python
import json
import time
import logging
from typing import Dict, List, Optional
from dataclasses import dataclass
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class MarketSignal:
    market_id: str
    title: str
    platform: str
    sentiment: str
    confidence: float
    suggested_action: str
    action_confidence: float
    current_price: float
    reasoning: str

class MusashiClient:
    """Client for communicating with Musashi Chrome extension"""

    def __init__(self, extension_id: str):
        self.extension_id = extension_id
        self.base_url = f"chrome-extension://{extension_id}"

    def _send_message(self, message_type: str, data: dict = None) -> dict:
        """
        Send message to Musashi extension via Chrome Native Messaging

        Note: This requires a Chrome Native Messaging Host to be set up.
        See: https://developer.chrome.com/docs/apps/nativeMessaging/

        For testing, you can use a WebSocket bridge or direct extension messaging.
        """
        import subprocess

        message = {
            "type": message_type,
            "data": data or {}
        }

        # Native messaging format
        message_json = json.dumps(message)
        message_length = len(message_json)

        # Send to native messaging host (you'll need to implement this)
        # This is a placeholder - actual implementation depends on your setup
        response = self._chrome_native_send(message_json)

        return json.loads(response)

    def get_news_analyses(self) -> List[Dict]:
        """Get all news sentiment analyses"""
        response = self._send_message("API_GET_NEWS_ANALYSES")
        if response.get("success"):
            return response.get("data", [])
        logger.error(f"Failed to get news analyses: {response.get('error')}")
        return []

    def get_market_signals(self, market_id: Optional[str] = None) -> List[MarketSignal]:
        """Get market sentiment signals"""
        data = {"marketId": market_id} if market_id else {}
        response = self._send_message("API_GET_MARKET_SIGNALS", data)

        if response.get("success"):
            signals = []
            for item in response.get("data", []):
                signals.append(MarketSignal(
                    market_id=item["market"]["id"],
                    title=item["market"]["title"],
                    platform=item["market"]["platform"],
                    sentiment=item["sentiment"],
                    confidence=item["confidence"],
                    suggested_action=item["suggestedAction"],
                    action_confidence=item["actionConfidence"],
                    current_price=item["currentPrice"],
                    reasoning=item["reasoning"]
                ))
            return signals

        logger.error(f"Failed to get market signals: {response.get('error')}")
        return []

    def get_all_markets(self) -> List[Dict]:
        """Get complete market database"""
        response = self._send_message("API_GET_MARKETS")
        if response.get("success"):
            return response.get("data", [])
        logger.error(f"Failed to get markets: {response.get('error')}")
        return []

    def health_check(self) -> bool:
        """Check if Musashi is responsive"""
        response = self._send_message("API_HEALTH")
        return response.get("success", False)


class TradingBot:
    """Example trading bot using Musashi signals"""

    def __init__(self, musashi_client: MusashiClient, min_confidence: float = 0.75):
        self.musashi = musashi_client
        self.min_confidence = min_confidence
        self.positions = {}  # marketId -> position

    def scan_for_opportunities(self):
        """Scan news for high-confidence trading opportunities"""
        logger.info("Scanning for opportunities...")

        news_analyses = self.musashi.get_news_analyses()

        for news in news_analyses:
            sentiment = news.get("overallSentiment", {})

            # Check if news has strong signal
            if sentiment.get("confidence", 0) < self.min_confidence:
                continue

            logger.info(f"High confidence news: {news.get('title')}")
            logger.info(f"Sentiment: {sentiment.get('sentiment')} ({sentiment.get('confidence'):.2%})")

            # Check related markets
            for signal in news.get("relatedMarkets", []):
                self._evaluate_signal(signal)

    def _evaluate_signal(self, signal_data: dict):
        """Evaluate a market signal for trading"""
        market = signal_data.get("market", {})
        market_id = market.get("id")

        # Skip if already have position
        if market_id in self.positions:
            logger.info(f"Already have position in {market.get('title')}")
            return

        # Check signal quality
        action_confidence = signal_data.get("actionConfidence", 0)
        if action_confidence < self.min_confidence:
            logger.info(f"Signal confidence too low: {action_confidence:.2%}")
            return

        suggested_action = signal_data.get("suggestedAction")
        current_price = signal_data.get("currentPrice", 0)

        logger.info(f"\n{'='*60}")
        logger.info(f"TRADING OPPORTUNITY")
        logger.info(f"Market: {market.get('title')}")
        logger.info(f"Platform: {market.get('platform')}")
        logger.info(f"Action: {suggested_action.upper()}")
        logger.info(f"Confidence: {action_confidence:.2%}")
        logger.info(f"Current Price: {current_price:.2%}")
        logger.info(f"Reasoning: {signal_data.get('reasoning')}")
        logger.info(f"{'='*60}\n")

        # Execute trade (placeholder - implement your trading logic)
        self._execute_trade(market_id, suggested_action, current_price)

    def _execute_trade(self, market_id: str, action: str, price: float):
        """Execute a trade (implement your trading platform integration)"""
        logger.info(f"EXECUTING: {action} at {price:.2%}")

        # Example: Place order on Polymarket
        # polymarket_api.place_order(
        #     market_id=market_id,
        #     side="YES" if action == "buy" else "NO",
        #     amount=100,  # $100 position
        #     price=price
        # )

        # Track position
        self.positions[market_id] = {
            "action": action,
            "entry_price": price,
            "timestamp": datetime.now(),
        }

    def monitor_positions(self):
        """Monitor existing positions for exit signals"""
        if not self.positions:
            return

        logger.info("Monitoring positions...")

        for market_id, position in list(self.positions.items()):
            signals = self.musashi.get_market_signals(market_id)

            if not signals:
                continue

            signal = signals[0]

            # Exit if sentiment reversed
            if signal.suggested_action != position["action"]:
                if signal.action_confidence > 0.6:
                    logger.warning(f"SENTIMENT REVERSED for {market_id}")
                    logger.warning(f"Original: {position['action']}, Now: {signal.suggested_action}")
                    self._close_position(market_id)

    def _close_position(self, market_id: str):
        """Close an existing position"""
        position = self.positions.pop(market_id, None)
        if position:
            logger.info(f"CLOSING position in {market_id}")
            # Implement your close logic here

    def run(self, scan_interval: int = 60):
        """Run the trading bot"""
        logger.info("Starting Musashi Trading Bot...")

        # Health check
        if not self.musashi.health_check():
            logger.error("Musashi extension not responding!")
            return

        logger.info("Musashi connected successfully")

        while True:
            try:
                self.scan_for_opportunities()
                self.monitor_positions()

                logger.info(f"Sleeping for {scan_interval}s...\n")
                time.sleep(scan_interval)

            except KeyboardInterrupt:
                logger.info("Shutting down...")
                break
            except Exception as e:
                logger.error(f"Error: {e}", exc_info=True)
                time.sleep(scan_interval)


# Example usage
if __name__ == "__main__":
    # Initialize Musashi client
    EXTENSION_ID = "your-extension-id-here"  # Get from chrome://extensions
    musashi = MusashiClient(EXTENSION_ID)

    # Create trading bot
    bot = TradingBot(
        musashi_client=musashi,
        min_confidence=0.75  # Only trade on 75%+ confidence signals
    )

    # Run bot (scans every 60 seconds)
    bot.run(scan_interval=60)
```

## Simple Example: Query Musashi

```python
import json

def get_musashi_signals():
    """Simple example: Get current market signals"""

    # This is a simplified example
    # In production, use Chrome Native Messaging or WebSocket bridge

    message = {
        "type": "API_GET_MARKET_SIGNALS",
        "data": {}
    }

    # Send to Musashi extension
    response = send_to_extension(message)

    if response["success"]:
        for signal in response["data"]:
            print(f"\nMarket: {signal['market']['title']}")
            print(f"Sentiment: {signal['sentiment']}")
            print(f"Confidence: {signal['confidence']:.2%}")
            print(f"Action: {signal['suggestedAction']}")
            print(f"Reasoning: {signal['reasoning']}")

if __name__ == "__main__":
    get_musashi_signals()
```

## Chrome Native Messaging Setup

To communicate with Musashi from Python, you need Chrome Native Messaging:

### 1. Create Native Messaging Host

`~/.config/google-chrome/NativeMessagingHosts/com.musashi.bot.json`:

```json
{
  "name": "com.musashi.bot",
  "description": "Musashi Trading Bot Bridge",
  "path": "/path/to/your/musashi_bridge.py",
  "type": "stdio",
  "allowed_origins": [
    "chrome-extension://YOUR_EXTENSION_ID/"
  ]
}
```

### 2. Create Bridge Script

`musashi_bridge.py`:

```python
#!/usr/bin/env python3
import sys
import json
import struct

def send_message(message):
    """Send message to Chrome extension"""
    encoded = json.dumps(message).encode('utf-8')
    sys.stdout.buffer.write(struct.pack('I', len(encoded)))
    sys.stdout.buffer.write(encoded)
    sys.stdout.buffer.flush()

def read_message():
    """Read message from Chrome extension"""
    text_length_bytes = sys.stdin.buffer.read(4)
    if len(text_length_bytes) == 0:
        return None

    text_length = struct.unpack('I', text_length_bytes)[0]
    text = sys.stdin.buffer.read(text_length).decode('utf-8')
    return json.loads(text)

# Main loop
while True:
    message = read_message()
    if message is None:
        break

    # Forward to your trading bot
    response = {"success": True, "data": message}
    send_message(response)
```

## Tips for Production

1. **Use WebSocket Bridge**: For real-time communication, run a WebSocket server that bridges Python ↔ Chrome extension
2. **Error Handling**: Always wrap API calls in try-except blocks
3. **Rate Limiting**: Don't poll faster than 30-60 seconds
4. **Logging**: Log all trades and signals for analysis
5. **Backtesting**: Test strategies with historical data first

## Next Steps

- See [Trading Strategies Guide](./trading-strategies.md) for signal interpretation
- See [API Reference](../api-reference.md) for complete endpoint documentation
