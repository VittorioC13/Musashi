import React from 'react';
import ReactDOM from 'react-dom/client';
import Sidebar from '../sidebar/Sidebar';
import { MarketMatch } from '../types/market';

let sidebarRoot: ReactDOM.Root | null = null;
let sidebarContainer: HTMLDivElement | null = null;

/**
 * Inject the sidebar into the page
 */
export function injectSidebar(): void {
  if (sidebarContainer) {
    console.log('[PredBot] Sidebar already injected');
    return;
  }

  // Create container for the sidebar
  sidebarContainer = document.createElement('div');
  sidebarContainer.id = 'predbot-sidebar-container';
  sidebarContainer.style.position = 'fixed';
  sidebarContainer.style.top = '0';
  sidebarContainer.style.right = '0';
  sidebarContainer.style.zIndex = '9999';
  sidebarContainer.style.pointerEvents = 'none'; // Let clicks through to sidebar content

  // Make sidebar content clickable
  sidebarContainer.style.cssText = `
    position: fixed;
    top: 0;
    right: 0;
    z-index: 9999;
  `;

  document.body.appendChild(sidebarContainer);

  // Create shadow DOM to isolate styles (optional but recommended)
  // For now, we'll inject directly to use Tailwind classes
  sidebarRoot = ReactDOM.createRoot(sidebarContainer);

  // Render initial empty sidebar
  sidebarRoot.render(
    <React.StrictMode>
      <Sidebar matches={[]} isLoading={true} />
    </React.StrictMode>
  );

  console.log('[PredBot] Sidebar injected into page');
}

/**
 * Update sidebar with new market matches
 */
export function updateSidebar(matches: MarketMatch[]): void {
  if (!sidebarRoot || !sidebarContainer) {
    console.warn('[PredBot] Sidebar not initialized, injecting now...');
    injectSidebar();
  }

  if (sidebarRoot) {
    sidebarRoot.render(
      <React.StrictMode>
        <Sidebar matches={matches} isLoading={false} />
      </React.StrictMode>
    );

    console.log(`[PredBot] Sidebar updated with ${matches.length} markets`);
  }
}

/**
 * Remove sidebar from page
 */
export function removeSidebar(): void {
  if (sidebarRoot) {
    sidebarRoot.unmount();
    sidebarRoot = null;
  }

  if (sidebarContainer && sidebarContainer.parentNode) {
    sidebarContainer.parentNode.removeChild(sidebarContainer);
    sidebarContainer = null;
  }

  console.log('[PredBot] Sidebar removed');
}

/**
 * Show loading state
 */
export function showLoading(): void {
  if (!sidebarRoot) {
    injectSidebar();
    return;
  }

  if (sidebarRoot) {
    sidebarRoot.render(
      <React.StrictMode>
        <Sidebar matches={[]} isLoading={true} />
      </React.StrictMode>
    );
  }
}
