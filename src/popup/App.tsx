import React from 'react';

const App: React.FC = () => {
  return (
    <div className="w-80 min-h-[240px] bg-gradient-to-br from-white to-gray-50 p-6">
      {/* Header with Gradient Icon */}
      <div className="flex flex-col items-center mb-6">
        <div className="w-16 h-16 bg-musashi-blue rounded-2xl flex items-center justify-center text-white font-semibold text-2xl mb-4">
          M
        </div>
        <h1 className="text-xl font-bold text-gray-800">Musashi Markets</h1>
        <p className="text-sm text-gray-600 text-center mt-1">
          Prediction odds on Twitter/X
        </p>
      </div>

      {/* Status Card */}
      <div className="glass-card rounded-xl p-5 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-700">Extension Status</span>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse-subtle"></div>
            <span className="text-xs font-medium text-green-600">Active</span>
          </div>
        </div>
        <p className="text-xs text-gray-600 leading-relaxed">
          Browse Twitter/X to discover prediction markets on politics, crypto, economics, and more
        </p>
      </div>

      {/* Quick Links */}
      <div className="space-y-2 mb-4">
        <a
          href="https://polymarket.com"
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center text-xs font-medium text-musashi-blue hover:text-musashi-blue-dark hover:underline transition-colors"
        >
          Visit Polymarket →
        </a>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-gray-500 pt-4 border-t border-gray-200">
        <p>v1.0.0 • Built with Claude Code</p>
      </div>
    </div>
  );
};

export default App;
