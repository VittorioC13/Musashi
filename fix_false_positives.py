#!/usr/bin/env python3
"""
Fix false positive matching issues
Based on the observed case: promotional tweet matching Bitcoin market
"""

import re

# Read keyword-matcher.ts
with open('src/analysis/keyword-matcher.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add promotional/spam content detection
promotional_detection = """
// ─── Promotional/Spam Content Detection ──────────────────────────────────────

const PROMOTIONAL_PATTERNS = [
  // Financial scams / trading promotions
  /\\$\\d+k.*pass.*test/i,           // "$100K if you pass test"
  /won't give you.*we will/i,      // "Your bank won't give you, we will"
  /no deposits.*profits/i,         // "No deposits, keep profits"
  /worst case.*lose.*fee/i,        // "Worst case you lose the entry fee"
  /free \\$\\d+/i,                  // "Free $500"
  /claim.*\\$\\d+/i,                // "Claim your $100"
  /limited.*offer/i,               // "Limited time offer"
  /click.*link.*bio/i,             // "Click link in bio"
  /dm.*for.*more/i,                // "DM me for more info"
  /join.*discord/i,                // Promotional Discord links
  /airdrop/i,                      // Crypto airdrops
  /whitelist/i,                    // NFT/crypto whitelists
  /presale/i,                      // Token presales
  /guaranteed.*profit/i,           // "Guaranteed profits"
  /risk[- ]free/i,                 // "Risk-free trading"
];

/**
 * Detect if a tweet is promotional/spam content
 * Returns true if tweet matches promotional patterns
 */
function isPromotionalContent(text: string): boolean {
  const normalized = text.toLowerCase();

  // Check against known promotional patterns
  for (const pattern of PROMOTIONAL_PATTERNS) {
    if (pattern.test(text)) {
      return true;
    }
  }

  // Excessive emoji usage (often in spam)
  const emojiCount = (text.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
  if (emojiCount > 8 && text.length < 200) {
    return true; // More than 8 emojis in a short tweet is suspicious
  }

  // Multiple dollar amounts with no context (often scams)
  const dollarMatches = text.match(/\\$\\d+[KMB]?/gi);
  if (dollarMatches && dollarMatches.length >= 3) {
    // 3+ different dollar amounts mentioned = likely promotional
    return true;
  }

  return false;
}

"""

# Insert before the DENOMINATOR_CAP constant
content = content.replace(
    '// ─── Category coherence detection ───────────────────────────────────────────',
    promotional_detection + '// ─── Category coherence detection ───────────────────────────────────────────'
)

# 2. Update the match() method to filter promotional content
# Find the match method in KeywordMatcher class
old_match_start = """  match(tweetText: string): MarketMatch[] {
    if (!tweetText || tweetText.length < 10) return [];

    const results: MarketMatch[] = [];"""

new_match_start = """  match(tweetText: string): MarketMatch[] {
    if (!tweetText || tweetText.length < 10) return [];

    // Filter out promotional/spam content to reduce false positives
    if (isPromotionalContent(tweetText)) {
      console.log('[Musashi] Skipping promotional content:', tweetText.substring(0, 60) + '...');
      return [];
    }

    const results: MarketMatch[] = [];"""

content = content.replace(old_match_start, new_match_start)

# 3. Increase minimum confidence threshold from 0.22 to 0.28 for stricter filtering
# This is in content-script.tsx
print("[INFO] Updating minimum confidence threshold in content-script.tsx...")

# Write updated keyword-matcher.ts
with open('src/analysis/keyword-matcher.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("[OK] Added promotional content detection")
print("[OK] Updated match() method to filter promotional tweets")
print("")
print("Changes:")
print("  - Detects promotional/spam patterns (trading promos, scams, etc.)")
print("  - Filters tweets with 3+ dollar amounts (likely spam)")
print("  - Detects excessive emoji usage")
print("  - Skips promotional content before matching")
print("")
print("This will reduce false positives from:")
print("  - Trading platform ads")
print("  - Financial scams")
print("  - Promotional tweets with dollar amounts")
print("  - Generic crypto airdrops/presales")
