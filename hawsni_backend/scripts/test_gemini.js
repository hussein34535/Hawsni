const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function testAddressParsing(address) {
    const prompt = `
    You are an Egyptian shipping expert. Parse the following Arabic address and identify the Governorate (City) and the specific Area (Zone).
    Address: "${address}"

    Return ONLY a JSON object in this format:
    {
      "city": "Governorate Name in Arabic (e.g. القاهرة, الإسكندرية)",
      "zone": "Area Name in Arabic (e.g. مدينة نصر, المنتزه)",
      "confidence": 0.95
    }
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        console.log("AI Response:", text);
    } catch (error) {
        console.error("Error:", error);
    }
}

testAddressParsing("احمد سعد، السيوف شارع صلاح الدين بجوار سنتر الاسيوطي، الاسكندريه");
