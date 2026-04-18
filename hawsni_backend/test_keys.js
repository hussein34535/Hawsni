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
            
            // Try searching for gemma model
            console.log('Fetching available models...');
            const modelList = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Dummy to trigger SDK
            
            // Actually try a very basic generate with gemini-1.5-flash-latest or similar
            const testModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); 
            const result = await testModel.generateContent("test");
            console.log(`Result: SUCCESS`);
        } catch (error) {
            console.error(`Result: ${keyName} Error - ${error.message}`);
        }
        console.log('--------------------------------------------------');
    }
}

testKeys();
