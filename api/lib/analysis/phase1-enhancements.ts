// Phase 1 Enhancements - Agent-friendly features
// Adds event_id, signal_type, urgency, and metadata to API responses

import { MarketMatch, SignalType, UrgencyLevel } from '../types/market';
import { createHash } from 'crypto';

/**
 * Generate a deterministic event ID based on the matched markets
 * Same markets will always produce the same event_id (for deduplication)
 */
export function generateEventId(text: string, matches: MarketMatch[]): string {
  if (matches.length === 0) {
    // No matches - generate ID from text hash
    const textHash = createHash('sha256').update(text.toLowerCase()).digest('hex').substring(0, 8);
    return `evt_none_${textHash}`;
  }

  // Create deterministic ID from top market
  const topMarket = matches[0].market;
  const marketKey = `${topMarket.platform}_${topMarket.id}`;
  const hash = createHash('sha256').update(marketKey).digest('hex').substring(0, 8);

  return `evt_${topMarket.category}_${hash}`;
}

/**
 * Classify the type of signal detected
 * Helps bots decide what action to take
 */
export function classifySignal(text: string, matches: MarketMatch[]): SignalType {
  if (matches.length === 0) {
    return 'user_interest';
  }

  const topMatch = matches[0];
  const confidence = topMatch.confidence;

  // Check for potential arbitrage (multiple platforms with different prices)
  // Note: In future, compare actual prices across platforms
  const hasPlatformVariety = matches.some(m => m.market.platform !== topMatch.market.platform);
  if (hasPlatformVariety && matches.length >= 2) {
    // Rough arbitrage detection - in Phase 3 we'll add real price comparison
    const priceDiff = Math.abs(
      matches[0].market.yesPrice - (matches[1]?.market.yesPrice || 0)
    );
    if (priceDiff > 0.05) {
      return 'arbitrage';
    }
  }

  // High confidence + breaking news keywords = news_event
  const breakingNewsKeywords = ['breaking', 'just', 'announced', 'now', 'alert', 'urgent', 'confirmed'];
  const hasBreakingNews = breakingNewsKeywords.some(keyword =>
    text.toLowerCase().includes(keyword)
  );

  if (confidence > 0.8 && hasBreakingNews) {
    return 'news_event';
  }

  // High confidence without breaking news = sentiment shift
  if (confidence > 0.7) {
    return 'sentiment_shift';
  }

  // Everything else = user interest
  return 'user_interest';
}

/**
 * Determine urgency level based on signal type and market characteristics
 * Helps bots prioritize actions
 */
export function determineUrgency(
  signalType: SignalType,
  matches: MarketMatch[],
  text: string
): UrgencyLevel {
  if (matches.length === 0) {
    return 'low';
  }

  const topMatch = matches[0];

  // Arbitrage is always time-sensitive
  if (signalType === 'arbitrage') {
    return 'critical';
  }

  // Check for time-sensitive keywords
  const urgentKeywords = ['now', 'breaking', 'just', 'alert', 'urgent', 'immediately'];
  const hasUrgentKeyword = urgentKeywords.some(keyword =>
    text.toLowerCase().includes(keyword)
  );

  // News events with urgent keywords = high urgency
  if (signalType === 'news_event' && hasUrgentKeyword) {
    return 'high';
  }

  // Check if market is ending soon (if we have endDate)
  if (topMatch.market.endDate) {
    try {
      const endDate = new Date(topMatch.market.endDate);
      const now = new Date();
      const hoursUntilEnd = (endDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursUntilEnd < 24) {
        return 'high';  // Less than 24 hours
      } else if (hoursUntilEnd < 72) {
        return 'medium';  // Less than 3 days
      }
    } catch (e) {
      // Invalid date, ignore
    }
  }

  // High confidence matches
  if (topMatch.confidence > 0.8) {
    return signalType === 'news_event' ? 'high' : 'medium';
  }

  // Medium confidence
  if (topMatch.confidence > 0.6) {
    return 'medium';
  }

  // Everything else
  return 'low';
}

/**
 * Calculate processing statistics for metadata
 */
export function calculateMetadata(
  startTime: number,
  sourcesChecked: number,
  marketsAnalyzed: number
) {
  return {
    processing_time_ms: Date.now() - startTime,
    sources_checked: sourcesChecked,
    markets_analyzed: marketsAnalyzed,
    model_version: 'keyword_matcher_v2.0'
  };
}
