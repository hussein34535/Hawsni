const ProductService = require('../../services/productService');
const uploadToSupabase = require('../../utils/fileUpload');
const supabase = require('../../config/supabase');
const { cleanImageUrls } = require('../../utils/imageUtils');


class ProductController {
    async getProducts(req, res) {
        try {
            const { category, search, minPrice, maxPrice, sort, featured, page, limit } = req.query;
            const filters = { category, search, minPrice, maxPrice, is_featured: featured };

            const result = await ProductService.getAllProducts(filters, sort, page, limit);

            res.json({
                success: true,
                ...result
            });
        } catch (error) {
            console.error('Error fetching products:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getFeatured(req, res) {
        try {
            const products = await ProductService.getFeaturedProducts();
            res.json({ success: true, products: products });
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

            res.json({ success: true, product: product });
        } catch (error) {
            console.error('Error fetching product:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Internal helper to parse and sanitize product data from both API and Admin requests.
     */
    _parseProductPayload(req, existingImages = []) {
        const body = req.body;
        
        // 1. Image URLs
        let rawUrls = [];
        let hasImageUpdates = false;

        if (body.retained_images) {
            try { 
                rawUrls = JSON.parse(body.retained_images); 
                hasImageUpdates = true;
            } catch(e) {}
        } else {
            // Fallback to existing images if no explicit retain/update field is sent
            rawUrls = [...existingImages];
        }

        if (body.image_urls) {
            const urls = typeof body.image_urls === 'string' ? JSON.parse(body.image_urls) : body.image_urls;
            const newUrls = Array.isArray(urls) ? urls : [urls];
            rawUrls = [...rawUrls, ...newUrls];
            hasImageUpdates = true;
        }

        if (body.scraped_images) {
            try {
                const scraped = JSON.parse(body.scraped_images);
                if (Array.isArray(scraped)) {
                    rawUrls = [...rawUrls, ...scraped];
                    hasImageUpdates = true;
                }
            } catch (e) {}
        }
        
        // If absolutely no image related fields were sent, keep existing
        if (!hasImageUpdates && (!rawUrls || rawUrls.length === 0)) {
            rawUrls = [...existingImages];
        }
        
        // Use central utility for URLs
        const cloudName = process.env.CLOUDINARY_NAME || 'hwasibackend';
        const imageUrls = cleanImageUrls(rawUrls, cloudName);

        // 2. Sizes
        let sizesArray = [];
        if (body.sizes) {
            const sizesString = Array.isArray(body.sizes) ? body.sizes.join(',') : String(body.sizes);
            sizesArray = sizesString.split(/[,،]/).map(s => s.trim()).filter(s => s);
        }

        // 3. Colors
        let colorsArray = [];
        if (body.colors) {
            try {
                let parsed = typeof body.colors === 'string' ? JSON.parse(body.colors) : body.colors;
                if (Array.isArray(parsed)) {
                    colorsArray = parsed.map(c => (typeof c === 'string' ? { color: c, imageIndex: null } : c));
                }
            } catch (e) {
                colorsArray = String(body.colors).split(',').map(c => ({ color: c.trim(), imageIndex: null })).filter(c => c.color);
            }
        }

        // 4. Categories
        let categoryIds = body.category_ids || (body.category_id ? [body.category_id] : []);
        if (!Array.isArray(categoryIds)) categoryIds = [categoryIds];

        // 5. Booleans (Handle 'on', 'true', true)
        const isTrue = (val) => val === 'on' || val === 'true' || val === true;

        return {
            name: body.name,
            description: body.description,
            price: Math.round(parseFloat(body.price || 0)),
            cost_price: Math.round(parseFloat(body.cost_price || 0)) || 0,
            discount: Math.round(parseFloat(body.discount || 0)) || 0,
            stock: parseInt(body.stock || 0) || 0,
            category_id: categoryIds[0] || null,
            category_ids: categoryIds,
            is_featured: isTrue(body.is_featured),
            is_vto_enabled: isTrue(body.is_vto_enabled),
            sizes: sizesArray.length > 0 ? sizesArray : null,
            colors: colorsArray.length > 0 ? colorsArray : null,
            accessories: body.accessories ? (typeof body.accessories === 'string' ? JSON.parse(body.accessories) : body.accessories) : null,
            images: imageUrls,
            size_guide: body.size_guide || ''
        };
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

            res.json({ success: true, products: finalProducts });
        } catch (error) {
            console.error('Error fetching related products:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async createProduct(req, res) {
        try {
            // Priority: File upload if present (overrides/appends to body URLs)
            let uploadedUrls = [];
            if (req.files && req.files.length > 0) {
                const results = await Promise.all(req.files.map(f => uploadToSupabase(f, 'products')));
                uploadedUrls = results.map(r => r.url);
            }

            const productData = this._parseProductPayload(req);
            if (uploadedUrls.length > 0) {
                productData.images = [...productData.images, ...uploadedUrls];
            }

            const product = await ProductService.createProduct(productData);
            res.status(201).json({ success: true, product });
        } catch (error) {
            console.error('Error creating product:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async updateProduct(req, res) {
        try {
            const currentProduct = await ProductService.getProductById(req.params.id);
            if (!currentProduct) {
                return res.status(404).json({ success: false, message: 'Product not found' });
            }

            let uploadedUrls = [];
            if (req.files && req.files.length > 0) {
                const results = await Promise.all(req.files.map(f => uploadToSupabase(f, 'products')));
                uploadedUrls = results.map(r => r.url);
            }

            // For updates, existing images come from currentProduct or body (if sorting)
            const productData = this._parseProductPayload(req, currentProduct.images || []);
            if (uploadedUrls.length > 0) {
                productData.images = [...productData.images, ...uploadedUrls];
            }

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
            console.log('📦 CreateProductAdmin Called. Files:', req.files ? req.files.length : 'No files');
            
            let uploadedUrls = [];
            if (req.files && req.files.length > 0) {
                const results = await Promise.all(req.files.map(f => uploadToSupabase(f, 'products')));
                uploadedUrls = results.map(r => r.url);
            }

            const productData = this._parseProductPayload(req);
            if (uploadedUrls.length > 0) {
                productData.images = [...productData.images, ...uploadedUrls];
            }

            const { data: newProduct, error } = await supabase.from('products').insert({
                name: productData.name,
                description: productData.description,
                price: productData.price,
                cost_price: productData.cost_price,
                discount: productData.discount,
                stock: productData.stock,
                category_id: productData.category_id,
                is_featured: productData.is_featured,
                is_vto_enabled: productData.is_vto_enabled,
                sizes: productData.sizes,
                colors: productData.colors,
                accessories: productData.accessories,
                images: productData.images,
                size_guide: productData.size_guide
            }).select().single();

            if (error) throw error;

            // Sync Category Links
            if (productData.category_ids.length > 0) {
                const links = productData.category_ids.map(catId => ({
                    product_id: newProduct.id,
                    category_id: catId
                }));
                await supabase.from('product_category_links').insert(links);
            }

            // Sync Variants
            if (req.body.variants) {
                try {
                    const variantsArr = typeof req.body.variants === 'string' ? JSON.parse(req.body.variants) : req.body.variants;
                    if (Array.isArray(variantsArr) && variantsArr.length > 0) {
                        const variantData = variantsArr.map(v => ({
                            product_id: newProduct.id,
                            size: v.size || null,
                            color: v.color || null,
                            sku: v.sku || null,
                            stock: parseInt(v.stock || 0)
                        }));
                        await supabase.from('product_variants').insert(variantData);
                        
                        // Auto-sync main product stock = sum of variant stocks
                        const totalVariantStock = variantData.reduce((sum, v) => sum + v.stock, 0);
                        await supabase.from('products').update({ stock: totalVariantStock }).eq('id', newProduct.id);
                    }
                } catch (e) {
                    console.error('Error parsing variants:', e);
                }
            }

            res.redirect('/admin/products');
        } catch (err) {
            console.error('❌ Server error in createProductAdmin:', err);
            res.status(500).send(`خطأ في السيرفر: ${err.message}`);
        }
    }

    async renderEditProductPage(req, res) {
        try {
            const { data: product } = await supabase
                .from('products')
                .select('*, product_category_links(category_id), product_variants(*)')
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
            console.log('🔄 UpdateProductAdmin Called for ID:', req.params.id);
            
            const { data: currentProduct } = await supabase.from('products').select('images').eq('id', req.params.id).single();
            if (!currentProduct) return res.status(404).send('المنتج غير موجود');

            let uploadedUrls = [];
            if (req.files && req.files.length > 0) {
                const results = await Promise.all(req.files.map(f => uploadToSupabase(f, 'products')));
                uploadedUrls = results.map(r => r.url);
            }

            const productData = this._parseProductPayload(req, currentProduct.images || []);
            if (uploadedUrls.length > 0) {
                productData.images = [...productData.images, ...uploadedUrls];
            }

            // Perform Update
            const { error: updateError } = await supabase.from('products').update({
                name: productData.name,
                description: productData.description,
                price: productData.price,
                cost_price: productData.cost_price,
                discount: productData.discount,
                stock: productData.stock,
                category_id: productData.category_id,
                is_featured: productData.is_featured,
                is_vto_enabled: productData.is_vto_enabled,
                sizes: productData.sizes,
                colors: productData.colors,
                accessories: productData.accessories,
                images: productData.images,
                size_guide: productData.size_guide
            }).eq('id', req.params.id);

            if (updateError) throw updateError;

            // Sync Category Links (Remove old, insert new)
            await supabase.from('product_category_links').delete().eq('product_id', req.params.id);
            if (productData.category_ids.length > 0) {
                const links = productData.category_ids.map(catId => ({
                    product_id: req.params.id,
                    category_id: catId
                }));
                await supabase.from('product_category_links').insert(links);
            }

            // Sync Variants
            if (req.body.variants) {
                try {
                    const variantsArr = typeof req.body.variants === 'string' ? JSON.parse(req.body.variants) : req.body.variants;
                    if (Array.isArray(variantsArr)) {
                        await supabase.from('product_variants').delete().eq('product_id', req.params.id);
                        if (variantsArr.length > 0) {
                            const variantData = variantsArr.map(v => ({
                                product_id: req.params.id,
                                size: v.size || null,
                                color: v.color || null,
                                sku: v.sku || null,
                                stock: parseInt(v.stock || 0)
                            }));
                            await supabase.from('product_variants').insert(variantData);
                            
                            // Auto-sync main product stock
                            const totalVariantStock = variantData.reduce((sum, v) => sum + v.stock, 0);
                            await supabase.from('products').update({ stock: totalVariantStock }).eq('id', req.params.id);
                        }
                    }
                } catch (e) {
                    console.error('Error parsing variants on update:', e);
                }
            }

            res.redirect('/admin/products');
        } catch (err) {
            console.error('❌ Server error in updateProductAdmin:', err);
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
            res.redirect('/admin/products');
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

            res.redirect(`/admin/products/${req.params.id}/images`);
        } catch (error) {
            console.error('Error uploading images:', error);
            res.status(500).send(`خطأ في رفع الصور: ${error.message}`);
        }
    }

    async reorderProductImages(req, res) {
        try {
            const newOrder = JSON.parse(req.body.imageOrder);

            await supabase.from('products').update({ images: newOrder }).eq('id', req.params.id);

            res.redirect(`/admin/products/${req.params.id}/images`);
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

