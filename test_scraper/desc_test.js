const cheerio = require('cheerio');
const fs = require('fs');

const data = fs.readFileSync('page.html', 'utf-8');
const $ = cheerio.load(data);

const productDescEl = $('#ProductDescription');

// Try a naive HTML to text parsing
let formattedText = '';
productDescEl.contents().each((i, node) => {
    if (node.type === 'text') {
        const t = $(node).text().trim();
        if (t) formattedText += t + '\n';
    } else if (node.type === 'tag') {
        const textContent = $(node).text().trim();
        if (textContent) {
            formattedText += textContent + '\n';
        } else if (node.name === 'br') {
            formattedText += '\n';
        }
    }
});

console.log("=== Formatted Description ===");
console.log(formattedText.trim());
