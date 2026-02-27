/**
 * Types for Today's News analysis feature
 */

import { Market } from './market';
import { DeepSeekSentimentResult } from '../api/deepseek-client';

export interface NewsAnalysis {
  newsId: string;
  title: string;
  timestamp: number;
  tweetCount: number;
  overallSentiment: DeepSeekSentimentResult;
  relatedMarkets: MarketSignal[];
  sentimentTrend: SentimentDataPoint[];
  lastUpdated: number;
}

export interface MarketSignal {
  market: Market;
  signal: 'buy' | 'sell' | 'hold';
  confidence: number;
  reasoning: string;
  priceTarget?: number; // Predicted YES price (0-1)
  currentPrice: number;
  potentialReturn: number; // Estimated % return
}

export interface SentimentDataPoint {
  timestamp: number;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  tweetCount: number;
}

export interface TextSelectionAnalysis {
  text: string;
  sentiment: DeepSeekSentimentResult;
  relatedMarkets: Market[];
  timestamp: number;
}

export interface NewsAnalysisCache {
  [newsId: string]: NewsAnalysis;
}
