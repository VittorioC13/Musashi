import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { AnalyzeTextRequest, AnalyzeTextResponse } from './lib/types/market';

// Lazy import to avoid initialization issues
let KeywordMatcher: any;
let matcher: any;
let phase1Utils: any;
let priceFetcher: any;
let arbitrageDetector: any;

async function initMatcher() {
  if (!matcher) {
    try {
      const module = await import('./lib/analysis/keyword-matcher');
      KeywordMatcher = module.KeywordMatcher;
      matcher = new KeywordMatcher();
    } catch (error) {
      console.error('Failed to load matcher:', error);
      throw error;
    }
  }
  return matcher;
}

async function initPhase1Utils() {
  if (!phase1Utils) {
    try {
      phase1Utils = await import('./lib/analysis/phase1-enhancements');
    } catch (error) {
      console.error('Failed to load phase1 utils:', error);
      throw error;
    }
  }
  return phase1Utils;
}

async function initPhase2Utils() {
  if (!priceFetcher || !arbitrageDetector) {
    try {
      priceFetcher = await import('./lib/services/price-fetcher');
      arbitrageDetector = await import('./lib/analysis/arbitrage-detector');
    } catch (error) {
      console.error('Failed to load phase2 utils:', error);
      throw error;
    }
  }
  return { priceFetcher, arbitrageDetector };
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // CORS headers - allow requests from extension
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
    const response = {
      event_id: 'evt_error',
      signal_type: 'user_interest' as const,
      urgency: 'low' as const,
      success: false,
      error: 'Method not allowed. Use POST.',
    };
    res.status(405).json(response);
    return;
  }

  // Track processing time for metadata
  const startTime = Date.now();

  try {
    const body = req.body as AnalyzeTextRequest;

    // Validate request
    if (!body.text || typeof body.text !== 'string') {
      const response = {
        event_id: 'evt_error',
        signal_type: 'user_interest' as const,
        urgency: 'low' as const,
        success: false,
        error: 'Missing or invalid "text" field in request body.',
      };
      res.status(400).json(response);
      return;
    }

    // Extract parameters
    const { text, minConfidence, maxResults } = body;

    // Initialize matcher and Phase 1 utilities
    const matcher = await initMatcher();
    const utils = await initPhase1Utils();

    // Apply custom settings if provided
    if (minConfidence !== undefined) {
      matcher.setMinConfidence(minConfidence);
    }
    if (maxResults !== undefined) {
      matcher.setMaxResults(maxResults);
    }

    // Perform matching
    const matches = matcher.match(text);

    // Get total markets count for metadata
    const allMarkets = matcher.getAllMarkets ? matcher.getAllMarkets() : [];
    const totalMarkets = allMarkets.length || 124; // Fallback to known count

    // Phase 2: Fetch live prices for matched markets
    const phase2 = await initPhase2Utils();
    let livePricesFetched = 0;

    // Update each match with live prices
    for (const match of matches) {
      try {
        const livePrice = await phase2.priceFetcher.fetchLivePrice(match.market);

        // Update market with live data
        match.market.yesPrice = livePrice.yesPrice;
        match.market.noPrice = livePrice.noPrice;
        match.market.isLive = livePrice.isLive;

        if (livePrice.volume !== undefined) {
          match.market.volume24h = livePrice.volume;
        }

        if (livePrice.isLive) {
          livePricesFetched++;
        }
      } catch (error) {
        // If price fetch fails, keep mock prices
        console.error(`Failed to fetch price for ${match.market.id}:`, error);
      }
    }

    // Phase 2: Detect arbitrage if multiple platforms present
    let arbitrage = undefined;
    if (matches.length >= 2) {
      // Check if we have different platforms
      const platforms = new Set(matches.map(m => m.market.platform));
      if (platforms.size > 1) {
        // Find Polymarket and Kalshi prices
        const polymarketMatch = matches.find(m => m.market.platform === 'polymarket');
        const kalshiMatch = matches.find(m => m.market.platform === 'kalshi');

        if (polymarketMatch && kalshiMatch) {
          arbitrage = phase2.arbitrageDetector.detectArbitrage(
            polymarketMatch.market.yesPrice,
            kalshiMatch.market.yesPrice
          );
        }
      }
    }

    // Phase 1: Generate enhanced fields for agents
    const eventId = utils.generateEventId(text, matches);
    let signalType = utils.classifySignal(text, matches);

    // Phase 2: Override signal type if arbitrage detected
    if (arbitrage && arbitrage.detected) {
      signalType = 'arbitrage';
    }

    let urgency = utils.determineUrgency(signalType, matches, text);

    // Phase 2: Set urgency to critical if arbitrage detected
    if (signalType === 'arbitrage') {
      urgency = 'critical';
    }

    const metadata = utils.calculateMetadata(startTime, totalMarkets, matches.length);
    // Add Phase 2 metadata
    (metadata as any).live_prices_fetched = livePricesFetched;
    (metadata as any).cache_hits = matches.length - livePricesFetched;

    // Build enhanced response
    const response: AnalyzeTextResponse = {
      // Phase 1: Enhanced fields for bot developers
      event_id: eventId,
      signal_type: signalType,
      urgency: urgency,

      // Original fields
      success: true,
      data: {
        markets: matches,
        matchCount: matches.length,
        timestamp: new Date().toISOString(),
        metadata: metadata,  // Phase 1 & 2: Processing statistics
        arbitrage: arbitrage,  // Phase 2: Arbitrage detection
      },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error in analyze-text:', error);
    const response = {
      event_id: 'evt_error',
      signal_type: 'user_interest' as const,
      urgency: 'low' as const,
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    };
    res.status(500).json(response);
  }
}
