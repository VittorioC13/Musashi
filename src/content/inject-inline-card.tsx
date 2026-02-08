import React from 'react';
import ReactDOM from 'react-dom/client';
import InlineMarketCard from '../sidebar/InlineMarketCard';
import { MarketMatch } from '../types/market';

// Track which tweets have cards injected
const injectedTweets = new Map<HTMLElement, ReactDOM.Root>();

/**
 * Inject an inline market card below a tweet
 */
export function injectInlineCard(
  tweetElement: HTMLElement,
  match: MarketMatch
): void {
  // Check if we already injected a card for this tweet
  if (injectedTweets.has(tweetElement)) {
    return;
  }

  // Create container for the card
  const cardContainer = document.createElement('div');
  cardContainer.className = 'predbot-inline-card-container';
  cardContainer.style.cssText = `
    margin: 8px 16px 12px 16px;
  `;

  // Find the best place to insert the card
  // Twitter's structure: article[data-testid="tweet"] contains the whole tweet
  // We want to insert after the tweet content but before replies/interactions

  // Try to insert after the tweet's main content
  const tweetContent = tweetElement.querySelector('[data-testid="tweetText"]')?.closest('div[dir="auto"]')?.parentElement?.parentElement;

  if (tweetContent && tweetContent.parentElement) {
    // Insert after the tweet content
    tweetContent.parentElement.insertBefore(cardContainer, tweetContent.nextSibling);
  } else {
    // Fallback: append to the tweet element
    tweetElement.appendChild(cardContainer);
  }

  // Render the card
  const root = ReactDOM.createRoot(cardContainer);
  root.render(
    <React.StrictMode>
      <InlineMarketCard market={match.market} confidence={match.confidence} />
    </React.StrictMode>
  );

  // Track the injection
  injectedTweets.set(tweetElement, root);

  console.log('[PredBot] Injected inline card for market:', match.market.title);
}

/**
 * Update an existing inline card
 */
export function updateInlineCard(
  tweetElement: HTMLElement,
  match: MarketMatch
): void {
  const existingRoot = injectedTweets.get(tweetElement);

  if (existingRoot) {
    existingRoot.render(
      <React.StrictMode>
        <InlineMarketCard market={match.market} confidence={match.confidence} />
      </React.StrictMode>
    );
  } else {
    // No existing card, inject a new one
    injectInlineCard(tweetElement, match);
  }
}

/**
 * Remove inline card from a tweet
 */
export function removeInlineCard(tweetElement: HTMLElement): void {
  const root = injectedTweets.get(tweetElement);

  if (root) {
    root.unmount();
    injectedTweets.delete(tweetElement);

    // Remove the container from DOM
    const container = tweetElement.querySelector('.predbot-inline-card-container');
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }

    console.log('[PredBot] Removed inline card');
  }
}

/**
 * Remove all inline cards
 */
export function removeAllInlineCards(): void {
  injectedTweets.forEach((root, tweetElement) => {
    root.unmount();

    const container = tweetElement.querySelector('.predbot-inline-card-container');
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  injectedTweets.clear();
  console.log('[PredBot] Removed all inline cards');
}

/**
 * Check if a tweet already has a card
 */
export function hasInlineCard(tweetElement: HTMLElement): boolean {
  return injectedTweets.has(tweetElement);
}
