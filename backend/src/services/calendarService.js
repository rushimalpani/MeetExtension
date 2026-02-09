const { google } = require('googleapis');
const { getOAuth2Client } = require('../config/google');
const { calculateMeetingTimes } = require('./timezoneService');

/**
 * Create a Google Calendar event with optional video conference
 * @param {Object} meetingData - Parsed meeting data
 * @param {Object} tokens - OAuth tokens
 * @param {string} userTimezone - User's local timezone
 * @param {string} meetingPlatform - Meeting platform (google_meet, microsoft_teams, zoom)
 * @param {string} externalMeetLink - External meeting link for non-Google Meet platforms
 * @returns {Promise<Object>} Created event with Meet link
 */
async function createMeetingEvent(meetingData, tokens, userTimezone, meetingPlatform = 'google_meet', externalMeetLink = null) {
    const auth = getOAuth2Client(tokens);
    const calendar = google.calendar({ version: 'v3', auth });

    // Calculate meeting times
    const { start, end } = calculateMeetingTimes(
        meetingData.date,
        meetingData.time,
        meetingData.duration,
        meetingData.timezone
    );

    // Build description with meeting link for non-Google Meet platforms
    let description = `Purpose: ${meetingData.purpose}\n\nParticipants: ${meetingData.participants}\n\nCreated via Gmeet Scheduler`;

    if (externalMeetLink && meetingPlatform !== 'google_meet') {
        const platformName = meetingPlatform === 'microsoft_teams' ? 'Microsoft Teams' :
            meetingPlatform === 'zoom' ? 'Zoom' : meetingPlatform;
        description = `${platformName} Meeting Link: ${externalMeetLink}\n\n${description}`;
    }

    // Build event object
    const event = {
        summary: meetingData.title,
        description,
        start,
        end,
        attendees: parseAttendees(meetingData.participants),
        reminders: {
            useDefault: false,
            overrides: [
                { method: 'email', minutes: 24 * 60 }, // 1 day before
                { method: 'popup', minutes: 30 }        // 30 minutes before
            ]
        }
    };

    // Add Google Meet only if platform is google_meet and generateMeet is true
    const shouldAddGoogleMeet = meetingPlatform === 'google_meet' && meetingData.generateMeet;

    if (shouldAddGoogleMeet) {
        event.conferenceData = {
            createRequest: {
                requestId: `meet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                conferenceSolutionKey: {
                    type: 'hangoutsMeet'
                }
            }
        };
    }

    try {
        const response = await calendar.events.insert({
            calendarId: 'primary',
            resource: event,
            conferenceDataVersion: shouldAddGoogleMeet ? 1 : 0,
            sendUpdates: 'none' // Don't send invites automatically
        });

        const createdEvent = response.data;
        console.log(`[DEBUG] Calendar insert successful. Platform: ${meetingPlatform}, ExternalLink: ${externalMeetLink}, GoogleLink: ${createdEvent.hangoutLink}`);

        // If a non-Google platform is selected, prioritize the external link.
        // Google sometimes automatically adds a hangoutLink even if we don't ask for it.
        const finalMeetLink = meetingPlatform === 'google_meet'
            ? (createdEvent.hangoutLink || externalMeetLink)
            : (externalMeetLink || createdEvent.hangoutLink);

        console.log(`[DEBUG] finalMeetLink selected: ${finalMeetLink}`);

        return {
            eventId: createdEvent.id,
            eventLink: createdEvent.htmlLink,
            meetLink: finalMeetLink,
            start: createdEvent.start,
            end: createdEvent.end,
            summary: createdEvent.summary,
            platform: meetingPlatform
        };
    } catch (error) {
        console.error('Calendar API error:', error.message);

        if (error.code === 401) {
            throw new Error('Authentication expired. Please re-authenticate.');
        }
        if (error.code === 403) {
            throw new Error('Calendar access denied. Please check permissions.');
        }

        throw new Error(`Failed to create calendar event: ${error.message}`);
    }
}

/**
 * Parse participants string into attendees array
 * @param {string} participants - Comma-separated participants
 * @returns {Array} Attendees array for Google Calendar
 */
function parseAttendees(participants) {
    if (!participants) return [];

    // Split by comma and clean up
    const names = participants.split(',').map(p => p.trim()).filter(Boolean);

    // For now, just return names (emails would need to be looked up)
    // In production, you'd integrate with a contacts API or directory
    return names
        .filter(name => name.includes('@')) // Only include if it looks like an email
        .map(email => ({ email: email.trim() }));
}

/**
 * Get user's calendar list
 * @param {Object} tokens - OAuth tokens
 * @returns {Promise<Array>} List of calendars
 */
async function getCalendarList(tokens) {
    const auth = getOAuth2Client(tokens);
    const calendar = google.calendar({ version: 'v3', auth });

    const response = await calendar.calendarList.list();
    return response.data.items;
}

/**
 * Delete a calendar event
 * @param {string} eventId - Event ID to delete
 * @param {Object} tokens - OAuth tokens
 */
async function deleteEvent(eventId, tokens) {
    const auth = getOAuth2Client(tokens);
    const calendar = google.calendar({ version: 'v3', auth });

    await calendar.events.delete({
        calendarId: 'primary',
        eventId
    });
}

module.exports = {
    createMeetingEvent,
    getCalendarList,
    deleteEvent
};
