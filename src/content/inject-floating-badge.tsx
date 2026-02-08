import React from 'react';
import ReactDOM from 'react-dom/client';
import FloatingBadge from '../sidebar/FloatingBadge';
import { MarketMatch } from '../types/market';

let badgeRoot: ReactDOM.Root | null = null;
let badgeContainer: HTMLDivElement | null = null;

/**
 * Inject the floating badge into the page
 */
export function injectFloatingBadge(): void {
  if (badgeContainer) {
    console.log('[PredBot] Floating badge already injected');
    return;
  }

  // Create container for the badge
  badgeContainer = document.createElement('div');
  badgeContainer.id = 'predbot-floating-badge';
  badgeContainer.style.cssText = `
    position: fixed;
    bottom: 0;
    right: 0;
    z-index: 10000;
    pointer-events: none;
  `;

  // Make badge content clickable
  badgeContainer.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  document.body.appendChild(badgeContainer);

  // Create React root
  badgeRoot = ReactDOM.createRoot(badgeContainer);

  // Render initial empty badge (won't show until matches > 0)
  badgeRoot.render(
    <React.StrictMode>
      <FloatingBadge matches={[]} />
    </React.StrictMode>
  );

  console.log('[PredBot] Floating badge injected');
}

/**
 * Update badge with new market matches
 */
export function updateFloatingBadge(matches: MarketMatch[]): void {
  if (!badgeRoot || !badgeContainer) {
    console.warn('[PredBot] Badge not initialized, injecting now...');
    injectFloatingBadge();
  }

  // Make container allow pointer events if there are matches
  if (badgeContainer) {
    badgeContainer.style.pointerEvents = matches.length > 0 ? 'auto' : 'none';
  }

  if (badgeRoot) {
    badgeRoot.render(
      <React.StrictMode>
        <FloatingBadge matches={matches} />
      </React.StrictMode>
    );

    console.log(`[PredBot] Badge updated with ${matches.length} markets`);
  }
}

/**
 * Remove badge from page
 */
export function removeFloatingBadge(): void {
  if (badgeRoot) {
    badgeRoot.unmount();
    badgeRoot = null;
  }

  if (badgeContainer && badgeContainer.parentNode) {
    badgeContainer.parentNode.removeChild(badgeContainer);
    badgeContainer = null;
  }

  console.log('[PredBot] Floating badge removed');
}
