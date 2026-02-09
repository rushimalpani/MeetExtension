/**
 * Meeting Link Service
 * Handles platform-specific meeting link generation
 */

const MEETING_PLATFORMS = {
    GOOGLE_MEET: 'google_meet',
    MICROSOFT_TEAMS: 'microsoft_teams',
    ZOOM: 'zoom'
};

const PLATFORM_CONFIG = {
    [MEETING_PLATFORMS.GOOGLE_MEET]: {
        name: 'Google Meet',
        icon: '🎥',
        color: '#00897B',
        joinText: 'Join Google Meet'
    },
    [MEETING_PLATFORMS.MICROSOFT_TEAMS]: {
        name: 'Teams',
        icon: '👥',
        color: '#6264A7',
        joinText: 'Join Teams Meeting'
    },
    [MEETING_PLATFORMS.ZOOM]: {
        name: 'Zoom',
        icon: '📹',
        color: '#2D8CFF',
        joinText: 'Join Zoom Meeting'
    }
};

/**
 * Validate if a platform is supported
 * @param {string} platform - Platform identifier
 * @returns {boolean}
 */
function isValidPlatform(platform) {
    return Object.values(MEETING_PLATFORMS).includes(platform);
}

/**
 * Get platform display configuration
 * @param {string} platform - Platform identifier
 * @returns {Object} Platform config
 */
function getPlatformConfig(platform) {
    return PLATFORM_CONFIG[platform] || PLATFORM_CONFIG[MEETING_PLATFORMS.GOOGLE_MEET];
}

/**
 * Generate a Microsoft Teams meeting deep link
 * Uses the Teams URL scheme for instant meetings
 * @param {Object} meetingData - Meeting details
 * @returns {Object} Link generation result
 */
function generateTeamsLink(meetingData) {
    try {
        // Generate a unique meeting ID
        const meetingId = `teams-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Teams deep link for scheduling/joining meetings
        // This creates a "Meet Now" style link that opens Teams
        const subject = encodeURIComponent(meetingData.title || 'Meeting');
        const content = encodeURIComponent(meetingData.purpose || '');

        // Microsoft Teams meeting join URL format
        // For instant meetings without Teams Graph API, we use the "Meet Now" approach
        const teamsLink = `https://teams.microsoft.com/l/meeting/new?subject=${subject}&content=${content}`;

        return {
            success: true,
            meetLink: teamsLink,
            platform: MEETING_PLATFORMS.MICROSOFT_TEAMS,
            message: 'Teams meeting link generated',
            isDeepLink: true // Indicates this opens Teams to create the meeting
        };
    } catch (error) {
        console.error('[TeamsLink] Error generating Teams link:', error.message);
        return {
            success: false,
            meetLink: null,
            platform: MEETING_PLATFORMS.MICROSOFT_TEAMS,
            error: error.message,
            fallbackMessage: 'Please create a Teams meeting manually and share the link.'
        };
    }
}

/**
 * Generate a Zoom meeting link
 * Attempts to use Zoom API if credentials are available, otherwise provides fallback
 * @param {Object} meetingData - Meeting details
 * @returns {Promise<Object>} Link generation result
 */
async function generateZoomLink(meetingData) {
    try {
        // Check if Zoom credentials are configured
        const zoomClientId = process.env.ZOOM_CLIENT_ID;
        const zoomClientSecret = process.env.ZOOM_CLIENT_SECRET;
        const zoomAccountId = process.env.ZOOM_ACCOUNT_ID;

        if (zoomClientId && zoomClientSecret && zoomAccountId) {
            // Full Zoom API integration
            const zoomLink = await createZoomMeetingViaAPI(meetingData, {
                clientId: zoomClientId,
                clientSecret: zoomClientSecret,
                accountId: zoomAccountId
            });
            return zoomLink;
        } else {
            // Fallback: Generate a Zoom "open" link
            console.log('[ZoomLink] No Zoom credentials configured, using fallback');

            // This link opens Zoom app/web to start a meeting
            const zoomStartLink = 'https://zoom.us/start/videomeeting';

            return {
                success: true,
                meetLink: zoomStartLink,
                platform: MEETING_PLATFORMS.ZOOM,
                message: 'Zoom meeting link (opens Zoom to start meeting)',
                isDeepLink: true,
                requiresManualSetup: true
            };
        }
    } catch (error) {
        console.error('[ZoomLink] Error generating Zoom link:', error.message);
        return {
            success: false,
            meetLink: null,
            platform: MEETING_PLATFORMS.ZOOM,
            error: error.message,
            fallbackMessage: 'Please create a Zoom meeting manually and share the link.'
        };
    }
}

