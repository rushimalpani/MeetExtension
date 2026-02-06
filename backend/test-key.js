require('dotenv').config();
const Groq = require('groq-sdk');

const apiKey = process.env.AI_API_KEY;
console.log('Testing API Key (Starts with):', apiKey ? apiKey.substring(0, 7) : 'NONE');

const groq = new Groq({ apiKey });

async function test() {
    try {
        const completion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: 'Say hello' }],
            model: 'llama-3.3-70b-versatile',
        });
        console.log('Success!', completion.choices[0].message.content);
    } catch (err) {
        console.error('Test Failed:', err.message);
        if (err.response) {
            console.error('Response Data:', JSON.stringify(err.response.data));
        }
    }
}

test();
