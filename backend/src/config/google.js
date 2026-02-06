const { google } = require('googleapis');

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

console.log(`[GoogleConfig] Using Redirect URI: ${process.env.GOOGLE_REDIRECT_URI}`);

const SCOPES = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
];

function getAuthUrl() {
    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        prompt: 'consent'
    });
}

async function getTokensFromCode(code) {
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
}

async function refreshAccessToken(refreshToken) {
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await oauth2Client.refreshAccessToken();
    return credentials;
}

function getOAuth2Client(tokens) {
    const client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );
    client.setCredentials(tokens);
    return client;
}

module.exports = {
    oauth2Client,
    SCOPES,
    getAuthUrl,
    getTokensFromCode,
    refreshAccessToken,
    getOAuth2Client
};
