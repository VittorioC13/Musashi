// PredBot Content Script
// Runs on Twitter/X pages to detect tweets and show prediction markets

import { TwitterExtractor, Tweet } from './twitter-extractor';
import { KeywordMatcher } from '../analysis/keyword-matcher';
import { MarketMatch } from '../types/market';
import { injectInlinePill, hasInlinePill } from './inject-inline-pill';
import '../sidebar/sidebar.css';

console.log('[PredBot] Content script loaded on:', window.location.href);

// Check if we're on Twitter/X
const isTwitter = window.location.hostname === 'twitter.com' || window.location.hostname === 'x.com';

if (!isTwitter) {
  console.log('[PredBot] Not on Twitter/X, exiting');
} else {
  console.log('[PredBot] Running on Twitter/X');

  // Initialize the Twitter extractor and matcher
  const extractor = new TwitterExtractor();
  const matcher = new KeywordMatcher();

  // Store all matches for the current page view
  let allMatches: MarketMatch[] = [];

  // Start monitoring for tweets after page loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePredBot);
  } else {
    // DOM already loaded
    initializePredBot();
  }

  function initializePredBot() {
    console.log('[PredBot] Initializing...');

    // Wait a bit for Twitter to render
    setTimeout(() => {
      extractor.start((tweets: Tweet[]) => {
        console.log('[PredBot] 🎯 Detected tweets:', tweets.length);

        let pillsInjected = 0;

        // Match each tweet to markets
        tweets.forEach((tweet, index) => {
          const matches = matcher.match(tweet.text);

          if (matches.length > 0) {
            console.log(`[PredBot] Tweet ${index + 1} matched ${matches.length} markets:`);
            console.log(`  Text: "${tweet.text.substring(0, 80)}${tweet.text.length > 80 ? '...' : ''}"`);

            // Log matches
            matches.forEach((match) => {
              console.log(`  📊 ${match.market.title}`);
              console.log(`     Confidence: ${(match.confidence * 100).toFixed(1)}%`);
              console.log(`     YES: ${(match.market.yesPrice * 100).toFixed(0)}% | NO: ${(match.market.noPrice * 100).toFixed(0)}%`);
              console.log(`     Keywords: ${match.matchedKeywords.join(', ')}`);
            });

            // Inject inline pill for the BEST match (highest confidence)
            const bestMatch = matches[0];

            if (!hasInlinePill(tweet.element)) {
              injectInlinePill(tweet.element, bestMatch);
              pillsInjected++;
            }

            // Add to global matches list
            allMatches.push(...matches);
          } else {
            console.log(`[PredBot] Tweet ${index + 1}: No market matches found`);
          }
        });

        // Remove duplicates from allMatches
        const uniqueMarkets = new Map();
        allMatches.forEach((match) => {
          if (!uniqueMarkets.has(match.market.id)) {
            uniqueMarkets.set(match.market.id, match);
          } else {
            // Keep the match with higher confidence
            const existing = uniqueMarkets.get(match.market.id);
            if (match.confidence > existing.confidence) {
              uniqueMarkets.set(match.market.id, match);
            }
          }
        });
        allMatches = Array.from(uniqueMarkets.values());

        // Sort by confidence (highest first)
        allMatches.sort((a, b) => b.confidence - a.confidence);

        // Update badge count
        updateBadge(allMatches.length);

        console.log(`[PredBot] Total unique markets found: ${allMatches.length}`);
        console.log(`[PredBot] Injected ${pillsInjected} inline pills`);
      });
    }, 1000);
  }

  /**
   * Update extension badge with market count
   */
  function updateBadge(count: number) {
    chrome.runtime.sendMessage(
      {
        type: 'UPDATE_BADGE',
        count,
      },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error('[PredBot] Error updating badge:', chrome.runtime.lastError);
        }
      }
    );
  }

  // Log when user scrolls (for debugging)
  let scrollTimeout: number | null = null;
  window.addEventListener('scroll', () => {
    if (scrollTimeout) clearTimeout(scrollTimeout);
    scrollTimeout = window.setTimeout(() => {
      console.log('[PredBot] User scrolled - new tweets should be detected automatically');
    }, 500);
  });
}

export {};
