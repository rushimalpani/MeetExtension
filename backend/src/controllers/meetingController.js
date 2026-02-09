const { parseMeetingRequest } = require('../services/aiService');
const { createMeetingEvent } = require('../services/calendarService');
const { convertTimezone, formatTimeDisplay } = require('../services/timezoneService');
const { generateEmail } = require('../services/emailService');
const {
    MEETING_PLATFORMS,
    isValidPlatform,
    getPlatformConfig,
    generateMeetingLink
} = require('../services/meetingLinkService');

/**
 * Generate meeting from natural language prompt
 * POST /api/generate-meeting
 */
async function generateMeeting(req, res) {
    try {
        const {
            prompt,
            userTimezone = 'UTC',
            meetingPlatform = MEETING_PLATFORMS.GOOGLE_MEET
        } = req.body;
        const { tokens, name: userName } = req.user;

        if (!prompt || typeof prompt !== 'string') {
            return res.status(400).json({ error: 'Missing or invalid prompt' });
        }

        if (prompt.length > 1000) {
            return res.status(400).json({ error: 'Prompt too long (max 1000 characters)' });
        }

        // Validate meeting platform
        if (!isValidPlatform(meetingPlatform)) {
            return res.status(400).json({
                error: `Invalid meeting platform. Supported: ${Object.values(MEETING_PLATFORMS).join(', ')}`
            });
        }

        console.log(`[Meeting] Processing request from ${req.user.email}: "${prompt.substring(0, 50)}..." Platform: ${meetingPlatform}`);

        // Step 1: Parse with AI
        const meetingData = await parseMeetingRequest(prompt, userTimezone);
        console.log('[Meeting] AI parsed:', JSON.stringify(meetingData));

        // Step 2: Convert timezones
        const times = convertTimezone(
            meetingData.date,
            meetingData.time,
            meetingData.timezone,
            userTimezone
        );

        // Step 3: Generate meeting link based on platform
        let calendarResult = null;
        let meetLink = null;
        let platformLinkResult = null;

        if (meetingData.generateMeet) {
            try {
                console.log(`[DEBUG] Attempting generation for platform: ${meetingPlatform}`);
                if (meetingPlatform === MEETING_PLATFORMS.GOOGLE_MEET) {
                    // Use existing calendar service for Google Meet
                    calendarResult = await createMeetingEvent(meetingData, tokens, userTimezone, meetingPlatform);
                    meetLink = calendarResult.meetLink;
                    console.log('[Meeting] Google Meet created via Calendar:', calendarResult.eventId, 'Link:', meetLink);
                } else {
                    // Generate link for other platforms
                    platformLinkResult = await generateMeetingLink(meetingPlatform, meetingData, tokens);

                    if (platformLinkResult.success) {
                        meetLink = platformLinkResult.meetLink;
                        console.log(`[Meeting] ${meetingPlatform} link generated:`, meetLink);
                    } else {
                        console.warn(`[Meeting] ${meetingPlatform} link generation failed:`, platformLinkResult.error);
                    }

                    // Still create calendar event (without Google Meet) for other platforms
                    calendarResult = await createMeetingEvent(meetingData, tokens, userTimezone, meetingPlatform, meetLink);
                    meetLink = calendarResult.meetLink; // Ensure we use the link from the calendar result
                    console.log('[Meeting] Calendar event created for', meetingPlatform, ':', calendarResult.eventId);
                }
            } catch (calError) {
                console.error('[Meeting] Calendar/Link error:', calError.message);
                // Continue without calendar - still provide the parsed data
            }
        }

        // Step 4: Generate email with platform info
        const timeInfo = {
            localTime: formatTimeDisplay(meetingData.date, meetingData.time, userTimezone),
            foreignTime: formatTimeDisplay(meetingData.date, meetingData.time, meetingData.timezone)
        };

        const platformConfig = getPlatformConfig(meetingPlatform);
        const email = generateEmail(meetingData, meetLink, timeInfo, userName, platformConfig);

        // Build response
        const response = {
            success: true,
            meeting: {
                title: meetingData.title,
                date: meetingData.date,
                time: meetingData.time,
                timezone: meetingData.timezone,
                duration: meetingData.duration,
                participants: meetingData.participants,
                purpose: meetingData.purpose
            },
            times: {
                local: {
                    formatted: timeInfo.localTime,
                    timezone: userTimezone
                },
                foreign: {
                    formatted: timeInfo.foreignTime,
                    timezone: meetingData.timezone
                }
            },
            platform: {
                id: meetingPlatform,
                name: platformConfig.name,
                icon: platformConfig.icon
            },
            calendar: calendarResult ? {
                eventId: calendarResult.eventId,
                eventLink: calendarResult.eventLink,
                created: true
            } : {
                created: false,
                message: 'Calendar event was not created'
            },
            meetLink,
            email: {
                subject: email.subject,
                body: email.body,
                htmlBody: email.htmlBody
            }
        };

        res.json(response);
    } catch (error) {
        console.error('[Meeting] Error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to generate meeting'
        });
    }
}

