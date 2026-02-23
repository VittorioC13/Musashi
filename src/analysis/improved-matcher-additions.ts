// Additional improvements to keyword-matcher.ts
// These should be integrated into the existing matcher

/**
 * IMPROVED SCORING ALGORITHM
 *
 * Key improvements:
 * 1. Category coherence bonus - rewards markets when tweet mentions multiple related terms
 * 2. Recency boost - prioritizes markets with closer end dates
 * 3. Platform-specific boost - slightly favors Polymarket for certain topics
 * 4. Numeric context detection - better handles price levels, dates, percentages
 */

// Category-related term clusters for coherence detection
const CATEGORY_CLUSTERS = {
  gaming: new Set(['gaming', 'video game', 'console', 'esports', 'pc', 'steam', 'playstation', 'xbox', 'nintendo']),
  crypto: new Set(['crypto', 'cryptocurrency', 'bitcoin', 'ethereum', 'btc', 'eth', 'blockchain', 'defi', 'web3']),
  music: new Set(['music', 'album', 'tour', 'concert', 'artist', 'song', 'single', 'spotify', 'streaming music']),
  tech: new Set(['tech', 'technology', 'ai', 'software', 'startup', 'silicon valley', 'coding', 'developer']),
  sports: new Set(['sports', 'team', 'championship', 'playoff', 'season', 'athlete', 'coach', 'league']),
  politics: new Set(['politics', 'election', 'congress', 'president', 'senate', 'house', 'vote', 'bill', 'policy']),
  finance: new Set(['stock', 'stocks', 'market', 'trading', 'wall street', 'ipo', 'shares', 'investor']),
};

/**
 * Detects category coherence - gives bonus when tweet contains multiple related terms
 * from the same category, indicating strong topical focus
 */
function getCategoryCoherenceBonus(matchedKeywords: string[], marketCategory: string): number {
  for (const [category, terms] of Object.entries(CATEGORY_CLUSTERS)) {
    const matchedInCategory = matchedKeywords.filter(kw => terms.has(kw)).length;

    // If we have 3+ terms from same category, strong signal
    if (matchedInCategory >= 3) {
      // Extra boost if market category aligns
      return marketCategory === category ? 0.15 : 0.1;
    }
    // 2 terms from same category is moderate signal
    if (matchedInCategory === 2) {
      return marketCategory === category ? 0.08 : 0.05;
    }
  }
  return 0;
}

/**
 * Recency boost - markets ending soon are more relevant
 */
