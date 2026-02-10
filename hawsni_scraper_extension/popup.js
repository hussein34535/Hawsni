document.addEventListener('DOMContentLoaded', async () => {
    const scrapeBtn = document.getElementById('scrapeBtn');
    const pasteBtn = document.getElementById('pasteBtn');
    const statusDiv = document.getElementById('status');

    // Check if we have data in storage
    const data = await chrome.storage.local.get('scrapedProduct');
    if (data.scrapedProduct) {
        pasteBtn.disabled = false;
        statusDiv.textContent = 'Product payload ready to paste.';
    }

    scrapeBtn.addEventListener('click', async () => {
        statusDiv.textContent = 'Scraping...';
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: scrapeLogic,
            });

            const product = results[0].result;
            if (product) {
                await chrome.storage.local.set({ scrapedProduct: product });
                pasteBtn.disabled = false;
                statusDiv.textContent = 'Scraped! Go to hwasi and Paste.';
            } else {
                statusDiv.textContent = 'No data found or scraping failed.';
            }
        } catch (err) {
            statusDiv.textContent = 'Error: ' + err.message;
        }
    });

    pasteBtn.addEventListener('click', async () => {
        statusDiv.textContent = 'Pasting...';
        try {
            const data = await chrome.storage.local.get('scrapedProduct');
            if (!data.scrapedProduct) {
                statusDiv.textContent = 'No data to paste.';
                return;
            }

            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: pasteLogic,
                args: [data.scrapedProduct]
            });
            statusDiv.textContent = 'Pasted successfully!';
        } catch (err) {
            statusDiv.textContent = 'Error: ' + err.message;
        }
    });
});

// === SCRAPING LOGIC (Runs on Vendor Tab) ===
function scrapeLogic() {
    try {
        // 1. Title
        const nameEl = document.querySelector('h6.prodect-text');
        const name = nameEl ? nameEl.textContent.trim() : 'Unknown Product';

        // 2. Description & Price (Fallback)
        const descContainer = document.querySelector('section.component-What');
        let description = '';
        let scrapedPriceFromDesc = 0;

        if (descContainer) {
            let text = descContainer.innerText;

            // Attempt to extract price from description text as fallback
            // Examples: "السعر : 599 جنيه", "Price : 599"
            const priceRegex = /(?:السعر|Price)\s*[:]\s*(\d+(\.\d+)?)/;
            const pMatch = text.match(priceRegex);
            if (pMatch) {
                scrapedPriceFromDesc = parseFloat(pMatch[1]);
            }

            // FILTER: Remove the product title itself if present in description
            if (name) {
                text = text.replace(name, '').trim();
            }

            // Filter out unwanted lines/sections
            const lines = text.split('\n').map(l => l.trim()).filter(l => l);
            const cleanLines = [];

            const skipKeywords = [
                'SIZE', 'COLOR', 'STOCK', 'SIZE CHART', 'In Stock',
                'البائع', 'العمولة', 'تحميل الكاتلوج', 'أضف اوردر جديد',
                'Hooks', 'لينك الميديا', 'السعر :', 'drive.google.com',
                'Media', 'لينك', 'ميديا', 'للتواصل', // Aggressive filtering
                'المقاسات بالوزن', 'مخزن', 'تلبيس', 'وزن', 'كيلو', 'Code', 'كود' // New requested filters
            ];

            for (const line of lines) {
                // Check if line contains any skip keywords
                if (skipKeywords.some(kw => line.includes(kw))) continue;

                // Filter table rows like "أبيض L 8" or "White XL 10"
                // Pattern: ends with a number, has at least 2 parts
                // We use .+ to match Arabic or English words
                if (/^.+\s+.+\s+\d+$/.test(line)) continue;

                // Filter "L 70:85" style lines
                if (/^[0-9A-Za-z]+\s+\d/.test(line)) continue;

                cleanLines.push(`<p>${line}</p>`);
            }

            description = cleanLines.join('');
        }

        // 3. Price (Primary Method)
        let price = 0;
        const priceEl = document.querySelector('.card-body-2.price');
        if (priceEl && priceEl.innerText) {
            const text = priceEl.innerText;
            const match = text.match(/(?:السعر|Price)\s*[:]\s*(\d+(\.\d+)?)/);
            if (match) price = parseFloat(match[1]);

            if (price === 0) {
                const simpleMatch = text.match(/(\d+(\.\d+)?)\s*جنيه/);
                if (simpleMatch) price = parseFloat(simpleMatch[1]);
            }
        }

        // Use fallback if primary failed
        if (price === 0 && scrapedPriceFromDesc > 0) {
            price = scrapedPriceFromDesc;
        }

        // 4. Images
        let images = [];

        // Strategy A: Specific Selector
        const mainImg = document.querySelector('.abut-img img');
        if (mainImg && mainImg.src) images.push(mainImg.src);

        // Strategy B: OG Image (Fallback) - High Quality
        if (images.length === 0) {
            const ogImg = document.querySelector('meta[property="og:image"]');
            if (ogImg && ogImg.content) images.push(ogImg.content);
        }

        // Strategy C: General Product Images (Fallback)
        if (images.length === 0) {
            // Try common selectors for product sliders/galleries
            const sliderImgs = document.querySelectorAll('.product-images img, .carousel-item img, .slider-single img, .swiper-slide img');
            sliderImgs.forEach(img => {
                if (img.src && img.src.startsWith('http') && !images.includes(img.src)) {
                    images.push(img.src);
                }
            });
        }

        // 5. Variants
        const sizesSet = new Set();
        const colorsSet = new Set();
        let totalStock = 0;

        document.querySelectorAll('.table-product tbody tr').forEach(row => {
            const cols = row.querySelectorAll('td');
            if (cols.length >= 3) {
                const colorSizeText = cols[0].textContent.trim();
                const color = cols[1].textContent.trim();
                const stock = parseInt(cols[2].textContent.trim()) || 0;

                let size = colorSizeText.replace(color, '').trim();
                if (size && color) {
                    sizesSet.add(size);
                    colorsSet.add(color);
                    totalStock += stock;
                }
            }
        });

        return {
            name,
            description,
            price,
            stock: totalStock,
            images,
            sizes: Array.from(sizesSet),
            colors: Array.from(colorsSet)
        };
    } catch (e) {
        console.error(e);
        return null;
    }
}

