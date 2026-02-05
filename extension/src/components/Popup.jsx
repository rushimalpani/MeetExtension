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

  async function checkAuthStatus() {
    setIsLoading(true);
    try {
      const { authenticated, user } = await checkAuth();
      setIsAuthenticated(authenticated);
      setUserEmail(user || '');
      if (authenticated) {
        setIsLinking(false); // Done linking
      }
    } catch (err) {
      console.error('Auth check failed:', err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLogout() {
    await clearToken(); // Assuming 'logout' was a typo and should be 'clearToken' as per existing import
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
  }

  function handleMeetingError(err) {
    setError(err.message);
    setResult(null);
  }

  function handleBack() {
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
            <button onClick={handleLogout} className="logout-btn" title="Logout">⬅️</button>
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
        <p>Powered by AI • Made with ❤️</p>
      </footer>
    </div>
  );
}
