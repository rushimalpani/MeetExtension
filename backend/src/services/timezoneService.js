const moment = require('moment-timezone');

// Common timezone mappings
const TIMEZONE_MAP = {
    // US Timezones
    'EST': 'America/New_York',
    'EDT': 'America/New_York',
    'CST': 'America/Chicago',
    'CDT': 'America/Chicago',
    'MST': 'America/Denver',
    'MDT': 'America/Denver',
    'PST': 'America/Los_Angeles',
    'PDT': 'America/Los_Angeles',

    // International
    'GMT': 'Europe/London',
    'BST': 'Europe/London',
    'CET': 'Europe/Paris',
    'CEST': 'Europe/Paris',
    'IST': 'Asia/Kolkata',
    'JST': 'Asia/Tokyo',
    'AEST': 'Australia/Sydney',
    'AEDT': 'Australia/Sydney',
    'SGT': 'Asia/Singapore',
    'HKT': 'Asia/Hong_Kong',
    'UTC': 'UTC',

    // US Team common reference
    'US': 'America/New_York',
    'UK': 'Europe/London',
    'INDIA': 'Asia/Kolkata',
    'JAPAN': 'Asia/Tokyo',
    'CHINA': 'Asia/Shanghai',
    'AUSTRALIA': 'Australia/Sydney'
};

/**
 * Normalize timezone string to IANA format
 * @param {string} tz - Timezone abbreviation or IANA name
 * @returns {string} IANA timezone
 */
function normalizeTimezone(tz) {
    if (!tz) return 'UTC';

    const upper = tz.toUpperCase().trim();

    // Check if it's in our mapping
    if (TIMEZONE_MAP[upper]) {
        return TIMEZONE_MAP[upper];
    }

    // Check if it's already a valid IANA timezone
    if (moment.tz.zone(tz)) {
        return tz;
    }

    // Try common patterns
    if (upper.includes('EASTERN') || upper.includes('NEW YORK')) {
        return 'America/New_York';
    }
    if (upper.includes('PACIFIC') || upper.includes('LOS ANGELES')) {
        return 'America/Los_Angeles';
    }
    if (upper.includes('CENTRAL')) {
        return 'America/Chicago';
    }
    if (upper.includes('MOUNTAIN')) {
        return 'America/Denver';
    }

    // Default to UTC if we can't determine
    console.warn(`Unknown timezone: ${tz}, defaulting to UTC`);
    return 'UTC';
}

/**
 * Convert datetime between timezones
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} time - Time in HH:MM format
 * @param {string} fromTimezone - Source timezone
 * @param {string} toTimezone - Target timezone
 * @returns {Object} Converted datetime info
 */
function convertTimezone(date, time, fromTimezone, toTimezone) {
    const fromTz = normalizeTimezone(fromTimezone);
    const toTz = normalizeTimezone(toTimezone);

    // Create moment in source timezone
    const sourceDateTime = moment.tz(`${date} ${time}`, 'YYYY-MM-DD HH:mm', fromTz);

    if (!sourceDateTime.isValid()) {
        throw new Error(`Invalid date/time: ${date} ${time}`);
    }

    // Convert to target timezone
    const targetDateTime = sourceDateTime.clone().tz(toTz);

    return {
        sourceDate: sourceDateTime.format('YYYY-MM-DD'),
        sourceTime: sourceDateTime.format('HH:mm'),
        sourceTimezone: fromTz,
        sourceFormatted: sourceDateTime.format('dddd, MMMM D, YYYY [at] h:mm A z'),

        targetDate: targetDateTime.format('YYYY-MM-DD'),
        targetTime: targetDateTime.format('HH:mm'),
        targetTimezone: toTz,
        targetFormatted: targetDateTime.format('dddd, MMMM D, YYYY [at] h:mm A z'),

        // ISO strings for API calls
        startISO: sourceDateTime.toISOString(),
        endISO: sourceDateTime.clone().add(60, 'minutes').toISOString()
    };
}

/**
 * Format time display for user
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} time - Time in HH:MM format  
 * @param {string} timezone - Timezone
 * @returns {string} Formatted display string
 */
function formatTimeDisplay(date, time, timezone) {
    const tz = normalizeTimezone(timezone);
    const dt = moment.tz(`${date} ${time}`, 'YYYY-MM-DD HH:mm', tz);
    return dt.format('dddd, MMMM D, YYYY [at] h:mm A z');
}

/**
 * Get current time in a specific timezone
 * @param {string} timezone - Timezone
 * @returns {string} Current time formatted
 */
function getCurrentTime(timezone) {
    const tz = normalizeTimezone(timezone);
    return moment().tz(tz).format('YYYY-MM-DD HH:mm:ss');
}

/**
 * Calculate end time based on duration
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} time - Time in HH:MM format
 * @param {number} durationMinutes - Duration in minutes
 * @param {string} timezone - Timezone
 * @returns {Object} Start and end datetime
 */
function calculateMeetingTimes(date, time, durationMinutes, timezone) {
    const tz = normalizeTimezone(timezone);
    const start = moment.tz(`${date} ${time}`, 'YYYY-MM-DD HH:mm', tz);
    const end = start.clone().add(durationMinutes, 'minutes');

    return {
        start: {
            dateTime: start.format(),
            timeZone: tz
        },
        end: {
            dateTime: end.format(),
            timeZone: tz
        }
    };
}

module.exports = {
    normalizeTimezone,
    convertTimezone,
    formatTimeDisplay,
    getCurrentTime,
    calculateMeetingTimes,
    TIMEZONE_MAP
};
