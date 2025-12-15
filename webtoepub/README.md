# WebToEpub Web

A web-hosted version of [WebToEpub](https://github.com/dteviot/WebToEpub) that runs in any browser without requiring extension installation.

## Architecture

This project wraps the original WebToEpub browser extension to run as a standalone web app.

### Directory Structure

```
webtoepub/
├── app/                    # Next.js app (web wrapper)
│   ├── api/proxy/route.js  # CORS proxy for external requests
│   ├── layout.js           # Root layout
│   └── page.js             # Redirects to popup.html
├── public/                 # Static files (original extension code)
│   ├── css/
│   │   ├── mobile.css      # WEB-ONLY: Mobile styling + element hiding
│   │   └── *.css           # Original extension CSS
│   ├── js/
│   │   ├── web-shim.js     # WEB-ONLY: Chrome API shims
│   │   ├── HttpClient.js   # MODIFIED: Proxy support (search for WEB-MOD)
│   │   ├── main.js         # MODIFIED: Web app detection (search for WEB-MOD)
│   │   └── *.js            # Original extension JS
│   ├── popup.html          # Main UI (modified to include web-shim.js)
│   └── _locales/           # i18n messages
├── package.json            # Dependencies (Next.js, React)
└── vercel.json             # Vercel deployment config
```

### Modified Files

Files with `WEB-MOD` comments can be updated from upstream by preserving the marked sections:

1. **HttpClient.js** - Proxy support for CORS
   - Top: `isWebApp` detection and `proxyUrl()` function
   - `wrapFetchImpl()`: Routes through proxy, handles redirect URLs
   - `setDeclarativeNetRequestRules()`: Skipped in web mode

2. **main.js** - Web app initialization
   - `isRunningAsWebApp()`: Detects web mode
   - `window.onload`: Handles web app startup

3. **popup.html** - Entry point
   - Added viewport meta tag
   - Added mobile.css link
   - Added web-shim.js as first script

### Web-Only Files (Not in Original Extension)

These files are completely new and don't need merging:

- `app/` - Next.js wrapper
- `public/js/web-shim.js` - Chrome API shims
- `public/css/mobile.css` - Mobile styling
- `package.json`, `vercel.json` - Build config

## Updating from Upstream

1. Clone the latest WebToEpub from https://github.com/dteviot/WebToEpub
2. Copy files from `plugin/` to `public/`, preserving:
   - `web-shim.js` (keep as-is)
   - `mobile.css` (keep as-is)
   - `popup.html` modifications (viewport, CSS link, web-shim script)
3. Re-apply `WEB-MOD` sections to:
   - `HttpClient.js`
   - `main.js`

## How It Works

1. **CORS Proxy**: `/api/proxy` fetches external URLs server-side to bypass CORS
2. **Chrome API Shims**: `web-shim.js` provides fake chrome.i18n, chrome.runtime, chrome.tabs, chrome.storage
3. **Mobile UI**: `mobile.css` hides non-essential options, adds Metadata/Advanced toggles

## Deployment

Deploy to Vercel:
```bash
vercel --prod
```

Or run locally:
```bash
npm install
npm run dev
```

## Usage

1. Paste a book URL (e.g., from Royal Road, Archive of Our Own, etc.)
2. Click "Load" to analyze chapters
3. Select chapters (or use defaults)
4. Click "Download EPUB"
