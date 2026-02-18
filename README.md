# AI Meeting Scheduler - Chrome Extension

A production-ready Chrome Extension with React.js frontend and Node.js/Express backend for AI-powered meeting scheduling using Groq AI.

## 🚀 Features

- **Natural Language Processing**: Type meetings in plain English (e.g., "Schedule a sync with team tomorrow at 10am").
- **AI-Powered Extraction**: Automatically extracts meeting details using Groq AI (Llama 3 models).
- **Instant Meeting**: Quick generate button for immediate Google Meet link creation.
- **Multimodal Support**: Support for Google Meet, Zoom, and MS Teams meeting details.
- **Timezone Conversion**: Automatic timezone handling with both local and foreign time display.
- **Google Calendar Integration**: Creates events directly in Google Calendar.
- **Professional Emails**: Auto-generates meeting invitation emails with subject and body.
- **Copy & Share**: One-click copy for meeting links and email invitations.

## 📁 Project Structure

```
MeetExtension/
├── backend/                 # Express.js API server
│   ├── src/
│   │   ├── config/         # Google OAuth & AI config
│   │   ├── controllers/    # Route handlers (auth, meeting)
│   │   ├── prompts/        # AI system prompts for extraction
│   │   ├── routes/         # API routes (authRoutes, meetingRoutes)
│   │   ├── services/       # Business logic (calendar, AI, etc.)
│   │   └── app.js          # Express app setup
│   ├── .env.example        # Environment template
│   ├── package.json
│   └── server.js           # Entry point
│
├── extension/              # Chrome Extension (React + Vite)
│   ├── public/
│   │   ├── icons/          # Extension icons (16, 48, 128)
│   │   └── manifest.json   # Extension manifest v3
│   ├── src/
│   │   ├── components/     # React UI components
│   │   ├── services/       # API communication layer
│   │   ├── styles/         # CSS design system
│   │   ├── App.jsx         # Main application logic
│   │   └── background.js   # Service worker for keep-alive & auth
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
   - Authorized redirect URIs: 
     - `http://localhost:3001/api/auth/google/callback`
     - `https://meetextension-2p8b.onrender.com/api/auth/google/callback`
6. Save your Client ID and Client Secret

### 2. Groq API Setup

1. Go to [Groq Console](https://console.groq.com/)
2. Create an account and get your API key
3. Copy your API key for the backend `.env`

### 3. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your credentials
# Ensure AI_MODEL is set (e.g., llama-3.3-70b-versatile)
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
5. The extension icon should appear in your toolbar (Gmeet Scheduler)

## 🎯 Usage

1. Click the extension icon in Chrome
2. Click **Sign in with Google**
3. Complete the OAuth flow (The extension handles the token automatically)
4. Type your meeting request or use the **Quick Generate** button
5. View meeting details, copy invitation, or open directly in Calendar

## 📡 API Endpoints

### Authentication (`/api/auth`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/google` | GET | Initiate OAuth flow |
| `/google/callback` | GET | OAuth callback |
| `/success` | GET | Success page for auth completion |
| `/me` | GET | Get current authenticated user |
| `/validate` | GET | Validate JWT token |
| `/diag` | GET | System diagnostics (secrets check) |

### Meetings (`/api`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/generate-meeting` | POST | Full AI extraction & Calendar creation |
| `/preview-meeting` | POST | AI extraction only (no calendar) |
| `/quick-generate` | POST | Immediate meeting creation (skips AI) |
| `/health` | GET | Server health check |

## 🚢 Deployment

### Production Backend (Render)

The backend is deployed at: `https://meetextension-2p8b.onrender.com`

To update production:
1. Ensure `NODE_ENV=production`
2. Set all `.env` variables in Render dashboard
3. Backend service worker in extension handles the "waking up" ping

### Extension Production update

Ensure `extension/src/services/api.js` points to the Render URL:
```js
const API_BASE_URL = 'https://meetextension-2p8b.onrender.com/api';
```

## 🔒 Security

- OAuth 2.0 for secure Google integration
- JWT tokens for API session management
- Secure background service worker for token handling
- CORS configured for specific extension and local origins
- Helmet.js and Express rate limiting

## 📝 License

MIT License

---

Made with ❤️ by the MeetExtension Team
