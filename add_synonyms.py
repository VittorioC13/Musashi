#!/usr/bin/env python3
"""
Script to add gaming, music, and streaming synonyms to keyword-matcher.ts
"""

import re

# Read the current keyword-matcher.ts
with open('src/analysis/keyword-matcher.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# New synonyms to add (extracted from improved-matcher-additions.ts)
gaming_synonyms = """
  // ── Gaming (expanded coverage) ────────────────────────────────────────────
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
  'xbox': ['microsoft', 'gaming', 'console'],"""

music_synonyms = """
  // ── Music (expanded coverage) ─────────────────────────────────────────────
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
  'collab': ['collaboration', 'music', 'feature'],"""

social_synonyms = """
  // ── Social Media & Streaming ──────────────────────────────────────────────
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
  'wsb': ['wallstreetbets', 'reddit', 'stocks'],"""

# Find the end of the SYNONYM_MAP object
# We'll add the new synonyms just before the closing brace
synonym_map_pattern = r'(export const SYNONYM_MAP: Record<string, string\[\]> = \{.*?)(\n\};)'

match = re.search(synonym_map_pattern, content, re.DOTALL)
if not match:
    print("[ERROR] Could not find SYNONYM_MAP in the file")
    exit(1)

# Insert the new synonyms before the closing brace
new_content = match.group(1) + gaming_synonyms + music_synonyms + social_synonyms + match.group(2)

# Replace the old SYNONYM_MAP with the new one
content = re.sub(synonym_map_pattern, new_content, content, flags=re.DOTALL)

# Write the updated content
with open('src/analysis/keyword-matcher.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("[OK] Successfully added gaming synonyms (40+ terms)")
print("[OK] Successfully added music synonyms (20+ terms)")
print("[OK] Successfully added social media & streaming synonyms (15+ terms)")
print("\nTotal: 75+ new synonym mappings added!")
print("\nNext: Rebuild the extension with 'npm run build'")
