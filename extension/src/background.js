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
        const url = new URL(tab.url);

        // Check if the URL matches our backend success page
        if (url.origin === 'http://localhost:3001' && url.pathname === '/api/auth/success') {
            const token = url.searchParams.get('token');

            if (token) {
                console.log('Detected auth token in URL, saving...');

                // Save token to storage
                chrome.storage.local.set({ authToken: token }, () => {
                    console.log('Auth token saved successfully');

                    // Close the success tab after a short delay
                    setTimeout(() => {
                        chrome.tabs.remove(tabId);

                        // Try to reopen the popup automatically (Chrome 127+)
                        if (chrome.action && chrome.action.openPopup) {
                            chrome.action.openPopup().catch(err => {
                                console.log('Automatic popup open failed (might require user gesture):', err);
                            });
                        }
                    }, 500);
                });
            }
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
