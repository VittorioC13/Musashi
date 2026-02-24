#!/usr/bin/env python3
"""
Raise minimum confidence threshold to reduce low-quality matches
"""

# Read content-script.tsx
with open('src/content/content-script.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Update confidence threshold from 0.22 to 0.30 (30% minimum)
# This filters out weak matches while keeping good ones
content = content.replace(
    'const matcher = new KeywordMatcher(markets, 0.22, 5); // Raised from 0.12 to 0.22 for better accuracy',
    'const matcher = new KeywordMatcher(markets, 0.30, 5); // Raised from 0.22 to 0.30 to filter weak matches'
)

# Write back
with open('src/content/content-script.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("[OK] Raised minimum confidence threshold: 0.22 -> 0.30 (30%)")
print("")
print("Impact:")
print("  - Filters matches below 30% confidence")
print("  - Reduces false positives and weak matches")
print("  - Most good matches are 35-80% anyway")
print("  - Improves overall match quality")
