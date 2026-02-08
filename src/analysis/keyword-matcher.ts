// Keyword-based market matcher for MVP
// Matches tweet text to prediction markets based on keyword overlap

import { Market, MarketMatch } from '../types/market';
import { mockMarkets } from '../data/mock-markets';

// Common words to ignore (stop words)
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
  'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
  'would', 'should', 'could', 'may', 'might', 'can', 'this', 'that',
  'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'them',
  'their', 'what', 'which', 'who', 'when', 'where', 'why', 'how', 'all',
  'just', 'so', 'than', 'too', 'very', 'not', 'no', 'yes',
]);

export class KeywordMatcher {
  private markets: Market[];
  private minConfidence: number;
  private maxResults: number;

  constructor(
    markets: Market[] = mockMarkets,
    minConfidence: number = 0.3,
    maxResults: number = 5
  ) {
    this.markets = markets;
    this.minConfidence = minConfidence;
    this.maxResults = maxResults;
  }

  /**
   * Match a tweet to relevant markets
   */
  public match(tweetText: string): MarketMatch[] {
    const tweetKeywords = this.extractKeywords(tweetText);

    if (tweetKeywords.length === 0) {
      return [];
    }

    const matches: MarketMatch[] = [];

    for (const market of this.markets) {
      const matchResult = this.calculateMatch(tweetKeywords, market);

      if (matchResult.confidence >= this.minConfidence) {
        matches.push(matchResult);
      }
    }

    // Sort by confidence (highest first) and limit results
    matches.sort((a, b) => b.confidence - a.confidence);

    return matches.slice(0, this.maxResults);
  }

  /**
   * Extract keywords from tweet text
   */
  private extractKeywords(text: string): string[] {
    // Normalize text: lowercase, remove URLs, mentions, hashtags
    let normalized = text.toLowerCase();

    // Remove URLs
    normalized = normalized.replace(/https?:\/\/[^\s]+/g, '');

    // Remove mentions (@username)
    normalized = normalized.replace(/@\w+/g, '');

    // Extract hashtags (keep the text, remove #)
    const hashtags = Array.from(text.matchAll(/#(\w+)/g)).map(m => m[1].toLowerCase());

    // Remove all special characters except spaces
    normalized = normalized.replace(/[^a-z0-9\s]/g, ' ');

    // Split into words
    const words = normalized.split(/\s+/).filter(word => {
      return word.length > 2 && !STOP_WORDS.has(word);
    });

    // Combine words and hashtags
    const keywords = [...new Set([...words, ...hashtags])];

    return keywords;
  }

  /**
   * Calculate match score between tweet keywords and a market
   */
  private calculateMatch(tweetKeywords: string[], market: Market): MarketMatch {
    const matchedKeywords: string[] = [];
    let exactMatches = 0;
    let partialMatches = 0;

    for (const tweetKeyword of tweetKeywords) {
      for (const marketKeyword of market.keywords) {
        const marketKeywordLower = marketKeyword.toLowerCase();

        // Exact match
        if (tweetKeyword === marketKeywordLower) {
          matchedKeywords.push(marketKeyword);
          exactMatches++;
        }
        // Partial match (tweet keyword contains market keyword or vice versa)
        else if (
          tweetKeyword.includes(marketKeywordLower) ||
          marketKeywordLower.includes(tweetKeyword)
        ) {
          if (!matchedKeywords.includes(marketKeyword)) {
            matchedKeywords.push(marketKeyword);
            partialMatches++;
          }
        }
      }
    }

    // Calculate confidence score
    // Exact matches are weighted more heavily
    const exactWeight = 0.7;
    const partialWeight = 0.3;

    const maxPossibleScore = market.keywords.length;
    const score =
      (exactMatches * exactWeight + partialMatches * partialWeight) /
      Math.max(maxPossibleScore, 1);

    // Boost confidence if multiple keywords match
    const keywordBoost = Math.min(matchedKeywords.length * 0.1, 0.3);
    const confidence = Math.min(score + keywordBoost, 1.0);

    return {
      market,
      confidence,
      matchedKeywords,
    };
  }

  /**
   * Update confidence threshold
   */
  public setMinConfidence(minConfidence: number): void {
    this.minConfidence = minConfidence;
  }

  /**
   * Update max results
   */
  public setMaxResults(maxResults: number): void {
    this.maxResults = maxResults;
  }
}

// Singleton instance for easy access
export const matcher = new KeywordMatcher();
