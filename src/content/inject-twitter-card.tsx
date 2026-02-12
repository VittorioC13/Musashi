import React from 'react';
import ReactDOM from 'react-dom/client';
import TwitterNativeCard from '../sidebar/TwitterNativeCard';
import { MarketMatch } from '../types/market';

// Track which tweets have cards injected
const injectedTweets = new Map<HTMLElement, { container: HTMLElement; root: ReactDOM.Root }>();

/**
 * Inject Twitter-native market card inline within tweet
 * Appears below tweet text, like Twitter's native link previews
 */
export function injectTwitterCard(
  tweetElement: HTMLElement,
  match: MarketMatch
): void {
  // Check if already injected
  if (injectedTweets.has(tweetElement)) {
    return;
  }

  // Find tweet text element
  const tweetTextElement = tweetElement.querySelector('[data-testid="tweetText"]');
  if (!tweetTextElement) {
    console.warn('[Musashi] Could not find tweet text element');
    return;
  }

  // Find the parent container that holds tweet content
  // We want to inject AFTER the text, like Twitter does with link previews
  let insertionPoint = tweetTextElement.parentElement;

  // Try to find the tweet content container
  while (insertionPoint && !insertionPoint.querySelector('[data-testid="tweetText"]')?.parentElement) {
    insertionPoint = insertionPoint.parentElement;
  }

  if (!insertionPoint) {
    console.warn('[Musashi] Could not find insertion point');
    return;
  }

  // Create card container
  const cardContainer = document.createElement('div');
  cardContainer.className = 'musashi-card-container';

  // Insert AFTER the tweet text (like Twitter's link previews)
  if (insertionPoint.nextSibling) {
    insertionPoint.parentElement?.insertBefore(cardContainer, insertionPoint.nextSibling);
  } else {
    insertionPoint.parentElement?.appendChild(cardContainer);
  }

  // Render the card
  const root = ReactDOM.createRoot(cardContainer);
  root.render(
    <React.StrictMode>
      <TwitterNativeCard market={match.market} confidence={match.confidence} />
    </React.StrictMode>
  );

  // Track injection
  injectedTweets.set(tweetElement, { container: cardContainer, root });

  console.log('[Musashi] Injected Twitter-native card for:', match.market.title);
}

/**
 * Update existing card
 */
export function updateTwitterCard(
  tweetElement: HTMLElement,
  match: MarketMatch
): void {
  const existing = injectedTweets.get(tweetElement);

  if (existing) {
    existing.root.render(
      <React.StrictMode>
        <TwitterNativeCard market={match.market} confidence={match.confidence} />
      </React.StrictMode>
    );
  } else {
    injectTwitterCard(tweetElement, match);
  }
}

/**
 * Remove card from tweet
 */
export function removeTwitterCard(tweetElement: HTMLElement): void {
  const existing = injectedTweets.get(tweetElement);

  if (existing) {
    existing.root.unmount();
    injectedTweets.delete(tweetElement);

    if (existing.container && existing.container.parentNode) {
      existing.container.parentNode.removeChild(existing.container);
    }

    console.log('[Musashi] Removed Twitter card');
  }
}

/**
 * Remove all cards
 */
export function removeAllTwitterCards(): void {
  injectedTweets.forEach((existing) => {
    existing.root.unmount();

    if (existing.container && existing.container.parentNode) {
      existing.container.parentNode.removeChild(existing.container);
    }
  });

  injectedTweets.clear();
  console.log('[Musashi] Removed all Twitter cards');
}

/**
 * Check if tweet has card
 */
export function hasTwitterCard(tweetElement: HTMLElement): boolean {
  return injectedTweets.has(tweetElement);
}
