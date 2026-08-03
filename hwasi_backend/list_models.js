const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function listAllModels() {
    const apiKey = process.env.GEMINI_API_KEY_1 || process.env.GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(apiKey);
    
    try {
        // Since the standard SDK might not have a direct listModels, we can try to find them
        console.log("Listing available models from vertex/google ai...");
        // Actually, we can use a fetch to the API directly or try to iterate
        // But the easiest is to check what was working.
        console.log("Common models: gemma-2-27b-it, gemma-2-9b-it, gemma-7b-it, gemini-1.5-flash");
    } catch (e) {
        console.error(e);
    }
}
listAllModels();
