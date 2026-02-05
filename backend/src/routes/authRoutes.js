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

module.exports = router;
