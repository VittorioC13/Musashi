import React from 'react';
import { Market } from '../types/market';

interface TwitterNativeCardProps {
  market: Market;
  confidence: number;
}

const TwitterNativeCard: React.FC<TwitterNativeCardProps> = ({ market, confidence }) => {
  const yesPercent = Math.round(market.yesPrice * 100);
  const noPercent = Math.round(market.noPrice * 100);
  const isYesWinning = market.yesPrice > 0.5;

  return (
    <a
      href={`${market.url}?ref=musashi`}
      target="_blank"
      rel="noopener noreferrer"
      className="twitter-native-card"
      onClick={(e) => {
        e.stopPropagation();
        console.log('[Musashi] User clicked market card:', market.title);
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-normal">Prediction Market</span>
          <span className="text-xs text-gray-400">•</span>
          <span className="text-xs text-gray-500 font-normal">Kalshi</span>
        </div>
        <span className="text-xs text-gray-400">{Math.round(confidence * 100)}% match</span>
      </div>

      {/* Market Title */}
      <h3 className="text-sm font-normal text-gray-900 leading-snug mb-3">
        {market.title}
      </h3>

      {/* Odds Display - Twitter style */}
      <div className="flex items-center gap-4">
        {/* YES */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 uppercase tracking-wide">Yes</span>
          <span className={`text-lg font-semibold ${isYesWinning ? 'text-green-600' : 'text-gray-700'}`}>
            {yesPercent}%
          </span>
          {isYesWinning && (
            <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
            </svg>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200"></div>

        {/* NO */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 uppercase tracking-wide">No</span>
          <span className={`text-lg font-semibold ${!isYesWinning ? 'text-red-600' : 'text-gray-700'}`}>
            {noPercent}%
          </span>
          {!isYesWinning && (
            <svg className="w-3.5 h-3.5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>
      </div>
    </a>
  );
};

export default TwitterNativeCard;
