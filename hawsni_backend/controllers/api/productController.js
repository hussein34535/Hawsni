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
            const { name, description, price, discount, category_id, stock, is_featured } = req.body;

            let imageUrls = [];
            if (req.files && req.files.length > 0) {
                const uploadPromises = req.files.map(file => uploadToSupabase(file, 'products'));
                imageUrls = await Promise.all(uploadPromises);
            }

            const { error } = await supabase.from('products').insert({
                name,
                description,
                price: parseFloat(price),
                discount: parseInt(discount) || 0,
                category_id: category_id || null,
                stock: parseInt(stock) || 0,
                is_featured: is_featured === 'on',
                images: imageUrls
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
            const { name, description, price, discount, category_id, stock, is_featured, sizes, colors } = req.body;

            const { data: currentProduct } = await supabase.from('products').select('images, sizes, colors').eq('id', req.params.id).single();

            let imageUrls = currentProduct?.images || [];

            if (req.files && req.files.length > 0) {
                const uploadPromises = req.files.map(file => uploadToSupabase(file, 'products'));
                const newImageUrls = await Promise.all(uploadPromises);
                imageUrls = [...imageUrls, ...newImageUrls];
            }

            // Parse sizes and colors
            let sizesArray = [];
            let colorsArray = [];

            if (sizes) {
                sizesArray = typeof sizes === 'string' ? sizes.split(',').map(s => s.trim()).filter(s => s) : sizes;
            }

            if (colors) {
                colorsArray = typeof colors === 'string' ? colors.split(',').map(c => c.trim()).filter(c => c) : colors;
            }

            await supabase.from('products').update({
                name,
                description,
                price: parseFloat(price),
                discount: parseInt(discount) || 0,
                category_id: category_id || null,
                stock: parseInt(stock) || 0,
                is_featured: is_featured === 'on',
                sizes: sizesArray.length > 0 ? sizesArray : null,
                colors: colorsArray.length > 0 ? colorsArray : null,
                images: imageUrls
            }).eq('id', req.params.id);

            res.redirect('/products');
        } catch (err) {
            console.error('❌ Server error:', err);
            res.status(500).send(`خطأ في السيرفر: ${err.message}`);
        }
    }

    async deleteProductAdmin(req, res) {
        try {
            await supabase.from('products').delete().eq('id', req.params.id);
            res.redirect('/products');
        } catch (error) {
            console.error('Error deleting product (Admin):', error);
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
}

module.exports = new ProductController();
