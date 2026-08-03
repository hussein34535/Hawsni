require('dotenv').config({ path: './hwasi_backend/.env' });
const aiChatbotService = require('./hwasi_backend/services/aiChatbotService');

async function test() {
    try {
        console.log('Testing Chatbot Service...');
        const response = await aiChatbotService.handleChat('hi', []);
        console.log('Response:', response);
    } catch (error) {
        console.error('TEST FAILED:', error);
    }
}

test();