// === PASTING LOGIC (Runs on hwasi Tab) ===
function pasteLogic(product) {
    if (!product) return;

    // Fill Basic Fields
    const setVal = (sel, val) => {
        const el = document.querySelector(sel);
        if (el) el.value = val;
    };

    setVal('input[name="name"]', product.name);
    setVal('textarea[name="description"]', product.description); // Might be textarea or rich editor
    setVal('input[name="price"]', product.price);
    setVal('input[name="stock"]', product.stock);
    setVal('input[name="sizes"]', product.sizes.join(', '));

    // Images (Populate hidden input)
    const scrapedImgsInput = document.getElementById('scrapedImagesInput');
    if (scrapedImgsInput) {
        scrapedImgsInput.value = JSON.stringify(product.images);
    }

    // Notify user about images next to the file input
    const imgLabel = document.querySelector('label.form-label');
    if (imgLabel && product.images.length > 0) {
        // Clear previous success message if any
        const existingSpan = imgLabel.querySelector('.scraped-success-msg');
        if (existingSpan) existingSpan.remove();

        const span = document.createElement('span');
        span.className = 'scraped-success-msg';
        span.textContent = ' (تم تحميل الصور تلقائياً ✅)';
        span.style.color = '#28a745';
        span.style.fontWeight = 'bold';
        imgLabel.appendChild(span);
    }

    // Colors (Populate hidden input)
    const colorsInput = document.getElementById('colorsInput');
    if (colorsInput && product.colors) {
        const colorObjs = product.colors.map(c => ({ color: c, imageIndex: null }));
        colorsInput.value = JSON.stringify(colorObjs);
    }

    // Notify the page to update UI (Unified Event)
    window.dispatchEvent(new CustomEvent('hwasi-data-pasted', { detail: product }));

    alert('Product pasted! Review details and Save.');
}
