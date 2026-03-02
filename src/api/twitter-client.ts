// Twitter API v2 client for collecting tweets from curated accounts

import { RawTweet } from '../types/feed';

// ─── Error Classes ─────────────────────────────────────────────────────────

export class TwitterApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public rateLimitReset?: number
  ) {
    super(message);
    this.name = 'TwitterApiError';
  }
}

// ─── Twitter API v2 Response Types ─────────────────────────────────────────

interface TwitterUser {
  id: string;
  username: string;
  name: string;
}

interface TwitterTweetData {
  id: string;
  text: string;
  author_id: string;
  created_at: string;
  public_metrics: {
    like_count: number;
    retweet_count: number;
    reply_count: number;
    quote_count: number;
  };
  referenced_tweets?: Array<{
    type: 'retweeted' | 'quoted' | 'replied_to';
    id: string;
  }>;
}

interface TwitterTimelineResponse {
  data?: TwitterTweetData[];
  includes?: {
    users?: TwitterUser[];
  };
  meta?: {
    result_count: number;
    newest_id?: string;
    oldest_id?: string;
    next_token?: string;
  };
}

interface TwitterUserResponse {
  data?: TwitterUser;
}

// ─── Twitter Client Class ──────────────────────────────────────────────────

export class TwitterClient {
  private bearerToken: string;
  private baseUrl = 'https://api.twitter.com/2';

  constructor(bearerToken?: string) {
    this.bearerToken = bearerToken || process.env.TWITTER_BEARER_TOKEN || '';

    if (!this.bearerToken) {
      console.warn('[Twitter Client] No bearer token configured. Set TWITTER_BEARER_TOKEN environment variable.');
    }
  }

