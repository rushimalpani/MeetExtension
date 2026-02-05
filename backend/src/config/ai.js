const Groq = require('groq-sdk');

const groq = new Groq({
    apiKey: process.env.AI_API_KEY
});

const AI_MODEL = process.env.AI_MODEL || 'llama-3.3-70b-versatile';

module.exports = {
    groq,
    AI_MODEL
};
