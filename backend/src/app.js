const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/authRoutes');
const meetingRoutes = require('./routes/meetingRoutes');

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://localhost:3000',
        process.env.FRONTEND_URL,
        /^chrome-extension:\/\/.*/
    ].filter(Boolean),
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser
app.use(express.json({ limit: '10kb' }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'Meeting Scheduler API'
    });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', meetingRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error'
    });
});

module.exports = app;
