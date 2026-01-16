const fetch = require('node-fetch');
require('dotenv').config();

async function getVersion() {
    try {
        const token = process.env.REPLICATE_API_TOKEN;
        if (!token) {
            console.error("No token found");
            return;
        }

        // Try yisol/idm-vton first
        let response = await fetch("https://api.replicate.com/v1/models/yisol/idm-vton/versions", {
            headers: {
                "Authorization": `Token ${token}`
            }
        });

        if (response.status !== 200) {
            console.log("yisol/idm-vton failed, trying cuuupid/idm-vton");
            response = await fetch("https://api.replicate.com/v1/models/cuuupid/idm-vton/versions", {
                headers: {
                    "Authorization": `Token ${token}`
                }
            });
        }

        if (response.status === 200) {
            const data = await response.json();
            if (data.results && data.results.length > 0) {
                console.log("LATEST_VERSION_ID=" + data.results[0].id);
            } else {
                console.log("No versions found");
            }
        } else {
            console.error("Failed to fetch versions:", await response.text());
        }
    } catch (e) {
        console.error(e);
    }
}

getVersion();
