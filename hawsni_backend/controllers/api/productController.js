const ProductService = require('../../services/productService');
const uploadToSupabase = require('../../utils/fileUpload');
const supabase = require('../../config/supabase');

// ─── Free Delivery Markup Helper ─────────────────────────────────────────────
// When store setting `free_delivery_enabled` is on, adds 50 EGP to every
// product price so the shipping cost is transparently embedded in the price.
async function applyFreeDeliveryMarkup(products) {
    try {
        const { data: settings } = await supabase
            .from('store_settings')
            .select('free_delivery_enabled')
            .single();
        if (!settings?.free_delivery_enabled) return products;
        const markup = p => ({ ...p, price: (parseFloat(p.price) || 0) + 50 });
        return Array.isArray(products) ? products.map(markup) : markup(products);
    } catch {
        return products; // Fallback: return unchanged on any error
    }
}

class ProductController {
    async getProducts(req, res) {
        try {
            const { category, search, minPrice, maxPrice, sort, featured } = req.query;
            const filters = { category, search, minPrice, maxPrice, is_featured: featured };

            const products = await ProductService.getAllProducts(filters, sort);
            const adjusted = await applyFreeDeliveryMarkup(products);

            res.json({
                success: true,
                count: adjusted.length,
                products: adjusted
            });
        } catch (error) {
            console.error('Error fetching products:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getFeatured(req, res) {
        try {
            const products = await ProductService.getFeaturedProducts();
            const adjusted = await applyFreeDeliveryMarkup(products);
            res.json({ success: true, products: adjusted });
        } catch (error) {
            console.error('Error fetching featured products:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getProduct(req, res) {
        try {
            const product = await ProductService.getProductById(req.params.id);

            if (!product) {
                return res.status(404).json({ success: false, message: 'Product not found' });
            }

            const [adjusted] = await applyFreeDeliveryMarkup([product]);
            res.json({ success: true, product: adjusted });
        } catch (error) {
            console.error('Error fetching product:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getRelatedProducts(req, res) {
        try {
            const { id } = req.params;
            
            // Fetch current product to find its category
            const current = await ProductService.getProductById(id);
            let categoryId = current ? current.category_id : null;

            // Start by trying to find other products in the same category
            let query = supabase.from('products')
                .select('*')
                .neq('id', id)
                .order('created_at', { ascending: false })
                .limit(8);

            if (categoryId) {
                query = query.eq('category_id', categoryId);
            }

            let { data: related, error } = await query;
            if (error) throw error;

            let finalProducts = related || [];

            // If we didn't find enough related products, fill with other recent/featured products
            if (finalProducts.length < 4) {
                const existingIds = new Set(finalProducts.map(p => p.id));
                existingIds.add(id);

                const { data: more } = await supabase.from('products')
                    .select('*')
                    .not('id', 'in', `(${Array.from(existingIds).join(',')})`)
                    .order('is_featured', { ascending: false }) // Prioritize high demand/featured
                    .order('created_at', { ascending: false })
                    .limit(8 - finalProducts.length);

                if (more && more.length > 0) {
                    finalProducts = [...finalProducts, ...more];
                }
            }

            const adjusted = await applyFreeDeliveryMarkup(finalProducts);
            res.json({ success: true, products: adjusted });
        } catch (error) {
            console.error('Error fetching related products:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async createProduct(req, res) {
        try {
            // Helper to ensure absolute URLs
            const ensureAbsoluteUrl = (url) => {
                if (!url || typeof url !== 'string') return url;
                if (url.startsWith('http')) return url;
                const cloudName = process.env.CLOUDINARY_NAME || process.env.CLOUDINARY_CLOUD_NAME || 'hwasibackend'; 
                if (url.match(/^[a-z0-9_]+(\.[a-z0-9]+)?$/i)) {
                    return `https://res.cloudinary.com/${cloudName}/image/upload/${url}`;
                }
                return url;
            };

            let rawImageUrls = [];
            // Priority 1: Direct URLs from Cloudinary (Direct Upload)
            if (req.body.image_urls) {
                const urls = typeof req.body.image_urls === 'string'
                    ? JSON.parse(req.body.image_urls)
                    : req.body.image_urls;
                rawImageUrls = Array.isArray(urls) ? urls : [urls];
            }
            // Priority 2: Traditional file upload via Multer (fallback)
            else if (req.files && req.files.length > 0) {
                const uploadPromises = req.files.map(file => uploadToSupabase(file, 'products'));
                const results = await Promise.all(uploadPromises);
                rawImageUrls = results.map(r => r.url);
            }

            // Sanitize all URLs
            const imageUrls = rawImageUrls.map(ensureAbsoluteUrl).filter(url => url);

            let sizes = [];
            let colors = [];

            if (req.body.sizes) {
                sizes = Array.isArray(req.body.sizes) ? req.body.sizes : req.body.sizes.split(',').map(s => s.trim());
            }

            if (req.body.colors) {
                try {
                    // Try to parse as JSON (new format with image mapping)
                    let parsedColors = typeof req.body.colors === 'string' ? JSON.parse(req.body.colors) : req.body.colors;

                    // Handle case where colors might be an array of stringified objects
                    if (Array.isArray(parsedColors)) {
                        colors = parsedColors.map(c => {
                            if (typeof c === 'string') {
                                // Try to parse if it's a stringified object
                                try {
                                    const parsed = JSON.parse(c);
                                    return parsed.color ? parsed : { color: c, imageIndex: null };
                                } catch {
                                    // It's just a color string
                                    return { color: c, imageIndex: null };
                                }
                            } else if (c && typeof c === 'object' && c.color) {
                                // Already a proper object
                                return c;
                            }
                            return { color: c, imageIndex: null };
                        });
                    } else {
                        colors = [];
                    }
                } catch (e) {
                    // Fallback to old format (comma-separated strings)
                    colors = req.body.colors.split(',').map(c => ({ color: c.trim(), imageIndex: null }));
                }
            }

            const productData = {
                name: req.body.name,
                description: req.body.description,
                price: parseFloat(req.body.price),
                discount: parseInt(req.body.discount) || 0,
                category_id: null, // Legacy field
                category_ids: req.body.category_ids || (req.body.category_id ? [req.body.category_id] : []),
                stock: parseInt(req.body.stock) || 0,
                is_featured: req.body.is_featured === 'on' || req.body.is_featured === 'true' || req.body.is_featured === true,
                is_vto_enabled: req.body.is_vto_enabled === 'on' || req.body.is_vto_enabled === 'true' || req.body.is_vto_enabled === true || (req.body.is_vto_enabled === undefined && true), // fallback for old payloads
                sizes: sizes,
                colors: colors,
                images: imageUrls
            };

            const product = await ProductService.createProduct(productData);

            res.status(201).json({ success: true, product });
        } catch (error) {
            console.error('Error creating product:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async updateProduct(req, res) {
        try {
            // Get current product to preserve existing images
            const currentProduct = await ProductService.getProductById(req.params.id);

            if (!currentProduct) {
                return res.status(404).json({ success: false, message: 'Product not found' });
            }

            let imageUrls = currentProduct.images || [];

            // Priority 1: Direct URLs from Cloudinary (Direct Upload)
            if (req.body.image_urls) {
                const urls = typeof req.body.image_urls === 'string'
                    ? JSON.parse(req.body.image_urls)
                    : req.body.image_urls;
                const newUrls = Array.isArray(urls) ? urls : [urls];
                imageUrls = [...imageUrls, ...newUrls];
            }
            // Priority 2: Traditional file upload via Multer (fallback)
            else if (req.files && req.files.length > 0) {
                const uploadPromises = req.files.map(file => uploadToSupabase(file, 'products'));
                const results = await Promise.all(uploadPromises);
                const newImageUrls = results.map(r => r.url);
                imageUrls = [...imageUrls, ...newImageUrls];
            }

            let sizes = [];
            let colors = [];

            if (req.body.sizes) {
                sizes = Array.isArray(req.body.sizes) ? req.body.sizes : req.body.sizes.split(',').map(s => s.trim());
            }

            if (req.body.colors) {
                colors = Array.isArray(req.body.colors) ? req.body.colors : req.body.colors.split(',').map(c => c.trim());
            }

            let categoryIds = req.body.category_ids || (req.body.category_id ? [req.body.category_id] : []);
            if (!Array.isArray(categoryIds)) categoryIds = [categoryIds];

            const productData = {
                name: req.body.name,
                description: req.body.description,
                price: parseFloat(req.body.price),
                discount: parseInt(req.body.discount) || 0,
                category_id: categoryIds[0] || null, // Sync with first category
                category_ids: categoryIds,
                stock: parseInt(req.body.stock) || 0,
                is_featured: req.body.is_featured === 'on' || req.body.is_featured === 'true' || req.body.is_featured === true,
                is_vto_enabled: req.body.is_vto_enabled === 'on' || req.body.is_vto_enabled === 'true' || req.body.is_vto_enabled === true,
                sizes: sizes,
                colors: colors,
                images: imageUrls
            };

            const product = await ProductService.updateProduct(req.params.id, productData);

            res.json({ success: true, product });
        } catch (error) {
            console.error('Error updating product:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async deleteProduct(req, res) {
        try {
            const product = await ProductService.deleteProduct(req.params.id);

            if (!product) {
                return res.status(404).json({ success: false, message: 'Product not found' });
            }

            res.json({ success: true, message: 'Product deleted' });
        } catch (error) {
            console.error('Error deleting product:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    // Admin UI Methods
    async renderProductsPage(req, res) {
        try {
            // Fetch products and categories separately or with a looser join to ensure all show
            const { data: products, error: pError } = await supabase
                .from('products')
                .select('*')
                .order('created_at', { ascending: false });

            if (pError) throw pError;

            const { data: categories, error: cError } = await supabase
                .from('categories')
                .select('*');

            if (cError) throw cError;

            // Map category names manually for maximum reliability
            const categoryMap = (categories || []).reduce((acc, cat) => {
                acc[cat.id] = cat.name;
                acc[cat._id] = cat.name; // Handle both id formats if necessary
                return acc;
            }, {});

            const mappedProducts = (products || []).map(p => ({
                ...p,
                category_name: categoryMap[p.category_id] || 'بدون تصنيف'
            }));

            res.render('products', { products: mappedProducts, categories: categories || [] });
        } catch (error) {
            console.error('Error rendering products:', error);
            res.status(500).send(`خطأ في عرض المنتجات: ${error.message}`);
        }
    }

    async renderNewProductPage(req, res) {
        try {
            const { data: categories } = await supabase.from('categories').select('*');
            res.render('product-form', { product: null, categories: categories || [] });
        } catch (error) {
            console.error('Error rendering new product form:', error);
            res.status(500).send(`خطأ في عرض صفحة المنتج الجديد: ${error.message}`);
        }
    }

    async createProductAdmin(req, res) {
        try {
            const { name, description, price, discount, category_id, stock, is_featured, is_vto_enabled, sizes, size_guide } = req.body;

            console.log('📦 CreateProductAdmin Called. Files:', req.files ? req.files.length : 'No files');

            let imageUrls = [];

            // Priority 1: Direct URLs from Cloudinary
            if (req.body.image_urls) {
                const urls = typeof req.body.image_urls === 'string'
                    ? JSON.parse(req.body.image_urls)
                    : req.body.image_urls;
                imageUrls = Array.isArray(urls) ? urls : [urls];
                console.log('✅ Direct upload URLs received:', imageUrls);
            }
            // Priority 2: Traditional Multer upload (fallback)
            else if (req.files && req.files.length > 0) {
                try {
                    const uploadPromises = req.files.map(file => uploadToSupabase(file, 'products'));
                    const results = await Promise.all(uploadPromises);
                    imageUrls = results.map(r => r.url);
                    console.log('✅ All images uploaded via Cloudinary:', imageUrls);
                } catch (imgError) {
                    console.error('❌ Error uploading images to Cloudinary:', imgError);
                    return res.status(500).send(`خطأ في رفع الصور: ${imgError.message}`);
                }
            }

            // Handle scraped images
            if (req.body.scraped_images) {
                try {
                    const scraped = JSON.parse(req.body.scraped_images);
                    if (Array.isArray(scraped)) imageUrls = [...imageUrls, ...scraped];
                } catch (e) {
                    console.error('Error parsing scraped images:', e);
                }
            }

            // Parse Sizes — support Arabic comma ، and English comma ,
            // Parse Sizes — support Arabic comma ، and English comma ,
            let sizesArray = [];
            if (sizes) {
                // Ensure we handle both string input and array input (join first to handle mixed cases)
                const sizesString = Array.isArray(sizes) ? sizes.join(',') : String(sizes);
                sizesArray = sizesString.split(/[,،]/).map(s => s.trim()).filter(s => s);
            }

            // Parse Colors
            let colorsArray = [];
            if (req.body.colors) {
                try {
                    let parsedColors = typeof req.body.colors === 'string' ? JSON.parse(req.body.colors) : req.body.colors;
                    if (Array.isArray(parsedColors)) {
                        colorsArray = parsedColors.map(c => {
                            if (typeof c === 'string') return { color: c, imageIndex: null };
                            return c; // Assuming it's already { color, imageIndex }
                        });
                    }
                } catch (e) {
                    colorsArray = typeof req.body.colors === 'string' ? req.body.colors.split(',').map(c => ({ color: c.trim(), imageIndex: null })) : [];
                }
            }

            // Handle Categories mapping
            let categoryIdsToInsert = req.body.category_ids || (category_id ? [category_id] : []);
            if (categoryIdsToInsert && !Array.isArray(categoryIdsToInsert)) {
                categoryIdsToInsert = [categoryIdsToInsert];
            }

            const { data: newProduct, error } = await supabase.from('products').insert({
                name,
                description,
                price: parseFloat(price),
                discount: parseInt(discount) || 0,
                stock: parseInt(stock) || 0,
                category_id: categoryIdsToInsert[0] || null, // Sync with main table
                is_featured: is_featured === 'on',
                is_vto_enabled: is_vto_enabled === 'on',
                sizes: sizesArray.length > 0 ? sizesArray : null,
                colors: colorsArray.length > 0 ? colorsArray : null,
                images: imageUrls,
                size_guide: size_guide || ''
            }).select().single();

            if (error) {
                console.error('❌ Supabase error:', error);
                return res.status(500).send(`خطأ في إضافة المنتج: ${error.message}`);
            }



            if (categoryIdsToInsert && categoryIdsToInsert.length > 0) {
                const links = categoryIdsToInsert.map(catId => ({
                    product_id: newProduct.id,
                    category_id: catId
                }));
                const { error: linkError } = await supabase.from('product_category_links').insert(links);
                if (linkError) {
                    console.error('❌ Error linking categories:', linkError);
                }
            }

            res.redirect('/products');
        } catch (err) {
            console.error('❌ Server error:', err);
            res.status(500).send(`خطأ في السيرفر: ${err.message}`);
        }
    }

    async renderEditProductPage(req, res) {
        try {
            const { data: product } = await supabase
                .from('products')
                .select('*, product_category_links(category_id)')
                .eq('id', req.params.id)
                .single();
            const { data: categories } = await supabase.from('categories').select('*');

            // Map linked categories to a simple array of IDs for easier use in EJS
            if (product && product.product_category_links) {
                product.category_ids = product.product_category_links.map(link => link.category_id);
            } else {
                product.category_ids = [];
            }

            res.render('product-form', { product, categories: categories || [] });
        } catch (error) {
            console.error('Error rendering edit product form:', error);
            res.status(500).send(`خطأ في عرض صفحة تعديل المنتج: ${error.message}`);
        }
    }

    async updateProductAdmin(req, res) {
        try {
            const { name, description, price, discount, category_id, stock, is_featured, is_vto_enabled, sizes, colors, size_guide } = req.body;
            console.log('🔄 UpdateProductAdmin Called for ID:', req.params.id);
            console.log('📂 Files received:', req.files ? req.files.length : 'None');
            console.log('📦 Raw Sizes:', req.body.sizes);
            console.log('📦 Raw Colors:', req.body.colors);
            console.log('📦 Raw Sizes:', req.body.sizes);
            console.log('📦 Raw Colors:', req.body.colors);

            // Helper to ensure absolute URLs (Fix for ERR_CONNECTION_RESET)
            const ensureAbsoluteUrl = (url, cloudName = 'hwasibackend') => {
                if (!url || typeof url !== 'string') return url;
                if (url.startsWith('http')) return url;
                // If it's a relative path starting with a Cloudinary public ID, prepend the base URL
                if (url.match(/^[a-z0-9_]+(\.[a-z0-9]+)?$/i)) {
                    return `https://res.cloudinary.com/${cloudName}/image/upload/${url}`;
                }
                return url;
            };

            // 1. Get current product data
            const { data: currentProduct } = await supabase.from('products').select('images, sizes, colors').eq('id', req.params.id).single();

            // 2. Identify the correct Cloudinary account from existing data
            let detectedCloudName = process.env.CLOUDINARY_NAME || process.env.CLOUDINARY_CLOUD_NAME || 'hwasibackend';
            const allPossibleImages = [...(currentProduct?.images || []), ...(req.body.image_urls ? (typeof req.body.image_urls === 'string' ? JSON.parse(req.body.image_urls) : req.body.image_urls) : [])];
            const sampleUrl = allPossibleImages.find(u => typeof u === 'string' && u.includes('res.cloudinary.com/'));
            if (sampleUrl) {
                const match = sampleUrl.match(/res\.cloudinary\.com\/([^/]+)\//);
                if (match && match[1]) detectedCloudName = match[1];
            }
            console.log('☁️ Detected Cloudinary Name:', detectedCloudName);

            // SOURCE OF TRUTH: The final sequence from the frontend
            let finalImageUrls = [];

            // Case A: Frontend sent the final ordered sequence (Direct Upload or Sort)
            if (req.body.image_urls) {
                try {
                    const urls = typeof req.body.image_urls === 'string'
                        ? JSON.parse(req.body.image_urls)
                        : req.body.image_urls;
                    finalImageUrls = Array.isArray(urls) ? urls : [urls];
                    console.log('✅ Final image sequence received (Direct/Sort):', finalImageUrls.length);
                } catch (e) {
                    console.error('Error parsing image_urls:', e);
                }
            } 
            // Case B: Traditional files uploaded (Fallback)
            else if (req.files && req.files.length > 0) {
                try {
                    // Start with retained images
                    let retained = [];
                    if (req.body.retained_images) {
                        retained = JSON.parse(req.body.retained_images);
                    } else {
                        retained = currentProduct?.images || [];
                    }
                    
                    const uploadPromises = req.files.map(file => uploadToSupabase(file, 'products'));
                    const results = await Promise.all(uploadPromises);
                    const newUploaded = results.map(r => r.url);
                    finalImageUrls = [...retained, ...newUploaded];
                    console.log('✅ Traditional upload added to retained:', newUploaded.length);
                } catch (imgErr) {
                    console.error('❌ Check Cloudinary Error in Update:', imgErr);
                    return res.status(500).send(`خطأ في رفع الصور: ${imgErr.message}`);
                }
            }
            // Case C: Just retained images (Sort or simple edit)
            else if (req.body.retained_images) {
                try {
                    finalImageUrls = JSON.parse(req.body.retained_images);
                } catch (e) {
                    finalImageUrls = currentProduct?.images || [];
                }
            } else {
                finalImageUrls = currentProduct?.images || [];
            }

            // SANITIZATION: Fix broken relative URLs using the detected cloud name
            let imageUrls = finalImageUrls.map(url => ensureAbsoluteUrl(url, detectedCloudName)).filter(url => url);
            console.log('🖼️ Final sanitized image count:', imageUrls.length);

            // Parse sizes — support Arabic comma ، and English comma ,
            let sizesArray = [];
            let colorsArray = [];

            if (sizes) {
                // Ensure we handle both string input and array input (join first to handle mixed cases)
                const sizesString = Array.isArray(sizes) ? sizes.join(',') : String(sizes);
                console.log('📏 Processing Sizes String:', sizesString);
                sizesArray = sizesString.split(/[,،]/).map(s => s.trim()).filter(s => s);
                console.log('📏 Parsed Sizes Array:', sizesArray);
            }

            if (colors) {
                try {
                    // Try to parse as JSON (new format with image mapping)
                    let parsedColors = typeof colors === 'string' ? JSON.parse(colors) : colors;

                    // Handle case where colors might be an array of stringified objects
                    if (Array.isArray(parsedColors)) {
                        colorsArray = parsedColors.map(c => {
                            if (typeof c === 'string') {
                                // Try to parse if it's a stringified object
                                try {
                                    const parsed = JSON.parse(c);
                                    return parsed.color ? parsed : { color: c, imageIndex: null };
                                } catch {
                                    // It's just a color string
                                    return { color: c, imageIndex: null };
                                }
                            } else if (c && typeof c === 'object' && c.color) {
                                // Already a proper object
                                return c;
                            }
                            return { color: c, imageIndex: null };
                        });
                    } else {
                        colorsArray = [];
                    }
                } catch (e) {
                    // Fallback to old format (comma-separated strings)
                    colorsArray = typeof colors === 'string' ? colors.split(',').map(c => ({ color: c.trim(), imageIndex: null })).filter(c => c.color) : colors;
                }
            }

            // Handle Categories mapping Update
            let categoryIdsToInsert = req.body.category_ids || (category_id ? [category_id] : []);
            if (categoryIdsToInsert && !Array.isArray(categoryIdsToInsert)) {
                categoryIdsToInsert = [categoryIdsToInsert];
            }

            // Perform Update
            const { error: updateError } = await supabase.from('products').update({
                name,
                description,
                price: parseFloat(price),
                discount: parseInt(discount) || 0,
                stock: parseInt(stock) || 0,
                category_id: categoryIdsToInsert[0] || null, // Sync with main table
                is_featured: is_featured === 'on',
                is_vto_enabled: is_vto_enabled === 'on',
                sizes: sizesArray.length > 0 ? sizesArray : null,
                colors: colorsArray.length > 0 ? colorsArray : null,
                images: imageUrls,
                size_guide: size_guide || ''
            }).eq('id', req.params.id);

            if (updateError) throw updateError;

            // Remove old links
            await supabase.from('product_category_links').delete().eq('product_id', req.params.id);

            // Insert new links
            if (categoryIdsToInsert && categoryIdsToInsert.length > 0) {
                const links = categoryIdsToInsert.map(catId => ({
                    product_id: req.params.id,
                    category_id: catId
                }));
                const { error: linkError } = await supabase.from('product_category_links').insert(links);
                if (linkError) {
                    console.error('❌ Error linking categories:', linkError);
                }
            }

            // Verify Persistence
            // const { data: updatedProduct } = await supabase.from('products').select('sizes, colors').eq('id', req.params.id).single();

            res.redirect('/products');
            // res.json({
            //     success: true,
            //     message: 'Debug Verification: Data updated in Database?',
            //     sentToDb: {
            //         sizes: sizesArray.length > 0 ? sizesArray : null,
            //     },
            //     readFromDb: {
            //         sizes: updatedProduct?.sizes,
            //         colors: updatedProduct?.colors
            //     },
            //     match: JSON.stringify(sizesArray) === JSON.stringify(updatedProduct?.sizes)
            // });
        } catch (err) {
            console.error('❌ Server error:', err);
            res.status(500).send(`خطأ في السيرفر: ${err.message}`);
        }
    }

    async deleteProductAdmin(req, res) {
        try {
            await supabase.from('products').delete().eq('id', req.params.id);

            // Check if request expects JSON (Fetch/AJAX)
            if (req.xhr || req.headers.accept.indexOf('json') > -1) {
                return res.json({ success: true, message: 'تم حذف المنتج بنجاح' });
            }

            // Fallback for standard form posts
            res.redirect('/products');
        } catch (error) {
            console.error('Error deleting product (Admin):', error);
            if (req.xhr || req.headers.accept.indexOf('json') > -1) {
                return res.status(500).json({ success: false, message: `خطأ في حذف المنتج: ${error.message}` });
            }
            res.status(500).send(`خطأ في حذف المنتج: ${error.message}`);
        }
    }

    // Image Management Methods
    async renderImageManagementPage(req, res) {
        try {
            const { data: product } = await supabase.from('products').select('*').eq('id', req.params.id).single();
            if (!product) {
                return res.status(404).send('المنتج غير موجود');
            }
            res.render('product-images', { product });
        } catch (error) {
            console.error('Error rendering image management page:', error);
            res.status(500).send(`خطأ في عرض صفحة إدارة الصور: ${error.message}`);
        }
    }

    async uploadProductImages(req, res) {
        try {
            const { data: currentProduct } = await supabase.from('products').select('images').eq('id', req.params.id).single();

            let imageUrls = currentProduct?.images || [];

            if (req.files && req.files.length > 0) {
                const uploadPromises = req.files.map(file => uploadToSupabase(file, 'products'));
                const results = await Promise.all(uploadPromises);
                const newImageUrls = results.map(r => r.url);
                imageUrls = [...imageUrls, ...newImageUrls];

                // Optional: update blur hash if it's empty, but generally safe to leave it
            }

            await supabase.from('products').update({ images: imageUrls }).eq('id', req.params.id);

            res.redirect(`/products/${req.params.id}/images`);
        } catch (error) {
            console.error('Error uploading images:', error);
            res.status(500).send(`خطأ في رفع الصور: ${error.message}`);
        }
    }

    async reorderProductImages(req, res) {
        try {
            const newOrder = JSON.parse(req.body.imageOrder);

            await supabase.from('products').update({ images: newOrder }).eq('id', req.params.id);

            res.redirect(`/products/${req.params.id}/images`);
        } catch (error) {
            console.error('Error reordering images:', error);
            res.status(500).send(`خطأ في إعادة ترتيب الصور: ${error.message}`);
        }
    }

    async deleteProductImage(req, res) {
        try {
            const { data: product } = await supabase.from('products').select('images').eq('id', req.params.id).single();

            if (!product || !product.images) {
                return res.status(404).json({ success: false, message: 'Product or images not found' });
            }

            const imageIndex = parseInt(req.params.imageIndex);
            const updatedImages = product.images.filter((_, index) => index !== imageIndex);

            await supabase.from('products').update({ images: updatedImages }).eq('id', req.params.id);

            res.json({ success: true });
        } catch (error) {
            console.error('Error deleting image:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    // Bulk delete products (Admin)
    async bulkDelete(req, res) {
        try {
            const { ids } = req.body;
            if (!ids || !Array.isArray(ids) || ids.length === 0) {
                return res.status(400).json({ success: false, message: 'لا توجد منتجات محددة' });
            }

            const { error } = await supabase.from('products').delete().in('id', ids);
            if (error) throw error;

            res.json({ success: true, message: `تم حذف ${ids.length} منتج` });
        } catch (err) {
            console.error('Error bulk deleting products:', err);
            res.status(500).json({ success: false, message: err.message });
        }
    }

    // Bulk update products (Admin) — e.g. change category
    async bulkUpdate(req, res) {
        try {
            const { ids, updates } = req.body;
            if (!ids || !Array.isArray(ids) || ids.length === 0) {
                return res.status(400).json({ success: false, message: 'لا توجد منتجات محددة' });
            }
            if (!updates || Object.keys(updates).length === 0) {
                return res.status(400).json({ success: false, message: 'لا توجد تحديثات' });
            }

            // Whitelist allowed fields for safety
            const allowed = ['category_id', 'is_featured', 'discount'];
            const safeUpdates = Object.fromEntries(
                Object.entries(updates).filter(([k]) => allowed.includes(k))
            );

            const { error } = await supabase.from('products').update(safeUpdates).in('id', ids);
            if (error) throw error;

            // Sync product_category_links for each ID if category_id was updated
            if (safeUpdates.category_id) {
                // Delete existing links for these products
                await supabase.from('product_category_links').delete().in('product_id', ids);

                // Insert new ones
                const bulkLinks = ids.map(id => ({
                    product_id: id,
                    category_id: safeUpdates.category_id
                }));
                await supabase.from('product_category_links').insert(bulkLinks);
            }

            res.json({ success: true, message: `تم تحديث ${ids.length} منتج` });
        } catch (err) {
            console.error('Error bulk updating products:', err);
            res.status(500).json({ success: false, message: err.message });
        }
    }
}

module.exports = new ProductController();

