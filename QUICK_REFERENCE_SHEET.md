# Musashi Matching System - Quick Reference Sheet

## 🎯 The System in One Sentence
**"We read tweets, find relevant prediction markets from our database, score how well they match, and show the best ones to users."**

---

## 📊 Current Stats

| Metric | Value |
|--------|-------|
| **Total Markets** | ~1,400 |
| **Platforms** | Polymarket (1,000) + Kalshi (400) |
| **Minimum Confidence** | 30% |
| **Categories** | 7 main (Politics, Crypto, Tech, Sports, etc.) |
| **Synonyms** | 75+ new gaming/music/streaming terms |
| **False Positive Filter** | 15+ promotional patterns |

---

## 🔄 How It Works (5 Steps)

```
1. DETECT → Watch for new tweets on user's timeline
2. EXTRACT → Pull out key words ("Bitcoin", "$150K")
3. FILTER → Skip spam/promotional content
4. MATCH → Search 1,400 markets for keyword matches
5. SCORE → Calculate confidence, show top matches
```

---

## 💯 Scoring Formula (Simplified)

```
Score = (Exact×1.0 + Synonyms×0.5 + Title×0.15) / Total Keywords

Then add bonuses:
+ Multi-word match: +12%
+ Category match: +8-15%
+ Ending soon: +5-10%

Minimum to show: 30%
```

---

## 🎯 Recent Improvements (Feb 2024)

✅ **2x Market Coverage** (700 → 1,400 markets)
✅ **Spam Filtering** (blocks trading ads, scams)
✅ **Better Synonyms** (75+ new terms for gaming/music)
✅ **Stricter Threshold** (22% → 30% minimum)
✅ **Category Bonuses** (detects topic clusters)

---

## 🚀 Top 3 Improvement Ideas

### 1️⃣ **User Feedback** (Easy, 1 week)
- Add "Not Relevant" button
- Learn what users don't want
- Quick win!

### 2️⃣ **Manifold Markets** (Medium, 2 weeks)
- 3x more markets (5,000+ total)
- Free API, easy integration
- Huge coverage boost

### 3️⃣ **Machine Learning** (Hard, 6 weeks)
- Learn from user clicks
- Personalized matching
- Long-term investment

---

## ❓ Top 5 Questions to Ask Engineer

1. **"What's our current false positive rate?"**
   → Measures accuracy

2. **"Which improvement would have biggest impact?"**
   → Engineer's expert opinion

3. **"Can we add Manifold Markets easily?"**
   → Quick path to 3x more coverage

4. **"Do we have data to start ML?"**
   → Future-proofing question

5. **"What keeps you up at night about the system?"**
   → Uncover hidden concerns

---

## 🎨 Examples to Understand Better

### Good Match (82% confidence) ✅
```
Tweet: "Bitcoin to $150K by year end?"
Market: "Will Bitcoin reach $150,000 in February?"

Why matched:
- "Bitcoin" exact match ✓
- "$150K" exact match ✓
- Crypto category bonus ✓
- High confidence → SHOW IT
```

### Filtered Spam (0% - blocked) 🚫
```
Tweet: "Your bank won't give you $100K. We will!"
Market: Bitcoin markets

Why blocked:
- "$100K" + "pass test" = Trading ad pattern
- Promotional content detected
- FILTERED BEFORE MATCHING
```

### Too Weak (18% - not shown) 📉
```
Tweet: "Best burger ever 🍔"
Market: "Will McDonald's bring back McRib?"

Why not shown:
- Only "burger" ≈ "fast food" synonym match
- 18% confidence < 30% minimum
- TOO WEAK, NOT SHOWN
```

---

## 📋 Meeting Agenda Template

**1. Review Current System** (15 min)
- How matching works
- Performance metrics
- Pain points

**2. Discuss Recent Changes** (10 min)
- Spam filtering results
- Confidence threshold impact

**3. Future Improvements** (30 min)
- User feedback button
- Manifold Markets
- ML approach
- Prioritization

**4. Technical Q&A** (20 min)
- Deep dive on scoring
- Performance concerns
- Feasibility discussion

**5. Next Steps** (10 min)
- Agree on priorities
- Timeline
- Success metrics

---

## ⚠️ Common Pitfalls to Avoid

❌ **Don't say**: "Just make it better"
✅ **Do say**: "Can we reduce false positives by 50%?"

❌ **Don't say**: "Why can't you just add ML?"
✅ **Do say**: "What would we need to implement ML?"

❌ **Don't say**: "This should be easy"
✅ **Do say**: "What's the complexity here?"

❌ **Don't say**: "Our competitors do X"
✅ **Do say**: "Could we explore X approach?"

---

## 🎯 Success Metrics to Track

### Current Baseline:
- Match rate: ~30-45% of tweets
- False positives: ~15-20%
- Avg confidence: ~40-60%

### After Improvements:
- Match rate: **50-60%** (with Manifold)
- False positives: **<10%** (with feedback loop)
- Avg confidence: **50-70%** (with ML)

---

## 💡 Analogy for Non-Technical Explanation

**"It's like a librarian helping readers find books:**

**Current System**: Librarian matches by reading book titles and descriptions

**With User Feedback**: Librarian learns which books you return vs keep

**With More Libraries**: Librarian has 3x more books to recommend from

**With ML**: Librarian remembers what you liked before and gets smarter over time

**With Semantics**: Librarian understands "mystery thriller" means you might like "detective novels" too"

---

## 📞 Follow-Up Actions

After the meeting:

✅ **Document decisions** in a shared doc
✅ **Set timeline** for agreed features
✅ **Define success metrics** (how we'll measure)
✅ **Schedule check-in** (weekly or bi-weekly)
✅ **Track progress** on a simple board

---

## 🎓 Jargon Decoder (Quick Reference)

| Engineer Says | You Understand As |
|--------------|-------------------|
| "Tokenization" | Breaking text into words |
| "High latency" | Too slow |
| "Low precision" | Too many wrong matches |
| "Low recall" | Missing good matches |
| "API rate limit" | Can't make too many requests |
| "Cache miss" | Had to fetch fresh data |
| "Cold start" | New user, no history |
| "Embeddings" | Math representation of meaning |
| "Threshold tuning" | Adjusting the minimum score |

---

## ✅ Pre-Meeting Checklist

- [ ] Read the full explanation doc
- [ ] Review recent changes (spam filter, threshold)
- [ ] Know your top 3 priorities
- [ ] Prepare specific questions
- [ ] Understand success metrics
- [ ] Be ready to discuss trade-offs

---

## 🚀 Post-Meeting Checklist

- [ ] Shared meeting notes with engineer
- [ ] Documented agreed next steps
- [ ] Set timeline for features
- [ ] Defined success metrics
- [ ] Scheduled follow-up
- [ ] Updated roadmap

---

**Print this page and bring to your meeting! 📄**

Quick answers to questions you might get asked.

---

**Last Updated**: Feb 24, 2026
**Next Review**: After engineer discussion
**Owner**: You + Engineer
