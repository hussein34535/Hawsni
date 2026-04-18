require('dotenv').config({ path: './.env' });
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testFinal() {
    const keys = Object.keys(process.env)
        .filter(key => key.startsWith('GEMINI_API_KEY'))
        .sort();

    for (const keyName of keys) {
        const key = process.env[keyName];
        console.log(`Final Test for ${keyName}...`);
        
        try {
            const genAI = new GoogleGenerativeAI(key);
            const model = genAI.getGenerativeModel({ model: "gemma-4-31b-it" });
            const result = await model.generateContent("Say 'Hello from Gemma 4'");
            console.log(`Result: SUCCESS - ${result.response.text().trim()}`);
        } catch (error) {
            console.error(`Result: FAILED - ${error.message}`);
        }
        console.log('--------------------------------------------------');
    }
}

testFinal();
