import React, { useState } from 'react';
import MarketCard from './MarketCard';
import { MarketMatch } from '../types/market';

interface FloatingBadgeProps {
  matches: MarketMatch[];
}

const FloatingBadge: React.FC<FloatingBadgeProps> = ({ matches }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // If no matches, don't show anything
  if (matches.length === 0) {
    return null;
  }

  return (
    <>
      {/* Collapsed Badge */}
      {!isExpanded && (
        <div
          onClick={toggleExpanded}
          className="fixed bottom-6 right-6 z-[10000] cursor-pointer group"
        >
          <div className="relative">
            {/* Main badge */}
            <div className="bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-full shadow-2xl px-5 py-3 flex items-center gap-3 hover:scale-105 transition-transform">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <span className="text-lg font-bold">P</span>
              </div>
              <div className="text-left">
                <div className="text-xs font-medium opacity-90">PredBot</div>
                <div className="text-sm font-bold">{matches.length} market{matches.length !== 1 ? 's' : ''}</div>
              </div>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </div>

            {/* Pulse animation */}
            <div className="absolute inset-0 bg-purple-600 rounded-full animate-ping opacity-20"></div>
          </div>
        </div>
      )}

      {/* Expanded Panel */}
      {isExpanded && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/20 z-[9998] backdrop-blur-sm"
            onClick={toggleExpanded}
          ></div>

          {/* Panel */}
          <div className="fixed bottom-0 right-0 w-full sm:w-96 h-[80vh] bg-white rounded-t-2xl sm:rounded-l-2xl sm:rounded-tr-none shadow-2xl z-[9999] flex flex-col animate-slideUp">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-4 flex items-center justify-between rounded-t-2xl sm:rounded-tl-2xl sm:rounded-tr-none">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <span className="text-xl font-bold">P</span>
                </div>
                <div>
                  <h2 className="font-bold text-lg">PredBot</h2>
                  <p className="text-xs text-purple-200">
                    {matches.length} market{matches.length !== 1 ? 's' : ''} found
                  </p>
                </div>
              </div>
              <button
                onClick={toggleExpanded}
                className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              {matches.map((match) => (
                <MarketCard
                  key={match.market.id}
                  market={match.market}
                  confidence={match.confidence}
                  matchedKeywords={match.matchedKeywords}
                />
              ))}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 p-3 bg-white text-center">
              <p className="text-xs text-gray-500">
                Powered by{' '}
                <a
                  href="https://kalshi.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-600 hover:underline font-medium"
                >
                  Kalshi
                </a>
              </p>
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default FloatingBadge;
