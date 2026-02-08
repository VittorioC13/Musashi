import React, { useState } from 'react';
import { Market } from '../types/market';

interface InlineMarketCardProps {
  market: Market;
  confidence: number;
}

const InlineMarketCard: React.FC<InlineMarketCardProps> = ({ market, confidence }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const yesPercent = Math.round(market.yesPrice * 100);
  const noPercent = Math.round(market.noPrice * 100);
  const volumeFormatted = formatVolume(market.volume24h);

  // Collapsed state - single line
  if (!isExpanded) {
    return (
      <div
        className="inline-market-card-compact"
        onClick={() => setIsExpanded(true)}
        onMouseEnter={() => setIsExpanded(true)}
      >
        <div className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl hover:border-purple-400 transition-all cursor-pointer">
          {/* Icon */}
          <div className="flex-shrink-0 w-6 h-6 bg-predbot-purple rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">P</span>
          </div>

          {/* Market title (truncated) */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">
              {market.title}
            </p>
          </div>

          {/* Quick prices */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-green-600">
              YES {yesPercent}%
            </span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs font-semibold text-red-600">
              NO {noPercent}%
            </span>
          </div>

          {/* Kalshi badge */}
          <div className="flex-shrink-0">
            <span className="text-xs font-medium text-purple-700 bg-purple-100 px-2 py-1 rounded-full">
              Kalshi
            </span>
          </div>

          {/* Arrow */}
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    );
  }

  // Expanded state - shows more details
  return (
    <div
      className="inline-market-card-expanded"
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className="bg-white border border-purple-300 rounded-xl shadow-lg p-4 transition-all">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 pr-2">
            <h3 className="text-sm font-semibold text-gray-900 leading-tight mb-1">
              {market.title}
            </h3>
            <p className="text-xs text-gray-500 line-clamp-2">
              {market.description}
            </p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(false);
            }}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Prices */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-green-50 rounded-lg p-2.5 text-center border border-green-200">
            <div className="text-xs text-green-600 font-medium mb-0.5">YES</div>
            <div className="text-xl font-bold text-green-700">{yesPercent}%</div>
          </div>
          <div className="bg-red-50 rounded-lg p-2.5 text-center border border-red-200">
            <div className="text-xs text-red-600 font-medium mb-0.5">NO</div>
            <div className="text-xl font-bold text-red-700">{noPercent}%</div>
          </div>
        </div>

        {/* Footer with volume and trade button */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span>Vol: {volumeFormatted}</span>
            <span>•</span>
            <span className="text-purple-600 font-medium">{Math.round(confidence * 100)}% match</span>
          </div>
          <a
            href={`${market.url}?ref=predbot`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.stopPropagation();
              console.log('[PredBot] User clicked trade:', market.title);
            }}
            className="text-xs font-semibold text-white bg-predbot-purple hover:bg-purple-700 px-3 py-1.5 rounded-lg transition-colors"
          >
            Trade →
          </a>
        </div>
      </div>
    </div>
  );
};

function formatVolume(volume: number): string {
  if (volume >= 1000000) {
    return `$${(volume / 1000000).toFixed(1)}M`;
  } else if (volume >= 1000) {
    return `$${(volume / 1000).toFixed(0)}K`;
  } else {
    return `$${volume}`;
  }
}

export default InlineMarketCard;
