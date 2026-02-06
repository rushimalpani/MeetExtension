// Service worker for Chrome Extension
// Handles background tasks and message passing

chrome.runtime.onInstalled.addListener(() => {
    console.log('Gmeet Scheduler extension installed');
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'GET_TOKEN') {
        chrome.storage.local.get(['authToken'], (result) => {
            sendResponse({ token: result.authToken });
        });
        return true; // Required for async response
    }

    if (request.type === 'SAVE_TOKEN') {
        chrome.storage.local.set({ authToken: request.token }, () => {
            sendResponse({ success: true });
        });
        return true;
    }

    if (request.type === 'CLEAR_TOKEN') {
        chrome.storage.local.remove(['authToken'], () => {
            sendResponse({ success: true });
        });
        return true;
    }
});

// Listen for URL changes in tabs for automatic auth detection
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'loading' && tab.url) {
        try {
            const url = new URL(tab.url);
            console.log('[AuthCheck] Loading URL:', url.origin + url.pathname);

            // Check if the URL matches our backend success page
            const allowedOrigins = [
                'http://localhost:3001',
                'https://meetextension-2p8b.onrender.com'
            ];

            const isOriginMatch = allowedOrigins.includes(url.origin);
            const isPathMatch = url.pathname === '/api/auth/success';

            if (isOriginMatch && isPathMatch) {
                console.log('[AuthCheck] Auth success page detected!');
                const token = url.searchParams.get('token');

                if (token) {
                    console.log('[AuthCheck] Found token, saving to storage...');

                    // Save token to storage
                    chrome.storage.local.set({ authToken: token }, () => {
                        console.log('[AuthCheck] Token saved. Closing tab in 500ms...');

                        // Close the success tab after a short delay
                        setTimeout(() => {
                            chrome.tabs.remove(tabId);
                            console.log('[AuthCheck] Tab closed.');

                            // Try to reopen the popup automatically (Chrome 127+)
                            if (chrome.action && chrome.action.openPopup) {
                                chrome.action.openPopup().catch(err => {
                                    console.warn('[AuthCheck] Popup reopen failed:', err);
                                });
                            }
                        }, 500);
                    });
                } else {
                    console.warn('[AuthCheck] No token found in URL params');
                }
            }
        } catch (e) {
            console.error('[AuthCheck] Error parsing URL:', e);
        }
    }
});

// Handle external messages (for OAuth callback - fallback)
chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
    if (request.type === 'AUTH_SUCCESS' && request.token) {
        chrome.storage.local.set({ authToken: request.token }, () => {
            sendResponse({ success: true });
        });
        return true;
    }
});
