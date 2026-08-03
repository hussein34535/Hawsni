const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/api/productController');
const upload = require('../middleware/upload');
const { productSchema } = require('../middleware/validation');

// @route   GET /api/products/search
// @desc    Search products
// @access  Public
router.get('/search', ProductController.getProducts.bind(ProductController));

// @route   GET /api/products
// @desc    Get all products
// @access  Public
router.get('/', ProductController.getProducts.bind(ProductController));

// @route   GET /api/products/featured
// @desc    Get featured products
// @access  Public
router.get('/featured', ProductController.getFeatured.bind(ProductController));

// @route   GET /api/products/:id
// @desc    Get product by ID
// @access  Public
router.get('/:id', ProductController.getProduct.bind(ProductController));

// @route   GET /api/products/:id/related
// @desc    Get related products (high demand / same category)
// @access  Public
router.get('/:id/related', ProductController.getRelatedProducts.bind(ProductController));

// @route   POST /api/products
// @desc    Create product (Admin only)
// @access  Private/Admin
router.post('/', upload.array('images', 5), productSchema, ProductController.createProduct.bind(ProductController));

// @route   PUT /api/products/:id
// @desc    Update product (Admin only)
// @access  Private/Admin
router.put('/:id', upload.array('images', 5), productSchema, ProductController.updateProduct.bind(ProductController));

// @route   DELETE /api/products/:id
// @desc    Delete product (Admin only)
// @access  Private/Admin
router.delete('/:id', ProductController.deleteProduct.bind(ProductController));

// Image Management Routes (Admin UI)
router.get('/:id/images', ProductController.renderImageManagementPage.bind(ProductController));
router.post('/:id/images', upload.array('images', 5), ProductController.uploadProductImages.bind(ProductController));
router.post('/:id/images/reorder', ProductController.reorderProductImages.bind(ProductController));
router.delete('/:id/images/:imageIndex', ProductController.deleteProductImage.bind(ProductController));

module.exports = router;