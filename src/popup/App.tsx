import React from 'react';

const App: React.FC = () => {
  return (
    <div className="p-4 bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-predbot-purple rounded-lg flex items-center justify-center text-white font-bold">
          P
        </div>
        <h1 className="text-xl font-bold text-gray-800">PredBot</h1>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Prediction market odds overlay for Twitter/X
      </p>

      <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Status</span>
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
            Active
          </span>
        </div>
        <p className="text-xs text-gray-500">
          Browse Twitter/X to see prediction markets
        </p>
      </div>

      <div className="mt-4 text-xs text-center text-gray-400">
        v1.0.0 • MVP
      </div>
    </div>
  );
};

export default App;
