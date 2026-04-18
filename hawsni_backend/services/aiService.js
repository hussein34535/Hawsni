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
     * بيستخدم قائمة المناطق الحقيقية من بوسطة عشان يختار منها مباشرة
     * @param {string} address The raw address string from the order
     * @param {Array} bostaDistricts Optional — real districts list from Bosta v2 API
     * @returns {Promise<{city: string, zone: string}|null>}
     */
    async parseAddress(address, bostaDistricts = null) {
        if (!this.model) {
            console.error('[AI] Model not initialized.');
            return null;
        }

        // لو عندنا قائمة بوسطة الحقيقية، نديها للـ AI عشان يختار منها مباشرة
        let bostaContext = '';
        if (bostaDistricts && bostaDistricts.length > 0) {
            // بنجهز ملخص بسيط: اسم المحافظة + أسماء المناطق فيها
            const citySummary = bostaDistricts.map(c => {
                const zones = (c.districts || []).slice(0, 20).map(d => d.districtName || d.zoneName).filter(Boolean).join(', ');
                return `${c.cityName}: [${zones}]`;
            }).join('\n');

            bostaContext = `\n\nIMPORTANT — You MUST select city and zone EXACTLY from this Bosta-registered list:
${citySummary}

Rules:
- "city" must be the exact cityName from the list above (e.g., "Cairo", "Alexandria", "Giza")
- "zone" must be an exact districtName from the chosen city's list
- If unsure about zone, return the most likely match or leave zone empty string ""`;
        }

        const prompt = `You are an Egyptian logistics expert. Parse the following Arabic shipping address.
Address: "${address}"
${bostaContext || `
Instructions:
1. "city" must be a standard Egyptian governorate in English (e.g., Cairo, Alexandria, Giza, Monufia).
2. "zone" should be the most specific neighborhood in English.
3. Normalize spelling variations.`}

Return ONLY a JSON object with no extra text:
{"city": "...", "zone": "..."}`;

        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            console.log(`[AI] Raw Response: ${text.substring(0, 150)}...`);

            const startIdx = text.indexOf('{');
            const endIdx = text.lastIndexOf('}');

            if (startIdx !== -1 && endIdx !== -1) {
                const jsonStr = text.substring(startIdx, endIdx + 1);
                try {
                    const parsed = JSON.parse(jsonStr);
                    console.log(`[AI] Parsed: City=${parsed.city}, Zone=${parsed.zone}`);
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
