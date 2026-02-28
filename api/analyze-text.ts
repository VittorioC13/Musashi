import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { AnalyzeTextRequest, AnalyzeTextResponse } from './lib/types/market';

// Lazy import to avoid initialization issues
let KeywordMatcher: any;
let matcher: any;
let phase1Utils: any;

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

    // Phase 1: Generate enhanced fields for agents
    const eventId = utils.generateEventId(text, matches);
    const signalType = utils.classifySignal(text, matches);
    const urgency = utils.determineUrgency(signalType, matches, text);
    const metadata = utils.calculateMetadata(startTime, totalMarkets, matches.length);

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
        metadata: metadata,  // Phase 1: Processing statistics
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