/**
 * Create Zoom meeting via API (when credentials are available)
 * @param {Object} meetingData - Meeting details
 * @param {Object} credentials - Zoom OAuth credentials
 * @returns {Promise<Object>} Created meeting details
 */
async function createZoomMeetingViaAPI(meetingData, credentials) {
    try {
        // Get OAuth access token using Server-to-Server OAuth
        const tokenResponse = await fetch('https://zoom.us/oauth/token', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${Buffer.from(`${credentials.clientId}:${credentials.clientSecret}`).toString('base64')}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `grant_type=account_credentials&account_id=${credentials.accountId}`
        });

        if (!tokenResponse.ok) {
            throw new Error('Failed to get Zoom access token');
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        // Calculate meeting start time
        const startTime = new Date(`${meetingData.date}T${meetingData.time}:00`);
        const startTimeISO = startTime.toISOString();

        // Create the meeting
        const meetingResponse = await fetch('https://api.zoom.us/v2/users/me/meetings', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                topic: meetingData.title,
                type: 2, // Scheduled meeting
                start_time: startTimeISO,
                duration: meetingData.duration || 60,
                timezone: meetingData.timezone || 'UTC',
                agenda: meetingData.purpose,
                settings: {
                    host_video: true,
                    participant_video: true,
                    join_before_host: true,
                    mute_upon_entry: false,
                    waiting_room: false
                }
            })
        });

        if (!meetingResponse.ok) {
            const errorData = await meetingResponse.json();
            throw new Error(errorData.message || 'Failed to create Zoom meeting');
        }

        const meeting = await meetingResponse.json();

        return {
            success: true,
            meetLink: meeting.join_url,
            platform: MEETING_PLATFORMS.ZOOM,
            message: 'Zoom meeting created successfully',
            meetingId: meeting.id,
            password: meeting.password,
            hostUrl: meeting.start_url
        };
    } catch (error) {
        console.error('[ZoomAPI] Error:', error.message);
        throw error;
    }
}

/**
 * Generate meeting link for specified platform
 * @param {string} platform - Meeting platform
 * @param {Object} meetingData - Meeting details
 * @param {Object} tokens - OAuth tokens (for Google Meet)
 * @returns {Promise<Object>} Link generation result
 */
async function generateMeetingLink(platform, meetingData, tokens = null) {
    // Validate platform
    if (!isValidPlatform(platform)) {
        return {
            success: false,
            error: `Invalid platform: ${platform}. Supported platforms: ${Object.values(MEETING_PLATFORMS).join(', ')}`
        };
    }

    switch (platform) {
        case MEETING_PLATFORMS.GOOGLE_MEET:
            // Google Meet is handled by calendarService - return indicator
            return {
                success: true,
                platform: MEETING_PLATFORMS.GOOGLE_MEET,
                useCalendarService: true,
                message: 'Use calendar service for Google Meet'
            };

        case MEETING_PLATFORMS.MICROSOFT_TEAMS:
            return generateTeamsLink(meetingData);

        case MEETING_PLATFORMS.ZOOM:
            return await generateZoomLink(meetingData);

        default:
            return {
                success: false,
                error: `Platform ${platform} not implemented`
            };
    }
}

module.exports = {
    MEETING_PLATFORMS,
    PLATFORM_CONFIG,
    isValidPlatform,
    getPlatformConfig,
    generateMeetingLink,
    generateTeamsLink,
    generateZoomLink
};
