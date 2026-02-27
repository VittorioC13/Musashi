# Trading Strategies with Musashi

Guide for AI agents on how to interpret and act on Musashi signals.

## Understanding Signals

### Sentiment Types

**Bullish (`"bullish"`)**
- Positive market outlook
- Price likely to increase
- **Action**: Buy YES shares
- **Example**: "Bitcoin adoption accelerating" → BTC prediction markets bullish

**Bearish (`"bearish"`)**
- Negative market outlook
- Price likely to decrease
- **Action**: Buy NO shares (or sell YES shares)
- **Example**: "Regulatory crackdown announced" → affected markets bearish

**Neutral (`"neutral"`)**
- No clear directional bias
- Insufficient information
- **Action**: Hold/Wait
- **Example**: "Mixed signals from experts"

### Confidence Scores

Confidence ranges from `0.0` to `1.0`:

| Range | Interpretation | Action |
|-------|---------------|--------|
| 0.0 - 0.4 | Low confidence | ❌ Avoid trading |
| 0.4 - 0.6 | Medium-low | ⚠️ Exercise caution |
| 0.6 - 0.75 | Medium-high | ✓ Consider trading |
| 0.75 - 0.9 | High confidence | ✓✓ Strong signal |
| 0.9 - 1.0 | Very high | ✓✓✓ Excellent signal |

**Rule of Thumb**: Only trade on signals with **confidence >= 0.7**

### Suggested Actions

**Buy (`"buy"`)**
- Purchase YES shares
- Market likely to resolve YES
- Bullish sentiment

**Sell (`"sell"`)**
- Purchase NO shares
- Market likely to resolve NO
- Bearish sentiment

**Hold (`"hold"`)**
- Wait for clearer signal
- Insufficient confidence
- Maintain current position if any

## Strategy #1: News-Based Trading

Trade on breaking news with high sentiment scores.

### Implementation

```python
def news_trading_strategy(musashi_client):
    """Trade on high-confidence news events"""

    news_analyses = musashi_client.get_news_analyses()

    for news in news_analyses:
        sentiment = news['overallSentiment']

        # Filter: Only very high confidence news
        if sentiment['confidence'] < 0.8:
            continue

        # Check each related market
        for signal in news['relatedMarkets']:

            # Double check: High action confidence
            if signal['actionConfidence'] < 0.75:
                continue

            # Trade logic
            if signal['suggestedAction'] == 'buy':
                buy_yes_shares(
                    market_id=signal['market']['id'],
                    amount=calculate_position_size(signal['actionConfidence']),
                    price=signal['currentPrice']
                )
            elif signal['suggestedAction'] == 'sell':
                buy_no_shares(
                    market_id=signal['market']['id'],
                    amount=calculate_position_size(signal['actionConfidence']),
                    price=1 - signal['currentPrice']
                )
```

### Key Points

- **Trigger**: News with `confidence >= 0.8`
- **Entry**: Related markets with `actionConfidence >= 0.75`
- **Position Size**: Scale with confidence (higher confidence = larger position)
- **Speed**: Act quickly - news moves fast

### Risk Management

```python
def calculate_position_size(confidence):
    """Scale position size with confidence"""

    if confidence >= 0.9:
        return 200  # $200 for 90%+ confidence
    elif confidence >= 0.8:
        return 150  # $150 for 80-90%
    elif confidence >= 0.75:
        return 100  # $100 for 75-80%
    else:
        return 0    # Don't trade below 75%
```

## Strategy #2: Momentum Trading

Follow sentiment trends for markets.

### Implementation

```python
def momentum_strategy(musashi_client):
    """Trade based on sentiment momentum"""

    news_analyses = musashi_client.get_news_analyses()

    for news in news_analyses:
        trend = news.get('sentimentTrend', [])

        # Need at least 3 data points
        if len(trend) < 3:
            continue

        # Check if momentum is consistent
        is_bullish_trend = all(
            point['sentiment'] == 'bullish'
            for point in trend[-3:]
        )

        is_bearish_trend = all(
            point['sentiment'] == 'bearish'
            for point in trend[-3:]
        )

        # Check if confidence is increasing
        confidence_increasing = (
            trend[-1]['confidence'] > trend[-2]['confidence'] and
            trend[-2]['confidence'] > trend[-3]['confidence']
        )

        if (is_bullish_trend or is_bearish_trend) and confidence_increasing:
            # Strong momentum signal
            for signal in news['relatedMarkets']:
                if signal['actionConfidence'] >= 0.7:
                    execute_trade(signal)
```

