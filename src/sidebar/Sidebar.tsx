import React, { useState } from 'react';
import MarketCard from './MarketCard';
import { MarketMatch } from '../types/market';

interface SidebarProps {
  matches: MarketMatch[];
  isLoading?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ matches, isLoading = false }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

  // Collapsed state - just a strip
  if (!isExpanded) {
    return (
      <div
        className="fixed top-20 right-0 w-10 bg-predbot-purple text-white shadow-lg rounded-l-lg cursor-pointer hover:bg-purple-700 transition-colors z-[9999]"
        onClick={toggleSidebar}
        style={{ height: '120px' }}
      >
        <div className="flex flex-col items-center justify-center h-full">
          <div className="transform -rotate-90 whitespace-nowrap text-sm font-semibold">
            PredBot
          </div>
          {matches.length > 0 && (
            <div className="absolute top-2 right-2 w-6 h-6 bg-white text-predbot-purple rounded-full flex items-center justify-center text-xs font-bold">
              {matches.length}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Expanded state - full sidebar
  return (
    <div
      className="fixed top-20 right-0 w-80 bg-gray-50 shadow-2xl rounded-l-xl overflow-hidden z-[9999]"
      style={{ maxHeight: 'calc(100vh - 100px)' }}
    >
      {/* Header */}
      <div className="bg-predbot-purple text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white text-predbot-purple rounded-lg flex items-center justify-center font-bold text-lg">
            P
          </div>
          <div>
            <h2 className="font-bold text-lg">PredBot</h2>
            <p className="text-xs text-purple-200">Prediction Markets</p>
          </div>
        </div>
        <button
          onClick={toggleSidebar}
          className="text-white hover:bg-purple-700 rounded p-1 transition-colors"
          title="Collapse"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="overflow-y-auto p-4" style={{ maxHeight: 'calc(100vh - 180px)' }}>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-pulse">
              <div className="w-12 h-12 bg-predbot-purple rounded-full flex items-center justify-center text-white font-bold text-xl mb-3">
                P
              </div>
            </div>
            <p className="text-sm text-gray-600">Analyzing tweets...</p>
          </div>
        ) : matches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-gray-400 mb-4">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-sm text-gray-700 font-medium mb-1">No markets found</p>
            <p className="text-xs text-gray-500 px-4">
              Scroll through tweets about politics, crypto, economics, or sports to see prediction markets
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 pb-3 border-b border-gray-200">
              <p className="text-xs text-gray-600">
                Found <span className="font-semibold text-predbot-purple">{matches.length}</span>{' '}
                {matches.length === 1 ? 'market' : 'markets'} matching your timeline
              </p>
            </div>

            {matches.map((match) => (
              <MarketCard
                key={match.market.id}
                market={match.market}
                confidence={match.confidence}
                matchedKeywords={match.matchedKeywords}
              />
            ))}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 p-3 text-center">
        <p className="text-xs text-gray-500">
          Powered by{' '}
          <a
            href="https://kalshi.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-predbot-purple hover:underline font-medium"
          >
            Kalshi
          </a>
        </p>
      </div>
    </div>
  );
};

export default Sidebar;
