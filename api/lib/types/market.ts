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

  // Phase 2: Real platform IDs for live price fetching
  ticker?: string;        // Kalshi market ticker (e.g., "FED-26MAR20-R")
  polymarket_id?: string; // Polymarket condition ID for CLOB API
  isLive?: boolean;       // Whether this market has live prices
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

// Phase 1: Enhanced response types for bot developers
export type SignalType = 'arbitrage' | 'news_event' | 'sentiment_shift' | 'user_interest';
export type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical';

export interface ResponseMetadata {
  processing_time_ms: number;
  sources_checked: number;
  markets_analyzed: number;
  model_version: string;
}

// Phase 2: Arbitrage detection result
export interface ArbitrageOpportunity {
  detected: boolean;
  spread: number;
  profit_potential: number;
  buy_platform: string;
  buy_price: number;
  sell_platform: string;
  sell_price: number;
  recommendation: string;
}

export interface AnalyzeTextResponse {
  // Phase 1: Enhanced fields for agents
  event_id: string;           // Unique ID to track events
  signal_type: SignalType;    // Type of signal detected
  urgency: UrgencyLevel;      // How time-sensitive this is

  // Original fields
  success: boolean;
  data?: {
    markets: MarketMatch[];
    matchCount: number;
    timestamp: string;
    metadata: ResponseMetadata;  // Phase 1: Processing stats
    arbitrage?: ArbitrageOpportunity;  // Phase 2: Arbitrage detection
  };
  error?: string;
}
