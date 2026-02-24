#!/usr/bin/env python3
"""
Script to integrate improved matching features into keyword-matcher.ts (v2 - safer)
"""

import re

# Read the original keyword-matcher.ts
with open('src/analysis/keyword-matcher.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Check if already integrated
if 'CATEGORY_CLUSTERS' in content:
    print("[INFO] Helper functions already integrated, skipping...")
else:
    # Helper functions to add
    helper_functions = """
// ─── Category coherence detection ───────────────────────────────────────────

// Category-related term clusters for coherence detection
const CATEGORY_CLUSTERS: Record<string, Set<string>> = {
  gaming: new Set(['gaming', 'video game', 'console', 'esports', 'pc', 'steam', 'playstation', 'xbox', 'nintendo', 'switch', 'gta', 'minecraft', 'valorant']),
  crypto: new Set(['crypto', 'cryptocurrency', 'bitcoin', 'ethereum', 'btc', 'eth', 'blockchain', 'defi', 'web3', 'solana', 'nft']),
  music: new Set(['music', 'album', 'tour', 'concert', 'artist', 'song', 'single', 'spotify', 'streaming music', 'coachella', 'festival']),
  tech: new Set(['tech', 'technology', 'ai', 'software', 'startup', 'silicon valley', 'coding', 'developer', 'nvidia', 'openai']),
  sports: new Set(['sports', 'team', 'championship', 'playoff', 'season', 'athlete', 'coach', 'league', 'nfl', 'nba']),
  politics: new Set(['politics', 'election', 'congress', 'president', 'senate', 'house', 'vote', 'bill', 'policy']),
  finance: new Set(['stock', 'stocks', 'market', 'trading', 'wall street', 'ipo', 'shares', 'investor']),
};

/**
 * Detects category coherence - gives bonus when tweet contains multiple related terms
 * from the same category, indicating strong topical focus
 */
function getCategoryCoherenceBonus(matchedKeywords: string[], marketCategory: string): number {
  for (const [category, terms] of Object.entries(CATEGORY_CLUSTERS)) {
    const matchedInCategory = matchedKeywords.filter(kw => terms.has(kw.toLowerCase())).length;

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
function getRecencyBoost(market: Market): number {
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
 * Numeric context detection
 * Helps match price targets, dates, percentages mentioned in tweets
 */
function extractNumericContexts(text: string): Set<string> {
  const contexts = new Set<string>();

  // Price targets: $100, $50K, $1M, etc.
  const priceMatches = text.matchAll(/\\$(\\d+(?:,\\d{3})*(?:\\.\\d+)?[KMB]?)/gi);
  for (const match of priceMatches) {
    contexts.add(`price:${match[1].toLowerCase()}`);
  }

  // Percentages: 5%, 10%, etc.
  const percentMatches = text.matchAll(/(\\d+(?:\\.\\d+)?)%/g);
  for (const match of percentMatches) {
    contexts.add(`percent:${match[1]}`);
  }

  // Years: 2024-2029, etc.
  const yearMatches = text.matchAll(/\\b(202[4-9])\\b/g);
  for (const match of yearMatches) {
    contexts.add(`year:${match[1]}`);
  }

  return contexts;
}

"""

    # Insert helper functions before "const DENOMINATOR_CAP"
    content = content.replace(
        'const DENOMINATOR_CAP = 5;',
        helper_functions + 'const DENOMINATOR_CAP = 5;'
    )
    print("[OK] Added helper functions (category coherence, recency boost, numeric contexts)")

# Update the computeScore function signature
if 'function computeScore(r: MatchCounts, market: Market, matchedKeywords: string[])' in content:
    print("[INFO] computeScore signature already updated, skipping...")
else:
    content = content.replace(
        'function computeScore(r: MatchCounts): number {',
        'function computeScore(r: MatchCounts, market: Market, matchedKeywords: string[]): number {'
    )
    print("[OK] Updated computeScore function signature")

# Add coherence and recency bonuses before the final return in computeScore
if 'coherenceBonus = getCategoryCoherenceBonus' in content:
    print("[INFO] Bonus calculations already added, skipping...")
else:
    old_return = '  return Math.min(1.0, normalized + (totalMatched > 0 ? coverageBonus : 0) + phraseBonus);\n}'
    new_return = '''  // Category coherence bonus
  const coherenceBonus = getCategoryCoherenceBonus(matchedKeywords, market.category || '');

  // Recency boost
  const recencyBoost = getRecencyBoost(market);

  return Math.min(1.0, normalized + (totalMatched > 0 ? coverageBonus : 0) + phraseBonus + coherenceBonus + recencyBoost);
}'''

    content = content.replace(old_return, new_return)
    print("[OK] Added category coherence and recency bonuses to scoring")

# Update the call to computeScore to include the new parameters
if 'computeScore({\n      exactMatches,\n      synonymMatches,\n      titleMatches,\n      totalChecked: explicitKeywords.length,\n      multiWordMatches,\n    }, market, matchedKeywords)' in content:
    print("[INFO] computeScore call already updated, skipping...")
else:
    old_call = '''    const confidence = computeScore({
      exactMatches,
      synonymMatches,
      titleMatches,
      totalChecked: explicitKeywords.length,
      multiWordMatches,
    });'''

    new_call = '''    const confidence = computeScore({
      exactMatches,
      synonymMatches,
      titleMatches,
      totalChecked: explicitKeywords.length,
      multiWordMatches,
    }, market, matchedKeywords);'''

    content = content.replace(old_call, new_call)
    print("[OK] Updated computeScore call with new parameters")

# Write the updated content
with open('src/analysis/keyword-matcher.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("\n[SUCCESS] Improved scoring algorithm integration complete!")
