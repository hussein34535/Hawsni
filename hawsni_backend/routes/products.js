const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/api/productController');
const upload = require('../middleware/upload');

// @route   GET /api/products/search
// @desc    Search products
// @access  Public
router.get('/search', ProductController.getProducts);

// @route   GET /api/products
// @desc    Get all products
// @access  Public
router.get('/', ProductController.getProducts);

// @route   GET /api/products/featured
// @desc    Get featured products
// @access  Public
router.get('/featured', ProductController.getFeatured);

// @route   GET /api/products/:id
// @desc    Get product by ID
// @access  Public
router.get('/:id', ProductController.getProduct);

// @route   POST /api/products
// @desc    Create product (Admin only)
// @access  Private/Admin
router.post('/', upload.array('images', 5), ProductController.createProduct);

// @route   PUT /api/products/:id
// @desc    Update product (Admin only)
// @access  Private/Admin
router.put('/:id', upload.array('images', 5), ProductController.updateProduct);

// @route   DELETE /api/products/:id
// @desc    Delete product (Admin only)
// @access  Private/Admin
router.delete('/:id', ProductController.deleteProduct);

// Image Management Routes (Admin UI)
router.get('/:id/images', ProductController.renderImageManagementPage);
router.post('/:id/images', upload.array('images', 5), ProductController.uploadProductImages);
router.post('/:id/images/reorder', ProductController.reorderProductImages);
router.delete('/:id/images/:imageIndex', ProductController.deleteProductImage);

module.exports = router;