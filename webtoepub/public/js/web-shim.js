/*
  Web-compatible shim for Chrome extension APIs
  Must be loaded FIRST before any other scripts
*/
"use strict";

(function() {
    // Check if running as web app (not extension)
    const isWebApp = typeof chrome === 'undefined' ||
                     typeof chrome.runtime === 'undefined' ||
                     typeof chrome.runtime.getURL === 'undefined';

    if (!isWebApp) return;

    // Messages storage
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
            if (options.url) {
                window.open(options.url, '_blank');
            }
        },
        query: (query, callback) => {
            callback([]);
        }
    };

    // storage API shim (uses localStorage)
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

    // Load messages and translate DOM
    async function init() {
        try {
            const response = await fetch('/_locales/en/messages.json');
            messages = await response.json();
        } catch (e) {
            console.error('Failed to load i18n messages:', e);
        }

        // Translate when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', translateDOM);
        } else {
            translateDOM();
        }
    }

    function translateDOM() {
        // Replace __MSG_*__ in text content
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            null,
            false
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

        // Translate button text content
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

    // Override window.onload to handle web mode
    const originalOnload = window.onload;
    window.addEventListener('load', function() {
        // Force web mode initialization
        if (isWebApp) {
            // Set a fake query param to make isRunningInTabMode return true-ish behavior
            // but we'll handle it differently
            initWebMode();
        }
    });

    function initWebMode() {
        // This runs after main.js sets up window.onload
        // We need to re-trigger initialization in a web-friendly way
        setTimeout(() => {
            translateDOM();
        }, 100);
    }

    init();
})();
