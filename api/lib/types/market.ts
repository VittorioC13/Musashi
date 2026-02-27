// Market data types for API

export interface Market {
  id: string;
  platform: 'kalshi' | 'polymarket';
  title: string;
  description: string;
  keywords: string[];
  yesPrice: number; // 0.0 to 1.0 (0.65 = 65%)
  noPrice: number;  // 0.0 to 1.0 (0.35 = 35%)
  volume24h: number; // 24h trading volume in dollars
  url: string;
  category: string;
  lastUpdated: string; // ISO timestamp
  numericId?: string;
  oneDayPriceChange?: number;
  endDate?: string;
}

export interface MarketMatch {
  market: Market;
  confidence: number; // 0.0 to 1.0
  matchedKeywords: string[];
}

// API-specific types
export interface AnalyzeTextRequest {
  text: string;
  minConfidence?: number;
  maxResults?: number;
}

export interface AnalyzeTextResponse {
  success: boolean;
  data?: {
    markets: MarketMatch[];
    matchCount: number;
    timestamp: string;
  };
  error?: string;
}
