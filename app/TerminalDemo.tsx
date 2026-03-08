'use client';

import { useEffect, useState } from 'react';

export default function TerminalDemo() {
  const [visibleLinesLeft, setVisibleLinesLeft] = useState(0);
  const [visibleLinesRight, setVisibleLinesRight] = useState(0);

  // Left column has 10 lines
  const leftLines = 10;
  // Right column has 13 lines
  const rightLines = 13;

  useEffect(() => {
    // Show left column lines one by one
    const leftInterval = setInterval(() => {
      setVisibleLinesLeft((prev) => {
        if (prev >= leftLines) {
          clearInterval(leftInterval);
          return prev;
        }
        return prev + 1;
      });
    }, 300);

    // Show right column lines one by one (with slight delay)
    const rightInterval = setInterval(() => {
      setVisibleLinesRight((prev) => {
        if (prev >= rightLines) {
          clearInterval(rightInterval);
          return prev;
        }
        return prev + 1;
      });
    }, 300);

    return () => {
      clearInterval(leftInterval);
      clearInterval(rightInterval);
    };
  }, []);

  return (
    <section className="flex flex-col items-center gap-12 w-full px-[120px] py-[100px] bg-[var(--bg-primary)]">
      <div className="flex flex-col items-center gap-4 w-full">
        <span className="font-jetbrains text-[var(--text-lighter)] text-[11px] font-bold tracking-[2px]">
          // FOR AGENTS
        </span>
        <h2 className="font-grotesk text-[var(--text-primary)] text-[42px] font-bold tracking-[-1px] text-center">
          Stop Searching. Start Asking.
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-8 w-full max-w-[1400px]">
        {/* WITHOUT MUSASHI */}
        <div className="terminal-column flex flex-col gap-6 p-8 bg-[#111] border border-[#222] rounded-lg">
          <div className="flex items-center gap-3 pb-4 border-b border-[#222]">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
              <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
              <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
            </div>
            <div className="font-jetbrains text-[#ff5f56] text-lg font-bold uppercase tracking-[1px]">
              Without Musashi
            </div>
          </div>
          <div className="font-jetbrains text-[13px] leading-[1.8] space-y-2">
            <div className={`text-[#888] transition-opacity duration-300 ${visibleLinesLeft >= 1 ? 'opacity-100' : 'opacity-0'}`}>
              <span className="text-[#888]">$</span> <span className="text-[#4a9eff]">trading-agent</span> <span className="text-[#e0e0e0]">is running...</span>
            </div>
            <div className={`text-[#666] italic transition-opacity duration-300 ${visibleLinesLeft >= 2 ? 'opacity-100' : 'opacity-0'}`}>
              Fresh install. No Musashi. No connected agentware.
            </div>
            <div className={`text-[#e0e0e0] transition-opacity duration-300 ${visibleLinesLeft >= 3 ? 'opacity-100' : 'opacity-0'}`}>
              The agent does not know what it can reach.
            </div>
            <div className={`text-[#e0e0e0] transition-opacity duration-300 ${visibleLinesLeft >= 4 ? 'opacity-100' : 'opacity-0'}`}>
              No Twitter sentiment. No Kalshi. No Polymarket.
            </div>
            <div className={`text-[#e0e0e0] transition-opacity duration-300 ${visibleLinesLeft >= 5 ? 'opacity-100' : 'opacity-0'}`}>
              It behaves like a normal chat assistant.
            </div>
            <div className={`mt-5 transition-opacity duration-300 ${visibleLinesLeft >= 6 ? 'opacity-100' : 'opacity-0'}`}>
              <span className="text-[#888]">Human:</span> <span className="text-[#e0e0e0]">&quot;What&apos;s the sentiment on Bitcoin right now?&quot;</span>
            </div>
            <div className={`text-[#ff5f56] transition-opacity duration-300 ${visibleLinesLeft >= 7 ? 'opacity-100' : 'opacity-0'}`}>
              No map. No flow. No action.
            </div>
            <div className={`text-[#ff5f56] transition-opacity duration-300 ${visibleLinesLeft >= 8 ? 'opacity-100' : 'opacity-0'}`}>
              Just waiting for prompts it cannot turn into reality.
            </div>
            <div className={`mt-4 text-[#666] italic transition-opacity duration-300 ${visibleLinesLeft >= 9 ? 'opacity-100' : 'opacity-0'}`}>
              // expensive intelligence, trapped in a box
            </div>
            <div className={`mt-5 transition-opacity duration-300 ${visibleLinesLeft >= 10 ? 'opacity-100' : 'opacity-0'}`}>
              <span className="text-[#888]">Human:</span> <span className="text-[#e0e0e0]">&quot;So... it still does nothing.&quot;</span>
            </div>
          </div>
        </div>

        {/* WITH MUSASHI */}
        <div className="terminal-column flex flex-col gap-6 p-8 bg-[#111] border border-[#222] rounded-lg">
          <div className="flex items-center gap-3 pb-4 border-b border-[#222]">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
              <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
              <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
            </div>
            <div className="font-jetbrains text-[#27c93f] text-lg font-bold uppercase tracking-[1px]">
              With Musashi
            </div>
          </div>
          <div className="font-jetbrains text-[13px] leading-[1.8] space-y-2">
            <div className={`text-[#888] transition-opacity duration-300 ${visibleLinesRight >= 1 ? 'opacity-100' : 'opacity-0'}`}>
              <span className="text-[#888]">$</span> <span className="text-[#4a9eff]">npm run agent</span>
            </div>
            <div className={`text-[#666] italic transition-opacity duration-300 ${visibleLinesRight >= 2 ? 'opacity-100' : 'opacity-0'}`}>
              // Launches terminal dashboard with 6 panels
            </div>

            {/* Terminal UI Mockup */}
            <div className={`mt-3 bg-[#0a0a0a] border border-[#27c93f]/30 rounded p-3 text-[10px] leading-relaxed transition-opacity duration-300 ${visibleLinesRight >= 3 ? 'opacity-100' : 'opacity-0'}`}>
              <div className="grid grid-cols-2 gap-3">
                {/* Feed Panel */}
                <div className="border border-[#4a9eff]/30 p-2 rounded bg-[#0a0a0a]">
                  <div className="text-[#4a9eff] font-bold mb-1 text-[10px]">FEED</div>
                  <div className="text-[#888] text-[9px] leading-relaxed">@Reuters • 2m</div>
                  <div className="text-[#e0e0e0] text-[9px] leading-relaxed">Trump ends...</div>
                  <div className="text-[#ffbd2e] text-[9px] leading-relaxed">• HIGH • 95%</div>
                </div>

                {/* Arbitrage Panel */}
                <div className="border border-[#ffbd2e]/30 p-2 rounded bg-[#0a0a0a]">
                  <div className="text-[#ffbd2e] font-bold mb-1 text-[10px]">ARBITRAGE</div>
                  <div className="text-[#e0e0e0] text-[9px] leading-relaxed">Bitcoin Up/Down</div>
                  <div className="flex gap-2 text-[9px] leading-relaxed">
                    <span className="text-[#27c93f]">YES 37%</span>
                    <span className="text-[#ff5f56]">NO 64%</span>
                  </div>
                  <div className="text-[#ffbd2e] text-[9px] leading-relaxed">Spread: 5.2%</div>
                </div>

                {/* Movers Panel */}
                <div className="border border-[#ff5f56]/30 p-2 rounded bg-[#0a0a0a]">
                  <div className="text-[#ff5f56] font-bold mb-1 text-[10px]">MOVERS</div>
                  <div className="text-[#27c93f] text-[9px] leading-relaxed">↑ Iran Ceasefire</div>
                  <div className="text-[#27c93f] text-[9px] leading-relaxed">+12.3% (55→67%)</div>
                </div>

                {/* Stats Panel */}
                <div className="border border-[#888]/30 p-2 rounded bg-[#0a0a0a]">
                  <div className="text-[#888] font-bold mb-1 text-[10px]">STATS</div>
                  <div className="text-[#e0e0e0] text-[9px] leading-relaxed">Tweets: 124</div>
                  <div className="text-[#e0e0e0] text-[9px] leading-relaxed">Politics: 45</div>
                </div>
              </div>

              {/* Logs */}
              <div className="border border-[#27c93f]/30 p-2 rounded mt-3 bg-[#0a0a0a]">
                <div className="text-[#27c93f] font-bold mb-1 text-[10px]">LOGS</div>
                <div className="text-[#27c93f] text-[9px] leading-relaxed">[15:23:45] ✓ Updated: 3 new</div>
                <div className="text-[#ffbd2e] text-[9px] leading-relaxed">[15:23:40] ⚠ Arb: 5.2%</div>
              </div>
            </div>
            <div className={`mt-3 text-[#666] italic transition-opacity duration-300 ${visibleLinesRight >= 4 ? 'opacity-100' : 'opacity-0'}`}>
              // Real-time data visualization, not JSON
            </div>
            <div className={`mt-2 text-[#27c93f] transition-opacity duration-300 ${visibleLinesRight >= 5 ? 'opacity-100' : 'opacity-0'}`}>
              Polling every 5s. Parallel fetch (300ms).
            </div>
            <div className={`mt-2 text-[#e0e0e0] transition-opacity duration-300 ${visibleLinesRight >= 6 ? 'opacity-100' : 'opacity-0'}`}>
              → 10 tweets analyzed
            </div>
            <div className={`text-[#e0e0e0] transition-opacity duration-300 ${visibleLinesRight >= 7 ? 'opacity-100' : 'opacity-0'}`}>
              → 2 arbitrage opportunities found
            </div>
            <div className={`text-[#e0e0e0] transition-opacity duration-300 ${visibleLinesRight >= 8 ? 'opacity-100' : 'opacity-0'}`}>
              → 4 markets moving significantly
            </div>
            <div className={`mt-3 text-[#666] italic transition-opacity duration-300 ${visibleLinesRight >= 9 ? 'opacity-100' : 'opacity-0'}`}>
              // Agent monitors dashboard, executes autonomously
            </div>
            <div className={`mt-3 text-[#e0e0e0] transition-opacity duration-300 ${visibleLinesRight >= 10 ? 'opacity-100' : 'opacity-0'}`}>
              No prompts. No chat. Pure data.
            </div>
            <div className={`mt-2 text-[#27c93f] transition-opacity duration-300 ${visibleLinesRight >= 11 ? 'opacity-100' : 'opacity-0'}`}>
              → PolyDepth-style YES/NO splits
            </div>
            <div className={`mt-2 text-[#27c93f] transition-opacity duration-300 ${visibleLinesRight >= 12 ? 'opacity-100' : 'opacity-0'}`}>
              → Color-coded urgency levels
            </div>
            <div className={`mt-4 transition-opacity duration-300 ${visibleLinesRight >= 13 ? 'opacity-100' : 'opacity-0'}`}>
              <span className="text-[#888]">Agent:</span> <span className="text-[#27c93f]">*executes trade on 5.2% spread*</span>
            </div>
            <div className={`mt-5 transition-opacity duration-300 ${visibleLinesRight >= 12 ? 'opacity-100' : 'opacity-0'}`}>
              <span className="text-[#888]">Agent:</span> <span className="text-[#e0e0e0]">*executes trade on Kalshi*</span>
            </div>
            <div className={`text-[#27c93f] transition-opacity duration-300 ${visibleLinesRight >= 13 ? 'opacity-100' : 'opacity-0'}`}>
              Position opened. Edge captured. Moving to next signal.
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-8 w-full max-w-[1000px] mt-12">
        <div className="flex flex-col items-center gap-3 p-8 bg-[#111] border border-[#222] rounded-lg">
          <div className="font-grotesk text-[#4a9eff] text-[48px] font-bold tracking-[-1px]">
            659
          </div>
          <div className="font-jetbrains text-[#888] text-xs uppercase tracking-[1px]">
            Markets Live
          </div>
        </div>
        <div className="flex flex-col items-center gap-3 p-8 bg-[#111] border border-[#222] rounded-lg">
          <div className="font-grotesk text-[#4a9eff] text-[48px] font-bold tracking-[-1px]">
            7
          </div>
          <div className="font-jetbrains text-[#888] text-xs uppercase tracking-[1px]">
            API Endpoints
          </div>
        </div>
        <div className="flex flex-col items-center gap-3 p-8 bg-[#111] border border-[#222] rounded-lg">
          <div className="font-grotesk text-[#4a9eff] text-[48px] font-bold tracking-[-1px]">
            71
          </div>
          <div className="font-jetbrains text-[#888] text-xs uppercase tracking-[1px]">
            Twitter Accounts
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
}
