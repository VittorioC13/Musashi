// Musashi Service Worker
// Fetches Polymarket markets (bypasses CORS) and stores them in chrome.storage.
// Content script reads from storage — no large-payload message passing needed.

import { fetchPolymarkets } from '../api/polymarket-client';

const STORAGE_KEY_MARKETS = 'polymarkets_v1';
const STORAGE_KEY_TS      = 'polymarketsTs_v1';
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
      console.log('[Musashi SW] Fetching fresh markets from Polymarket...');
      const fresh = await refreshMarkets();
      sendResponse({ markets: fresh });
    }).catch((e) => {
      console.error('[Musashi SW] FETCH_MARKETS error:', e);
      sendResponse({ markets: [] });
    });
    return true; // keep channel open for async
  }

  // Content script asks SW to poll live prices (avoids X.com CSP blocking direct fetch)
  if (message.type === 'POLL_PRICES') {
    const numericIds: string[] = message.numericIds ?? [];
    if (numericIds.length === 0) { sendResponse({ prices: {} }); return true; }

    const params = numericIds.map((id: string) => `id=${encodeURIComponent(id)}`).join('&');
    fetch(`https://gamma-api.polymarket.com/markets?${params}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then((data: Array<{ id: string; outcomePrices: string; outcomes: string; oneDayPriceChange?: number }>) => {
        const prices: Record<string, { yes: number; no: number; oneDayPriceChange: number }> = {};
        for (const m of data) {
          try {
            const outcomePrices: string[] = JSON.parse(m.outcomePrices);
            const outcomes: string[] = JSON.parse(m.outcomes);
            const yesIdx = outcomes.findIndex((o: string) => o.toLowerCase() === 'yes');
            if (yesIdx === -1 || !outcomePrices[yesIdx]) continue;
            const yes = Math.min(Math.max(parseFloat(outcomePrices[yesIdx]), 0.01), 0.99);
            prices[m.id] = {
              yes: +yes.toFixed(2),
              no: +(1 - yes).toFixed(2),
              oneDayPriceChange: m.oneDayPriceChange ?? 0,
            };
          } catch { /* skip malformed */ }
        }
        sendResponse({ prices });
      })
      .catch((e) => {
        console.warn('[Musashi SW] POLL_PRICES fetch failed:', e);
        sendResponse({ prices: {} });
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
    const markets = await fetchPolymarkets(250, 5);
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
