import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';
import type { AnalyzedTweet, FeedStats, CronRunMetadata, AccountCategory } from '../../src/types/feed';

// ─── KV Storage Keys ───────────────────────────────────────────────────────

const FEED_LATEST_KEY = 'feed:latest';
const CRON_METADATA_KEY = 'cron:last_run';

function getTweetKey(tweetId: string): string {
  return `tweet:${tweetId}`;
}

// ─── Main Handler ──────────────────────────────────────────────────────────

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  const startTime = Date.now();

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow GET
  if (req.method !== 'GET') {
    res.status(405).json({
      success: false,
      error: 'Method not allowed. Use GET.',
    });
    return;
  }

  try {
    // Get last cron run metadata
    const cronMetadata = await kv.get<CronRunMetadata>(CRON_METADATA_KEY);

    // Get all tweet IDs from feed:latest
    const allTweetIds = await kv.get<string[]>(FEED_LATEST_KEY) || [];

    // Batch fetch all tweets
    const allTweets = await Promise.all(
      allTweetIds.map(id => kv.get<AnalyzedTweet>(getTweetKey(id)))
    );

    const validTweets = allTweets.filter(t => t !== null) as AnalyzedTweet[];

    // Time-based filtering
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    const sixHoursAgo = now - (6 * 60 * 60 * 1000);
    const oneDayAgo = now - (24 * 60 * 60 * 1000);

    const last1h = validTweets.filter(t => new Date(t.collected_at).getTime() > oneHourAgo).length;
    const last6h = validTweets.filter(t => new Date(t.collected_at).getTime() > sixHoursAgo).length;
    const last24h = validTweets.filter(t => new Date(t.collected_at).getTime() > oneDayAgo).length;

    // Category breakdown
    const byCategory = validTweets.reduce((acc, tweet) => {
      acc[tweet.category] = (acc[tweet.category] || 0) + 1;
      return acc;
    }, {} as Record<AccountCategory, number>);

    // Urgency breakdown
    const byUrgency = validTweets.reduce((acc, tweet) => {
      acc[tweet.urgency] = (acc[tweet.urgency] || 0) + 1;
      return acc;
    }, {} as Record<'low' | 'medium' | 'high' | 'critical', number>);

    // Top markets (by mention count)
    const marketCounts = new Map<string, { market: any; count: number }>();

    for (const tweet of validTweets) {
      for (const match of tweet.matches) {
        const marketId = match.market.id;
        if (marketCounts.has(marketId)) {
          marketCounts.get(marketId)!.count++;
        } else {
          marketCounts.set(marketId, {
            market: match.market,
            count: 1,
          });
        }
      }
    }

    const topMarkets = Array.from(marketCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(item => ({
        market: item.market,
        mention_count: item.count,
      }));

    // Build response
    const response: FeedStats = {
      success: true,
      data: {
        timestamp: new Date().toISOString(),
        last_collection: cronMetadata?.timestamp || 'Never',
        tweets: {
          last_1h: last1h,
          last_6h: last6h,
          last_24h: last24h,
        },
        by_category: byCategory,
        by_urgency: byUrgency,
        top_markets: topMarkets,
        metadata: {
          processing_time_ms: Date.now() - startTime,
        },
      },
    };

    // Cache for 1 minute (stats change frequently)
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    res.status(200).json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Feed Stats API] Error:', errorMessage);

    const isKVError = errorMessage.includes('KV') || errorMessage.includes('Redis');

    res.status(500).json({
      success: false,
      error: errorMessage,
      ...(isKVError && {
        note: 'Vercel KV storage error. Ensure KV_REST_API_URL and KV_REST_API_TOKEN are set.',
      }),
    });
  }
}
