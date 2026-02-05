const { parseMeetingRequest } = require('../services/aiService');
const { createMeetingEvent } = require('../services/calendarService');
const { convertTimezone, formatTimeDisplay } = require('../services/timezoneService');
const { generateEmail } = require('../services/emailService');

/**
 * Generate meeting from natural language prompt
 * POST /api/generate-meeting
 */
async function generateMeeting(req, res) {
    try {
        const { prompt, userTimezone = 'UTC' } = req.body;
        const { tokens, name: userName } = req.user;

        if (!prompt || typeof prompt !== 'string') {
            return res.status(400).json({ error: 'Missing or invalid prompt' });
        }

        if (prompt.length > 1000) {
            return res.status(400).json({ error: 'Prompt too long (max 1000 characters)' });
        }

        console.log(`[Meeting] Processing request from ${req.user.email}: "${prompt.substring(0, 50)}..."`);

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

        // Step 3: Create calendar event
        let calendarResult = null;
        let meetLink = null;

        if (meetingData.generateMeet) {
            try {
                calendarResult = await createMeetingEvent(meetingData, tokens, userTimezone);
                meetLink = calendarResult.meetLink;
                console.log('[Meeting] Calendar event created:', calendarResult.eventId);
            } catch (calError) {
                console.error('[Meeting] Calendar error:', calError.message);
                // Continue without calendar - still provide the parsed data
            }
        }

        // Step 4: Generate email
        const timeInfo = {
            localTime: formatTimeDisplay(meetingData.date, meetingData.time, userTimezone),
            foreignTime: formatTimeDisplay(meetingData.date, meetingData.time, meetingData.timezone)
        };

        const email = generateEmail(meetingData, meetLink, timeInfo, userName);

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
        const { userTimezone = 'UTC' } = req.body;
        const { tokens, name: userName } = req.user;

        console.log(`[QuickMeeting] Processing request from ${req.user.email}`);

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

        // Create calendar event directly
        const calendarResult = await createMeetingEvent(meetingData, tokens, userTimezone);
        const meetLink = calendarResult.meetLink;

        console.log('[QuickMeeting] Calendar event created:', calendarResult.eventId);

        // Generate email with default metadata
        const timeInfo = {
            localTime: formatTimeDisplay(meetingData.date, meetingData.time, userTimezone),
            foreignTime: formatTimeDisplay(meetingData.date, meetingData.time, userTimezone)
        };

        const email = generateEmail(meetingData, meetLink, timeInfo, userName);

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
