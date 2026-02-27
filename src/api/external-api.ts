/**
 * External API for AI Agents
 *
 * This module enables AI agents and external applications to access Musashi analysis data
 * via Chrome Extension messaging API.
 *
 * USAGE FOR AI AGENTS:
 *
 * 1. Install Musashi Chrome Extension
 * 2. Get the extension ID from chrome://extensions
 * 3. Use chrome.runtime.sendMessage() to query data
 *
 * Example (from a web page with Musashi extension installed):
 *
 * ```javascript
 * const MUSASHI_EXTENSION_ID = 'your-extension-id-here';
 *
 * // Get all news analyses
 * chrome.runtime.sendMessage(
 *   MUSASHI_EXTENSION_ID,
 *   { type: 'API_GET_NEWS_ANALYSES' },
 *   (response) => {
 *     console.log('News analyses:', response.data);
 *   }
 * );
 * ```
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

export interface ApiNewsAnalysis {
  newsId: string;
  title: string;
  timestamp: number;
  tweetCount: number;
  sentiment: {
    sentiment: 'bullish' | 'bearish' | 'neutral';
    confidence: number;
    marketAction: 'buy' | 'sell' | 'hold';
    actionConfidence: number;
    reasoning: string;
    keyPoints: string[];
    riskLevel: 'low' | 'medium' | 'high';
  };
  relatedMarkets: {
    marketId: string;
    title: string;
    platform: 'polymarket' | 'kalshi';
    signal: 'buy' | 'sell' | 'hold';
    confidence: number;
    currentPrice: number;
    potentialReturn: number;
    url: string;
  }[];
  sentimentTrend: {
    timestamp: number;
    sentiment: 'bullish' | 'bearish' | 'neutral';
    confidence: number;
  }[];
}

/**
 * API endpoint handlers
 */
