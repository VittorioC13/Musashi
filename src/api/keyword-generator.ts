// Auto-generates keywords from a Kalshi market title.
// Kalshi markets don't ship with a keywords array, so we derive one
// by tokenizing the title, building bigrams/trigrams, and expanding
// through the same SYNONYM_MAP the matcher uses.

import { SYNONYM_MAP } from '../analysis/keyword-matcher';

const TITLE_STOPS = new Set([
  'will', 'the', 'a', 'an', 'in', 'on', 'at', 'by', 'for', 'to', 'of',
  'and', 'or', 'is', 'be', 'has', 'have', 'are', 'was', 'were', 'been',
  'do', 'does', 'did', '2024', '2025', '2026', '2027', '2028', 'before',
  'after', 'end', 'yes', 'no', 'than', 'over', 'under', 'above', 'below',
  'hit', 'reach', 'win', 'lose', 'pass', 'major', 'us', 'use', 'its',
  'their', 'any', 'all', 'into', 'out', 'up', 'down', 'as', 'from',
  'with', 'this', 'that', 'not', 'new', 'more', 'than', 'most', 'least',
  'how', 'what', 'when', 'where', 'who', 'get', 'got', 'put', 'set',
  'per', 'via', 'vs', 'vs.',
]);

/** Generate unigrams + bigrams + trigrams from a string */
function tokenize(text: string): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s'&]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(w => w.length > 0);

  const tokens: string[] = [...words];
  for (let i = 0; i < words.length - 1; i++) {
    tokens.push(words[i] + ' ' + words[i + 1]);
  }
  for (let i = 0; i < words.length - 2; i++) {
    tokens.push(words[i] + ' ' + words[i + 1] + ' ' + words[i + 2]);
  }
  return tokens;
}

/**
 * Given a market title, returns a keyword array suitable for KeywordMatcher.
 *
 * Strategy:
 * 1. Tokenize title into unigrams/bigrams/trigrams
 * 2. Filter stop words from single tokens
 * 3. For each token, look up in SYNONYM_MAP and add all synonyms
 * 4. Also do a reverse lookup: if a token matches any SYNONYM_MAP value,
 *    add the corresponding key (so "fed" in title → adds "jerome powell" etc.)
 * 5. Deduplicate and return
 */
export function generateKeywords(title: string): string[] {
  const allTokens = tokenize(title);
  const keywords = new Set<string>();

  for (const token of allTokens) {
    const isPhrase = token.includes(' ');

    // For single words, apply stop-word filter
    if (!isPhrase) {
      if (token.length <= 2 || TITLE_STOPS.has(token)) continue;
    } else {
      // For phrases, only skip very short ones
      if (token.length <= 4) continue;
    }

    keywords.add(token);

    // Forward lookup: token is a key in SYNONYM_MAP
    const forwardSyns = SYNONYM_MAP[token];
    if (forwardSyns) {
      for (const s of forwardSyns) keywords.add(s);
    }
  }

  // Reverse lookup: for each SYNONYM_MAP entry, check if any value
  // is present in our current keyword set and add the key
  for (const [key, values] of Object.entries(SYNONYM_MAP)) {
    for (const val of values) {
      if (keywords.has(val)) {
        keywords.add(key);
        // Also add the key's other synonyms
        const keySyns = SYNONYM_MAP[key];
        if (keySyns) keySyns.forEach(s => keywords.add(s));
        break;
      }
    }
  }

  return Array.from(keywords);
}
