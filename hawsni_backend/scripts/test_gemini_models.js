const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
  try {
    const result = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // dummy
    // Actually the library might not have a direct listModels in the main class
    // but we can try to find the standard ones.
    console.log("Testing gemini-1.5-flash...");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const res = await model.generateContent("hi");
    console.log(res.response.text());
  } catch (error) {
    console.error("Error:", error.message);
  }
}

listModels();
