# DrLee IDE - Deployment Guide

## Netlify Deployment (Recommended)

DrLee IDE is a **100% client-side application** that runs entirely in the browser. No backend server required!

### Quick Deploy to Netlify

#### Option 1: One-Click Deploy

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy)

#### Option 2: CLI Deploy

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build the project
npm run build

# Deploy to Netlify
netlify deploy --prod
```

#### Option 3: GitHub Integration

1. Push your code to GitHub
2. Go to [Netlify](https://app.netlify.com)
3. Click "New site from Git"
4. Select your repository
5. Build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
6. Click "Deploy site"

### Configuration

The `netlify.toml` file is already configured with:
- Build settings
- Security headers
- CORS headers for WebAssembly
- Cache optimization
- Client-side routing redirects

### What Gets Deployed?

The built site (~464KB) includes:
- HTML/CSS/JavaScript (minified)
- Monaco Editor integration
- Runtime loaders for Python, SQLite, TypeScript

### What Gets Loaded from CDN?

These are loaded on-demand when users select a language:
- **Monaco Editor**: ~3MB (VS Code editor)
- **Pyodide**: ~6.5MB (Python 3.11 + standard library)
- **sql.js**: ~2MB (SQLite database)
- **TypeScript Compiler**: ~3MB (for transpilation)

### How It Works in Production

1. **User opens your Netlify site** → Loads ~464KB static files
2. **User selects Python** → Browser downloads Pyodide from CDN (~6.5MB, cached)
3. **User writes code** → All execution happens in browser via WebAssembly
4. **User saves file** → Stored in browser's IndexedDB (no server)

### Performance Optimizations

✅ **First load**: Fast (~464KB)
✅ **Language runtimes**: Lazy-loaded on demand
✅ **CDN caching**: Monaco Editor, Pyodide, sql.js cached by browser
✅ **Static assets**: Cached for 1 year
✅ **Gzip compression**: Enabled automatically by Netlify

## Other Deployment Options

### Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

Create `vercel.json`:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### GitHub Pages

```bash
# Build the project
npm run build

# Deploy to gh-pages branch
npm install -g gh-pages
gh-pages -d dist
```

### Cloudflare Pages

1. Go to Cloudflare Pages
2. Connect your GitHub repository
3. Build settings:
   - **Build command**: `npm run build`
   - **Build output**: `dist`

### Self-Hosted (Any Static Host)

Just upload the `dist/` folder to any static file host:
- Apache
- Nginx
- AWS S3 + CloudFront
- Google Cloud Storage
- Azure Static Web Apps

Make sure to configure:
- Serve `index.html` for all routes (SPA routing)
- Enable gzip compression
- Set proper CORS headers for WebAssembly

## Browser Requirements

DrLee IDE requires modern browsers with:
- ✅ WebAssembly support (all modern browsers)
- ✅ IndexedDB (for file storage)
- ✅ ES6+ JavaScript
- ✅ Async/await support

**Supported Browsers**:
- Chrome/Edge 90+
- Firefox 90+
- Safari 15+
- Opera 75+

## Production Checklist

Before deploying:

- [ ] Run `npm run build` locally to verify build works
- [ ] Test the preview: `npm run preview`
- [ ] Verify all languages work
- [ ] Test file save/load functionality
- [ ] Check browser console for errors
- [ ] Test on mobile devices (responsive design)
- [ ] Verify theme toggle works
- [ ] Test keyboard shortcuts

## Monitoring & Analytics

Add analytics to track usage:

```html
<!-- Add to index.html <head> -->

<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=YOUR_GA_ID"></script>

<!-- Plausible Analytics (Privacy-friendly) -->
<script defer data-domain="yourdomain.com" src="https://plausible.io/js/script.js"></script>
```

## Troubleshooting

### Build fails on Netlify
- Check Node version (use 18+)
- Verify `package.json` dependencies
- Check build logs for errors

### WebAssembly doesn't work
- Verify CORS headers are set (already in `netlify.toml`)
- Check browser console for security errors
- Ensure HTTPS is enabled (required for SharedArrayBuffer)

### Large initial load time
- This is normal - Pyodide is 6.5MB
- It's only loaded when user selects Python
- Browser caches it after first load

### Files don't persist
- Files are stored in browser's IndexedDB
- Clearing browser data will delete files
- Consider adding export/import functionality

## Cost Estimate

Netlify Free Tier includes:
- ✅ 100GB bandwidth/month
- ✅ 300 build minutes/month
- ✅ Custom domain
- ✅ HTTPS
- ✅ Instant cache invalidation

**Expected costs**: $0/month for typical usage (free tier is sufficient)

## Support

If you encounter deployment issues:
1. Check browser console for errors
2. Review Netlify build logs
3. Verify `netlify.toml` configuration
4. Test production build locally: `npm run preview`
