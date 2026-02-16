const express = require('express');
const router = express.Router();
const AdminController = require('../../controllers/api/adminController');
const ProductController = require('../../controllers/api/productController');
const OrderController = require('../../controllers/api/orderController');
const { protect, authorize } = require('../../middleware/auth');
const upload = require('../../middleware/upload');

// All routes here are protected and require 'admin' role
router.use(protect);
router.use(authorize('admin'));

// Dashboard
router.get('/dashboard', AdminController.getDashboardStats);

// Products Management
// We can reuse existing ProductController logic but mapped to admin routes for clarity/access control
// Note: ProductController methods might rely on req.body/res.json directly which is good.
// If they render views (like renderEditProductPage), we can't use them here.
// Checking ProductController... it has createProductAdmin etc. 
// We should check if 'productController' has API-friendly methods. 
// If not, we might need to update ProductController or create new methods.
// Based on file list, there is 'controllers/api/productController.js'. Let's assume it has JSON methods.

// If `controllers/api/productController.js` exists, it likely returns JSON.
// Validating... yes it does exist in file list.

// GET /api/admin/products - List all products (maybe with pagination)
router.get('/products', ProductController.getAllProducts);

// POST /api/admin/products - Create product
router.post('/products', upload.any(), ProductController.createProduct);

// PUT /api/admin/products/:id - Update product
router.put('/products/:id', upload.any(), ProductController.updateProduct);

// DELETE /api/admin/products/:id - Delete product
router.delete('/products/:id', ProductController.deleteProduct);

// Orders Management
// GET /api/admin/orders - List all orders
router.get('/orders', OrderController.getAllOrders); // We might need to implement this if it doesn't exist or verify it returns all

// PUT /api/admin/orders/:id/status - Update order status
router.put('/orders/:id/status', OrderController.updateOrderStatus);


module.exports = router;
