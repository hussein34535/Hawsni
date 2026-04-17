const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

class AIService {
    constructor() {
        if (!process.env.GEMINI_API_KEY) {
            console.warn('[AI] Warning: GEMINI_API_KEY is not set.');
            return;
        }
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // Using gemma-4-31b-it as requested (confirmed working with current API key)
        this.model = genAI.getGenerativeModel({ model: "gemma-4-31b-it" });
    }

    /**
     * Parse a raw Arabic address string into City and Zone
     * @param {string} address The raw address string from the order
     * @returns {Promise<{city: string, zone: string}|null>}
     */
    async parseAddress(address) {
        if (!this.model) {
            console.error('[AI] Model not initialized.');
            return null;
        }

        const prompt = `
        You are an Egyptian logistics expert. Parse the following Arabic shipping address and identify the Governorate (City) and the specific Area (Zone).
        Address: "${address}"

        Instructions:
        1. "city" must be one of the standard Egyptian governorates (e.g., القاهرة, الإسكندرية, الجيزة, المنوفية, إلخ).
        2. "zone" should be the most specific neighborhood or area mentioned (e.g., مدينة نصر, المنتزه, السيوف, المعادي).
        3. If you see a street name, use it only to help identify the area.
        4. Normalize spelling (e.g., both الاسكندرية and الاسكندريه should be الإسكندرية).

        Return ONLY a JSON object:
        {"city": "...", "zone": "..."}
        `;

        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            
            // Log raw response for debugging
            console.log(`[AI] Raw Response: ${text.substring(0, 100)}...`);

            // Extract JSON: find the first { and the last }
            const startIdx = text.indexOf('{');
            const endIdx = text.lastIndexOf('}');
            
            if (startIdx !== -1 && endIdx !== -1) {
                const jsonStr = text.substring(startIdx, endIdx + 1);
                try {
                    const parsed = JSON.parse(jsonStr);
                    console.log(`[AI] Parsed address: ${address} -> City: ${parsed.city}, Zone: ${parsed.zone}`);
                    return parsed;
                } catch (parseError) {
                    console.error('[AI] JSON Parse Error:', parseError.message);
                }
            } else {
                console.error('[AI] No JSON block found in response');
            }
            return null;
        } catch (error) {
            console.error('[AI] Address parsing failed:', error.message);
            return null;
        }
    }
}

module.exports = new AIService();
