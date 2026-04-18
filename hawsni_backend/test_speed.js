const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function testGemma3Speed() {
    const apiKey = process.env.GEMINI_API_KEY_1 || process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("No API key found!");
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemma-3-27b-it" });

    console.log("🚀 Testing Gemma 3 27B Speed...");
    
    const startTime = Date.now();
    try {
        const result = await model.generateContent("أهلاً بك، رد عليّ بكلمة واحدة لغرض اختبار السرعة.");
        const duration = Date.now() - startTime;
        
        console.log("-----------------------------------------");
        console.log(`🤖 Reply: ${result.response.text().trim()}`);
        console.log(`⏱️ Duration: ${duration}ms (${(duration/1000).toFixed(2)}s)`);
        console.log("-----------------------------------------");
    } catch (error) {
        console.error("❌ Error during test:", error.message);
    }
}

testGemma3Speed();
