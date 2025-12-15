/*
  Web-compatible shim for Chrome extension APIs
  Also simplifies UI for web/mobile use
*/
"use strict";

(function() {
    const isWebApp = typeof chrome === 'undefined' ||
                     typeof chrome.runtime === 'undefined' ||
                     typeof chrome.runtime.getURL === 'undefined';

    if (!isWebApp) return;

    let messages = {};

    // Create chrome namespace and mark as web shim
    window.chrome = window.chrome || {};
    window.chrome.__webShim = true;

    // i18n API shim
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

    // runtime API shim
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

    // tabs API shim
    window.chrome.tabs = {
        create: (options) => {
            if (options.url) window.open(options.url, '_blank');
        },
        query: (query, callback) => callback([])
    };

    // storage API shim
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

    // Load messages
    async function init() {
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

    function onDOMReady() {
        translateDOM();
        simplifyUI();
    }

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

    function simplifyUI() {
        // Rename buttons for clarity
        const loadBtn = document.getElementById('loadAndAnalyseButton');
        if (loadBtn) loadBtn.textContent = 'Load';

        const packBtn = document.getElementById('packEpubButton');
        if (packBtn) packBtn.textContent = 'Download EPUB';

        // Simplify labels
        const startingUrlLabel = document.querySelector('#startingUrlRow td:first-child');
        if (startingUrlLabel) startingUrlLabel.textContent = 'Book URL';

        // Add placeholder to URL input
        const urlInput = document.getElementById('startingUrlInput');
        if (urlInput) urlInput.placeholder = 'Paste story URL here...';

        // Add "More Options" toggle after the input section
        const inputSection = document.getElementById('inputSection');
        if (inputSection && !document.getElementById('moreOptionsToggle')) {
            const toggle = document.createElement('button');
            toggle.id = 'moreOptionsToggle';
            toggle.type = 'button';
            toggle.textContent = 'More Options';
            toggle.onclick = function() {
                document.body.classList.toggle('show-options');
                this.textContent = document.body.classList.contains('show-options')
                    ? 'Hide Options'
                    : 'More Options';
            };
            inputSection.parentNode.insertBefore(toggle, inputSection.nextSibling);
        }

        // Simplify chapter count display
        const chapterCountLabel = document.querySelector('td:has(#spanChapterCount)');
        if (chapterCountLabel) {
            const countSpan = document.getElementById('spanChapterCount');
            if (countSpan) {
                // Move count outside table structure for cleaner display
                const outputSection = document.getElementById('outputSection');
                if (outputSection) {
                    const countDiv = document.createElement('div');
                    countDiv.id = 'chapterCountDisplay';
                    countDiv.style.cssText = 'color: #a1a1aa; font-size: 13px; margin-bottom: 12px;';

                    // Update count display when it changes
                    const observer = new MutationObserver(() => {
                        const count = countSpan.textContent;
                        countDiv.textContent = count ? `${count} chapters` : '';
                    });
                    observer.observe(countSpan, { childList: true, characterData: true, subtree: true });
                }
            }
        }
    }

    // Re-run after main.js initializes
    window.addEventListener('load', function() {
        setTimeout(() => {
            translateDOM();
            simplifyUI();
        }, 150);
    });

    init();
})();
