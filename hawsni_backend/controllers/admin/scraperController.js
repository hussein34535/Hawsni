const fetch = require('node-fetch');
const cheerio = require('cheerio');

class ScraperController {
    async scrape(req, res) {
        try {
            const { url } = req.body;

            if (!url) {
                return res.status(400).json({ success: false, message: 'URL is required' });
            }

            // Fetch the HTML
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch URL: ${response.statusText}`);
            }
            const html = await response.text();

            // Load into Cheerio
            const $ = cheerio.load(html);

            // 1. Title
            const name = $('h6.prodect-text').text().trim();

            // 2. Description
            // Get the container
            const descContainer = $('section.component-What');
            // Clone to not affect original DOM if needed, though here we're just extracting
            // Remove elements we don't want in description (title, buttons, etc.)
            let $desc = descContainer.clone();
            $desc.find('h6.prodect-text').remove();
            $desc.find('.card-body-2').remove();
            $desc.find('table').remove();
            $desc.find('div:has(a.btn-save-link)').remove();
            $desc.find('h1').remove(); // "لينك الميديا" usually in h1

            // Clean up text
            let description = '';
            if ($desc && $desc.length > 0) {
                const htmlContent = $desc.html();
                if (htmlContent) {
                    description = htmlContent.trim();
                }
            }

            // 3. Price
            // Look for "السعر : 450 جنيه"
            let price = 0;
            const priceText = $('.card-body-2.price').text();
            const priceMatch = priceText.match(/(\d+)\s*جنيه/);
            if (priceMatch) {
                price = parseFloat(priceMatch[1]);
            }

            // 4. Images
            // Main image
            const images = [];
            const mainImg = $('.abut-img img').attr('src');
            if (mainImg) {
                images.push(mainImg);
            }

            // 5. Variants (Sizes, Colors, Stock)
            const variants = [];
            let totalStock = 0;
            const sizesSet = new Set();
            const colorsSet = new Set();

            $('.table-product tbody tr').each((i, el) => {
                const cols = $(el).find('td');
                if (cols.length >= 3) {
                    const colorSizeText = $(cols[0]).text().trim(); // "أببض M"
                    const color = $(cols[1]).text().trim();         // "أببض"
                    const stock = parseInt($(cols[2]).text().trim()) || 0;

                    // Extract size by removing color from the first column
                    let size = colorSizeText.replace(color, '').trim();

                    if (size && color) {
                        variants.push({ size, color, stock });
                        sizesSet.add(size);
                        colorsSet.add(color);
                        totalStock += stock;
                    }
                }
            });

            res.json({
                success: true,
                data: {
                    name,
                    description,
                    price,
                    stock: totalStock,
                    images,
                    sizes: Array.from(sizesSet),
                    colors: Array.from(colorsSet), // We might need to map these to hex codes or keep as names
                    variants
                }
            });

        } catch (error) {
            console.error('Scraping error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new ScraperController();