/**
 * Parse meeting without creating event (preview mode)
 * POST /api/preview-meeting
 */
async function previewMeeting(req, res) {
    try {
        const { prompt, userTimezone = 'UTC' } = req.body;

        if (!prompt || typeof prompt !== 'string') {
            return res.status(400).json({ error: 'Missing or invalid prompt' });
        }

        // Parse with AI
        const meetingData = await parseMeetingRequest(prompt, userTimezone);

        // Convert timezones
        const times = convertTimezone(
            meetingData.date,
            meetingData.time,
            meetingData.timezone,
            userTimezone
        );

        res.json({
            success: true,
            meeting: meetingData,
            times: {
                local: {
                    formatted: formatTimeDisplay(meetingData.date, meetingData.time, userTimezone),
                    timezone: userTimezone
                },
                foreign: {
                    formatted: formatTimeDisplay(meetingData.date, meetingData.time, meetingData.timezone),
                    timezone: meetingData.timezone
                }
            }
        });
    } catch (error) {
        console.error('[Preview] Error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to parse meeting'
        });
    }
}

/**
 * Generate meeting immediately without AI parsing
 * POST /api/quick-generate
 */
async function quickGenerateMeeting(req, res) {
    try {
        const {
            userTimezone = 'UTC',
            meetingPlatform = MEETING_PLATFORMS.GOOGLE_MEET
        } = req.body;
        const { tokens, name: userName } = req.user;

        // Validate meeting platform
        if (!isValidPlatform(meetingPlatform)) {
            return res.status(400).json({
                error: `Invalid meeting platform. Supported: ${Object.values(MEETING_PLATFORMS).join(', ')}`
            });
        }

        console.log(`[QuickMeeting] Processing request from ${req.user.email}, Platform: ${meetingPlatform}`);

        // Default meeting data
        const now = new Date();
        const meetingData = {
            title: "Quick Meeting",
            date: now.toISOString().split('T')[0],
            time: now.toTimeString().split(' ')[0].substring(0, 5),
            timezone: userTimezone,
            duration: 30,
            participants: "",
            purpose: "Quick meeting generated via Gmeet Scheduler",
            generateMeet: true
        };

        let calendarResult = null;
        let meetLink = null;

        console.log(`[DEBUG] Quick generation for platform: ${meetingPlatform}`);
        if (meetingPlatform === MEETING_PLATFORMS.GOOGLE_MEET) {
            // Use existing calendar service for Google Meet
            calendarResult = await createMeetingEvent(meetingData, tokens, userTimezone, meetingPlatform);
            meetLink = calendarResult.meetLink;
        } else {
            // Generate link for other platforms
            const platformLinkResult = await generateMeetingLink(meetingPlatform, meetingData, tokens);
            console.log(`[DEBUG] platformLinkResult for ${meetingPlatform}:`, platformLinkResult);

            if (platformLinkResult.success) {
                meetLink = platformLinkResult.meetLink;
            }

            // Create calendar event for other platforms
            calendarResult = await createMeetingEvent(meetingData, tokens, userTimezone, meetingPlatform, meetLink);
            meetLink = calendarResult.meetLink; // Ensure we use the link from the calendar result
            console.log(`[DEBUG] Final meetLink for ${meetingPlatform}:`, meetLink);
        }

        console.log('[QuickMeeting] Calendar event created:', calendarResult.eventId);

        // Generate email with platform info
        const timeInfo = {
            localTime: formatTimeDisplay(meetingData.date, meetingData.time, userTimezone),
            foreignTime: formatTimeDisplay(meetingData.date, meetingData.time, userTimezone)
        };

        const platformConfig = getPlatformConfig(meetingPlatform);
        const email = generateEmail(meetingData, meetLink, timeInfo, userName, platformConfig);

        res.json({
            success: true,
            meeting: meetingData,
            times: {
                local: {
                    formatted: timeInfo.localTime,
                    timezone: userTimezone
                },
                foreign: {
                    formatted: timeInfo.foreignTime,
                    timezone: userTimezone
                }
            },
            platform: {
                id: meetingPlatform,
                name: platformConfig.name,
                icon: platformConfig.icon
            },
            calendar: {
                eventId: calendarResult.eventId,
                eventLink: calendarResult.eventLink,
                created: true
            },
            meetLink,
            email: {
                subject: email.subject,
                body: email.body,
                htmlBody: email.htmlBody
            }
        });
    } catch (error) {
        console.error('[QuickMeeting] Error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to generate quick meeting'
        });
    }
}

module.exports = {
    generateMeeting,
    previewMeeting,
    quickGenerateMeeting
};
