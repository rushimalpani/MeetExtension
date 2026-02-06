const express = require('express');
const {
    initiateAuth,
    handleCallback,
    serveSuccessPage,
    verifyToken,
    getCurrentUser,
    validateToken
} = require('../controllers/authController');

const router = express.Router();

// Initiate OAuth flow
router.get('/google', initiateAuth);

// OAuth callback
router.get('/google/callback', handleCallback);

// Success page for automatic auth detection
router.get('/success', serveSuccessPage);

// Get current user (protected)
router.get('/me', verifyToken, getCurrentUser);

// Validate token
router.get('/validate', verifyToken, validateToken);

// Diagnostic endpoint (safe)
router.get('/diag', (req, res) => {
    res.json({
        node_env: process.env.NODE_ENV,
        has_client_id: !!process.env.GOOGLE_CLIENT_ID,
        has_client_secret: !!process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        has_jwt_secret: !!process.env.JWT_SECRET,
        has_ai_key: !!process.env.AI_API_KEY
    });
});

module.exports = router;
