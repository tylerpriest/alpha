/*
  WebToEpub Web Shim
  ==================

  This file provides Chrome extension API compatibility for running
  WebToEpub as a standalone web app (instead of a browser extension).

  It provides:
  1. Chrome API shims (i18n, runtime, tabs, storage)
  2. i18n message translation for __MSG_*__ placeholders
  3. State-based UI management (has-book, has-chapters classes)

  This file should load BEFORE any other extension scripts.
*/
"use strict";

(function() {
    // Only run if Chrome extension APIs are not available
    const isWebApp = typeof chrome === 'undefined' ||
                     typeof chrome.runtime === 'undefined' ||
                     typeof chrome.runtime.getURL === 'undefined';

    if (!isWebApp) return;

    let messages = {};

    /* ============================================================
       CHROME API SHIMS
       ============================================================ */

    window.chrome = window.chrome || {};
    window.chrome.__webShim = true;

    // chrome.i18n
    window.chrome.i18n = {
        getMessage: function(key, substitutions) {
            const entry = messages[key] || messages['__MSG_' + key + '__'];
            if (!entry) return key;
            let msg = entry.message || key;
            if (substitutions) {
                const subs = Array.isArray(substitutions) ? substitutions : [substitutions];
                subs.forEach((sub, i) => {
                    msg = msg.replace(new RegExp('\\$' + (i + 1), 'g'), sub);
                    if (entry.placeholders) {
                        Object.keys(entry.placeholders).forEach(name => {
                            const placeholder = entry.placeholders[name];
                            if (placeholder.content === '$' + (i + 1)) {
                                msg = msg.replace(new RegExp('\\$' + name + '\\$', 'gi'), sub);
                            }
                        });
                    }
                });
            }
            return msg;
        },
        getUILanguage: () => 'en'
    };

    // chrome.runtime
    window.chrome.runtime = {
        getURL: (path) => '/' + path.replace(/^\//, ''),
        getManifest: () => ({ version: '1.0.0-web', name: 'WebToEpub Web' }),
        lastError: null,
        onMessage: {
            hasListener: () => false,
            addListener: () => {},
            removeListener: () => {}
        }
    };

    // chrome.tabs
    window.chrome.tabs = {
        create: (options) => {
            if (options.url) window.open(options.url, '_blank');
        },
        query: (query, callback) => callback([])
    };

    // chrome.storage
    window.chrome.storage = {
        local: {
            get: (keys, callback) => {
                const result = {};
                const keyList = Array.isArray(keys) ? keys : [keys];
                keyList.forEach(key => {
                    const val = localStorage.getItem('webtoepub_' + key);
                    if (val) result[key] = JSON.parse(val);
                });
                if (callback) callback(result);
                return Promise.resolve(result);
            },
            set: (items, callback) => {
                Object.keys(items).forEach(key => {
                    localStorage.setItem('webtoepub_' + key, JSON.stringify(items[key]));
                });
                if (callback) callback();
                return Promise.resolve();
            }
        }
    };

    /* ============================================================
       INITIALIZATION
       ============================================================ */

    async function init() {
        // Register service worker for PWA
        registerServiceWorker();

        try {
            const response = await fetch('/_locales/en/messages.json');
            messages = await response.json();
        } catch (e) {
            console.error('Failed to load i18n messages:', e);
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', onDOMReady);
        } else {
            onDOMReady();
        }
    }

    function registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(() => {});
        }
    }

    // Extract URL from shared text (handles "Check this out: https://..." etc)
    function extractUrlFromText(text) {
        if (!text) return null;
        // If text is already a URL, return it
        if (text.startsWith('http://') || text.startsWith('https://')) {
            return text.split(/\s/)[0]; // Get just the URL part
        }
        // Try to find URL in text
        const urlMatch = text.match(/https?:\/\/[^\s]+/);
        return urlMatch ? urlMatch[0] : null;
    }

    function onDOMReady() {
        translateDOM();
        setupUI();
        observeStateChanges();
        // Show body after translations complete
        document.body.classList.add('ready');
    }

    /* ============================================================
       i18n TRANSLATION
       ============================================================ */

    function translateDOM() {
        const walker = document.createTreeWalker(
            document.body, NodeFilter.SHOW_TEXT, null, false
        );
        const textNodes = [];
        while (walker.nextNode()) {
            if (walker.currentNode.textContent.includes('__MSG_')) {
                textNodes.push(walker.currentNode);
            }
        }
        textNodes.forEach(node => {
            node.textContent = translateString(node.textContent);
        });

        document.querySelectorAll('button, option, td, th, .i18n, label, p').forEach(el => {
            if (el.childNodes.length === 1 && el.childNodes[0].nodeType === Node.TEXT_NODE) {
                el.textContent = translateString(el.textContent);
            }
        });
    }

    function translateString(str) {
        return str.replace(/__MSG_([^_]+(?:_[^_]+)*)__/g, (match, key) => {
            const fullKey = '__MSG_' + key + '__';
            const entry = messages[fullKey];
            return entry ? entry.message : match;
        });
    }

    /* ============================================================
       UI SETUP
       ============================================================ */

    function setupUI() {
        // Rename buttons
        const loadBtn = document.getElementById('loadAndAnalyseButton');
        if (loadBtn) {
            loadBtn.textContent = 'Load';
            // Add loading state
            const origClick = loadBtn.onclick;
            loadBtn.addEventListener('click', function() {
                this.textContent = 'Loading...';
                this.disabled = true;
            });
        }

        const packBtn = document.getElementById('packEpubButton');
        if (packBtn) packBtn.textContent = 'Download EPUB';

        // Simplify URL label
        const startingUrlRow = document.querySelector('tr:has(#startingUrlInput)');
        if (startingUrlRow) {
            const label = startingUrlRow.querySelector('td:first-child');
            if (label) label.textContent = 'Book URL';
        }

        // Setup URL input
        const urlInput = document.getElementById('startingUrlInput');
        if (urlInput) {
            urlInput.placeholder = 'Paste story URL here...';

            // Check for URL in query params (from share target or direct link)
            const urlParams = new URLSearchParams(window.location.search);
            let sharedUrl = urlParams.get('url');

            // Share target might pass URL in 'text' param instead
            if (!sharedUrl) {
                const textParam = urlParams.get('text');
                if (textParam) {
                    sharedUrl = extractUrlFromText(textParam);
                }
            }

            if (sharedUrl) {
                urlInput.value = sharedUrl;
                // Clean up URL bar
                window.history.replaceState({}, '', window.location.pathname);
                // Auto-load when URL comes from share target
                setTimeout(() => {
                    const loadBtn = document.getElementById('loadAndAnalyseButton');
                    if (loadBtn) loadBtn.click();
                }, 500);
            } else {
                // Restore last URL from localStorage
                const lastUrl = localStorage.getItem('webtoepub_lastUrl');
                if (lastUrl && !urlInput.value) {
                    urlInput.value = lastUrl;
                }
            }

            // Save URL on change
            urlInput.addEventListener('change', function() {
                if (this.value) {
                    localStorage.setItem('webtoepub_lastUrl', this.value);
                }
            });
        }

        // Add toggle buttons
        addToggleButtons();

        // Add helper text
        addHelperText();
    }

    function addToggleButtons() {
        const progressSection = document.querySelector('.progressSection');
        if (!progressSection || document.getElementById('optionsToggles')) return;

        const container = document.createElement('div');
        container.id = 'optionsToggles';

        // Metadata toggle
        const metaBtn = document.createElement('button');
        metaBtn.id = 'metadataToggle';
        metaBtn.type = 'button';
        metaBtn.textContent = 'Metadata';
        metaBtn.onclick = function() {
            document.body.classList.toggle('show-metadata');
            this.textContent = document.body.classList.contains('show-metadata')
                ? 'Hide Metadata' : 'Metadata';
        };

        // Advanced toggle
        const advBtn = document.createElement('button');
        advBtn.id = 'advancedToggle';
        advBtn.type = 'button';
        advBtn.textContent = 'Advanced';
        advBtn.onclick = function() {
            document.body.classList.toggle('show-advanced');
            this.textContent = document.body.classList.contains('show-advanced')
                ? 'Hide Advanced' : 'Advanced';
        };

        container.appendChild(metaBtn);
        container.appendChild(advBtn);

        // Insert after progress section
        progressSection.parentNode.insertBefore(container, progressSection.nextSibling);
    }

    function addHelperText() {
        const loadBtn = document.getElementById('loadAndAnalyseButton');
        if (!loadBtn || document.getElementById('webHelperText')) return;

        const helper = document.createElement('p');
        helper.id = 'webHelperText';
        helper.innerHTML = 'Supports Royal Road, Archive of Our Own, Wattpad,<br>and 200+ other sites';

        // Insert after the URL row's container
        const urlRow = loadBtn.closest('tr');
        if (urlRow && urlRow.nextSibling) {
            urlRow.parentNode.insertBefore(helper, urlRow.nextSibling);
        }
    }

    /* ============================================================
       STATE OBSERVATION
       Watches for book/chapter data and adds appropriate classes
       ============================================================ */

    function observeStateChanges() {
        // Watch title input for book data
        const titleInput = document.getElementById('titleInput');
        if (titleInput) {
            // Check initial state
            checkBookState(titleInput);

            // Watch for changes
            const titleObserver = new MutationObserver(() => checkBookState(titleInput));
            titleObserver.observe(titleInput, { attributes: true, attributeFilter: ['value'] });

            // Also listen for input events
            titleInput.addEventListener('input', () => checkBookState(titleInput));
            titleInput.addEventListener('change', () => checkBookState(titleInput));

            // Periodic check as fallback (value can be set programmatically)
            setInterval(() => checkBookState(titleInput), 500);
        }

        // Watch chapter table for chapters
        const chapterTable = document.getElementById('chapterUrlsTable');
        if (chapterTable) {
            const chapterObserver = new MutationObserver(checkChapterState);
            chapterObserver.observe(chapterTable, { childList: true, subtree: true });

            // Initial check
            checkChapterState();
        }

        // Watch error section to reset Load button on errors
        const errorSection = document.getElementById('errorSection');
        if (errorSection) {
            const errorObserver = new MutationObserver(() => {
                if (!errorSection.hidden) {
                    const loadBtn = document.getElementById('loadAndAnalyseButton');
                    if (loadBtn) {
                        loadBtn.textContent = 'Load';
                        loadBtn.disabled = false;
                    }
                }
            });
            errorObserver.observe(errorSection, { attributes: true, attributeFilter: ['hidden'] });
        }
    }

    function checkBookState(titleInput) {
        const hasBook = titleInput && titleInput.value && titleInput.value.trim() !== '';
        document.body.classList.toggle('has-book', hasBook);

        // Reset Load button when book loads
        if (hasBook) {
            const loadBtn = document.getElementById('loadAndAnalyseButton');
            if (loadBtn && loadBtn.disabled) {
                loadBtn.textContent = 'Load';
                loadBtn.disabled = false;
            }
        }
    }

    function checkChapterState() {
        const chapterRows = document.querySelectorAll('#chapterUrlsTable tbody tr');
        const hasChapters = chapterRows.length > 0;
        document.body.classList.toggle('has-chapters', hasChapters);

        // Reset Load button when chapters load (loading is complete)
        if (hasChapters) {
            const loadBtn = document.getElementById('loadAndAnalyseButton');
            if (loadBtn && loadBtn.disabled) {
                loadBtn.textContent = 'Load';
                loadBtn.disabled = false;
            }
        }
    }

    /* ============================================================
       POST-LOAD HOOK
       Re-run after main.js initializes
       ============================================================ */

    window.addEventListener('load', function() {
        setTimeout(() => {
            translateDOM();
            setupUI();

            // Force state check
            const titleInput = document.getElementById('titleInput');
            if (titleInput) checkBookState(titleInput);
            checkChapterState();
        }, 200);
    });

    init();
})();
