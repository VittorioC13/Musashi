import React from 'react';
import { Market } from '../types/market';

interface MarketCardProps {
  market: Market;
  confidence: number;
  matchedKeywords: string[];
}

const MarketCard: React.FC<MarketCardProps> = ({ market, confidence, matchedKeywords }) => {
  const yesPercent = Math.round(market.yesPrice * 100);
  const noPercent = Math.round(market.noPrice * 100);
  const volumeFormatted = formatVolume(market.volume24h);

  const confidenceLabel = confidence >= 0.7 ? 'Strong Match' : 'Related';
  const confidenceBg = confidence >= 0.7 ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700';

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow mb-3">
      {/* Header with platform logo */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 pr-2">
          <h3 className="text-sm font-semibold text-gray-900 leading-tight line-clamp-2">
            {market.title}
          </h3>
        </div>
        <div className="flex-shrink-0">
          <span className="inline-block px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded">
            Kalshi
          </span>
        </div>
      </div>

      {/* Confidence badge */}
      <div className="mb-3">
        <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${confidenceBg}`}>
          {confidenceLabel} ({Math.round(confidence * 100)}%)
        </span>
      </div>

      {/* Prices */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-green-50 rounded-lg p-2 text-center">
          <div className="text-xs text-green-600 font-medium mb-1">YES</div>
          <div className="text-2xl font-bold text-green-700">{yesPercent}%</div>
        </div>
        <div className="bg-red-50 rounded-lg p-2 text-center">
          <div className="text-xs text-red-600 font-medium mb-1">NO</div>
          <div className="text-2xl font-bold text-red-700">{noPercent}%</div>
        </div>
      </div>

      {/* Volume */}
      <div className="mb-3 text-xs text-gray-500 text-center">
        24h Volume: {volumeFormatted}
      </div>

      {/* Matched keywords */}
      {matchedKeywords.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1">
          {matchedKeywords.slice(0, 4).map((keyword, idx) => (
            <span
              key={idx}
              className="inline-block px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
            >
              {keyword}
            </span>
          ))}
          {matchedKeywords.length > 4 && (
            <span className="inline-block px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
              +{matchedKeywords.length - 4} more
            </span>
          )}
        </div>
      )}

      {/* Trade button */}
      <a
        href={`${market.url}?ref=predbot`}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full bg-predbot-purple hover:bg-purple-700 text-white text-sm font-medium py-2 px-4 rounded-lg text-center transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          console.log('[PredBot] User clicked trade button for:', market.title);
        }}
      >
        Trade on Kalshi →
      </a>
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

export default MarketCard;
