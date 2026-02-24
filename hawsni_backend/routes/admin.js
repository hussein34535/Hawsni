const express = require('express');
const router = express.Router();

// Middleware
const upload = require('../middleware/upload');

// Controllers
const dashboardController = require('../controllers/admin/dashboardController');
const bannersController = require('../controllers/admin/bannersController');
const usersController = require('../controllers/admin/usersController');
const ordersController = require('../controllers/admin/ordersController');
const scraperController = require('../controllers/admin/scraperController');
const ProductController = require('../controllers/api/productController');
const shippingController = require('../controllers/admin/shippingController');
const settingsController = require('../controllers/admin/settingsController');

// Dashboard
router.get('/dashboard', dashboardController.getDashboard);

// Scraper
router.post('/scrape-product', scraperController.scrape);

// Banners Routes
router.get('/banners', bannersController.index);
router.get('/banners/new', bannersController.new);
router.post('/banners', upload.single('banner_image'), bannersController.create);
router.get('/banners/:id/edit', bannersController.edit);
router.post('/banners/:id', upload.single('banner_image'), bannersController.update);
router.delete('/banners/:id', bannersController.delete);

// Users Routes
router.get('/users', usersController.index);

// Orders Routes
router.get('/orders', ordersController.index);
router.post('/orders/:id/status', ordersController.updateStatus);
router.post('/orders/bulk-status', ordersController.bulkUpdateStatus);

// Category Controller
const CategoryController = require('../controllers/api/categoryController');

// Products Routes
router.get('/products', ProductController.renderProductsPage);
router.get('/products/new', ProductController.renderNewProductPage);
router.post('/products', upload.array('images', 5), ProductController.createProductAdmin);
router.get('/products/:id/edit', ProductController.renderEditProductPage);
router.post('/products/:id', upload.array('images', 5), ProductController.updateProductAdmin);
router.delete('/products/:id', ProductController.deleteProductAdmin);

// Products Bulk Routes
router.post('/products/bulk-delete', ProductController.bulkDelete);
router.post('/products/bulk-update', ProductController.bulkUpdate);

// Categories Routes
router.get('/categories', CategoryController.renderCategoriesPage);
router.post('/categories', upload.single('image'), CategoryController.createCategoryAdmin);
router.get('/categories/:id/edit', CategoryController.renderEditPage);
router.post('/categories/:id', upload.single('image'), CategoryController.updateCategoryAdmin);
router.delete('/categories/:id', CategoryController.deleteCategoryAdmin);
router.post('/categories/reorder', CategoryController.reorderCategories);

// Shipping Settings Routes
router.get('/shipping', shippingController.index);
router.post('/shipping', shippingController.update);

// General Settings Routes
router.get('/settings', settingsController.index);
router.post('/settings', settingsController.update);

module.exports = router;
