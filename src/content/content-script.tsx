// Musashi Content Script
// Detects tweets on Twitter/X and overlays matching Polymarket prediction markets.
// Market data is fetched by the background service worker (bypasses CORS).

import { TwitterExtractor, Tweet } from './twitter-extractor';
import { KeywordMatcher } from '../analysis/keyword-matcher';
import { MarketMatch, Market } from '../types/market';
import { injectTwitterCard, hasTwitterCard, detectTwitterTheme, applyThemeToAllCards } from './inject-twitter-card';
import '../sidebar/sidebar.css';

console.log('[Musashi] Content script loaded');

// ── Live price polling ────────────────────────────────────────────────────────
// Module-level so registerCard/unregisterCard can be imported by inject-twitter-card.

const activeCards = new Map<string, string>(); // marketId → numericId
let pollInterval: ReturnType<typeof setInterval> | null = null;

export function registerCard(marketId: string, numericId: string): void {
  activeCards.set(marketId, numericId);
  if (pollInterval === null) {
    pollInterval = setInterval(pollPrices, 30_000);
  }
}

export function unregisterCard(marketId: string): void {
  activeCards.delete(marketId);
  if (activeCards.size === 0 && pollInterval !== null) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
}

async function pollPrices(): Promise<void> {
  if (activeCards.size === 0) return;

  const numericIds = Array.from(activeCards.values()).filter(Boolean);
  if (numericIds.length === 0) return;

  try {
    // Delegate fetch to service worker — content scripts are blocked by x.com CSP
    const response = await new Promise<{ prices: Record<string, { yes: number; no: number; oneDayPriceChange: number }> }>(
      (resolve) => {
        chrome.runtime.sendMessage({ type: 'POLL_PRICES', numericIds }, (res) => {
          if (chrome.runtime.lastError) {
            console.warn('[Musashi] POLL_PRICES SW error:', chrome.runtime.lastError.message);
            resolve({ prices: {} });
            return;
          }
          resolve(res ?? { prices: {} });
        });
      }
    );

    const priceByNumericId = response.prices;

    // Reverse-map numericId → marketId and dispatch
    const marketIdPriceMap: Record<string, { yes: number; no: number; oneDayPriceChange: number }> = {};
    for (const [marketId, numericId] of activeCards.entries()) {
      if (priceByNumericId[numericId]) {
        marketIdPriceMap[marketId] = priceByNumericId[numericId];
      }
    }

    if (Object.keys(marketIdPriceMap).length > 0) {
      window.dispatchEvent(
        new CustomEvent('musashi-price-update', { detail: marketIdPriceMap })
      );
      console.log(`[Musashi] Polled ${Object.keys(marketIdPriceMap).length} market price(s)`);
    }
  } catch (e) {
    console.warn('[Musashi] Price poll failed:', e);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

const isTwitter =
  window.location.hostname === 'twitter.com' ||
  window.location.hostname === 'x.com';

if (!isTwitter) {
  console.log('[Musashi] Not on Twitter/X, exiting');
} else {
  console.log('[Musashi] Running on Twitter/X');

  const extractor = new TwitterExtractor();
  let allMatches: MarketMatch[] = [];

  // Watch for Twitter theme changes (user toggling Dim / Lights Out / Default mid-session)
  let lastTheme = detectTwitterTheme();
  const themeObserver = new MutationObserver(() => {
    const theme = detectTwitterTheme();
    if (theme !== lastTheme) {
      lastTheme = theme;
      applyThemeToAllCards(theme);
    }
  });
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style'] });
  themeObserver.observe(document.body,            { attributes: true, attributeFilter: ['class', 'style'] });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeMusashi);
  } else {
    initializeMusashi();
  }

  async function initializeMusashi() {
    console.log('[Musashi] Requesting markets from service worker...');
    const markets = await loadMarketsFromServiceWorker();

    if (markets.length === 0) {
      console.warn('[Musashi] No markets received. Check the Service Worker console for errors.');
      return;
    }

    console.log(`[Musashi] ${markets.length} markets loaded. Starting tweet scanner...`);
    const matcher = new KeywordMatcher(markets, 0.22, 5); // Raised from 0.12 to 0.22 for better accuracy

    setTimeout(() => {
      extractor.start((tweets: Tweet[]) => {
        console.log(`[Musashi] Scanned ${tweets.length} tweet(s)`);
        let injected = 0;

        tweets.forEach((tweet) => {
          const matches = matcher.match(tweet.text);

          if (matches.length > 0) {
            const best = matches[0];
            console.log(
              `[Musashi] MATCH ${(best.confidence * 100).toFixed(0)}% — "${best.market.title}"` +
              (matches.length > 1 ? ` (+${matches.length - 1} secondary)` : '')
            );
            if (!hasTwitterCard(tweet.element)) {
              injectTwitterCard(tweet.element, best, tweet.text, matches.slice(1, 3));
              injected++;
            }
            allMatches.push(...matches);
          }
        });

        if (injected > 0) console.log(`[Musashi] Injected ${injected} card(s)`);

        const unique = new Map<string, MarketMatch>();
        allMatches.forEach(m => {
          const ex = unique.get(m.market.id);
          if (!ex || m.confidence > ex.confidence) unique.set(m.market.id, m);
        });
        allMatches = Array.from(unique.values()).sort((a, b) => b.confidence - a.confidence);
        updateBadge(allMatches.length);
      });
    }, 1500);
  }

  function updateBadge(count: number) {
    try {
      chrome.runtime.sendMessage({ type: 'UPDATE_BADGE', count }, () => {
        void chrome.runtime.lastError;
      });
    } catch { /* context invalidated after reload */ }
  }
}

// ── Market loading via service worker ────────────────────────────────────────

async function loadMarketsFromServiceWorker(): Promise<Market[]> {
  return new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage({ type: 'FETCH_MARKETS' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('[Musashi] Service worker error:', chrome.runtime.lastError.message);
          resolve([]);
          return;
        }
        const markets: Market[] = response?.markets ?? [];
        console.log(`[Musashi] Received ${markets.length} markets from service worker`);
        resolve(markets);
      });
    } catch (e) {
      console.error('[Musashi] Could not reach service worker:', e);
      resolve([]);
    }
  });
}
