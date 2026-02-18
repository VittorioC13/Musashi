import React, { useState, useEffect, useRef } from 'react';
import { Market } from '../types/market';

interface TwitterNativeCardProps {
  market: Market;
  confidence: number;
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
  onMount,
  onUnmount,
}) => {
  const [liveYes, setLiveYes] = useState(market.yesPrice);
  const [liveNo, setLiveNo]   = useState(market.noPrice);
  const [dayChange, setDayChange] = useState(market.oneDayPriceChange ?? 0);
  const [yesFlash, setYesFlash] = useState<PriceFlash>(null);
  const [noFlash,  setNoFlash]  = useState<PriceFlash>(null);
  const [barWidth, setBarWidth] = useState(0); // starts at 0 for entry animation
  const prevYes = useRef(market.yesPrice);

  // Register/unregister with polling orchestrator
  useEffect(() => {
    onMount?.();
    return () => onUnmount?.();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Entry animation: give the DOM one frame to render width:0, then transition to actual value
  useEffect(() => {
    const t = setTimeout(() => setBarWidth(Math.round(market.yesPrice * 100)), 50);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Subscribe to live price updates dispatched by content-script polling
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

  // Format end date: "2026-03-31" → "Mar 31"
  const endDateLabel = React.useMemo(() => {
    if (!market.endDate) return null;
    try {
      const d = new Date(market.endDate + 'T00:00:00Z');
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
    } catch { return null; }
  }, [market.endDate]);

  // Format 24h change: 0.052 → "+5.2%", -0.03 → "-3.0%"
  const changeLabel = React.useMemo(() => {
    if (!dayChange) return null;
    const pct = (dayChange * 100).toFixed(1);
    return dayChange > 0 ? `+${pct}%` : `${pct}%`;
  }, [dayChange]);

  return (
    <a
      href={`${market.url}?ref=musashi`}
      target="_blank"
      rel="noopener noreferrer"
      className="twitter-native-card"
      onClick={(e) => {
        e.stopPropagation();
        console.log('[Musashi] User clicked market card:', market.title);
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-normal">Prediction Market</span>
          <span className="text-xs text-gray-400">•</span>
          <span className="text-xs text-gray-500 font-normal">
            {market.platform === 'polymarket' ? 'Polymarket' : 'Kalshi'}
          </span>
        </div>
        <span className="text-xs text-gray-400">{Math.round(confidence * 100)}% match</span>
      </div>

      {/* Market Title */}
      <h3 className="text-sm font-normal text-gray-900 leading-snug mb-3">
        {market.title}
      </h3>

      {/* Odds Display */}
      <div className="flex items-center gap-4 mb-2">
        {/* YES */}
        <div className={`flex items-center gap-2 px-2 py-0.5 rounded-md transition-colors duration-300 ${
          yesFlash === 'up'   ? 'musashi-flash-up'
          : yesFlash === 'down' ? 'musashi-flash-down'
          : ''
        }`}>
          <span className="text-xs text-gray-500 uppercase tracking-wide">Yes</span>
          <span className={`text-lg font-semibold transition-all duration-300 ${isYesWinning ? 'text-green-600' : 'text-gray-700'}`}>
            {yesPercent}%
          </span>
          {isYesWinning && (
            <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
            </svg>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200"></div>

        {/* NO */}
        <div className={`flex items-center gap-2 px-2 py-0.5 rounded-md transition-colors duration-300 ${
          noFlash === 'up'   ? 'musashi-flash-up'
          : noFlash === 'down' ? 'musashi-flash-down'
          : ''
        }`}>
          <span className="text-xs text-gray-500 uppercase tracking-wide">No</span>
          <span className={`text-lg font-semibold transition-all duration-300 ${!isYesWinning ? 'text-red-600' : 'text-gray-700'}`}>
            {noPercent}%
          </span>
          {!isYesWinning && (
            <svg className="w-3.5 h-3.5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>

        {/* 24h change pill */}
        {changeLabel && (
          <span className={`ml-auto text-xs font-medium px-1.5 py-0.5 rounded ${
            dayChange > 0
              ? 'text-green-700 bg-green-50'
              : 'text-red-700 bg-red-50'
          }`}>
            {changeLabel}
          </span>
        )}
      </div>

      {/* Probability bar */}
      <div className="musashi-prob-bar">
        <div className="musashi-prob-bar-fill" style={{ width: `${barWidth}%` }} />
      </div>

      {/* End date */}
      {endDateLabel && (
        <div className="text-xs text-gray-400 mt-2">
          Resolves {endDateLabel}
        </div>
      )}
    </a>
  );
};

export default TwitterNativeCard;
