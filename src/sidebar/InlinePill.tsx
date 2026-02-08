import React, { useState } from 'react';
import { Market } from '../types/market';

interface InlinePillProps {
  market: Market;
  confidence: number;
}

const InlinePill: React.FC<InlinePillProps> = ({ market, confidence }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const yesPercent = Math.round(market.yesPrice * 100);
  const noPercent = Math.round(market.noPrice * 100);

  // Determine if YES is more likely (for trend arrow)
  const isYesWinning = market.yesPrice > 0.5;
  const volumeFormatted = formatVolume(market.volume24h);

  // Compact pill (like OKX)
  if (!isExpanded) {
    return (
      <span
        onClick={(e) => {
          e.stopPropagation();
          setIsExpanded(true);
        }}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-900 text-white rounded-full text-xs font-medium cursor-pointer hover:bg-gray-800 transition-colors mx-1"
        style={{ verticalAlign: 'middle' }}
      >
        {/* Icon */}
        <span className="flex items-center justify-center w-4 h-4 bg-purple-600 rounded-full text-[10px] font-bold">
          P
        </span>

        {/* Market short name */}
        <span className="font-semibold max-w-[120px] truncate">
          {getShortMarketName(market.title)}
        </span>

        {/* YES price */}
        <span className={isYesWinning ? 'text-green-400' : 'text-gray-400'}>
          {yesPercent}%
        </span>

        {/* Trend arrow */}
        <svg
          className={`w-3 h-3 ${isYesWinning ? 'text-green-400' : 'text-red-400'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isYesWinning ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7 7 7" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7-7-7" />
          )}
        </svg>
      </span>
    );
  }

  // Expanded card (click to see details)
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-[9999] backdrop-blur-sm"
        onClick={(e) => {
          e.stopPropagation();
          setIsExpanded(false);
        }}
      />

      {/* Expanded card */}
      <div
        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[10000] w-[90%] max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white rounded-2xl shadow-2xl p-5 animate-scaleIn">
          {/* Close button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(false);
            }}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Header */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                P
              </div>
              <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                {Math.round(confidence * 100)}% match
              </span>
            </div>
            <h3 className="text-base font-bold text-gray-900 leading-tight">
              {market.title}
            </h3>
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
              {market.description}
            </p>
          </div>

          {/* Prices */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-3 border border-green-200">
              <div className="text-xs font-medium text-green-600 mb-1">YES</div>
              <div className="text-3xl font-bold text-green-700">{yesPercent}%</div>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-3 border border-red-200">
              <div className="text-xs font-medium text-red-600 mb-1">NO</div>
              <div className="text-3xl font-bold text-red-700">{noPercent}%</div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between mb-4 text-xs text-gray-500">
            <span>24h Volume: <span className="font-semibold text-gray-700">{volumeFormatted}</span></span>
            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">Kalshi</span>
          </div>

          {/* Trade button */}
          <a
            href={`${market.url}?ref=predbot`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.stopPropagation();
              console.log('[PredBot] User clicked trade:', market.title);
            }}
            className="block w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white text-sm font-semibold py-3 px-4 rounded-xl text-center transition-all transform hover:scale-[1.02]"
          >
            Trade on Kalshi →
          </a>
        </div>
      </div>

      <style>{`
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-scaleIn {
          animation: scaleIn 0.2s ease-out;
        }
      `}</style>
    </>
  );
};

function getShortMarketName(title: string): string {
  // Extract key terms for compact display
  if (title.includes('Bitcoin')) return 'Bitcoin';
  if (title.includes('Ethereum')) return 'Ethereum';
  if (title.includes('Fed')) return 'Fed Rate';
  if (title.includes('Trump')) return 'Trump 2024';
  if (title.includes('Biden')) return 'Biden';
  if (title.includes('inflation')) return 'Inflation';
  if (title.includes('unemployment')) return 'Unemployment';
  if (title.includes('recession')) return 'Recession';
  if (title.includes('Apple')) return 'AAPL';
  if (title.includes('NVIDIA')) return 'NVDA';
  if (title.includes('Chiefs')) return 'Chiefs SB';
  if (title.includes('Celtics')) return 'Celtics';

  // Default: take first 2-3 words
  const words = title.split(' ');
  return words.slice(0, 2).join(' ');
}

function formatVolume(volume: number): string {
  if (volume >= 1000000) {
    return `$${(volume / 1000000).toFixed(1)}M`;
  } else if (volume >= 1000) {
    return `$${(volume / 1000).toFixed(0)}K`;
  } else {
    return `$${volume}`;
  }
}

export default InlinePill;
