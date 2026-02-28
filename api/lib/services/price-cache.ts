// Price Caching Service
// In-memory cache with TTL for live market prices

interface CachedPrice {
  price: any;
  timestamp: number;
  ttl: number;
}

// In-memory cache (resets on serverless cold start)
const cache = new Map<string, CachedPrice>();

// Default TTL: 5 minutes (balances freshness vs API quota)
const DEFAULT_TTL = 5 * 60 * 1000;

/**
 * Get cached price if it exists and hasn't expired
 * @param key - Cache key (e.g., "polymarket_abc123" or "kalshi_BTC-100K-2026")
 * @returns Cached price or null if expired/not found
 */
export function getCachedPrice(key: string): any | null {
  const cached = cache.get(key);

  if (!cached) {
    return null;
  }

  // Check if expired
  const now = Date.now();
  if (now - cached.timestamp > cached.ttl) {
    cache.delete(key);
    return null;
  }

  return cached.price;
}

/**
 * Store price in cache with TTL
 * @param key - Cache key
 * @param price - Price data to cache
 * @param ttl - Time to live in milliseconds (default: 5 minutes)
 */
export function setCachedPrice(key: string, price: any, ttl: number = DEFAULT_TTL): void {
  cache.set(key, {
    price,
    timestamp: Date.now(),
    ttl,
  });
}

/**
 * Clear entire cache (useful for testing)
 */
export function clearCache(): void {
  cache.clear();
}

/**
 * Get cache statistics
 * @returns Object with cache stats
 */
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
  };
}

/**
 * Remove expired entries from cache (garbage collection)
 */
export function pruneCache(): number {
  const now = Date.now();
  let pruned = 0;

  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > value.ttl) {
      cache.delete(key);
      pruned++;
    }
  }

  return pruned;
}
