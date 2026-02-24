#!/usr/bin/env python3
"""
Script to increase market coverage in Musashi AI
Increases fetch limits for both Polymarket and Kalshi
"""

import re

# Read the service worker file
with open('src/background/service-worker.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Current: fetchPolymarkets(500, 10)
# New: fetchPolymarkets(1000, 15)
content = content.replace(
    'fetchPolymarkets(500, 10)',
    'fetchPolymarkets(1000, 15)'
)

# Current: fetchKalshiMarkets(200, 10)
# New: fetchKalshiMarkets(400, 15)
content = content.replace(
    'fetchKalshiMarkets(200, 10)',
    'fetchKalshiMarkets(400, 15)'
)

# Write back
with open('src/background/service-worker.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("[OK] Increased Polymarket fetch: 500 -> 1000 markets (10 -> 15 pages)")
print("[OK] Increased Kalshi fetch: 200 -> 400 markets (10 -> 15 pages)")
print("")
print("Expected total markets: ~1400 (up from ~700)")
print("")
print("This will provide:")
print("  - 2x more market coverage")
print("  - Better matching for niche topics")
print("  - More diverse categories (gaming, music, entertainment, etc.)")
print("")
print("Next: Rebuild with 'npm run build'")
