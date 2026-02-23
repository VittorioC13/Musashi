// Musashi Service Worker
// Fetches Polymarket + Kalshi markets (bypasses CORS) and stores them in chrome.storage.
// Content script reads from storage — no large-payload message passing needed.

import { fetchPolymarkets } from '../api/polymarket-client';
import { fetchKalshiMarkets } from '../api/kalshi-client';

// v2 key — invalidates the old Polymarket-only cache so combined data is fetched fresh
const STORAGE_KEY_MARKETS = 'markets_v2';
const STORAGE_KEY_TS      = 'marketsTs_v2';
const CACHE_TTL_MS        = 30 * 60 * 1000; // 30 minutes

console.log('[Musashi SW] Service worker initialized');

// ── Proactive fetch on install / browser startup ──────────────────────────────

chrome.runtime.onInstalled.addListener(() => { refreshMarkets(); });
chrome.runtime.onStartup.addListener(() => { refreshMarkets(); });

// ── Message handler ───────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  // Content script asks for markets (cache miss or first load)
  if (message.type === 'FETCH_MARKETS') {
    chrome.storage.local.get([STORAGE_KEY_MARKETS, STORAGE_KEY_TS]).then(async (cached) => {
      const ts: number = cached[STORAGE_KEY_TS] ?? 0;
      const markets = cached[STORAGE_KEY_MARKETS];

      // Return cached if fresh
      if (Array.isArray(markets) && markets.length > 0 && Date.now() - ts < CACHE_TTL_MS) {
        console.log(`[Musashi SW] Returning ${markets.length} cached markets`);
        sendResponse({ markets });
        return;
      }

      // Fetch fresh
      console.log('[Musashi SW] Fetching fresh markets from Polymarket + Kalshi...');
      const fresh = await refreshMarkets();
      sendResponse({ markets: fresh });
    }).catch((e) => {
      console.error('[Musashi SW] FETCH_MARKETS error:', e);
      sendResponse({ markets: [] });
    });
    return true; // keep channel open for async
  }

  // Badge update from content script
  if (message.type === 'UPDATE_BADGE') {
    const count = message.count || 0;
    if (sender.tab?.id) {
      chrome.action.setBadgeText({ text: count > 0 ? count.toString() : '', tabId: sender.tab.id });
      chrome.action.setBadgeBackgroundColor({ color: '#A8C5DD', tabId: sender.tab.id });
    }
    sendResponse({ success: true });
    return true;
  }
});

// Clear badge when navigating away from Twitter/X
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    const url = tab.url || '';
    if (!url.includes('twitter.com') && !url.includes('x.com')) {
      chrome.action.setBadgeText({ text: '', tabId });
    }
  }
});

// ── Market refresh ────────────────────────────────────────────────────────────

async function refreshMarkets() {
  try {
    // Fetch both sources in parallel; if one fails the other still contributes
    const [polyResult, kalshiResult] = await Promise.allSettled([
      fetchPolymarkets(500, 10),
      fetchKalshiMarkets(200, 10),
    ]);

    const polyMarkets  = polyResult.status   === 'fulfilled' ? polyResult.value   : [];
    const kalshiMarkets = kalshiResult.status === 'fulfilled' ? kalshiResult.value : [];

    if (polyResult.status === 'rejected') {
      console.warn('[Musashi SW] Polymarket fetch failed:', polyResult.reason);
    }
    if (kalshiResult.status === 'rejected') {
      console.warn('[Musashi SW] Kalshi fetch failed:', kalshiResult.reason);
    }

    // Merge; dedup by id just in case
    const seen = new Set<string>();
    const markets = [...polyMarkets, ...kalshiMarkets].filter(m => {
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    });

    console.log(
      `[Musashi SW] Fetched ${polyMarkets.length} Polymarket + ` +
      `${kalshiMarkets.length} Kalshi = ${markets.length} total markets`
    );

    if (markets.length > 0) {
      await chrome.storage.local.set({
        [STORAGE_KEY_MARKETS]: markets,
        [STORAGE_KEY_TS]: Date.now(),
      });
      console.log(`[Musashi SW] Stored ${markets.length} markets`);
    }
    // Clear any previous ERR badge
    chrome.action.setBadgeText({ text: '' });
    return markets;
  } catch (e) {
    console.error('[Musashi SW] refreshMarkets failed:', e);
    // Show red ERR badge on ALL tabs so the user can see without opening any console
    chrome.action.setBadgeText({ text: 'ERR' });
    chrome.action.setBadgeBackgroundColor({ color: '#FF4444' });
    return [];
  }
}

export {};
