import React, { useState, useEffect } from 'react';
import MeetingForm from './MeetingForm';
import ResultPreview from './ResultPreview';
import AuthSection from './AuthSection';
import { checkAuth, clearToken } from '../services/api';

export default function Popup() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuthStatus();
    loadCachedResult(); // Load cached meeting result on mount

    // Listen for storage changes (for automatic login)
    const listener = (changes, area) => {
      if (area === 'local' && changes.authToken) {
        checkAuthStatus();
      }
    };

    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.onChanged.addListener(listener);
    }

    return () => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.onChanged.removeListener(listener);
      }
    };
  }, []);

  // Load cached meeting result from chrome.storage
  async function loadCachedResult() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      try {
        const data = await chrome.storage.local.get('cachedMeetingResult');
        if (data.cachedMeetingResult) {
          setResult(data.cachedMeetingResult);
        }
      } catch (err) {
        console.error('Failed to load cached result:', err);
      }
    }
  }

  // Save meeting result to chrome.storage
  async function saveCachedResult(data) {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      try {
        await chrome.storage.local.set({ cachedMeetingResult: data });
      } catch (err) {
        console.error('Failed to save cached result:', err);
      }
    }
  }

  // Clear cached meeting result from chrome.storage
  async function clearCachedResult() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      try {
        await chrome.storage.local.remove('cachedMeetingResult');
      } catch (err) {
        console.error('Failed to clear cached result:', err);
      }
    }
  }

  async function checkAuthStatus() {
    setIsLoading(true);
    setError(null); // Clear previous errors
    try {
      const { authenticated, user } = await checkAuth();
      setIsAuthenticated(authenticated);
      setUserEmail(user || '');
      if (authenticated) {
        setIsLinking(false); // Done linking
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      // Fall back to not authenticated state silently
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLogout() {
    await clearToken();
    await clearCachedResult(); // Clear cached meeting on logout
    setIsAuthenticated(false);
    setUserEmail('');
    setResult(null);
  }

  function handleLoginStart() {
    setIsLinking(true);
  }

  function handleMeetingSuccess(data) {
    setResult(data);
    setError(null);
    saveCachedResult(data); // Cache the new meeting result
  }

  function handleMeetingError(err) {
    setError(err.message);
    setResult(null);
  }

  function handleBack() {
    // Don't clear cached result - just go back to form
    // The cached result will be shown when user reopens extension
    setResult(null);
    setError(null);
  }

  return (
    <div className="popup">
      <header className="header">
        <div className="logo">
          <img src="/icon128.png" alt="Logo" className="logo-img" />
          <h1>Gmeet Scheduler</h1>
        </div>
        {isAuthenticated && (
          <div className="user-info">
            <span className="user-email" title={userEmail}>{userEmail}</span>

            <button onClick={handleLogout} className="logout-btn" title="Logout" style={{ color: '#ff4d4f' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </button>
          </div>
        )}
      </header>

      <main className="content">
        {isLoading && !isLinking ? (
          <div className="auth-card">
            <div className="spinner" style={{ margin: '0 auto 20px' }}></div>
            <h2>Checking connection...</h2>
            <p>Please wait while we verify your session.</p>
          </div>
        ) : isLinking ? (
          <div className="auth-card">
            <div className="spinner" style={{ margin: '0 auto 20px' }}></div>
            <h2>Linking your account...</h2>
            <p>Complete the login in your browser.</p>
          </div>
        ) : (
          isAuthenticated ? (
            result ? (
              <ResultPreview result={result} onBack={handleBack} />
            ) : (
              <MeetingForm onSuccess={handleMeetingSuccess} onError={handleMeetingError} />
            )
          ) : (
            <AuthSection onAuthenticated={checkAuthStatus} onLoginStart={handleLoginStart} />
          )
        )}

        {error && (
          <div className="error-message">
            <span>⚠️</span>
            <p>{error}</p>
            <button onClick={() => setError(null)}>✕</button>
          </div>
        )}
      </main>

      <footer className="footer">
        <p>Powered by Gmeet Scheduler © 2026
</p>
      </footer>
    </div>
  );
}
