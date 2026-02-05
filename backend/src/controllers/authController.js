const jwt = require('jsonwebtoken');
const { google } = require('googleapis');
const { getAuthUrl, getTokensFromCode, getOAuth2Client } = require('../config/google');

/**
 * Initiate Google OAuth flow
 */
function initiateAuth(req, res) {
  const { extId } = req.query;
  const state = extId ? JSON.stringify({ extId }) : undefined;

  const authUrl = getAuthUrl();
  // Add state to the URL if we have an extension ID
  const urlWithState = state ? `${authUrl}&state=${encodeURIComponent(state)}` : authUrl;

  res.redirect(urlWithState);
}

/**
 * Handle OAuth callback
 */
async function handleCallback(req, res) {
  const { code, error, state: stateParam } = req.query;

  let extId = null;
  if (stateParam) {
    try {
      const stateObj = JSON.parse(stateParam);
      extId = stateObj.extId;
    } catch (e) {
      console.warn('Failed to parse state param:', e);
    }
  }

  if (error) {
    return res.redirect(`/auth-error.html?error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return res.status(400).json({ error: 'Authorization code missing' });
  }

  try {
    // Exchange code for tokens
    const tokens = await getTokensFromCode(code);

    // Get user info
    const oauth2Client = getOAuth2Client(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();

    // Create JWT with tokens and user info
    const jwtPayload = {
      userId: userInfo.id,
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
      tokens: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date
      }
    };

    const jwtToken = jwt.sign(jwtPayload, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    // Redirect to a success page that the extension can easily monitor
    res.redirect(`/api/auth/success?token=${jwtToken}&name=${encodeURIComponent(userInfo.name)}`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).json({ error: 'Authentication failed: ' + error.message });
  }
}

/**
 * Verify JWT token middleware
 */
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}

/**
 * Get current user info
 */
function getCurrentUser(req, res) {
  res.json({
    userId: req.user.userId,
    email: req.user.email,
    name: req.user.name,
    picture: req.user.picture
  });
}

/**
 * Validate token endpoint
 */
function validateToken(req, res) {
  res.json({ valid: true, user: req.user.email });
}

/**
 * Serve the success page
 */
function serveSuccessPage(req, res) {
  const { token, name } = req.query;

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Connecting...</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
          background: #09090b;
          color: white;
        }
        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(255,255,255,0.1);
          border-top-color: #6366f1;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      </style>
    </head>
    <body>
      <div style="text-align: center;">
        <div class="spinner" style="margin: 0 auto 20px;"></div>
        <h2 style="margin-bottom: 5px;">Success!</h2>
        <p style="color: #a1a1aa; margin: 0;">Linking to extension...</p>
      </div>
      <script>
        // Tab will be closed by background.js, 
        // but this is a fallback to close fast
        setTimeout(() => window.close(), 2000);
      </script>
    </body>
    </html>
  `);
}

module.exports = {
  initiateAuth,
  handleCallback,
  serveSuccessPage,
  verifyToken,
  getCurrentUser,
  validateToken
};
