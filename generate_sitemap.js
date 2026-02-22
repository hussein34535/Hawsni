const https = require('https');
const fs = require('fs');
const path = require('path');

const BACKEND_SITEMAP_URL = 'https://hwasibackend.vercel.app/sitemap.xml';
const OUTPUT_PATH = path.join(__dirname, 'web', 'sitemap.xml');

console.log(`📡 Fetching live sitemap from: ${BACKEND_SITEMAP_URL}`);

https.get(BACKEND_SITEMAP_URL, (res) => {
    let data = '';

    // A chunk of data has been received.
    res.on('data', (chunk) => {
        data += chunk;
    });

    // The whole response has been received.
    res.on('end', () => {
        if (res.statusCode === 200) {
            fs.writeFileSync(OUTPUT_PATH, data, 'utf8');
            console.log(`✅ Success! Static sitemap generated at: ${OUTPUT_PATH}`);
            console.log(`📝 Total Characters: ${data.length}`);
        } else {
            console.error(`❌ Failed to fetch sitemap. Status Code: ${res.statusCode}`);
        }
    });

}).on("error", (err) => {
    console.error(`❌ Error fetching sitemap: ${err.message}`);
});
