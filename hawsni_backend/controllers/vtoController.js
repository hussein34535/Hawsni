const fetch = require('node-fetch');

// Replicate IDM-VTON model version (cuuupid/idm-vton)
const MODEL_VERSION = "0513734a452173b8173e907e3a59d19a36266e55b48528559432bd21c7d7e985";

exports.startTryOn = async (req, res) => {
    try {
        const { human_image, garment_image, description } = req.body;

        if (!human_image || !garment_image) {
            return res.status(400).json({ error: 'Missing human_image or garment_image' });
        }

        const response = await fetch("https://api.replicate.com/v1/predictions", {
            method: "POST",
            headers: {
                "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                version: MODEL_VERSION,
                input: {
                    human_img: human_image, // Changed from human_image to human_img based on cuuupid/idm-vton schema
                    garm_img: garment_image,
                    garment_des: description || "clothing",
                    crop: false,
                    seed: 42,
                    steps: 30,
                    category: "upper_body" // Default to upper_body, can make dynamic later
                },
            }),
        });

        if (response.status !== 201) {
            const error = await response.json();
            console.error("Replicate API Error:", error);
            return res.status(500).json({ error: "Failed to start generation", details: error });
        }

        const prediction = await response.json();
        res.json(prediction);

    } catch (error) {
        console.error("VTO Start Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
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
