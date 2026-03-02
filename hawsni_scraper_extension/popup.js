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
        statusDiv.innerHTML = '<span style="color: #007bff;">⏳ الخطوة 1: جاري استخراج البيانات الخام من الصفحة...</span>';
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: scrapeLogic,
            });

            const rawProduct = results[0].result;
            if (rawProduct) {
                statusDiv.innerHTML = '<span style="color: #28a745;">✅ تم استخراج البيانات.</span><br><span style="color: #007bff;">⏳ الخطوة 2: جاري الاتصال بالذكاء الاصطناعي للتحسين...</span>';

                // --- OPENROUTER AI INTEGRATION ---
                const systemPrompt = `
You are a Senior Fashion Copywriter and E-commerce Specialist for a high-end fashion brand (similar to Zara, Massimo Dutti, H&M Premium). Your goal is to transform raw, informal product details into sophisticated, "Quiet Luxury" marketing copy.

### TONE & STYLE:
- **Professional & Chic:** Use formal Arabic mixed with industry-standard English terms (e.g., Premium Fit, Finishing, Texture, High-end, Oversize).
- **Concise:** Avoid fluff. Focus on material quality, cut/fit, and usage.
- **No Street Slang:** Do not use words like "شياكة", "تحفة", "خامة محملة" in a colloquial way. Instead, use "أناقة", "نسيج عالي الكثافة", "جودة استثنائية".

### OUTPUT STRUCTURE (Strictly follow this order):

1. **PRODUCT TITLE:**
   - Create a sophisticated English title in ALL CAPS.
   - Format: **THE [ADJECTIVE/NOUN] [CATEGORY]**
   - Example: **THE SIGNATURE QUARTER ZIP** or **THE CLASSIC COTTON HOODIE**.

2. **DESCRIPTION:**
   - Write a short paragraph (2-3 sentences) in Arabic.
   - Highlight the fabric (Cotton, Polar, etc.), the fit, and the finishing.
   - Use a tone of "Quiet Luxury".

3. **SYSTEM SIZE FORMAT (CRITICAL):**
   - You must convert the provided size/weight data into a specific single-line format for the database.
   - Format: Size= Range Unit , Size= Range Unit
   - Use a comma "،" or "," to separate sizes.
   - Example: **S= 50-60 كجم ، M= 60-70 كجم ، L= 70-80 كجم**
   - If the input is in cm, keep it in cm. If in kg, keep it in kg.

### INPUT PROCESSING:
- Ignore spelling mistakes in the user's raw input.
- If the user provides messy size data, clean it and format it strictly as requested above.
- Return ONLY the exact requested format, nothing else. No markdown wrappers around the entire response.`;

                const userPrompt = `Raw Title: ${rawProduct.name}\n\nRaw Description: ${rawProduct.description}\n\nRaw Sizes: ${rawProduct.sizes.join(', ')}`;

                const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${CONFIG.OPENROUTER_API_KEY}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': 'https://hawsni.com',
                        'X-Title': 'Hawsni Scraper Extension'
                    },
                    body: JSON.stringify({
                        model: "arcee-ai/trinity-large-preview:free",
                        messages: [
                            { role: "system", content: systemPrompt },
                            { role: "user", content: userPrompt }
                        ]
                    })
                });

                if (aiResponse.ok) {
                    statusDiv.innerHTML += '<br><span style="color: #28a745;">✅ تم استلام الرد من الذكاء الاصطناعي.</span><br><span style="color: #007bff;">⏳ الخطوة 3: جاري تنسيق ومعالجة البيانات للحفظ...</span>';
                    const aiData = await aiResponse.json();
                    let aiText = aiData.choices[0].message.content;

                    // Parse the rewritten text according to the structure
                    // Using basic regex/split strategies
                    let newTitle = rawProduct.name;
                    let newDesc = rawProduct.description;
                    let newSizesStr = '';

                    const titleMatch = aiText.match(/\*\*THE.*?\*\*/);
                    if (titleMatch) {
                        newTitle = titleMatch[0].replace(/\*\*/g, '').trim();
                        aiText = aiText.replace(titleMatch[0], '');
                    }

                    // Look for the size line (something with '=' and ',')
                    const lines = aiText.split('\n').map(l => l.trim()).filter(l => l);
                    const sizeLineIndex = lines.findIndex(l => l.includes('=') && (l.includes('،') || l.includes(',')));

                    if (sizeLineIndex !== -1) {
                        newSizesStr = lines[sizeLineIndex].replace(/\*\*/g, '').replace(/Size/g, '').trim();
                        // Remove size line from description lines
                        lines.splice(sizeLineIndex, 1);
                    }

                    // Everything else is description
                    newDesc = lines.join('\n').replace(/\*\*/g, '').trim();

                    // Update product payload
                    const product = {
                        ...rawProduct,
                        name: newTitle,
                        description: newDesc,
                        ai_sizes_raw: newSizesStr // We store it separate so the paste logic knows it's the formatted size guide
                    };

                    await chrome.storage.local.set({ scrapedProduct: product });
                    pasteBtn.disabled = false;
                    statusDiv.innerHTML = '<span style="color: #28a745; font-weight: bold;">🎉 اكتملت جميع الخطوات بنجاح! انتقل للوحة التحكم واضغط Paste.</span>';
                } else {
                    console.error("OpenRouter API Failed", await aiResponse.text());
                    // Fallback to raw if AI fails
                    await chrome.storage.local.set({ scrapedProduct: rawProduct });
                    pasteBtn.disabled = false;
                    statusDiv.innerHTML = '<span style="color: #dc3545;">⚠️ فشل الاتصال بالذكاء الاصطناعي. تم سحب البيانات الخام. انتقل للوحة التحكم واضغط Paste.</span>';
                }
            } else {
                statusDiv.innerHTML = '<span style="color: #dc3545;">❌ لم يتم العثور على بيانات في هذه الصفحة أو فشل السحب.</span>';
            }
        } catch (err) {
            statusDiv.innerHTML = '<span style="color: #dc3545;">❌ خطأ: ' + err.message + '</span>';
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
        const hostname = window.location.hostname;

        if (hostname.includes('angazny.com')) {
            // === ANGAZNY LOGIC ===
            let name = 'Unknown Product';
            const h5s = document.querySelectorAll('h5.mb-1');
            if (h5s.length > 0) {
                const clone = h5s[0].cloneNode(true);
                Array.from(clone.children).forEach(child => child.remove());
                name = clone.textContent.trim();
            }

            let price = 0;
            const priceInput = document.getElementById('TotalPriceValue');
            if (priceInput) {
                price = parseFloat(priceInput.value);
            }

            let description = '';
            const productDescEl = document.getElementById('ProductDescription');
            if (productDescEl) {
                // innerText preserves natural visual line breaks from the browser
                description = productDescEl.innerText.trim();
            }
            if (!description.trim()) {
                // Fallback if there's no #ProductDescription
                const headings = document.querySelectorAll('h4, h5, div');
                headings.forEach(el => {
                    if (el.textContent.trim() === 'التفاصيل' || el.textContent.trim() === 'الوصف') {
                        if (el.nextElementSibling) {
                            description += el.nextElementSibling.innerText.trim() + '\n';
                        }
                    }
                });
            }
            if (!description.trim()) {
                description = 'Product details extracted from Angazny.';
            }

            let images = [];
            const swiperImgs = document.querySelectorAll('.swiper-wrapper img, .carousel-item img, img.img-fluid');
            swiperImgs.forEach(img => {
                if (img.src && img.src.includes('/imgs/') && !images.includes(img.src)) {
                    images.push(img.src);
                }
            });
            if (images.length === 0) {
                document.querySelectorAll('img').forEach(img => {
                    if (img.src && img.src.includes('/imgs/') && !images.includes(img.src)) {
                        images.push(img.src);
                    }
                });
            }

            const sizesSet = new Set();
            const colorsSet = new Set();
            let totalStock = 0;

            const rows = document.querySelectorAll('.data-list-view tbody tr');
            rows.forEach(row => {
                const cols = row.querySelectorAll('td');
                if (cols.length >= 4) {
                    let colOffset = 0;
                    if (cols[0].querySelector('.dt-checkboxes')) {
                        colOffset = 1;
                    }
                    if (cols.length > colOffset + 3) {
                        const colorText = cols[colOffset].textContent.trim();
                        const sizeText = cols[colOffset + 1].textContent.trim();
                        const stockText = cols[colOffset + 3].textContent.trim();

                        if (colorText) colorsSet.add(colorText);
                        if (sizeText) sizesSet.add(sizeText);
                        totalStock += parseInt(stockText) || 0;
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
        } else {
            // === ORIGINAL VENDOR LOGIC ===
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
        }
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
    if (product.ai_sizes_raw) {
        setVal('textarea[name="size_guide"]', product.ai_sizes_raw);
    }

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
