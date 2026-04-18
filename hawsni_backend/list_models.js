require('dotenv').config({ path: './.env' });
const fetch = require('node-fetch');

async function listModels() {
    const keys = Object.keys(process.env)
        .filter(key => key.startsWith('GEMINI_API_KEY'))
        .sort();

    for (const keyName of keys) {
        const key = process.env[keyName];
        console.log(`Checking models for ${keyName} (${key.substring(0, 10)}...)`);
        
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.models) {
                console.log(`Success! Found ${data.models.length} models.`);
                // Log first few models to see naming convention
                data.models.slice(0, 5).forEach(m => console.log(` - ${m.name}`));
            } else {
                console.error(`Error: ${JSON.stringify(data)}`);
            }
        } catch (e) {
            console.error(`Fetch Error: ${e.message}`);
        }
        console.log('--------------------------------------------------');
    }
}

listModels();
