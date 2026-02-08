import React from 'react';
import ReactDOM from 'react-dom/client';
import InlinePill from '../sidebar/InlinePill';
import { MarketMatch } from '../types/market';

// Track which tweets have pills injected
const injectedTweets = new Map<HTMLElement, ReactDOM.Root>();

/**
 * Inject an inline pill into a tweet (OKX style)
 */
export function injectInlinePill(
  tweetElement: HTMLElement,
  match: MarketMatch
): void {
  // Check if we already injected a pill for this tweet
  if (injectedTweets.has(tweetElement)) {
    return;
  }

  // Find the tweet text element
  const tweetTextElement = tweetElement.querySelector('[data-testid="tweetText"]');

  if (!tweetTextElement) {
    console.warn('[PredBot] Could not find tweet text element');
    return;
  }

  // Create container for the pill
  const pillContainer = document.createElement('span');
  pillContainer.className = 'predbot-inline-pill';
  pillContainer.style.cssText = `
    display: inline;
    vertical-align: middle;
  `;

  // Insert the pill right after the tweet text
  // We want it to appear inline, like OKX does
  if (tweetTextElement.parentElement) {
    tweetTextElement.parentElement.appendChild(pillContainer);
  } else {
    tweetTextElement.appendChild(pillContainer);
  }

  // Render the pill
  const root = ReactDOM.createRoot(pillContainer);
  root.render(
    <React.StrictMode>
      <InlinePill market={match.market} confidence={match.confidence} />
    </React.StrictMode>
  );

  // Track the injection
  injectedTweets.set(tweetElement, root);

  console.log('[PredBot] Injected inline pill for market:', match.market.title);
}

/**
 * Update an existing inline pill
 */
export function updateInlinePill(
  tweetElement: HTMLElement,
  match: MarketMatch
): void {
  const existingRoot = injectedTweets.get(tweetElement);

  if (existingRoot) {
    existingRoot.render(
      <React.StrictMode>
        <InlinePill market={match.market} confidence={match.confidence} />
      </React.StrictMode>
    );
  } else {
    // No existing pill, inject a new one
    injectInlinePill(tweetElement, match);
  }
}

/**
 * Remove inline pill from a tweet
 */
export function removeInlinePill(tweetElement: HTMLElement): void {
  const root = injectedTweets.get(tweetElement);

  if (root) {
    root.unmount();
    injectedTweets.delete(tweetElement);

    // Remove the container from DOM
    const container = tweetElement.querySelector('.predbot-inline-pill');
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }

    console.log('[PredBot] Removed inline pill');
  }
}

/**
 * Remove all inline pills
 */
export function removeAllInlinePills(): void {
  injectedTweets.forEach((root, tweetElement) => {
    root.unmount();

    const container = tweetElement.querySelector('.predbot-inline-pill');
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  injectedTweets.clear();
  console.log('[PredBot] Removed all inline pills');
}

/**
 * Check if a tweet already has a pill
 */
export function hasInlinePill(tweetElement: HTMLElement): boolean {
  return injectedTweets.has(tweetElement);
}
