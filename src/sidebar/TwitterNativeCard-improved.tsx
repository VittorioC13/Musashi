import React, { useState, useEffect, useRef } from 'react';
import { Market } from '../types/market';
import { analyzeSentiment } from '../analysis/sentiment-analyzer';

interface TwitterNativeCardProps {
  market: Market;
  confidence: number;
  tweetText?: string;
  onMount?: () => void;
  onUnmount?: () => void;
}

interface PriceUpdate {
  yes: number;
  no: number;
  oneDayPriceChange: number;
}

type PriceFlash = 'up' | 'down' | null;

const TwitterNativeCard: React.FC<TwitterNativeCardProps> = ({
  market,
  confidence,
  tweetText,
  onMount,
  onUnmount,
}) => {
  const [liveYes, setLiveYes] = useState(market.yesPrice);
  const [liveNo, setLiveNo]   = useState(market.noPrice);
  const [dayChange, setDayChange] = useState(market.oneDayPriceChange ?? 0);
  const [yesFlash, setYesFlash] = useState<PriceFlash>(null);
  const [noFlash,  setNoFlash]  = useState<PriceFlash>(null);
  const [barWidth, setBarWidth] = useState(0);
  const prevYes = useRef(market.yesPrice);

  // Analyze sentiment from tweet text
  const sentiment = React.useMemo(() => {
    return tweetText ? analyzeSentiment(tweetText) : null;
  }, [tweetText]);

  // Register/unregister with polling orchestrator
  useEffect(() => {
    onMount?.();
    return () => onUnmount?.();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Entry animation
  useEffect(() => {
    const t = setTimeout(() => setBarWidth(Math.round(market.yesPrice * 100)), 50);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Subscribe to live price updates
  useEffect(() => {
    function handlePriceUpdate(e: Event) {
      const detail = (e as CustomEvent<Record<string, PriceUpdate>>).detail;
      const update = detail[market.id];
      if (!update) return;

      const direction: PriceFlash = update.yes > prevYes.current ? 'up'
        : update.yes < prevYes.current ? 'down'
        : null;

      if (direction) {
        setYesFlash(direction);
        setNoFlash(direction === 'up' ? 'down' : 'up');
        setTimeout(() => { setYesFlash(null); setNoFlash(null); }, 1000);
      }

      prevYes.current = update.yes;
      setLiveYes(update.yes);
      setLiveNo(update.no);
      setDayChange(update.oneDayPriceChange);
      setBarWidth(Math.round(update.yes * 100));
    }

    window.addEventListener('musashi-price-update', handlePriceUpdate);
    return () => window.removeEventListener('musashi-price-update', handlePriceUpdate);
  }, [market.id]);

  const yesPercent = Math.round(liveYes * 100);
  const noPercent  = Math.round(liveNo  * 100);
  const isYesWinning = liveYes >= 0.5;

  // Format end date
  const endDateLabel = React.useMemo(() => {
    if (!market.endDate) return null;
    try {
      const d = new Date(market.endDate + 'T00:00:00Z');
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
    } catch { return null; }
  }, [market.endDate]);

  // Format 24h change
  const changeLabel = React.useMemo(() => {
    if (!dayChange) return null;
    const pct = (dayChange * 100).toFixed(1);
    return dayChange > 0 ? `+${pct}%` : `${pct}%`;
  }, [dayChange]);

  // Format 24h volume
  const volumeLabel = React.useMemo(() => {
    const v = market.volume24h;
    if (!v || v <= 0) return null;
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 10_000)    return `$${Math.round(v / 1_000)}K`;
    if (v >= 1_000)     return `$${(v / 1_000).toFixed(1)}K`;
    return `$${Math.round(v)}`;
  }, [market.volume24h]);

  // Get confidence level for styling
  const confidenceLevel = confidence >= 0.7 ? 'high' : confidence >= 0.4 ? 'medium' : 'low';

  return (
    <a
      href={`${market.url}?ref=musashi`}
      target="_blank"
      rel="noopener noreferrer"
      className="twitter-native-card group"
      onClick={(e) => {
        e.stopPropagation();
        console.log('[Musashi] User clicked market card:', market.title);
      }}
    >
      {/* Header - Improved with better visual hierarchy */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-normal">Prediction Market</span>
          <span className="text-xs text-gray-300">·</span>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-md transition-all ${
            market.platform === 'polymarket'
              ? 'bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 border border-purple-200'
              : 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border border-blue-200'
          }`}>
            {market.platform === 'polymarket' ? '🟣 Polymarket' : '🔵 Kalshi'}
          </span>
          {sentiment && sentiment.confidence > 0 && (
            <>
              <span className="text-xs text-gray-300">·</span>
              <div
                className="flex items-center gap-1"
                title={`Sentiment: ${sentiment.sentiment} (${Math.round(sentiment.confidence * 100)}%)`}
              >
                <div
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{
                    backgroundColor:
                      sentiment.sentiment === 'bullish' ? '#10B981' :
                      sentiment.sentiment === 'bearish' ? '#EF4444' :
                      '#94A3B8',
                  }}
                />
                <span className="text-xs text-gray-500 font-medium">
                  {sentiment.sentiment === 'bullish' ? '📈' : sentiment.sentiment === 'bearish' ? '📉' : '➡️'}
                </span>
              </div>
            </>
          )}
        </div>
        {/* Improved confidence badge */}
        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
          confidenceLevel === 'high'
            ? 'bg-green-50 text-green-700 border border-green-200'
            : confidenceLevel === 'medium'
            ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
            : 'bg-gray-50 text-gray-600 border border-gray-200'
        }`}>
          {confidenceLevel === 'high' && '⚡'}
          {confidenceLevel === 'medium' && '✓'}
          {Math.round(confidence * 100)}% match
        </div>
      </div>

      {/* Market Title - Improved typography */}
      <h3 className="text-[15px] font-semibold text-gray-900 leading-snug mb-3.5 line-clamp-2 group-hover:text-gray-700 transition-colors">
        {market.title}
      </h3>

      {/* Odds Display - Improved with better visual weight */}
      <div className="flex items-stretch gap-3 mb-3">
        {/* YES */}
        <div className={`flex-1 flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-lg transition-all duration-300 ${
          yesFlash === 'up'   ? 'musashi-flash-up'
          : yesFlash === 'down' ? 'musashi-flash-down'
          : ''
        } ${
          isYesWinning
            ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 shadow-sm'
            : 'bg-gray-50 border border-gray-200'
        }`}>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Yes</span>
            {isYesWinning && (
              <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
              </svg>
            )}
          </div>
          <span className={`text-2xl font-bold transition-all ${isYesWinning ? 'text-green-700' : 'text-gray-600'}`}>
            {yesPercent}%
          </span>
        </div>

        {/* Divider */}
        <div className="w-px bg-gray-200 my-1"></div>

        {/* NO */}
        <div className={`flex-1 flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-lg transition-all duration-300 ${
          noFlash === 'up'   ? 'musashi-flash-up'
          : noFlash === 'down' ? 'musashi-flash-down'
          : ''
        } ${
          !isYesWinning
            ? 'bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-200 shadow-sm'
            : 'bg-gray-50 border border-gray-200'
        }`}>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">No</span>
            {!isYesWinning && (
              <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </div>
          <span className={`text-2xl font-bold transition-all ${!isYesWinning ? 'text-red-700' : 'text-gray-600'}`}>
            {noPercent}%
          </span>
        </div>

        {/* 24h change pill - moved to side */}
        {changeLabel && (
          <div className={`flex items-center px-2 rounded-lg text-xs font-bold ${
            dayChange > 0
              ? 'text-green-700 bg-green-50 border border-green-200'
              : 'text-red-700 bg-red-50 border border-red-200'
          }`}>
            {changeLabel}
          </div>
        )}
      </div>

      {/* Probability bar - Improved with gradient */}
      <div className="musashi-prob-bar" style={{ height: '4px' }}>
        <div
          className="musashi-prob-bar-fill"
          style={{
            width: `${barWidth}%`,
            background: isYesWinning
              ? 'linear-gradient(90deg, #10B981, #34D399)'
              : 'linear-gradient(90deg, #F87171, #EF4444)'
          }}
        />
      </div>

      {/* Metadata footer - Improved spacing */}
      {(endDateLabel || volumeLabel) && (
        <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
          {endDateLabel && (
            <div className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="font-medium">Resolves {endDateLabel}</span>
            </div>
          )}
          {endDateLabel && volumeLabel && (
            <span className="text-gray-300">·</span>
          )}
          {volumeLabel && (
            <div className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span className="font-medium">{volumeLabel} volume</span>
            </div>
          )}
        </div>
      )}
    </a>
  );
};

export default TwitterNativeCard;
