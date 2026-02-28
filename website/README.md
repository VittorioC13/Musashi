# Musashi Website - Demo Page

Beautiful landing page showcasing Musashi's AI agent intelligence for prediction markets.

## 🎨 Design Inspiration

Inspired by [taste.ink](https://taste.ink) - clean, elegant, serif typography with split-screen terminal comparison.

## 📁 Files

- `index.html` - Main landing page
- `styles.css` - Elegant styling with terminal aesthetics
- `script.js` - Interactive animations and easter eggs

## 🚀 Deployment Options

### Option 1: Vercel (Recommended)

1. Push website folder to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import repository
4. Set root directory to `website`
5. Deploy!
6. Add custom domain: `musashi.bot`

### Option 2: Netlify

1. Drag and drop `website` folder to [netlify.com/drop](https://app.netlify.com/drop)
2. Add custom domain: `musashi.bot`

### Option 3: GitHub Pages

1. Create `gh-pages` branch
2. Copy website files to root
3. Enable GitHub Pages in settings
4. Add CNAME file with `musashi.bot`

### Option 4: Cloudflare Pages

1. Go to [pages.cloudflare.com](https://pages.cloudflare.com)
2. Connect GitHub repository
3. Set build directory to `website`
4. Deploy

## 🌐 Custom Domain Setup

### DNS Configuration for musashi.bot:

**For Vercel:**
```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

**For Netlify:**
```
Type: A
Name: @
Value: 75.2.60.5

Type: CNAME
Name: www
Value: [your-site].netlify.app
```

**For Cloudflare Pages:**
```
Type: CNAME
Name: @
Value: [your-site].pages.dev

Type: CNAME
Name: www
Value: [your-site].pages.dev
```

## ✨ Features

- **Split-screen comparison** - "Without Musashi" vs "With Musashi"
- **Terminal aesthetics** - Mac-style window chrome with syntax highlighting
- **Smooth animations** - Fade-ins, parallax, hover effects
- **Responsive design** - Works on mobile, tablet, desktop
- **Easter egg** - Konami code (↑↑↓↓←→←→BA) shows live API response
- **Performance optimized** - Fast loading, minimal dependencies

## 🎯 Key Sections

1. **Hero** - "Without Musashi, your agents lose every trade"
2. **Demo** - Interactive terminal comparison
3. **Stats** - 124 markets, ∞ bots, 192ms response
4. **CTA** - Try API / View Docs buttons

## 🎨 Color Palette

- Background: `#ffffff` (white)
- Text: `#1a1a1a` (near-black)
- Terminal: `#1e1e1e` (dark gray)
- Success: `#10b981` (green)
- Error: `#ef4444` (red)
- Critical: `#ff6b6b` (bright red)
- Gradient: `#667eea` → `#764ba2` (purple gradient)

## 🔤 Typography

- **Headers**: Cormorant Garamond (serif, elegant)
- **Body**: Inter (sans-serif, clean)
- **Code**: Monaco, Menlo (monospace)

## 📱 Test Locally

```bash
# Option 1: Python
cd website
python -m http.server 8000

# Option 2: Node.js
npx http-server website -p 8000

# Option 3: Just open in browser
open index.html
```

Then visit: `http://localhost:8000`

## 🐛 Debug

- Open browser console (F12)
- Check for errors
- Try Konami code: ↑↑↓↓←→←→BA for live API test

## 💡 Customization

Edit these sections in `index.html`:
- Hero headline
- Terminal dialogue
- Stats numbers
- CTA text

Edit `styles.css` for:
- Colors (CSS variables)
- Fonts
- Spacing
- Animations

## 📈 Analytics (Optional)

Add Google Analytics or Plausible:

```html
<!-- Add before </head> in index.html -->
<script defer data-domain="musashi.bot" src="https://plausible.io/js/script.js"></script>
```

## 🎉 Launch Checklist

- [ ] Test on desktop
- [ ] Test on mobile
- [ ] Check all links work
- [ ] Verify API endpoint responds
- [ ] Set up custom domain
- [ ] Add SSL certificate (automatic on Vercel/Netlify)
- [ ] Test in multiple browsers
- [ ] Share on Twitter/Discord

---

**Live site**: https://musashi.bot (once deployed)
**API**: https://musashi-api.vercel.app
**GitHub**: https://github.com/VittorioC13/Musashi
