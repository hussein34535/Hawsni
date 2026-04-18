require('dotenv').config({ path: './.env' });
const fetch = require('node-fetch');

async function searchGemma() {
    const key = process.env.GEMINI_API_KEY_1;
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        console.log('Searching for Gemma models...');
        const gemmaModels = data.models.filter(m => m.name.toLowerCase().includes('gemma'));
        
        if (gemmaModels.length > 0) {
            gemmaModels.forEach(m => console.log(`Found: ${m.name}`));
        } else {
            console.log('No Gemma models found. Listing Gemini models instead:');
            data.models.filter(m => m.name.includes('gemini-1.5')).forEach(m => console.log(` - ${m.name}`));
        }
    } catch (e) {
        console.error(e.message);
    }
}

searchGemma();