### Key Points

- **Trigger**: 3+ consecutive same-sentiment readings
- **Confirmation**: Increasing confidence trend
- **Entry**: `actionConfidence >= 0.7`
- **Hold**: Until sentiment reverses

## Strategy #3: Contrarian Trading

Trade against mispriced markets.

### Implementation

```python
def contrarian_strategy(musashi_client):
    """Find mispriced markets based on sentiment vs price"""

    signals = musashi_client.get_market_signals()

    for signal in signals:
        market = signal['market']
        current_price = signal['currentPrice']
        sentiment = signal['sentiment']
        confidence = signal['confidence']

        # Only high confidence signals
        if confidence < 0.8:
            continue

        # Look for price/sentiment mismatch
        if sentiment == 'bullish' and current_price < 0.4:
            # Market underpriced - buy YES
            print(f"Undervalued: {market['title']}")
            print(f"Price: {current_price:.1%}, Sentiment: {sentiment} ({confidence:.1%})")
            buy_yes_shares(market['id'], amount=150, price=current_price)

        elif sentiment == 'bearish' and current_price > 0.6:
            # Market overpriced - buy NO
            print(f"Overvalued: {market['title']}")
            print(f"Price: {current_price:.1%}, Sentiment: {sentiment} ({confidence:.1%})")
            buy_no_shares(market['id'], amount=150, price=1 - current_price)
```

### Key Points

- **Trigger**: High confidence sentiment + mispriced market
- **Entry Bullish**: `sentiment == 'bullish'` AND `price < 0.4`
- **Entry Bearish**: `sentiment == 'bearish'` AND `price > 0.6`
- **Confidence**: `>= 0.8` required

## Strategy #4: Portfolio Monitoring

Continuously monitor and rebalance positions.

### Implementation

```python
def monitor_portfolio(musashi_client, portfolio):
    """Monitor existing positions for exit signals"""

    for position in portfolio:
        market_id = position['marketId']

        # Get current sentiment
        signals = musashi_client.get_market_signals(market_id)

        if not signals:
            continue

        signal = signals[0]

        # Exit conditions
        should_exit = False
        reason = ""

        # 1. Sentiment reversal
        if signal['sentiment'] != position['originalSentiment']:
            if signal['confidence'] >= 0.7:
                should_exit = True
                reason = f"Sentiment reversed: {position['originalSentiment']} → {signal['sentiment']}"

        # 2. Low confidence
        if signal['confidence'] < 0.5:
            should_exit = True
            reason = "Confidence dropped below 50%"

        # 3. Action change
        if signal['suggestedAction'] != position['originalAction']:
            if signal['actionConfidence'] >= 0.6:
                should_exit = True
                reason = f"Action changed: {position['originalAction']} → {signal['suggestedAction']}"

        if should_exit:
            print(f"Exiting {market_id}: {reason}")
            close_position(market_id)
```

### Key Points

- **Monitor Frequency**: Every 60-120 seconds
- **Exit Triggers**:
  - Sentiment reversal (confidence >= 0.7)
  - Confidence drops below 50%
  - Suggested action changes (confidence >= 0.6)

## Strategy #5: Multi-Signal Confirmation

Combine multiple signals before trading.

### Implementation

```python
def multi_signal_strategy(musashi_client):
    """Only trade when multiple signals align"""

    news_analyses = musashi_client.get_news_analyses()
    market_signals_map = {}

    # Collect all signals for each market
    for news in news_analyses:
        for signal in news.get('relatedMarkets', []):
            market_id = signal['market']['id']

            if market_id not in market_signals_map:
                market_signals_map[market_id] = []

            market_signals_map[market_id].append({
                'sentiment': signal['sentiment'],
                'confidence': signal['confidence'],
                'action': signal['suggestedAction'],
                'actionConfidence': signal['actionConfidence']
            })

    # Trade only on markets with multiple confirming signals
    for market_id, signals in market_signals_map.items():

        # Need at least 2 signals
        if len(signals) < 2:
            continue

        # Check if all signals agree
        sentiments = [s['sentiment'] for s in signals]
        actions = [s['action'] for s in signals]

        if len(set(sentiments)) == 1 and len(set(actions)) == 1:
            # All signals agree!

            avg_confidence = sum(s['confidence'] for s in signals) / len(signals)
            avg_action_confidence = sum(s['actionConfidence'] for s in signals) / len(signals)

            if avg_confidence >= 0.75 and avg_action_confidence >= 0.7:
                print(f"STRONG CONSENSUS on {market_id}")
                print(f"Signals: {len(signals)}, Avg Confidence: {avg_confidence:.1%}")
                execute_trade_with_high_conviction(market_id, actions[0], avg_action_confidence)
```

