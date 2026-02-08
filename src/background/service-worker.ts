// PredBot Service Worker
// Handles background tasks like badge updates

console.log('PredBot service worker initialized');

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'UPDATE_BADGE') {
    const count = message.count || 0;

    // Update badge with market count
    if (sender.tab?.id) {
      chrome.action.setBadgeText({
        text: count > 0 ? count.toString() : '',
        tabId: sender.tab.id,
      });

      chrome.action.setBadgeBackgroundColor({
        color: '#8B5CF6', // predbot-purple
        tabId: sender.tab.id,
      });
    }

    sendResponse({ success: true });
  }

  return true; // Keep message channel open for async response
});

// Clear badge when tab is updated (navigating away from Twitter)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    const url = tab.url || '';
    if (!url.includes('twitter.com') && !url.includes('x.com')) {
      chrome.action.setBadgeText({ text: '', tabId });
    }
  }
});

export {};
