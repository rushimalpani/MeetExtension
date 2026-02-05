const express = require('express');
const { body, validationResult } = require('express-validator');
const { verifyToken } = require('../controllers/authController');
const { generateMeeting, previewMeeting, quickGenerateMeeting } = require('../controllers/meetingController');

const router = express.Router();

// Validation middleware
const validateMeetingRequest = [
    body('prompt')
        .trim()
        .notEmpty()
        .withMessage('Prompt is required')
        .isLength({ max: 1000 })
        .withMessage('Prompt must be less than 1000 characters'),
    body('userTimezone')
        .optional()
        .isString()
        .withMessage('Timezone must be a string'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }
        next();
    }
];

// Generate meeting (full flow with calendar)
router.post(
    '/generate-meeting',
    verifyToken,
    validateMeetingRequest,
    generateMeeting
);

// Preview meeting (parse only, no calendar)
router.post(
    '/preview-meeting',
    verifyToken,
    validateMeetingRequest,
    previewMeeting
);

// Quick generate meeting (skips AI)
router.post(
    '/quick-generate',
    verifyToken,
    quickGenerateMeeting
);

module.exports = router;
