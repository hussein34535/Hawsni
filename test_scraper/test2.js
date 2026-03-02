const cheerio = require('cheerio');
const fs = require('fs');

const data = fs.readFileSync('page.html', 'utf-8');
const $ = cheerio.load(data);

console.log("=== Title HTML ===");
$('h1, h2, h3, h4, h5, h6').each((i, el) => {
    const text = $(el).text().trim();
    if (text.includes('سويت') || text.includes('سوسته')) {
        console.log("Element:", $.html(el));
        console.log("Parent:", $.html($(el).parent()));
    }
});

console.log("\n=== Price HTML ===");
$('*').each((i, el) => {
    if ($(el).children().length === 0) {
        const text = $(el).text().trim();
        if (text.includes('سعر')) {
            console.log("Element:", $.html(el));
            console.log("Parent:", $.html($(el).parent()));
        }
    }
});

console.log("\n=== Description HTML ===");
$('div').each((i, el) => {
    const classAttr = $(el).attr('class');
    if (classAttr === 'app-content content') {
        // Just print the first 500 chars of HTML
        console.log("Description container HTML:", $.html(el).substring(0, 500));
    }
});