function getRecencyBoost(market: { endDate?: string }): number {
  if (!market.endDate) return 0;

  try {
    const endDate = new Date(market.endDate);
    const now = new Date();
    const daysUntilEnd = (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

    // Markets ending within 30 days get a small boost
    if (daysUntilEnd > 0 && daysUntilEnd <= 30) {
      return 0.05;
    }
    // Markets ending within 7 days get bigger boost
    if (daysUntilEnd > 0 && daysUntilEnd <= 7) {
      return 0.1;
    }
  } catch (e) {
    // Invalid date, no boost
  }
  return 0;
}

/**
 * Improved confidence thresholds based on match type
 * Returns minimum confidence required for this type of match
 */
function getMinConfidenceThreshold(
  exactMatches: number,
  synonymMatches: number,
  multiWordMatches: number
): number {
  // Very specific: multi-word phrase match with 2+ exact matches
  if (multiWordMatches >= 1 && exactMatches >= 2) {
    return 0.15;  // Lower threshold, high confidence
  }

  // Strong: 3+ exact matches
  if (exactMatches >= 3) {
    return 0.18;
  }

  // Good: 2 exact matches or 1 exact + 2 synonym
  if (exactMatches >= 2 || (exactMatches >= 1 && synonymMatches >= 2)) {
    return 0.22;
  }

  // Weak: mostly synonyms or title matches
  return 0.28;  // Higher threshold to filter noise
}

/**
 * Enhanced scoring with category coherence and recency
 * This would replace computeScore in keyword-matcher.ts
 */
function computeImprovedScore(
  counts: {
    exactMatches: number;
    synonymMatches: number;
    titleMatches: number;
    totalChecked: number;
    multiWordMatches: number;
  },
  market: { category: string; endDate?: string },
  matchedKeywords: string[]
): number {
  if (counts.totalChecked === 0) return 0;

  // Base weighted score
  const weighted =
    counts.exactMatches * 1.0 +
    counts.synonymMatches * 0.5 +
    counts.titleMatches * 0.15;

  // Normalize by capped denominator
  const DENOMINATOR_CAP = 5;
  const denominator = Math.min(counts.totalChecked, DENOMINATOR_CAP);
  const normalized = weighted / denominator;

  const totalMatched = counts.exactMatches + counts.synonymMatches + counts.titleMatches;

  // Dynamic threshold filtering
  const minThreshold = getMinConfidenceThreshold(
    counts.exactMatches,
    counts.synonymMatches,
    counts.multiWordMatches
  );

  if (normalized < minThreshold) {
    return 0;
  }

  // Coverage bonus
  const coverageBonus = Math.min(0.2, (totalMatched - 1) * 0.05);

  // Phrase bonus - multi-word matches are highly specific
  const phraseBonus = Math.min(0.3, counts.multiWordMatches * 0.12);

  // NEW: Category coherence bonus
  const coherenceBonus = getCategoryCoherenceBonus(matchedKeywords, market.category);

  // NEW: Recency boost
  const recencyBoost = getRecencyBoost(market);

  // Combine all factors
  const finalScore = Math.min(
    1.0,
    normalized +
    (totalMatched > 0 ? coverageBonus : 0) +
    phraseBonus +
    coherenceBonus +
    recencyBoost
  );

  return finalScore;
}

/**
 * Numeric context detection
 * Helps match price targets, dates, percentages mentioned in tweets
 */
function extractNumericContexts(text: string): Set<string> {
  const contexts = new Set<string>();

  // Price targets: $100, $50K, $1M, etc.
  const priceMatches = text.matchAll(/\$(\d+(?:,\d{3})*(?:\.\d+)?[KMB]?)/gi);
  for (const match of priceMatches) {
    contexts.add(`price:${match[1].toLowerCase()}`);
  }

  // Percentages: 5%, 10%, etc.
  const percentMatches = text.matchAll(/(\d+(?:\.\d+)?)%/g);
  for (const match of percentMatches) {
    contexts.add(`percent:${match[1]}`);
  }

  // Years: 2026, 2027, etc.
  const yearMatches = text.matchAll(/\b(202[4-9])\b/g);
  for (const match of yearMatches) {
    contexts.add(`year:${match[1]}`);
  }

  return contexts;
}

/**
 * Additional gaming-specific synonyms to add to SYNONYM_MAP
 */
export const GAMING_SYNONYMS = {
  'gta': ['gta 6', 'grand theft auto', 'rockstar', 'gaming'],
  'gta 6': ['gta', 'grand theft auto', 'rockstar', 'gaming', 'video game'],
  'gta vi': ['gta 6', 'gta', 'grand theft auto', 'rockstar'],
  'grand theft auto': ['gta', 'gta 6', 'rockstar', 'gaming'],
  'rockstar': ['gta', 'gta 6', 'gaming', 'take two'],
  'take two': ['rockstar', 'gta', 'gaming'],
  'elden ring': ['fromsoftware', 'souls', 'gaming', 'rpg', 'dlc'],
  'fromsoftware': ['elden ring', 'dark souls', 'gaming', 'souls'],
  'souls': ['elden ring', 'dark souls', 'fromsoftware', 'gaming'],
  'dark souls': ['fromsoftware', 'souls', 'elden ring', 'gaming'],
  'league of legends': ['lol', 'riot games', 'esports', 'moba', 'gaming'],
  'lol': ['league of legends', 'esports', 'riot games', 'gaming'],
  'riot games': ['league of legends', 'valorant', 'gaming', 'esports'],
  'faker': ['league of legends', 'lol', 't1', 'esports'],
  't1': ['league of legends', 'faker', 'esports', 'korea'],
  'valorant': ['riot games', 'fps', 'esports', 'gaming', 'tac shooter'],
  'sentinels': ['valorant', 'esports', 'tenz', 'gaming'],
  'tenz': ['sentinels', 'valorant', 'esports'],
  'nintendo': ['switch', 'switch 2', 'gaming', 'console', 'zelda', 'mario'],
  'switch': ['nintendo', 'switch 2', 'gaming', 'console'],
  'switch 2': ['nintendo', 'switch', 'gaming', 'console', 'next gen'],
  'zelda': ['nintendo', 'switch', 'gaming', 'tears of the kingdom'],
  'mario': ['nintendo', 'switch', 'gaming', 'super mario'],
  'pokemon': ['nintendo', 'switch', 'gaming', 'game freak'],
  'minecraft': ['mojang', 'microsoft', 'sandbox', 'gaming', 'video game'],
  'mojang': ['minecraft', 'microsoft', 'gaming'],
  'hollow knight': ['silksong', 'indie game', 'metroidvania', 'team cherry'],
  'silksong': ['hollow knight', 'indie game', 'metroidvania', 'gaming'],
  'indie game': ['gaming', 'indie', 'video game'],
  'esports': ['gaming', 'competitive', 'tournament', 'league'],
  'gaming': ['video game', 'esports', 'gamer', 'console'],
  'gamer': ['gaming', 'video game', 'esports'],
  'console': ['gaming', 'playstation', 'xbox', 'nintendo'],
  'playstation': ['ps5', 'sony', 'gaming', 'console'],
  'ps5': ['playstation', 'sony', 'gaming', 'console'],
  'xbox': ['microsoft', 'gaming', 'console'],
};

/**
 * Additional music-specific synonyms
 */
export const MUSIC_SYNONYMS = {
  'taylor swift': ['music', 'pop', 'swifties', 'eras tour', 'album'],
  'swifties': ['taylor swift', 'music', 'fandom'],
  'eras tour': ['taylor swift', 'tour', 'concert', 'music'],
  'beyonce': ['music', 'pop', 'renaissance', 'tour', 'beyoncé'],
  'beyoncé': ['beyonce', 'music', 'pop'],
  'renaissance': ['beyonce', 'music', 'album'],
  'the weeknd': ['music', 'pop', 'r&b', 'abel tesfaye'],
  'abel tesfaye': ['the weeknd', 'music'],
  'coachella': ['music festival', 'festival', 'music', 'concert'],
  'music festival': ['coachella', 'concert', 'music', 'tour'],
  'festival': ['music festival', 'concert', 'music'],
  'sabrina carpenter': ['music', 'pop', 'singer', 'espresso'],
  'espresso': ['sabrina carpenter', 'music', 'song'],
  'ye': ['kanye west', 'kanye', 'music', 'rap', 'hip hop'],
  'concert': ['music', 'tour', 'live music', 'show'],
  'tour': ['concert', 'music', 'live music'],
  'album': ['music', 'release', 'new album'],
  'single': ['music', 'song', 'release'],
  'collaboration': ['music', 'collab', 'feature'],
  'collab': ['collaboration', 'music', 'feature'],
};

/**
 * Social media & streaming synonyms
 */
export const SOCIAL_STREAMING_SYNONYMS = {
  'kick': ['streaming', 'xqc', 'stake', 'content creator'],
  'pokimane': ['twitch', 'streaming', 'content creator', 'offlinetv'],
  'xqc': ['twitch', 'kick', 'streaming', 'streamer', 'content creator'],
  'mcdonalds': ['fast food', 'breakfast', 'restaurant', 'mcdonald'],
  'mcdonald': ['mcdonalds', 'fast food'],
  'starbucks': ['coffee', 'sbux', 'cafe', 'union'],
  'sbux': ['starbucks', 'coffee'],
  'fast food': ['mcdonalds', 'burger king', 'wendys', 'restaurant'],
  'restaurant': ['fast food', 'dining', 'food'],
  'shein': ['fast fashion', 'ecommerce', 'fashion', 'retail'],
  'balenciaga': ['fashion', 'luxury', 'brand', 'designer'],
  'met gala': ['fashion', 'vogue', 'anna wintour', 'red carpet'],
  'reddit': ['social media', 'rddt', 'stock', 'wallstreetbets'],
  'wallstreetbets': ['reddit', 'wsb', 'stocks', 'meme stock'],
  'wsb': ['wallstreetbets', 'reddit', 'stocks'],
};

export default {
  computeImprovedScore,
  extractNumericContexts,
  getCategoryCoherenceBonus,
  getRecencyBoost,
  GAMING_SYNONYMS,
  MUSIC_SYNONYMS,
  SOCIAL_STREAMING_SYNONYMS,
};
