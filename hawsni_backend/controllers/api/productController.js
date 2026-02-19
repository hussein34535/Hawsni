const ProductService = require('../../services/productService');
const uploadToSupabase = require('../../utils/fileUpload');
const supabase = require('../../config/supabase');

class ProductController {
    async getProducts(req, res) {
        try {
            const { category, search, minPrice, maxPrice, sort } = req.query;
            const filters = { category, search, minPrice, maxPrice };

            const products = await ProductService.getAllProducts(filters, sort);

            res.json({
                success: true,
                count: products.length,
                products
            });
        } catch (error) {
            console.error('Error fetching products:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getFeatured(req, res) {
        try {
            const products = await ProductService.getFeaturedProducts();
            res.json({ success: true, products });
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

            res.json({ success: true, product });
        } catch (error) {
            console.error('Error fetching product:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async createProduct(req, res) {
        try {
            let imageUrls = [];

            if (req.files && req.files.length > 0) {
                const uploadPromises = req.files.map(file => uploadToSupabase(file, 'products'));
                imageUrls = await Promise.all(uploadPromises);
            }

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
                category_id: req.body.category_id || null,
                stock: parseInt(req.body.stock) || 0,
                is_featured: req.body.is_featured === 'on' || req.body.is_featured === 'true' || req.body.is_featured === true,
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

            if (req.files && req.files.length > 0) {
                const uploadPromises = req.files.map(file => uploadToSupabase(file, 'products'));
                const newImageUrls = await Promise.all(uploadPromises);
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

            const productData = {
                name: req.body.name,
                description: req.body.description,
                price: parseFloat(req.body.price),
                discount: parseInt(req.body.discount) || 0,
                category_id: req.body.category_id || null,
                stock: parseInt(req.body.stock) || 0,
                is_featured: req.body.is_featured === 'on' || req.body.is_featured === 'true' || req.body.is_featured === true,
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
            // Use the same logic as the original server.js to include category names
            const { data: products } = await supabase.from('products').select('*, categories(name)');
            const { data: categories } = await supabase.from('categories').select('*');
            res.render('products', { products: products || [], categories: categories || [] });
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
            const { name, description, price, discount, category_id, stock, is_featured, sizes, size_guide } = req.body;

            console.log('📦 CreateProductAdmin Called. Files:', req.files ? req.files.length : 'No files');

            let imageUrls = [];
            if (req.files && req.files.length > 0) {
                try {
                    const uploadPromises = req.files.map(file => uploadToSupabase(file, 'products'));
                    imageUrls = await Promise.all(uploadPromises);
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

            const { error } = await supabase.from('products').insert({
                name,
                description,
                price: parseFloat(price),
                discount: parseInt(discount) || 0,
                category_id: category_id || null,
                stock: parseInt(stock) || 0,
                is_featured: is_featured === 'on',
                sizes: sizesArray.length > 0 ? sizesArray : null,
                colors: colorsArray.length > 0 ? colorsArray : null,
                images: imageUrls,
                size_guide: size_guide || ''
            });

            if (error) {
                console.error('❌ Supabase error:', error);
                return res.status(500).send(`خطأ في إضافة المنتج: ${error.message}`);
            }

            res.redirect('/products');
        } catch (err) {
            console.error('❌ Server error:', err);
            res.status(500).send(`خطأ في السيرفر: ${err.message}`);
        }
    }

    async renderEditProductPage(req, res) {
        try {
            const { data: product } = await supabase.from('products').select('*').eq('id', req.params.id).single();
            const { data: categories } = await supabase.from('categories').select('*');
            res.render('product-form', { product, categories: categories || [] });
        } catch (error) {
            console.error('Error rendering edit product form:', error);
            res.status(500).send(`خطأ في عرض صفحة تعديل المنتج: ${error.message}`);
        }
    }

    async updateProductAdmin(req, res) {
        try {
            const { name, description, price, discount, category_id, stock, is_featured, sizes, colors, size_guide } = req.body;
            console.log('🔄 UpdateProductAdmin Called for ID:', req.params.id);
            console.log('📂 Files received:', req.files ? req.files.length : 'None');
            console.log('📦 Raw Sizes:', req.body.sizes);
            console.log('📦 Raw Colors:', req.body.colors);
            console.log('📦 Raw Sizes:', req.body.sizes);
            console.log('📦 Raw Colors:', req.body.colors);

            const { data: currentProduct } = await supabase.from('products').select('images, sizes, colors').eq('id', req.params.id).single();

            // Handle Retained Images (deletion/persistence)
            let imageUrls = [];
            if (req.body.retained_images) {
                try {
                    imageUrls = JSON.parse(req.body.retained_images);
                    if (!Array.isArray(imageUrls)) imageUrls = [];
                } catch (e) {
                    console.error('Error parsing retained images:', e);
                    imageUrls = [];
                }
            } else {
                // Fallback: keep all existing if field missing (shouldn't happen with updated form)
                imageUrls = currentProduct?.images || [];
            }

            if (req.files && req.files.length > 0) {
                try {
                    const uploadPromises = req.files.map(file => uploadToSupabase(file, 'products'));
                    const newImageUrls = await Promise.all(uploadPromises);
                    console.log('✅ New images uploaded:', newImageUrls);
                    imageUrls = [...imageUrls, ...newImageUrls];
                } catch (imgErr) {
                    console.error('❌ Check Cloudinary Error in Update:', imgErr);
                    return res.status(500).send(`خطأ في رفع الصور: ${imgErr.message}`);
                }
            }

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

            // Perform Update
            const { error: updateError } = await supabase.from('products').update({
                name,
                description,
                price: parseFloat(price),
                discount: parseInt(discount) || 0,
                category_id: category_id || null,
                stock: parseInt(stock) || 0,
                is_featured: is_featured === 'on',
                sizes: sizesArray.length > 0 ? sizesArray : null,
                colors: colorsArray.length > 0 ? colorsArray : null,
                images: imageUrls,
                size_guide: size_guide || ''
            }).eq('id', req.params.id);

            if (updateError) throw updateError;

            // Verify Persistence
            const { data: updatedProduct } = await supabase.from('products').select('sizes, colors').eq('id', req.params.id).single();

            // res.redirect('/products');
            res.json({
                success: true,
                message: 'Debug Verification: Data updated in Database?',
                sentToDb: {
                    sizes: sizesArray.length > 0 ? sizesArray : null,
                },
                readFromDb: {
                    sizes: updatedProduct?.sizes,
                    colors: updatedProduct?.colors
                },
                match: JSON.stringify(sizesArray) === JSON.stringify(updatedProduct?.sizes)
            });
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
                const newImageUrls = await Promise.all(uploadPromises);
                imageUrls = [...imageUrls, ...newImageUrls];
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

            res.json({ success: true, message: `تم تحديث ${ids.length} منتج` });
        } catch (err) {
            console.error('Error bulk updating products:', err);
            res.status(500).json({ success: false, message: err.message });
        }
    }
}

module.exports = new ProductController();

