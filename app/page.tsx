'use client';

import { useState } from 'react';
import Image from "next/image";
import TerminalDemo from "./TerminalDemo";
import SmoothScrollLink from "./components/SmoothScrollLink";
import FAQ from "./components/FAQ";
import InstallCodeReveal from "./components/InstallCodeReveal";

export default function Home() {
  const [showInstallCode, setShowInstallCode] = useState(false);

  return (
    <div className="flex flex-col w-full bg-[var(--bg-primary)]">
      {/* Header */}
      <header className="flex items-center justify-between w-full px-[80px] py-4 bg-[var(--bg-primary)] border-b border-[var(--border-primary)] gap-10">
        <div className="font-jetbrains text-[var(--text-primary)] text-[22px] font-bold tracking-[1px]">
          MUSASHI
        </div>
        <nav className="flex items-center gap-8">
          <a href="/ai" className="font-jetbrains text-[var(--text-secondary)] text-xs font-medium hover:text-[var(--text-primary)] transition-colors">API</a>
          <a href="/pricing" className="font-jetbrains text-[var(--text-secondary)] text-xs font-medium hover:text-[var(--text-primary)] transition-colors">PRICING</a>
          <a href="/privacy" className="font-jetbrains text-[var(--text-secondary)] text-xs font-medium hover:text-[var(--text-primary)] transition-colors">PRIVACY</a>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative w-full h-[860px] bg-[var(--bg-primary)] overflow-hidden">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0A0A0F] via-[#0A0A0F] to-[#0F0F1A] opacity-80" />
        {/* Hero Content */}
        <div className="absolute left-[80px] top-[100px] w-[500px] flex flex-col gap-7 z-10">
          {/* Headline */}
          <h1 className="font-jetbrains text-[var(--text-primary)] text-[52px] font-normal leading-[1.15] tracking-[-2px]">
            Trade the<br />[Tweets]
          </h1>

          {/* Subtitle */}
          <p className="font-jetbrains text-[var(--text-secondary)] text-[15px] font-normal leading-[1.7]">
            In the future, your agents scroll and trade for you.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-3">
            <div className="flex gap-4">
              <button
                onClick={() => setShowInstallCode(!showInstallCode)}
                className="px-8 py-[14px] bg-[var(--text-primary)] hover:opacity-90 transition-opacity"
              >
                <span className="font-jetbrains text-[var(--bg-primary)] text-xs font-bold">Install</span>
              </button>
              <SmoothScrollLink targetId="see-the-difference" className="px-8 py-[14px] bg-[var(--overlay-light)] border border-[var(--border-lighter)] hover:bg-[var(--overlay-lighter)] transition-colors">
                <span className="font-jetbrains text-[var(--text-primary)] text-xs font-bold">See Demo</span>
              </SmoothScrollLink>
            </div>
            <span className="font-jetbrains text-[var(--text-tertiary)] text-[11px] font-normal">
              Free • No Rate Limits • REST API + Agent SDK
            </span>
          </div>
        </div>

        {/* Hero Figure - Musashi Image / Install Code */}
        <InstallCodeReveal showCode={showInstallCode} />
      </section>

      {/* Terminal Demo Section */}
      <div id="see-the-difference">
        <TerminalDemo />
      </div>

      {/* Advanced Features Section */}
      <section className="flex flex-col items-center gap-12 w-full px-[120px] py-[80px] bg-[var(--bg-primary)]">
        <h2 className="font-grotesk text-[var(--text-primary)] text-[42px] font-bold tracking-[-1px] text-center">
          Built for Trading Bots
        </h2>

        <div className="grid grid-cols-2 gap-8 w-full max-w-[1100px]">
          {/* Feed System */}
          <div className="flex flex-col gap-6 p-10 bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 fill-[#00FF88]" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8l-5-5zM5 19V5h10v4h4v10H5z"/>
              </svg>
              <h3 className="font-grotesk text-[var(--text-primary)] text-xl font-semibold">
                Automated Feed System
              </h3>
            </div>
            <p className="font-jetbrains text-[var(--text-secondary)] text-sm leading-[1.8]">
              Monitors 71 high-signal Twitter accounts across 8 categories (crypto, politics, economics, tech, sports, geopolitics, finance, breaking news). Automatically collects, analyzes, and matches tweets to markets every 2 minutes.
            </p>
            <div className="flex flex-col gap-2">
              <span className="font-jetbrains text-[var(--text-tertiary)] text-xs">Categories tracked:</span>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-[var(--overlay-lighter)] border border-[var(--border-primary)] font-jetbrains text-[10px] text-[var(--text-secondary)]">CRYPTO</span>
                <span className="px-2 py-1 bg-[var(--overlay-lighter)] border border-[var(--border-primary)] font-jetbrains text-[10px] text-[var(--text-secondary)]">POLITICS</span>
                <span className="px-2 py-1 bg-[var(--overlay-lighter)] border border-[var(--border-primary)] font-jetbrains text-[10px] text-[var(--text-secondary)]">ECONOMICS</span>
                <span className="px-2 py-1 bg-[var(--overlay-lighter)] border border-[var(--border-primary)] font-jetbrains text-[10px] text-[var(--text-secondary)]">TECH</span>
                <span className="px-2 py-1 bg-[var(--overlay-lighter)] border border-[var(--border-primary)] font-jetbrains text-[10px] text-[var(--text-secondary)]">SPORTS</span>
                <span className="px-2 py-1 bg-[var(--overlay-lighter)] border border-[var(--border-primary)] font-jetbrains text-[10px] text-[var(--text-secondary)]">GEOPOLITICS</span>
                <span className="px-2 py-1 bg-[var(--overlay-lighter)] border border-[var(--border-primary)] font-jetbrains text-[10px] text-[var(--text-secondary)]">FINANCE</span>
                <span className="px-2 py-1 bg-[var(--overlay-lighter)} border border-[var(--border-primary)] font-jetbrains text-[10px] text-[var(--text-secondary)]">BREAKING NEWS</span>
              </div>
            </div>
          </div>

          {/* Sentiment & Signals */}
          <div className="flex flex-col gap-6 p-10 bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 fill-[#00FF88]" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
              </svg>
              <h3 className="font-grotesk text-[var(--text-primary)] text-xl font-semibold">
                Trading Signals
              </h3>
            </div>
            <p className="font-jetbrains text-[var(--text-secondary)] text-sm leading-[1.8]">
              AI-powered sentiment analysis classifies each tweet as bullish, bearish, or neutral. Generates trading signals with direction (YES/NO/HOLD), confidence scores, edge calculation, and urgency levels (critical/high/medium/low).
            </p>
            <div className="flex items-center gap-4">
              <div className="flex flex-col gap-1">
                <span className="font-jetbrains text-[#00FF88] text-xs font-bold">BULLISH</span>
                <span className="font-jetbrains text-[var(--text-tertiary)] text-[10px]">Long signal</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-jetbrains text-[#FF4444] text-xs font-bold">BEARISH</span>
                <span className="font-jetbrains text-[var(--text-tertiary)] text-[10px]">Short signal</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-jetbrains text-[#9CA3AF] text-xs font-bold">NEUTRAL</span>
                <span className="font-jetbrains text-[var(--text-tertiary)] text-[10px]">Hold position</span>
              </div>
            </div>
          </div>

          {/* Arbitrage Detection */}
          <div className="flex flex-col gap-6 p-10 bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 fill-[#00FF88]" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 10l5 5 5-5z"/>
              </svg>
              <h3 className="font-grotesk text-[var(--text-primary)] text-xl font-semibold">
                Arbitrage Detection
              </h3>
            </div>
            <p className="font-jetbrains text-[var(--text-secondary)] text-sm leading-[1.8]">
              Cross-platform price discrepancy detection between Polymarket and Kalshi. Identifies opportunities where the same event has different odds on different platforms. Filter by minimum spread, confidence, and category.
            </p>
            <div className="flex items-center gap-2 p-3 bg-[var(--overlay-lighter)] border border-[var(--border-primary)]">
              <span className="font-jetbrains text-[var(--text-secondary)] text-xs">Example: Polymarket 63% → Kalshi 70% = </span>
              <span className="font-jetbrains text-[#00FF88] text-xs font-bold">7% spread</span>
            </div>
          </div>

          {/* Market Movers */}
          <div className="flex flex-col gap-6 p-10 bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 fill-[#00FF88]" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 13h2v8H3v-8zm4-8h2v16H7V5zm4 4h2v12h-2V9zm4-4h2v16h-2V5zm4 7h2v9h-2v-9z"/>
              </svg>
              <h3 className="font-grotesk text-[var(--text-primary)] text-xl font-semibold">
                Market Movers
              </h3>
            </div>
            <p className="font-jetbrains text-[var(--text-secondary)] text-sm leading-[1.8]">
              Tracks markets with significant price changes using 7-day price history stored in Vercel KV. Detects movements &gt;5% in 1h or 24h windows. Real-time CLOB API polling updates top 50 markets every 60 seconds.
            </p>
            <div className="flex items-center gap-4">
              <div className="px-3 py-2 bg-[var(--overlay-lighter)] border border-[var(--border-primary)]">
                <span className="font-jetbrains text-[var(--text-tertiary)] text-[10px]">1H CHANGE</span>
                <span className="font-jetbrains text-[#00FF88] text-sm font-bold ml-2">+12%</span>
              </div>
              <div className="px-3 py-2 bg-[var(--overlay-lighter)] border border-[var(--border-primary)]">
                <span className="font-jetbrains text-[var(--text-tertiary)] text-[10px]">24H CHANGE</span>
                <span className="font-jetbrains text-[#FF4444] text-sm font-bold ml-2">-8%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <FAQ />

      {/* Final CTA Section */}
      <section className="flex w-full px-[120px] py-[120px] bg-[var(--bg-primary)] border border-[var(--border-primary)] min-h-[500px]">
        <div className="flex flex-col items-center justify-center gap-10 w-full mx-auto">
          <h2 className="font-grotesk text-[var(--text-primary)] text-[72px] font-bold tracking-[-2px] text-center leading-[1.1]">
            Built for AI agents
          </h2>

          <a href="/ai" className="px-12 py-5 bg-[var(--text-primary)] hover:opacity-90 transition-opacity mx-auto">
            <span className="font-jetbrains text-[var(--bg-primary)] text-sm font-bold">START BUILDING — FREE</span>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="flex flex-col gap-6 w-full px-[120px] py-12 bg-[var(--bg-secondary)] border-t border-[var(--border-primary)]">
        <div className="flex items-start justify-between w-full">
          <div className="flex flex-col gap-3">
            <span className="font-jetbrains text-[var(--text-primary)] text-base font-semibold tracking-[1px]">
              MUSASHI
            </span>
            <span className="font-jetbrains text-[var(--text-tertiary)] text-xs font-normal max-w-[400px] leading-relaxed">
              AI intelligence service for trading bots. Automated feed API with sentiment analysis and trading signals. Chrome extension for monitoring.
            </span>
          </div>

          <div className="flex gap-16">
            <div className="flex flex-col gap-3">
              <span className="font-jetbrains text-[var(--text-muted)] text-[10px] font-bold tracking-[1.5px] uppercase">
                Product
              </span>
              <nav className="flex flex-col gap-2">
                <a href="/ai" className="font-jetbrains text-[var(--text-secondary)] text-xs font-medium hover:text-[var(--text-primary)] transition-colors">API Docs</a>
                <a href="/pricing" className="font-jetbrains text-[var(--text-secondary)] text-xs font-medium hover:text-[var(--text-primary)] transition-colors">Pricing</a>
                <a href="/privacy" className="font-jetbrains text-[var(--text-secondary)] text-xs font-medium hover:text-[var(--text-primary)] transition-colors">Privacy</a>
              </nav>
            </div>

            <div className="flex flex-col gap-3">
              <span className="font-jetbrains text-[var(--text-muted)] text-[10px] font-bold tracking-[1.5px] uppercase">
                Community
              </span>
              <nav className="flex flex-col gap-2">
                <a href="https://twitter.com/musashimarket" target="_blank" rel="noopener noreferrer" className="font-jetbrains text-[var(--text-secondary)] text-xs font-medium hover:text-[var(--text-primary)] transition-colors">Twitter</a>
                <a href="https://github.com/VittorioC13/musashi-bot" target="_blank" rel="noopener noreferrer" className="font-jetbrains text-[var(--text-secondary)] text-xs font-medium hover:text-[var(--text-primary)] transition-colors">GitHub</a>
              </nav>
            </div>
          </div>
        </div>

        <div className="w-full h-[1px] bg-[var(--border-primary)]" />

        <div className="flex items-center justify-between w-full">
          <span className="font-jetbrains text-[var(--text-tertiary)] text-[11px] font-normal">
            © {new Date().getFullYear()} Musashi
          </span>
          <span className="font-jetbrains text-[var(--text-tertiary)] text-[11px] font-normal">
            Built for agents. Powered by prediction markets.
          </span>
        </div>
      </footer>
    </div>
  );
}
