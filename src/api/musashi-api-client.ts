// Musashi API Client
// Handles communication with the Musashi backend API

import { MarketMatch } from '../types/market';

// Phase 1: Enhanced API response (extension ignores new fields)
interface AnalyzeTextResponse {
  // Phase 1: New fields for bot developers (extension ignores these)
  event_id: string;
  signal_type: 'arbitrage' | 'news_event' | 'sentiment_shift' | 'user_interest';
  urgency: 'low' | 'medium' | 'high' | 'critical';

  // Original fields
  success: boolean;
  data?: {
    markets: MarketMatch[];
    matchCount: number;
    timestamp: string;
    metadata?: {  // Phase 1: Processing stats
      processing_time_ms: number;
      sources_checked: number;
      markets_analyzed: number;
      model_version: string;
    };
  };
  error?: string;
}

export class MusashiApiClient {
  private baseUrl: string;
  private apiKey?: string;

  constructor(baseUrl: string = 'https://musashi-api.vercel.app', apiKey?: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  /**
   * Analyze text and return matching markets
   */
  async analyzeText(
    text: string,
    options?: {
      minConfidence?: number;
      maxResults?: number;
    }
  ): Promise<MarketMatch[]> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      const response = await fetch(`${this.baseUrl}/api/analyze-text`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          text,
          minConfidence: options?.minConfidence,
          maxResults: options?.maxResults,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const result: AnalyzeTextResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Unknown API error');
      }

      return result.data?.markets || [];
    } catch (error) {
      console.error('[Musashi API] Error analyzing text:', error);
      // Return empty array on error - extension will handle gracefully
      return [];
    }
  }

  /**
   * Set the API base URL (for testing different environments)
   */
  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  /**
   * Set API key for authenticated requests
   */
  setApiKey(key: string): void {
    this.apiKey = key;
  }
}

// Singleton instance with configurable base URL
// For local development: Use 'http://localhost:3000'
// For production: Use 'https://musashi-api.vercel.app' (or your deployed URL)
export const musashiApi = new MusashiApiClient(
  // Production API URL
  'https://musashi-api.vercel.app'
);
