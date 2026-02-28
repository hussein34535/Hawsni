const fetch = require('node-fetch');

// Replicate IDM-VTON model version (cuuupid/idm-vton)
const MODEL_VERSION = "0513734a452173b8173e907e3a59d19a36266e55b48528559432bd21c7d7e985";

exports.startTryOn = async (req, res) => {
    try {
        const apiToken = process.env.REPLICATE_API_TOKEN;
        if (!apiToken) {
            console.error("VTO Error: REPLICATE_API_TOKEN is not set");
            return res.status(500).json({ error: 'VTO service not configured. Missing API token.' });
        }

        const { human_image, garment_image, description } = req.body;

        if (!human_image || !garment_image) {
            return res.status(400).json({ error: 'Missing human_image or garment_image' });
        }

        // --- Quality Optimization Logic ---
        // 1. Dynamic Category Detection
        let category = "upper_body";
        const desc = (description || "").toLowerCase();

        const lowerBodyKeywords = ["pants", "trousers", "jeans", "skirt", "shorts", "بنطلون", "جيب"];
        const fullBodyKeywords = ["dress", "abaya", "kaftan", "onesie", "jumpsuit", "بيجاما", "بيجامة", "سالوبيت", "سلوبيت", "فستان", "عباية"];

        if (lowerBodyKeywords.some(k => desc.includes(k))) {
            category = "lower_body";
        } else if (fullBodyKeywords.some(k => desc.includes(k))) {
            category = "dresses";
        }

        // 2. Comprehensive Negative Prompt
        const negativePrompt = "low quality, bad anatomy, distorted, deformed, unrelated objects, bare limbs where garment should be, missing sleeves, messy background, extra limbs, fingers disfigured, text, font, branding, logos, watermark, letters, signature, graphics on chest";

        console.log(`VTO Request: category=${category}, desc=${description || 'none'}`);

        const response = await fetch("https://api.replicate.com/v1/predictions", {
            method: "POST",
            headers: {
                "Authorization": `Token ${apiToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                version: MODEL_VERSION,
                input: {
                    human_img: human_image,
                    garm_img: garment_image,
                    garment_des: (description || "clothing piece") + ", high quality, highly detailed fabric",
                    crop: false,
                    steps: 40, // Max limit for this model is 40
                    category: category,
                    negative_prompt: negativePrompt,
                    guidance_scale: 3.0 // Higher guidance for better alignment
                },
            }),
        });

        const responseBody = await response.json();

        if (response.status !== 201) {
            console.error("Replicate API Error Details:", {
                status: response.status,
                body: responseBody
            });
            return res.status(response.status).json({
                error: "Replicate service rejected the request",
                details: responseBody
            });
        }

        res.json(responseBody);

    } catch (error) {
        console.error("VTO Start Error:", error.message || error);
        res.status(500).json({ error: error.message || "Internal Server Error" });
    }
};

exports.checkStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const response = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
            headers: {
                "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}`,
                "Content-Type": "application/json",
            },
        });

        if (response.status !== 200) {
            const error = await response.json();
            return res.status(500).json({ error: "Failed to check status", details: error });
        }

        const prediction = await response.json();
        res.json(prediction);

    } catch (error) {
        console.error("VTO Status Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
