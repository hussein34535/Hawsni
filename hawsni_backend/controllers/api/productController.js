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
            const products = await ProductService.getAllProducts();
            const { data: categories } = await supabase.from('categories').select('*');
            res.render('products', { products: products || [], categories: categories || [] });
        } catch (error) {
            console.error('Error rendering products:', error);
            res.status(500).send(`Error: ${error.message}`);
        }
    }

    async renderNewProductPage(req, res) {
        try {
            const { data: categories } = await supabase.from('categories').select('*');
            res.render('product-form', { product: null, categories: categories || [] });
        } catch (error) {
            console.error('Error rendering new product form:', error);
            res.status(500).send(`Error: ${error.message}`);
        }
    }

    async createProductAdmin(req, res) {
        try {
            let imageUrls = [];
            if (req.files && req.files.length > 0) {
                const uploadPromises = req.files.map(file => uploadToSupabase(file, 'products'));
                imageUrls = await Promise.all(uploadPromises);
            }

            const productData = {
                name: req.body.name,
                description: req.body.description,
                price: parseFloat(req.body.price),
                discount: parseInt(req.body.discount) || 0,
                category_id: req.body.category_id || null,
                stock: parseInt(req.body.stock) || 0,
                is_featured: req.body.is_featured === 'on',
                images: imageUrls
            };

            await ProductService.createProduct(productData);
            res.redirect('/products');
        } catch (error) {
            console.error('Error creating product (Admin):', error);
            res.status(500).send(`Error: ${error.message}`);
        }
    }

    async renderEditProductPage(req, res) {
        try {
            const product = await ProductService.getProductById(req.params.id);
            const { data: categories } = await supabase.from('categories').select('*');
            res.render('product-form', { product, categories: categories || [] });
        } catch (error) {
            console.error('Error rendering edit product form:', error);
            res.status(500).send(`Error: ${error.message}`);
        }
    }

    async updateProductAdmin(req, res) {
        try {
            const currentProduct = await ProductService.getProductById(req.params.id);
            let imageUrls = currentProduct.images || [];

            if (req.files && req.files.length > 0) {
                const uploadPromises = req.files.map(file => uploadToSupabase(file, 'products'));
                const newImageUrls = await Promise.all(uploadPromises);
                imageUrls = [...imageUrls, ...newImageUrls];
            }

            const productData = {
                name: req.body.name,
                description: req.body.description,
                price: parseFloat(req.body.price),
                discount: parseInt(req.body.discount) || 0,
                category_id: req.body.category_id || null,
                stock: parseInt(req.body.stock) || 0,
                is_featured: req.body.is_featured === 'on',
                images: imageUrls
            };

            await ProductService.updateProduct(req.params.id, productData);
            res.redirect('/products');
        } catch (error) {
            console.error('Error updating product (Admin):', error);
            res.status(500).send(`Error: ${error.message}`);
        }
    }

    async deleteProductAdmin(req, res) {
        try {
            await ProductService.deleteProduct(req.params.id);
            res.redirect('/products');
        } catch (error) {
            console.error('Error deleting product (Admin):', error);
            res.status(500).send(`Error: ${error.message}`);
        }
    }
}

module.exports = new ProductController();