export function setupExternalApi() {
  // Listen for external messages (from AI agents, scripts, etc.)
  chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
    console.log('[Musashi API] External request:', message.type);

    // Get all news analyses
    if (message.type === 'API_GET_NEWS_ANALYSES') {
      chrome.storage.local.get(['news_analyses']).then((stored) => {
        const analyses = stored.news_analyses || {};
        const data: ApiNewsAnalysis[] = Object.values(analyses).map(transformAnalysis);

        sendResponse({
          success: true,
          data,
          timestamp: Date.now(),
        } as ApiResponse<ApiNewsAnalysis[]>);
      });
      return true;
    }

    // Get specific news analysis by ID
    if (message.type === 'API_GET_NEWS_ANALYSIS') {
      const newsId = message.newsId;
      if (!newsId) {
        sendResponse({
          success: false,
          error: 'Missing newsId parameter',
          timestamp: Date.now(),
        } as ApiResponse);
        return;
      }

      chrome.storage.local.get(['news_analyses']).then((stored) => {
        const analyses = stored.news_analyses || {};
        const analysis = analyses[newsId];

        if (!analysis) {
          sendResponse({
            success: false,
            error: `News analysis not found: ${newsId}`,
            timestamp: Date.now(),
          } as ApiResponse);
          return;
        }

        sendResponse({
          success: true,
          data: transformAnalysis(analysis),
          timestamp: Date.now(),
        } as ApiResponse<ApiNewsAnalysis>);
      });
      return true;
    }

    // Get all available markets
    if (message.type === 'API_GET_MARKETS') {
      chrome.storage.local.get(['markets_v2']).then((stored) => {
        const markets = stored.markets_v2 || [];

        sendResponse({
          success: true,
          data: markets,
          timestamp: Date.now(),
        } as ApiResponse);
      });
      return true;
    }

    // Get market signals (filtered by sentiment/action)
    if (message.type === 'API_GET_MARKET_SIGNALS') {
      const filter = message.filter || {}; // { signal: 'buy', minConfidence: 0.7 }

      chrome.storage.local.get(['news_analyses']).then((stored) => {
        const analyses = stored.news_analyses || {};
        let allSignals: any[] = [];

        Object.values(analyses).forEach((analysis: any) => {
          allSignals.push(...analysis.relatedMarkets);
        });

        // Apply filters
        if (filter.signal) {
          allSignals = allSignals.filter((s) => s.signal === filter.signal);
        }
        if (filter.minConfidence) {
          allSignals = allSignals.filter((s) => s.confidence >= filter.minConfidence);
        }

        // Sort by confidence
        allSignals.sort((a, b) => b.confidence - a.confidence);

        sendResponse({
          success: true,
          data: allSignals,
          timestamp: Date.now(),
        } as ApiResponse);
      });
      return true;
    }

    // Health check
    if (message.type === 'API_HEALTH') {
      chrome.storage.local.get(['markets_v2']).then((stored) => {
        const markets = stored.markets_v2 || [];
        sendResponse({
          success: true,
          data: {
            status: 'healthy',
            version: '1.0.0',
            marketsLoaded: markets.length,
            lastUpdate: Date.now(),
          },
          timestamp: Date.now(),
        } as ApiResponse);
      });
      return true;
    }

    // Get API capabilities and documentation
    if (message.type === 'API_GET_CAPABILITIES') {
      sendResponse({
        success: true,
        data: {
          name: 'Musashi AI',
          version: '1.0.0',
          description: 'AI-powered sentiment analysis and prediction market signals for automated trading',
          documentation: {
            main: 'https://musashi.bot/ai',
            quickstart: 'https://musashi.bot/ai/quickstart',
            apiReference: 'https://musashi.bot/ai/api-reference',
            examples: {
              python: 'https://musashi.bot/ai/examples/python',
              nodejs: 'https://musashi.bot/ai/examples/nodejs',
            },
            strategies: 'https://musashi.bot/ai/strategies',
            schema: 'https://musashi.bot/ai/schema.json',
            openapi: 'https://musashi.bot/ai/openapi.yaml',
          },
          endpoints: [
            {
              type: 'API_GET_NEWS_ANALYSES',
              description: 'Get AI sentiment analysis for trending news',
              parameters: {},
              returns: 'NewsAnalysis[]',
              example: { type: 'API_GET_NEWS_ANALYSES', data: {} },
            },
            {
              type: 'API_GET_MARKET_SIGNALS',
              description: 'Get sentiment signals for prediction markets',
              parameters: { marketId: 'string (optional)' },
              returns: 'MarketSignal[]',
              example: { type: 'API_GET_MARKET_SIGNALS', data: {} },
            },
            {
              type: 'API_GET_MARKETS',
              description: 'Get complete market database (500+ markets)',
              parameters: {},
              returns: 'Market[]',
              example: { type: 'API_GET_MARKETS', data: {} },
            },
            {
              type: 'API_HEALTH',
              description: 'Check extension health and status',
              parameters: {},
              returns: 'HealthData',
              example: { type: 'API_HEALTH', data: {} },
            },
            {
              type: 'API_GET_CAPABILITIES',
              description: 'Get API capabilities and documentation links',
              parameters: {},
              returns: 'Capabilities',
              example: { type: 'API_GET_CAPABILITIES', data: {} },
            },
          ],
          usage: {
            javascript: `chrome.runtime.sendMessage('EXTENSION_ID', { type: 'API_GET_NEWS_ANALYSES', data: {} }, (response) => { console.log(response.data); });`,
            note: 'Replace EXTENSION_ID with your installed Musashi extension ID from chrome://extensions',
          },
          confidenceThresholds: {
            description: 'Recommended confidence thresholds for trading',
            minimum: 0.7,
            high: 0.8,
            veryHigh: 0.9,
          },
          rateLimits: {
            newsAnalyses: '60-120 seconds',
            marketSignals: '30-60 seconds per market',
            marketsDatabase: '15 minutes',
            note: 'These are recommended polling frequencies, not hard limits',
          },
          features: [
            'Real-time sentiment analysis via DeepSeek AI',
            'Trading signals with Buy/Sell/Hold recommendations',
            'Confidence scores for all signals',
            'Sentiment trend tracking',
            'Market discovery and filtering',
            '500+ markets from Polymarket + Kalshi',
            'Free API access (no authentication required)',
          ],
          dataSources: [
            'Twitter/X (via browser)',
            'Polymarket API',
            'Kalshi API',
            'DeepSeek AI',
          ],
          pricing: {
            cost: 'FREE',
            note: 'All AI analysis costs are covered by Musashi',
          },
        },
        timestamp: Date.now(),
      } as ApiResponse);
      return true;
    }

    // Unknown endpoint
    sendResponse({
      success: false,
      error: `Unknown API endpoint: ${message.type}`,
      timestamp: Date.now(),
    } as ApiResponse);
  });

  console.log('[Musashi API] External API initialized');
}

/**
 * Transform internal NewsAnalysis to API format
 */
function transformAnalysis(analysis: any): ApiNewsAnalysis {
  return {
    newsId: analysis.newsId,
    title: analysis.title,
    timestamp: analysis.timestamp,
    tweetCount: analysis.tweetCount,
    sentiment: {
      sentiment: analysis.overallSentiment.sentiment,
      confidence: analysis.overallSentiment.confidence,
      marketAction: analysis.overallSentiment.marketAction,
      actionConfidence: analysis.overallSentiment.actionConfidence,
      reasoning: analysis.overallSentiment.reasoning,
      keyPoints: analysis.overallSentiment.keyPoints,
      riskLevel: analysis.overallSentiment.riskLevel,
    },
    relatedMarkets: analysis.relatedMarkets.map((m: any) => ({
      marketId: m.market.id,
      title: m.market.title,
      platform: m.market.platform,
      signal: m.signal,
      confidence: m.confidence,
      currentPrice: m.currentPrice,
      potentialReturn: m.potentialReturn,
      url: m.market.url,
    })),
    sentimentTrend: analysis.sentimentTrend.map((t: any) => ({
      timestamp: t.timestamp,
      sentiment: t.sentiment,
      confidence: t.confidence,
    })),
  };
}
