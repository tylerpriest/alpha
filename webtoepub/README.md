# WebToEpub Web

A web-hosted version of [WebToEpub](https://github.com/dteviot/WebToEpub) that runs in any browser without requiring extension installation.

## Architecture

This project wraps the original WebToEpub browser extension to run as a standalone web app.

### Directory Structure

```
webtoepub/
├── app/                    # Next.js app (web wrapper)
│   ├── api/proxy/route.js  # CORS proxy for external requests
│   └── layout.js           # Root layout
├── public/                 # Static files (original extension code)
│   ├── css/mobile.css      # WEB-ONLY: Mobile styling + state-based UI
│   ├── js/
│   │   ├── web-shim.js     # WEB-ONLY: Chrome API shims, PWA, state management
│   │   ├── HttpClient.js   # MODIFIED: Proxy support (search for WEB-MOD)
│   │   ├── Download.js     # MODIFIED: Anchor-based downloads (search for WEB-MOD)
│   │   └── *.js            # Original extension JS
│   ├── popup.html          # Main UI (modified for web)
│   ├── manifest.json       # WEB-ONLY: PWA manifest with share target
│   ├── sw.js               # WEB-ONLY: Service worker for PWA
│   └── _locales/en/        # i18n messages (English only)
├── package.json            # Dependencies (Next.js)
└── vercel.json             # Vercel deployment config (rewrites / to popup.html)
```

### Modified Files

Files with `WEB-MOD` comments can be updated from upstream by preserving the marked sections:

1. **HttpClient.js** - Proxy support for CORS
   - `isWebApp` detection and `proxyUrl()` function
   - Routes requests through `/api/proxy` to bypass CORS

2. **Download.js** - Web-compatible downloads
   - `isWebAppDownload` detection
   - `saveOnWebApp()`: Anchor-based downloads instead of chrome.downloads

3. **main.js** - Web app initialization
   - `isRunningAsWebApp()`: Detects web mode
   - Handles web app startup

4. **Util.js** - Safari compatibility
   - Guards against missing `chrome.runtime.getManifest`

5. **popup.html** - Entry point
   - PWA meta tags, manifest link
   - mobile.css stylesheet
   - web-shim.js as first script

### Web-Only Files (Not in Original Extension)

These files are completely new and don't need merging:

- `app/api/proxy/route.js` - CORS proxy API
- `public/js/web-shim.js` - Chrome API shims, i18n, state management
- `public/css/mobile.css` - Mobile styling, state-based visibility
- `public/manifest.json` - PWA manifest with share target
- `public/sw.js` - Service worker for PWA installation
- `package.json`, `vercel.json` - Build config

## Updating from Upstream

1. Clone the latest WebToEpub from https://github.com/dteviot/WebToEpub
2. Copy files from `plugin/` to `public/`, preserving web-only files
3. Re-apply `WEB-MOD` sections (search for the marker) to:
   - `HttpClient.js`, `Download.js`, `main.js`, `Util.js`
4. Re-apply `popup.html` modifications (PWA meta tags, mobile.css, web-shim.js)

## How It Works

1. **CORS Proxy**: `/api/proxy` fetches external URLs server-side
2. **Chrome API Shims**: `web-shim.js` provides chrome.i18n, runtime, tabs, storage
3. **State-Based UI**: Body classes (`has-book`, `has-chapters`) control visibility
4. **PWA**: Installable with share target for mobile "Share to" workflow

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