  /**
   * Get Twitter user ID from username
   *
   * @param username - Twitter handle (without @)
   * @returns User ID
   */
  async getUserId(username: string): Promise<string> {
    const url = `${this.baseUrl}/users/by/username/${username}`;

    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.bearerToken}`,
        },
      });

      await this.checkRateLimit(response);

      if (!response.ok) {
        if (response.status === 404) {
          throw new TwitterApiError(
            `User @${username} not found (suspended, deleted, or username changed)`,
            404
          );
        }
        throw new TwitterApiError(
          `Failed to get user ID for @${username}`,
          response.status
        );
      }

      const data = await response.json() as TwitterUserResponse;

      if (!data.data?.id) {
        throw new TwitterApiError(`No user data returned for @${username}`, 500);
      }

      return data.data.id;
    } catch (error) {
      if (error instanceof TwitterApiError) {
        throw error;
      }
      throw new TwitterApiError(
        `Network error fetching user @${username}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  /**
   * Fetch recent tweets from a user's timeline
   *
   * @param username - Twitter handle (without @)
   * @param sinceMinutes - Fetch tweets from the last N minutes
   * @param maxResults - Max tweets to return (default: 10, max: 100)
   * @returns Array of raw tweets
   */
  async fetchUserTimeline(
    username: string,
    sinceMinutes: number = 3,
    maxResults: number = 10
  ): Promise<RawTweet[]> {
    try {
      // Get user ID first
      const userId = await this.getUserId(username);

      // Calculate start time (tweets from last N minutes)
      const startTime = new Date(Date.now() - sinceMinutes * 60 * 1000).toISOString();

      // Build URL with query parameters
      const url = new URL(`${this.baseUrl}/users/${userId}/tweets`);
      url.searchParams.set('max_results', Math.min(maxResults, 100).toString());
      url.searchParams.set('start_time', startTime);
      url.searchParams.set('tweet.fields', 'created_at,public_metrics,referenced_tweets');
      url.searchParams.set('expansions', 'author_id');
      url.searchParams.set('user.fields', 'username,name');

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${this.bearerToken}`,
        },
      });

      await this.checkRateLimit(response);

      if (!response.ok) {
        throw new TwitterApiError(
          `Failed to fetch timeline for @${username}`,
          response.status
        );
      }

      const data = await response.json() as TwitterTimelineResponse;

      if (!data.data || data.data.length === 0) {
        return []; // No tweets in timeframe
      }

      // Filter and map tweets
      const filteredTweets = data.data.filter(tweet => this.shouldIncludeTweet(tweet));

      return filteredTweets.map(tweet => this.mapTweet(tweet, username));
    } catch (error) {
      if (error instanceof TwitterApiError) {
        throw error;
      }
      throw new TwitterApiError(
        `Error fetching timeline for @${username}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  /**
   * Batch fetch timelines for multiple usernames
   * Isolates errors per account so one failure doesn't crash the entire batch
   *
   * @param usernames - Array of Twitter handles
   * @param sinceMinutes - Fetch tweets from the last N minutes
   * @returns Map of username → {tweets, error?}
   */
  async batchFetchTimelines(
    usernames: string[],
    sinceMinutes: number = 3
  ): Promise<Map<string, { tweets: RawTweet[]; error?: string }>> {
    const results = new Map<string, { tweets: RawTweet[]; error?: string }>();

    // Fetch timelines sequentially to respect rate limits
    // Could be parallelized with Promise.allSettled, but sequential is safer
    for (const username of usernames) {
      try {
        const tweets = await this.fetchUserTimeline(username, sinceMinutes, 10);
        results.set(username, { tweets });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[Twitter Client] Failed to fetch @${username}:`, errorMessage);

        // If rate limit hit, stop processing remaining accounts
        if (error instanceof TwitterApiError && error.statusCode === 429) {
          console.error(`[Twitter Client] Rate limit hit. Stopping batch fetch.`);
          results.set(username, { tweets: [], error: `Rate limit exceeded (resets at ${new Date(error.rateLimitReset! * 1000).toISOString()})` });
          break; // Stop processing
        }

        results.set(username, { tweets: [], error: errorMessage });
      }
    }

    return results;
  }

  /**
   * Check rate limit headers and throw if exceeded
   */
  private async checkRateLimit(response: Response): Promise<void> {
    const remaining = response.headers.get('x-rate-limit-remaining');
    const reset = response.headers.get('x-rate-limit-reset');

    if (response.status === 429) {
      const resetTime = reset ? parseInt(reset) : Date.now() / 1000 + 900; // Default 15 min
      throw new TwitterApiError(
        'Twitter API rate limit exceeded',
        429,
        resetTime
      );
    }

    // Log warning if close to rate limit
    if (remaining && parseInt(remaining) < 10) {
      console.warn(`[Twitter Client] Rate limit warning: ${remaining} requests remaining`);
    }
  }

  /**
   * Filter out tweets we don't want to store
   *
   * Excludes:
   * - Bare retweets (starts with "RT @")
   * - Bare replies (unless quote tweet with added commentary)
   * - Tweets shorter than 30 characters
   */
  private shouldIncludeTweet(tweet: TwitterTweetData): boolean {
    // Check minimum length
    if (tweet.text.length < 30) {
      return false;
    }

    // Exclude bare retweets
    if (tweet.text.startsWith('RT @')) {
      return false;
    }

    // Check if it's a reply
    const isReply = tweet.referenced_tweets?.some(ref => ref.type === 'replied_to');
    const isQuote = tweet.referenced_tweets?.some(ref => ref.type === 'quoted');

    // Exclude bare replies (unless it's a quote tweet)
    if (isReply && !isQuote) {
      return false;
    }

    return true;
  }

  /**
   * Map Twitter API response to our RawTweet format
   */
  private mapTweet(tweet: TwitterTweetData, username: string): RawTweet {
    return {
      id: tweet.id,
      text: tweet.text,
      author: username,
      created_at: tweet.created_at,
      metrics: {
        likes: tweet.public_metrics.like_count,
        retweets: tweet.public_metrics.retweet_count,
        replies: tweet.public_metrics.reply_count,
        quotes: tweet.public_metrics.quote_count,
      },
      url: `https://twitter.com/${username}/status/${tweet.id}`,
    };
  }
}

// ─── Singleton Instance ────────────────────────────────────────────────────

export const twitterClient = new TwitterClient();

// ─── Helper Function for User ID Lookup ────────────────────────────────────

// Cache user IDs to avoid repeated lookups
const userIdCache = new Map<string, string>();

export async function getUserId(username: string): Promise<string> {
  // Check cache first
  if (userIdCache.has(username)) {
    return userIdCache.get(username)!;
  }

  // Fetch from Twitter API
  const userId = await twitterClient.getUserId(username);

  // Cache for future use
  userIdCache.set(username, userId);

  return userId;
}
