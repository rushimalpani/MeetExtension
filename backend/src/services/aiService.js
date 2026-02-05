const { groq, AI_MODEL } = require('../config/ai');
const { MEETING_SYSTEM_PROMPT, getMeetingPrompt } = require('../prompts/meetingPrompt');
const moment = require('moment-timezone');

/**
 * Parse a natural language meeting request using AI
 * @param {string} userPrompt - The user's natural language request
 * @param {string} userTimezone - User's local timezone
 * @returns {Promise<Object>} Parsed meeting data
 */
async function parseMeetingRequest(userPrompt, userTimezone = 'UTC') {
    const currentDate = moment().tz(userTimezone).format('YYYY-MM-DD HH:mm:ss (dddd)');

    try {
        const completion = await groq.chat.completions.create({
            model: AI_MODEL,
            messages: [
                {
                    role: 'system',
                    content: MEETING_SYSTEM_PROMPT
                },
                {
                    role: 'user',
                    content: getMeetingPrompt(userPrompt, currentDate)
                }
            ],
            temperature: 0.1, // Low temperature for consistent JSON output
            max_tokens: 500,
            response_format: { type: 'json_object' }
        });

        const responseText = completion.choices[0].message.content.trim();

        // Parse and validate JSON
        let meetingData;
        try {
            meetingData = JSON.parse(responseText);
        } catch (parseError) {
            // Try to extract JSON from response if wrapped in markdown
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                meetingData = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('AI response is not valid JSON');
            }
        }

        // Validate required fields
        const requiredFields = ['title', 'date', 'time', 'timezone'];
        for (const field of requiredFields) {
            if (!meetingData[field]) {
                throw new Error(`Missing required field: ${field}`);
            }
        }

        // Set defaults for optional fields
        meetingData.duration = meetingData.duration || 60;
        meetingData.generateMeet = meetingData.generateMeet !== false;
        meetingData.participants = meetingData.participants || '';
        meetingData.purpose = meetingData.purpose || 'Meeting';

        // Resolve relative dates
        meetingData.date = resolveRelativeDate(meetingData.date, userTimezone);

        return meetingData;
    } catch (error) {
        console.error('AI parsing error:', error);
        throw new Error(`Failed to parse meeting request: ${error.message}`);
    }
}

/**
 * Resolve relative date strings to actual dates
 */
function resolveRelativeDate(dateStr, timezone) {
    const now = moment().tz(timezone);
    const lower = dateStr.toLowerCase();

    if (lower === 'today' || lower.includes('today')) {
        return now.format('YYYY-MM-DD');
    }
    if (lower === 'tomorrow' || lower.includes('tomorrow')) {
        return now.add(1, 'day').format('YYYY-MM-DD');
    }
    if (lower.includes('next monday')) {
        return now.day(8).format('YYYY-MM-DD'); // Next Monday
    }
    if (lower.includes('next tuesday')) {
        return now.day(9).format('YYYY-MM-DD');
    }
    if (lower.includes('next wednesday')) {
        return now.day(10).format('YYYY-MM-DD');
    }
    if (lower.includes('next thursday')) {
        return now.day(11).format('YYYY-MM-DD');
    }
    if (lower.includes('next friday')) {
        return now.day(12).format('YYYY-MM-DD');
    }
    if (lower.includes('next week')) {
        return now.add(1, 'week').format('YYYY-MM-DD');
    }

    // If already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr;
    }

    // Try to parse other date formats
    const parsed = moment(dateStr, ['YYYY-MM-DD', 'MM/DD/YYYY', 'DD/MM/YYYY', 'MMMM D YYYY', 'MMM D YYYY']);
    if (parsed.isValid()) {
        return parsed.format('YYYY-MM-DD');
    }

    return dateStr;
}

module.exports = {
    parseMeetingRequest
};
