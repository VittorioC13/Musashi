import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import TwitterNativeCard from '../sidebar/TwitterNativeCard';
import { MarketMatch } from '../types/market';
import { registerCard, unregisterCard } from './content-script';

// Track which tweets have cards injected
const injectedTweets = new Map<HTMLElement, { container: HTMLElement; root: ReactDOM.Root }>();

/**
 * Detect whether Twitter is currently in dark mode by sampling the
 * body background luminance. Works for both Dim (#15202B) and Lights Out (#000).
 */
export function detectTwitterTheme(): 'dark' | 'light' {
  const bg = getComputedStyle(document.body).backgroundColor;
  const m  = bg.match(/\d+/g);
  if (!m) return 'light';
  const [r, g, b] = m.map(Number);
  return (r * 299 + g * 587 + b * 114) / 1000 < 100 ? 'dark' : 'light';
}

/**
 * Toggle .musashi-dark on every injected card container.
 * Called at injection time and whenever Twitter's theme changes.
 */
export function applyThemeToAllCards(theme: 'dark' | 'light'): void {
  injectedTweets.forEach(({ container }) => {
    container.classList.toggle('musashi-dark', theme === 'dark');
  });
}

/**
 * Renders the primary market card plus an expandable list of secondary matches.
 * The expand button lives outside the <a> tag so it doesn't trigger navigation.
 */
const MarketCardGroup: React.FC<{
  primary:   MarketMatch;
  secondary: MarketMatch[];
  onMount:   (marketId: string, numericId: string) => void;
  onUnmount: (marketId: string) => void;
}> = ({ primary, secondary, onMount, onUnmount }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      {/* Primary — always visible */}
      <TwitterNativeCard
        market={primary.market}
        confidence={primary.confidence}
        onMount={() => { if (primary.market.numericId) onMount(primary.market.id, primary.market.numericId); }}
        onUnmount={() => onUnmount(primary.market.id)}
      />

      {secondary.length > 0 && (
        <>
          {/* Expand trigger */}
          <button
            className="musashi-expand-btn"
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); setExpanded(v => !v); }}
          >
            {expanded
              ? 'show less'
              : `+ ${secondary.length} more market${secondary.length > 1 ? 's' : ''}`}
          </button>

          {/* Secondary cards — grid-based smooth expand */}
          <div className={`musashi-secondary-cards${expanded ? ' musashi-secondary-expanded' : ''}`}>
            <div>
              {secondary.map(m => (
                <div key={m.market.id} className="musashi-secondary-item">
                  <TwitterNativeCard
                    market={m.market}
                    confidence={m.confidence}
                    onMount={() => { if (m.market.numericId) onMount(m.market.id, m.market.numericId); }}
                    onUnmount={() => onUnmount(m.market.id)}
                  />
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

/**
 * Inject Twitter-native market card inline within tweet
 * Appears below tweet text, like Twitter's native link previews
 */
export function injectTwitterCard(
  tweetElement: HTMLElement,
  match: MarketMatch,
  secondaryMatches: MarketMatch[] = []
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
  let insertionPoint = tweetTextElement.parentElement;

  while (insertionPoint && !insertionPoint.querySelector('[data-testid="tweetText"]')?.parentElement) {
    insertionPoint = insertionPoint.parentElement;
  }

  if (!insertionPoint) {
    console.warn('[Musashi] Could not find insertion point');
    return;
  }

  // Create card container, applying dark mode immediately if active
  const cardContainer = document.createElement('div');
  const isDark = detectTwitterTheme() === 'dark';
  cardContainer.className = isDark
    ? 'musashi-card-container musashi-dark'
    : 'musashi-card-container';

  // Insert AFTER the tweet text (like Twitter's link previews)
  if (insertionPoint.nextSibling) {
    insertionPoint.parentElement?.insertBefore(cardContainer, insertionPoint.nextSibling);
  } else {
    insertionPoint.parentElement?.appendChild(cardContainer);
  }

  // Render the group (primary + optional expandable secondary cards)
  const root = ReactDOM.createRoot(cardContainer);
  root.render(
    <React.StrictMode>
      <MarketCardGroup
        primary={match}
        secondary={secondaryMatches}
        onMount={registerCard}
        onUnmount={unregisterCard}
      />
    </React.StrictMode>
  );

  // Track injection
  injectedTweets.set(tweetElement, { container: cardContainer, root });

  const extra = secondaryMatches.length > 0 ? ` (+${secondaryMatches.length} secondary)` : '';
  console.log(`[Musashi] Injected card for: ${match.market.title}${extra}`);
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
    const { market, confidence } = match;
    existing.root.render(
      <React.StrictMode>
        <TwitterNativeCard
          market={market}
          confidence={confidence}
          onMount={() => {
            if (market.numericId) {
              registerCard(market.id, market.numericId);
            }
          }}
          onUnmount={() => unregisterCard(market.id)}
        />
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
