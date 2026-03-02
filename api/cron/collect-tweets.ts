import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';
import { twitterClient } from '../../src/api/twitter-client';
import { KeywordMatcher } from '../../src/analysis/keyword-matcher';
import { analyzeSentiment } from '../../src/analysis/sentiment-analyzer';
import { generateSignal } from '../../src/analysis/signal-generator';
import { getMarkets, getArbitrage } from '../lib/market-cache';
import {
  TWITTER_ACCOUNTS,
  getHighPriorityAccounts,
  getMediumPriorityAccounts,
} from '../../src/data/twitter-accounts';
import type {
  AnalyzedTweet,
  RawTweet,
  CronRunMetadata,
  AccountCategory,
} from '../../src/types/feed';

// ─── KV Storage Keys ───────────────────────────────────────────────────────

const FEED_LATEST_KEY = 'feed:latest';
const CRON_METADATA_KEY = 'cron:last_run';
const TWEET_TTL_SECONDS = 48 * 60 * 60; // 48 hours

function getTweetKey(tweetId: string): string {
  return `tweet:${tweetId}`;
}

function getCategoryKey(category: AccountCategory): string {
  return `feed:category:${category}`;
}

// ─── Main Handler ──────────────────────────────────────────────────────────

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  const startTime = Date.now();

  // CORS (handle preflight)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Allow GET and POST (Vercel cron sends GET by default)
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).json({
      success: false,
      error: 'Method not allowed. Use GET or POST.',
    });
    return;
  }

  // Verify cron secret (Vercel sends this header for authenticated cron calls)
  const cronSecret = req.headers.authorization?.replace('Bearer ', '');
  if (cronSecret !== process.env.CRON_SECRET) {
    console.error('[Cron] Unauthorized: Invalid CRON_SECRET');
    res.status(401).json({
      success: false,
      error: 'Unauthorized',
    });
    return;
  }

  console.log('[Cron] Starting tweet collection...');

  try {
    // Step 1: Get markets from cache
    const markets = await getMarkets();
    if (markets.length === 0) {
      console.warn('[Cron] No markets available, skipping collection');
      res.status(200).json({
        success: true,
        message: 'No markets available, skipped collection',
        tweets_stored: 0,
      });
      return;
    }

    console.log(`[Cron] Loaded ${markets.length} markets`);

    // Step 2: Initialize KeywordMatcher
    const matcher = new KeywordMatcher(markets, 0.3, 5);

    // Step 3: Get arbitrage opportunities (for signal enrichment)
    const arbitrageOpportunities = await getArbitrage(0.03);
    console.log(`[Cron] Loaded ${arbitrageOpportunities.length} arbitrage opportunities`);

    // Step 4: Fetch tweets from high-priority accounts first (limit to 10 per run to avoid rate limits)
    const allHighPriorityAccounts = getHighPriorityAccounts();
    const highPriorityAccounts = allHighPriorityAccounts.slice(0, 10); // Only fetch 10 accounts per run
    console.log(`[Cron] Fetching from ${highPriorityAccounts.length} high-priority accounts (of ${allHighPriorityAccounts.length} total)`);

    const highPriorityResults = await twitterClient.batchFetchTimelines(
      highPriorityAccounts.map(a => a.username),
      3 // Last 3 minutes (overlap buffer)
    );

    // Step 5: Analyze and store tweets
    let totalCollected = 0;
    let totalAnalyzed = 0;
    let totalStored = 0;
    const errors: Array<{ account: string; error: string }> = [];

    for (const [username, result] of highPriorityResults.entries()) {
      if (result.error) {
        errors.push({ account: username, error: result.error });
        continue;
      }

      const account = highPriorityAccounts.find(a => a.username === username);
      if (!account) continue;

      totalCollected += result.tweets.length;

      for (const rawTweet of result.tweets) {
        totalAnalyzed++;

        // Analyze tweet through existing pipeline
        const matches = matcher.match(rawTweet.text);

        // Skip tweets with no market matches or low confidence
        if (matches.length === 0 || matches[0].confidence < 0.3) {
          continue;
        }

        // Get arbitrage for matched markets
        const topMatchId = matches[0].market.id;
        const arbitrage = arbitrageOpportunities.find(
          arb => arb.polymarket.id === topMatchId || arb.kalshi.id === topMatchId
        );

        // Generate signal
        const sentiment = analyzeSentiment(rawTweet.text);
        const signal = generateSignal(rawTweet.text, matches, arbitrage);

        // Build analyzed tweet
        const analyzedTweet: AnalyzedTweet = {
          tweet: rawTweet,
          matches,
          sentiment,
          suggested_action: signal.suggested_action,
          category: account.category,
          urgency: signal.urgency,
          confidence: matches[0].confidence,
          analyzed_at: new Date().toISOString(),
          collected_at: new Date().toISOString(),
        };

        // Store tweet in KV
        await storeTweet(analyzedTweet);
        totalStored++;
      }
    }

    // Step 6: Update feed indices
    await updateFeedIndices();

    // Step 7: Skip medium-priority accounts to avoid rate limits (disabled for now)
    // const elapsedTime = Date.now() - startTime;
    // const remainingTime = 55000 - elapsedTime; // 5s buffer before 60s timeout

    if (false) { // Disabled to avoid Twitter API rate limits
      // const avgTimePerAccount = highPriorityAccounts.length > 0
      //   ? elapsedTime / highPriorityAccounts.length
      //   : 1000;
      // const estimatedAccounts = Math.floor(remainingTime / avgTimePerAccount);

      // if (estimatedAccounts > 0) {
      //   const mediumPriorityAccounts = getMediumPriorityAccounts().slice(0, estimatedAccounts);
      //   console.log(`[Cron] Time remaining: ${remainingTime}ms, fetching ${mediumPriorityAccounts.length} medium-priority accounts`);

      //   const mediumPriorityResults = await twitterClient.batchFetchTimelines(
      //     mediumPriorityAccounts.map(a => a.username),
      //     3
      //   );

      //   for (const [username, result] of mediumPriorityResults.entries()) {
      //     if (result.error) {
      //       errors.push({ account: username, error: result.error });
      //       continue;
      //     }

      //     const account = mediumPriorityAccounts.find(a => a.username === username);
      //     if (!account) continue;

      //     totalCollected += result.tweets.length;

      //     for (const rawTweet of result.tweets) {
      //       totalAnalyzed++;

      //       const matches = matcher.match(rawTweet.text);
      //       if (matches.length === 0 || matches[0].confidence < 0.3) {
      //         continue;
      //       }

      //       const topMatchId = matches[0].market.id;
      //       const arbitrage = arbitrageOpportunities.find(
      //         arb => arb.polymarket.id === topMatchId || arb.kalshi.id === topMatchId
      //       );

      //       const sentiment = analyzeSentiment(rawTweet.text);
      //       const signal = generateSignal(rawTweet.text, matches, arbitrage);

      //       const analyzedTweet: AnalyzedTweet = {
      //         tweet: rawTweet,
      //         matches,
      //         sentiment,
      //         suggested_action: signal.suggested_action,
      //         category: account.category,
      //         urgency: signal.urgency,
      //         confidence: matches[0].confidence,
      //         analyzed_at: new Date().toISOString(),
      //         collected_at: new Date().toISOString(),
      //       };

      //       await storeTweet(analyzedTweet);
      //       totalStored++;
      //     }
      //   }

      //   await updateFeedIndices();
      // }
    }

    // Step 8: Store cron metadata
    const cronMetadata: CronRunMetadata = {
      timestamp: new Date().toISOString(),
      tweets_collected: totalCollected,
      tweets_analyzed: totalAnalyzed,
      tweets_stored: totalStored,
      errors,
      duration_ms: Date.now() - startTime,
    };

    await kv.setex(CRON_METADATA_KEY, TWEET_TTL_SECONDS, cronMetadata);

    console.log(`[Cron] Complete: ${totalStored} tweets stored (${totalCollected} collected, ${totalAnalyzed} analyzed) in ${cronMetadata.duration_ms}ms`);

    // Step 9: Return summary
    res.status(200).json({
      success: true,
      tweets_collected: totalCollected,
      tweets_analyzed: totalAnalyzed,
      tweets_stored: totalStored,
      errors: errors.length,
      duration_ms: cronMetadata.duration_ms,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Cron] Error:', errorMessage);

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

// ─── Helper Functions ──────────────────────────────────────────────────────

/**
 * Store a tweet in KV with TTL
 */
async function storeTweet(tweet: AnalyzedTweet): Promise<void> {
  const key = getTweetKey(tweet.tweet.id);
  await kv.setex(key, TWEET_TTL_SECONDS, tweet);
}

/**
 * Update feed indices (latest + category-specific)
 */
async function updateFeedIndices(): Promise<void> {
  try {
    // Get all tweet keys
    const tweetKeys = await kv.keys('tweet:*');
    const tweetIds = tweetKeys.map(key => key.replace('tweet:', ''));

    // Fetch all tweets to build indices
    const tweets = await Promise.all(
      tweetIds.map(id => kv.get<AnalyzedTweet>(getTweetKey(id)))
    );

    const validTweets = tweets.filter(t => t !== null) as AnalyzedTweet[];

    // Sort by created_at (newest first)
    validTweets.sort((a, b) =>
      new Date(b.tweet.created_at).getTime() - new Date(a.tweet.created_at).getTime()
    );

    // Build feed:latest (last 200 tweet IDs)
    const latestTweetIds = validTweets.slice(0, 200).map(t => t.tweet.id);
    await kv.setex(FEED_LATEST_KEY, TWEET_TTL_SECONDS, latestTweetIds);

    // Build feed:category:{category} indices (last 100 per category)
    const categoriesMap = new Map<AccountCategory, string[]>();

    for (const tweet of validTweets) {
      const category = tweet.category;
      if (!categoriesMap.has(category)) {
        categoriesMap.set(category, []);
      }
      const categoryTweetIds = categoriesMap.get(category)!;
      if (categoryTweetIds.length < 100) {
        categoryTweetIds.push(tweet.tweet.id);
      }
    }

    // Store category indices
    for (const [category, tweetIds] of categoriesMap.entries()) {
      await kv.setex(getCategoryKey(category), TWEET_TTL_SECONDS, tweetIds);
    }

    console.log(`[Cron] Updated feed indices: ${latestTweetIds.length} in latest, ${categoriesMap.size} categories`);
  } catch (error) {
    console.error('[Cron] Failed to update feed indices:', error);
    // Don't throw - indices update is not critical
  }
}
