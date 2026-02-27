# Musashi API Documentation

This folder contains all API-related documentation for Musashi.

## 📚 Documentation Files

### For Developers & AI Agent Builders

1. **`API_DOCUMENTATION.md`** ⭐ **START HERE**
   - Complete API reference
   - All endpoints documented
   - Code examples (Python, JavaScript, cURL)
   - Request/response schemas
   - Use cases for AI agents

2. **`api-docs.html`** 🌐
   - Interactive web version of the API docs
   - Beautiful UI with examples
   - Open in browser for best experience
   - Also live at: https://musashi-api.vercel.app/api-docs.html

### For Deployment & Maintenance

3. **`API_DEPLOYMENT_GUIDE.md`** 🚀
   - How to deploy to Vercel
   - Local development setup
   - Environment configuration
   - Troubleshooting guide
   - Monitoring and logs

4. **`DEPLOYMENT_STATUS.md`** ✅
   - Current deployment status
   - What's working / what needs fixing
   - Quick debug commands
   - Deployment checklist

### For Understanding the System

5. **`MUSASHI_V2_HYBRID_ARCHITECTURE.md`** 🏗️
   - Complete system architecture
   - How extension + API work together
   - File structure explanation
   - Agent integration patterns
   - Future roadmap

6. **`SUCCESS_SUMMARY.md`** 🎯
   - Deployment completion summary
   - Quick links and status
   - How to test everything
   - Metrics and accomplishments

---

## 🚀 Quick Links

- **Live API**: https://musashi-api.vercel.app/api/analyze-text
- **GitHub**: https://github.com/VittorioC13/Musashi
- **Test Endpoint**: https://musashi-api.vercel.app/api/test

---

## 📖 Recommended Reading Order

**If you're new:**
1. Read `SUCCESS_SUMMARY.md` - Get overview
2. Read `API_DOCUMENTATION.md` - Understand the API
3. Open `api-docs.html` in browser - See interactive examples

**If you're deploying:**
1. Read `API_DEPLOYMENT_GUIDE.md` - Deployment steps
2. Check `DEPLOYMENT_STATUS.md` - Current status

**If you're building an agent:**
1. Read `API_DOCUMENTATION.md` - API reference
2. Check code examples section
3. Test with the live API

---

## 🤖 Quick API Example

```bash
# Test the API right now
curl -X POST https://musashi-api.vercel.app/api/analyze-text \
  -H "Content-Type: application/json" \
  -d '{"text": "Bitcoin just crossed 100k", "maxResults": 3}'
```

---

*Last updated: February 27, 2026*