### Key Points

- **Trigger**: 2+ signals agree on same market
- **Confirmation**: Same sentiment AND action
- **Entry**: Average confidence >= 0.75
- **Position Size**: Larger (higher conviction)

## Risk Management Rules

### Position Sizing

```python
def calculate_position_size(confidence, account_balance):
    """Kelly Criterion-inspired position sizing"""

    # Base risk: 2% of account per trade
    base_risk = account_balance * 0.02

    # Scale with confidence
    if confidence >= 0.9:
        multiplier = 3.0  # 6% of account
    elif confidence >= 0.8:
        multiplier = 2.0  # 4% of account
    elif confidence >= 0.75:
        multiplier = 1.5  # 3% of account
    else:
        return 0  # Don't trade

    return base_risk * multiplier
```

### Stop Loss Rules

```python
def check_stop_loss(position, current_signal):
    """Stop loss logic"""

    # Rule 1: Sentiment reversal with high confidence
    if (current_signal['sentiment'] != position['sentiment'] and
        current_signal['confidence'] >= 0.75):
        return True, "Sentiment reversed"

    # Rule 2: Confidence collapsed
    if current_signal['confidence'] < 0.4:
        return True, "Confidence collapsed"

    # Rule 3: Price moved against us significantly
    if position['action'] == 'buy':
        if current_signal['currentPrice'] < position['entryPrice'] * 0.8:
            return True, "Price down 20%"
    else:
        if current_signal['currentPrice'] > position['entryPrice'] * 1.2:
            return True, "Price up 20%"

    return False, None
```

### Diversification

- **Max per market**: 5% of account
- **Max per category**: 20% of account
- **Max total exposure**: 50% of account
- **Reserve cash**: Always keep 50%+ in cash

## Best Practices

### 1. Start Conservative

```python
# First week: High confidence only
MIN_CONFIDENCE = 0.85
MIN_ACTION_CONFIDENCE = 0.8
MAX_POSITION = 50  # $50 max

# After proving strategy: Relax slightly
MIN_CONFIDENCE = 0.75
MIN_ACTION_CONFIDENCE = 0.7
MAX_POSITION = 150  # $150 max
```

### 2. Log Everything

```python
import logging

logging.info({
    'action': 'trade_executed',
    'market_id': market_id,
    'sentiment': signal['sentiment'],
    'confidence': signal['confidence'],
    'entry_price': price,
    'position_size': amount,
    'timestamp': datetime.now().isoformat()
})
```

### 3. Backtest First

- Test strategies on historical data
- Paper trade for 1-2 weeks
- Start with small positions
- Scale up gradually

### 4. Monitor Performance

```python
# Track win rate
wins = sum(1 for trade in trades if trade['profit'] > 0)
win_rate = wins / len(trades)

# Track average profit
avg_profit = sum(t['profit'] for t in trades) / len(trades)

# Track by confidence level
high_conf_trades = [t for t in trades if t['confidence'] >= 0.85]
high_conf_win_rate = sum(1 for t in high_conf_trades if t['profit'] > 0) / len(high_conf_trades)
```

## Common Pitfalls

### ❌ Over-trading
- Don't trade every signal
- Quality > Quantity
- Wait for >= 0.75 confidence

### ❌ Ignoring Risk Management
- Always use position sizing
- Set stop losses
- Diversify

### ❌ Chasing Losses
- Don't increase position size after losses
- Stick to strategy
- Take breaks after bad trades

### ❌ Ignoring Market Context
- Check market liquidity
- Consider time to resolution
- Watch for major events

## Next Steps

- Implement one strategy at a time
- Start with Strategy #1 (News-Based)
- Paper trade for 1-2 weeks
- Gradually increase position sizes
- Combine strategies as you gain confidence

## Support

- API Documentation: [API Reference](../api-reference.md)
- Python Examples: [Python Agent](./python-agent.md)
- Node.js Examples: [Node.js Agent](./nodejs-agent.md)
