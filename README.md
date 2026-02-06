# AI Meeting Scheduler - Chrome Extension

A production-ready Chrome Extension with React.js frontend and Node.js/Express backend for AI-powered meeting scheduling.

## 🚀 Features

- **Natural Language Processing**: Type meetings in plain English
- **AI-Powered Extraction**: Automatically extracts meeting details using Groq AI
- **Timezone Conversion**: Automatic timezone handling with both local and foreign time display
- **Google Calendar Integration**: Creates events directly in Google Calendar
- **Google Meet Links**: Generates video meeting links automatically
- **Professional Emails**: Auto-generates meeting invitation emails
- **Copy & Download**: Easy sharing of meeting details

## 📁 Project Structure

```
MeetExtension/
├── backend/                 # Express.js API server
│   ├── src/
│   │   ├── config/         # Google OAuth & AI config
│   │   ├── controllers/    # Route handlers
│   │   ├── prompts/        # AI system prompts
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   └── app.js          # Express app setup
│   ├── .env.example        # Environment template
│   ├── package.json
│   └── server.js           # Entry point
│
├── extension/              # Chrome Extension (React)
│   ├── public/
│   │   ├── icons/          # Extension icons
│   │   └── manifest.json   # Manifest v3
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── services/       # API communication
│   │   ├── styles/         # CSS styles
│   │   └── background.js   # Service worker
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

## 🛠️ Setup Instructions

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Google Cloud Console account
- Groq API key (free tier available)

### 1. Google Cloud Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable **Google Calendar API**
4. Go to **OAuth consent screen** → Configure for External users
5. Go to **Credentials** → Create **OAuth 2.0 Client ID**
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3001/api/auth/google/callback`
6. Save your Client ID and Client Secret

### 2. Groq API Setup

1. Go to [Groq Console](https://console.groq.com/)
2. Create an account and get your API key
3. Free tier includes 30 requests/minute

### 3. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your credentials
nano .env
```

Configure `.env`:
```env
PORT=3001
NODE_ENV=development

# Google OAuth (from step 1)
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/google/callback

# Groq AI (from step 2)
AI_API_KEY=your_groq_api_key
AI_MODEL=llama-3.3-70b-versatile

# JWT Secret (generate random string)
JWT_SECRET=your_super_secret_key_here
```

Start the server:
```bash
npm run dev
```

### 4. Extension Setup

```bash
cd extension

# Install dependencies
npm install

# Build the extension
npm run build
```

### 5. Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `extension/dist` folder
5. The extension icon should appear in your toolbar

## 🎯 Usage

1. Click the extension icon in Chrome
2. Click **Sign in with Google**
3. Complete the OAuth flow
4. Copy and paste the token when prompted
5. Type your meeting request:
   ```
   Schedule a meeting with John tomorrow at 2pm EST about quarterly review
   ```
6. Click **Generate Meeting**
7. View meeting details, copy email, or open in Calendar

## 📡 API Endpoints

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/google` | GET | Initiate OAuth flow |
| `/api/auth/google/callback` | GET | OAuth callback |
| `/api/auth/me` | GET | Get current user |
| `/api/auth/validate` | GET | Validate token |

### Meetings

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/generate-meeting` | POST | Generate meeting with calendar |
| `/api/preview-meeting` | POST | Preview without creating event |
| `/api/health` | GET | Health check |

### Request Format

```json
{
  "prompt": "Schedule a meeting with Sarah tomorrow at 3pm PST",
  "userTimezone": "America/New_York"
}
```

### Response Format

```json
{
  "success": true,
  "meeting": {
    "title": "Meeting with Sarah",
    "date": "2026-02-05",
    "time": "15:00",
    "timezone": "America/Los_Angeles",
    "duration": 60,
    "participants": "Sarah",
    "purpose": "Discussion"
  },
  "times": {
    "local": { "formatted": "...", "timezone": "America/New_York" },
    "foreign": { "formatted": "...", "timezone": "America/Los_Angeles" }
  },
  "meetLink": "https://meet.google.com/xxx-xxxx-xxx",
  "email": {
    "subject": "Meeting Invitation: Meeting with Sarah | February 5, 2026",
    "body": "..."
  }
}
```

## 🔒 Security

- OAuth 2.0 for Google authentication
- JWT tokens for API authentication
- Rate limiting (100 requests/15 min)
- Input validation with express-validator
- Helmet.js for security headers
- CORS configured for extension only

## 🚢 Deployment

### Backend (Production)

```bash
# Build and deploy to your server
cd backend
npm install --production

# Set production environment variables
export NODE_ENV=production
export PORT=3001
# ... other env vars

# Start with PM2
npm install -g pm2
pm2 start server.js --name meet-api
```

### Update Extension for Production

1. Update `extension/src/services/api.js`:
   ```js
   const API_BASE_URL = 'https://your-api-domain.com/api';
   ```

2. Update `extension/public/manifest.json`:
   ```json
   "host_permissions": [
     "https://your-api-domain.com/*"
   ]
   ```

3. Rebuild: `npm run build`

4. For Chrome Web Store:
   - Zip the `dist` folder
   - Upload to [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole)

## 📝 License

MIT License

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

---

Made with ❤️ using React, Node.js, and AI
