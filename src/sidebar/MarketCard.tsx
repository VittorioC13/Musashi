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
  const confidencePercent = Math.round(confidence * 100);

  return (
    <div className="glass-card rounded-xl p-5 group">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 pr-2">
          <h3 className="text-sm font-semibold text-gray-900 leading-tight line-clamp-2 mb-1">
            {market.title}
          </h3>
        </div>
        {/* Kalshi Badge */}
        <div className="flex-shrink-0">
          <span className="inline-block px-2.5 py-1 text-xs font-semibold bg-musashi-blue/10 text-musashi-blue rounded-lg border border-musashi-blue/20">
            Kalshi
          </span>
        </div>
      </div>

      {/* Confidence Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-gray-700">
            {confidenceLabel}
          </span>
          <span className="text-xs font-bold text-musashi-blue">
            {confidencePercent}%
          </span>
        </div>
        <div className="confidence-bar-container">
          <div
            className="confidence-bar-fill"
            style={{ width: `${confidencePercent}%` }}
          />
        </div>
      </div>

      {/* YES/NO Prices - more spacing */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        {/* YES Box */}
        <div className="relative backdrop-blur-sm bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-center group-hover:bg-green-500/15 transition-all">
          <div className="text-xs text-green-600 font-semibold mb-1">YES</div>
          <div className="text-2xl font-bold text-green-700">{yesPercent}%</div>
        </div>
        {/* NO Box */}
        <div className="relative backdrop-blur-sm bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-center group-hover:bg-red-500/15 transition-all">
          <div className="text-xs text-red-600 font-semibold mb-1">NO</div>
          <div className="text-2xl font-bold text-red-700">{noPercent}%</div>
        </div>
      </div>

      {/* Volume and Keywords */}
      <div className="space-y-2 mb-4">
        {/* Volume */}
        <div className="text-xs text-gray-600">
          <span className="font-medium">24h Volume:</span>{' '}
          <span className="font-semibold text-gray-800">{volumeFormatted}</span>
        </div>

        {/* Keywords */}
        {matchedKeywords.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {matchedKeywords.slice(0, 6).map((keyword, idx) => (
              <span
                key={idx}
                className="inline-block px-2 py-0.5 text-xs bg-white/60 backdrop-blur-sm text-gray-700 rounded-md border border-gray-200"
              >
                {keyword}
              </span>
            ))}
            {matchedKeywords.length > 6 && (
              <span className="inline-block px-2 py-0.5 text-xs bg-white/60 backdrop-blur-sm text-gray-500 rounded-md border border-gray-200">
                +{matchedKeywords.length - 6} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Trade Button */}
      <a
        href={`${market.url}?ref=musashi`}
        target="_blank"
        rel="noopener noreferrer"
        className="glass-button block w-full text-white text-sm font-semibold py-3 px-4 rounded-xl text-center"
        onClick={(e) => {
          e.stopPropagation();
          console.log('[Musashi] User clicked trade button for:', market.title);
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
