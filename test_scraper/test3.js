const cheerio = require('cheerio');
const fs = require('fs');

const data = fs.readFileSync('page.html', 'utf-8');
const $ = cheerio.load(data);

function scrapeAngazny() {
    let name = '';
    // Title is usually an h5 with mb-1 that contains "متوفر" or just the first h5.mb-1
    const h5s = $('h5.mb-1');
    if (h5s.length > 0) {
        // usually it contains a p.badge inside it, and the text node is the title
        name = h5s.first().clone().children().remove().end().text().trim();
    }

    let price = 0;
    const priceInput = $('#TotalPriceValue');
    if (priceInput.length > 0) {
        price = parseFloat(priceInput.val());
    }

    let description = '';
    // Look for description in the tab panes or anywhere
    // Let's find a div that contains descriptive text, maybe there is a 'tablist'
    const descEl = $('.tab-content');
    if (descEl.length > 0) {
        description = descEl.text().trim().replace(/\\s+/g, ' ');
    } else {
        // Or look for any blockquote or card-body that has the text
        const cardBodies = $('.card-body');
        // Angazny might have it inside a specific col
        // For now let's just grab text from a possible container 
        description = 'TEST_DESC';
    }

    let images = [];
    $('.swiper-wrapper img, .carousel-item img, img.img-fluid').each((i, el) => {
        const src = $(el).attr('src');
        if (src && src.includes('/imgs/') && !images.includes(src)) {
            images.push(src);
        }
    });
    // fallback to just finding the upload/imgs
    if (images.length === 0) {
        $('img').each((i, el) => {
            const src = $(el).attr('src');
            if (src && src.includes('/imgs/') && !images.includes(src)) {
                images.push(src);
            }
        });
    }

    const sizesSet = new Set();
    const colorsSet = new Set();
    let totalStock = 0;

    $('.data-list-view tbody tr').each((i, row) => {
        const cols = $(row).find('td');
        if (cols.length >= 4) {
            // Columns: Color | Size | Commision | Stock
            const color = $(cols[0]).text().trim(); // wait, does col 0 have checkbox?
            // "نبيتي | L | 5% | 119" - let's see how many cols
            let colOffset = 0;
            if ($(cols[0]).find('.dt-checkboxes').length > 0) {
                colOffset = 1;
            }
            const colorText = $(cols[colOffset]).text().trim();
            const sizeText = $(cols[colOffset + 1]).text().trim();
            const stockText = $(cols[colOffset + 3]).text().trim();

            if (colorText) colorsSet.add(colorText);
            if (sizeText) sizesSet.add(sizeText);
            totalStock += parseInt(stockText) || 0;
        }
    });

    // Another check for description: frequently under "التفاصيل"
    $('h4, h5, div').each((i, el) => {
        if ($(el).text().trim() === 'التفاصيل' || $(el).text().trim() === 'الوصف') {
            const nextEl = $(el).next();
            description = nextEl.text().trim();
        }
    });

    return { name, price, images, sizes: Array.from(sizesSet), colors: Array.from(colorsSet), stock: totalStock, description };
}

console.log(scrapeAngazny());
