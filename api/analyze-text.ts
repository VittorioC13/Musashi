import type { VercelRequest, VercelResponse } from '@vercel/node';

// Lazy import to avoid initialization issues
let KeywordMatcher: any;
let matcher: any;

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

interface AnalyzeTextRequest {
  text: string;
  minConfidence?: number;
  maxResults?: number;
}

interface AnalyzeTextResponse {
  success: boolean;
  data?: {
    markets: any[];
    matchCount: number;
    timestamp: string;
  };
  error?: string;
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
    const response: AnalyzeTextResponse = {
      success: false,
      error: 'Method not allowed. Use POST.',
    };
    res.status(405).json(response);
    return;
  }

  try {
    const body = req.body as AnalyzeTextRequest;

    // Validate request
    if (!body.text || typeof body.text !== 'string') {
      const response: AnalyzeTextResponse = {
        success: false,
        error: 'Missing or invalid "text" field in request body.',
      };
      res.status(400).json(response);
      return;
    }

    // Extract parameters
    const { text, minConfidence, maxResults } = body;

    // Initialize matcher
    const matcher = await initMatcher();

    // Apply custom settings if provided
    if (minConfidence !== undefined) {
      matcher.setMinConfidence(minConfidence);
    }
    if (maxResults !== undefined) {
      matcher.setMaxResults(maxResults);
    }

    // Perform matching
    const matches = matcher.match(text);

    // Build response
    const response: AnalyzeTextResponse = {
      success: true,
      data: {
        markets: matches,
        matchCount: matches.length,
        timestamp: new Date().toISOString(),
      },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error in analyze-text:', error);
    const response: AnalyzeTextResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    };
    res.status(500).json(response);
  }
}
