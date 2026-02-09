// For local development
const API_BASE_URL = 'http://localhost:3001/api';

// For production (Render)
// const API_BASE_URL = 'https://meetextension-2p8b.onrender.com/api';

/**
 * Get stored auth token
 */
export async function getToken() {
    return new Promise((resolve) => {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.get(['authToken'], (result) => {
                resolve(result.authToken || null);
            });
        } else {
            // Fallback for development
            resolve(localStorage.getItem('authToken'));
        }
    });
}

/**
 * Save auth token
 */
export async function saveToken(token) {
    return new Promise((resolve) => {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.set({ authToken: token }, () => {
                resolve(true);
            });
        } else {
            localStorage.setItem('authToken', token);
            resolve(true);
        }
    });
}

/**
 * Clear auth token
 */
export async function clearToken() {
    return new Promise((resolve) => {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.remove(['authToken'], () => {
                resolve(true);
            });
        } else {
            localStorage.removeItem('authToken');
            resolve(true);
        }
    });
}

/**
 * Make authenticated API request
 */
async function apiRequest(endpoint, options = {}) {
    const token = await getToken();

    const config = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
            ...options.headers
        }
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'API request failed');
    }

    return data;
}

/**
 * Check if user is authenticated
 */
export async function checkAuth() {
    try {
        const token = await getToken();
        if (!token) return { authenticated: false };

        const result = await apiRequest('/auth/validate');
        return { authenticated: true, user: result.user };
    } catch (error) {
        return { authenticated: false };
    }
}

/**
 * Get OAuth URL
 */
export function getAuthUrl() {
    return `${API_BASE_URL}/auth/google`;
}

/**
 * Generate meeting from prompt
 */
export async function generateMeeting(prompt, userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone, meetingPlatform = 'google_meet') {
    return apiRequest('/generate-meeting', {
        method: 'POST',
        body: JSON.stringify({ prompt, userTimezone, meetingPlatform })
    });
}

/**
 * Preview meeting without creating
 */
export async function previewMeeting(prompt, userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone) {
    return apiRequest('/preview-meeting', {
        method: 'POST',
        body: JSON.stringify({ prompt, userTimezone })
    });
}
/**
 * Generate meeting immediately without AI parsing
 */
export async function quickGenerateMeeting(userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone, meetingPlatform = 'google_meet') {
    return apiRequest('/quick-generate', {
        method: 'POST',
        body: JSON.stringify({ userTimezone, meetingPlatform })
    });
}
