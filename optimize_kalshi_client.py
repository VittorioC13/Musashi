#!/usr/bin/env python3
"""
Script to optimize Kalshi client for better market coverage
"""

import re

# Read the Kalshi client file
with open('src/api/kalshi-client.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Update the default maxPages from 8 to 15
content = content.replace(
    'maxPages = 8,',
    'maxPages = 15,'
)

# Update the targetSimpleCount default from 150 to 400 to match our service worker call
content = content.replace(
    'targetSimpleCount = 150,',
    'targetSimpleCount = 400,'
)

# Write back
with open('src/api/kalshi-client.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("[OK] Updated Kalshi client defaults:")
print("  - targetSimpleCount: 150 -> 400 markets")
print("  - maxPages: 8 -> 15 pages")
print("")
print("This ensures Kalshi pagination can fetch enough markets to reach the target.")
