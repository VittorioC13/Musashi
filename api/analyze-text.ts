import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Market, MarketMatch } from '../src/types/market';
import { KeywordMatcher } from '../src/analysis/keyword-matcher';
import { generateSignal, TradingSignal } from '../src/analysis/signal-generator';
import { fetchPolymarkets } from '../src/api/polymarket-client';
import { fetchKalshiMarkets } from '../src/api/kalshi-client';
import { detectArbitrage } from '../src/api/arbitrage-detector';

// In-memory cache for markets (5 minutes TTL)
let cachedMarkets: Market[] = [];
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Fetch and cache markets from both platforms
 */
async function getMarkets(): Promise<Market[]> {
  const now = Date.now();

  // Return cached if fresh
  if (cachedMarkets.length > 0 && (now - cacheTimestamp) < CACHE_TTL_MS) {
    console.log(`[API] Using cached ${cachedMarkets.length} markets`);
    return cachedMarkets;
  }

  // Fetch fresh markets
  console.log('[API] Fetching fresh markets...');

  try {
    const [polyResult, kalshiResult] = await Promise.allSettled([
      fetchPolymarkets(500, 10),
      fetchKalshiMarkets(400, 10),
    ]);

    const polyMarkets = polyResult.status === 'fulfilled' ? polyResult.value : [];
    const kalshiMarkets = kalshiResult.status === 'fulfilled' ? kalshiResult.value : [];

    cachedMarkets = [...polyMarkets, ...kalshiMarkets];
    cacheTimestamp = now;

    console.log(`[API] Cached ${cachedMarkets.length} markets`);
    return cachedMarkets;
  } catch (error) {
    console.error('[API] Failed to fetch markets:', error);
    // Return stale cache if available
    return cachedMarkets;
  }
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only accept POST
  if (req.method !== 'POST') {
    res.status(405).json({
      event_id: 'evt_error',
      signal_type: 'user_interest',
      urgency: 'low',
      success: false,
      error: 'Method not allowed. Use POST.',
    });
    return;
  }

  const startTime = Date.now();

  try {
    const body = req.body as {
      text: string;
      minConfidence?: number;
      maxResults?: number;
    };

    // Validate request
    if (!body.text || typeof body.text !== 'string') {
      res.status(400).json({
        event_id: 'evt_error',
        signal_type: 'user_interest',
        urgency: 'low',
        success: false,
        error: 'Missing or invalid "text" field in request body.',
      });
      return;
    }

    const { text, minConfidence = 0.3, maxResults = 5 } = body;

    // Get markets
    const markets = await getMarkets();

    if (markets.length === 0) {
      res.status(503).json({
        event_id: 'evt_error',
        signal_type: 'user_interest',
        urgency: 'low',
        success: false,
        error: 'No markets available. Service temporarily unavailable.',
      });
      return;
    }

    // Match markets
    const matcher = new KeywordMatcher(markets, minConfidence, maxResults);
    const matches = matcher.match(text);

    // Detect arbitrage
    const arbitrageOpportunities = detectArbitrage(markets, 0.03);
    let arbitrageForSignal = undefined;

    if (matches.length > 0 && arbitrageOpportunities.length > 0) {
      const topMatchId = matches[0].market.id;
      arbitrageForSignal = arbitrageOpportunities.find(
        arb => arb.polymarket.id === topMatchId || arb.kalshi.id === topMatchId
      );
    }

    // Generate trading signal
    const signal: TradingSignal = generateSignal(text, matches, arbitrageForSignal);

    // Build response
    const response = {
      event_id: signal.event_id,
      signal_type: signal.signal_type,
      urgency: signal.urgency,
      success: true,
      data: {
        markets: signal.matches,
        matchCount: signal.matches.length,
        timestamp: new Date().toISOString(),
        suggested_action: signal.suggested_action,
        sentiment: signal.sentiment,
        arbitrage: signal.arbitrage,
        metadata: {
          processing_time_ms: Date.now() - startTime,
          sources_checked: 2, // Polymarket + Kalshi
          markets_analyzed: markets.length,
          model_version: 'v2.0.0',
        },
      },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('[API] Error in analyze-text:', error);
    res.status(500).json({
      event_id: 'evt_error',
      signal_type: 'user_interest',
      urgency: 'low',
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
