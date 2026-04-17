const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function checkModel() {
  const models = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-pro"];
  for (const m of models) {
    try {
      console.log(`Checking ${m}...`);
      const model = genAI.getGenerativeModel({ model: m });
      const res = await model.generateContent("test");
      console.log(`  ${m} works!`);
      return m;
    } catch (e) {
      console.log(`  ${m} failed: ${e.message}`);
    }
  }
}

checkModel().then(m => console.log("Success with:", m));
