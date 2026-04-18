require('dotenv').config({ path: './.env' });
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testKeys() {
    const keys = Object.keys(process.env)
        .filter(key => key.startsWith('GEMINI_API_KEY'))
        .sort();

    console.log(`Found ${keys.length} keys in .env: ${keys.join(', ')}`);
    console.log('--------------------------------------------------');

    for (const keyName of keys) {
        const key = process.env[keyName];
        console.log(`Testing ${keyName}: ${key.substring(0, 8)}...`);
        
        try {
            const genAI = new GoogleGenerativeAI(key);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Using a standard model for checking validity
            const result = await model.generateContent("Say 'Valid'");
            const response = result.response.text();
            console.log(`Result: SUCCESS (${response.trim()})`);
        } catch (error) {
            console.error(`Result: FAILED for ${keyName}`);
            console.error(`Error Logic: ${error.message}`);
        }
        console.log('--------------------------------------------------');
    }
}

testKeys();
