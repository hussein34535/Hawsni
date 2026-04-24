const https = require('https');
const fs = require('fs');
const path = require('path');

const fontsDir = path.join(__dirname, 'assets', 'fonts');

// Create fonts directory if it doesn't exist
if (!fs.existsSync(fontsDir)) {
    fs.mkdirSync(fontsDir, { recursive: true });
}

const fonts = [
    { url: 'https://github.com/google/fonts/raw/main/ofl/cairo/Cairo%5Bslnt,wght%5D.ttf', file: 'Cairo.ttf' },
    { url: 'https://github.com/google/fonts/raw/main/ofl/poppins/Poppins-Regular.ttf', file: 'Poppins-Regular.ttf' },
    { url: 'https://github.com/google/fonts/raw/main/ofl/poppins/Poppins-Bold.ttf', file: 'Poppins-Bold.ttf' }
];

fonts.forEach(font => {
    const dest = path.join(fontsDir, font.file);
    const file = fs.createWriteStream(dest);
    https.get(font.url, function (response) {
        response.pipe(file);
        file.on('finish', function () {
            file.close();
            console.log(`Downloaded ${font.file}`);
        });
    }).on('error', function (err) {
        fs.unlink(dest);
        console.error(`Error downloading ${font.file}: ${err.message}`);
    });
});
