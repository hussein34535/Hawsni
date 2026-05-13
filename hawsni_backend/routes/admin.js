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
const adminAuthController = require('../controllers/admin/adminAuthController');
const adminReviewsController = require('../controllers/admin/reviewsController');
const adminChatController = require('../controllers/admin/adminChatController');
const { adminProtect } = require('../middleware/adminAuth');

// Auth Routes (Public for Admin)
// These will be available at /admin/login and /admin/logout
router.get('/login', adminAuthController.renderLogin);
router.post('/login', adminAuthController.login);
router.get('/logout', adminAuthController.logout);

// Redirect /admin to /admin/dashboard
router.get('/', (req, res) => {
    res.redirect('/admin/dashboard');
});

// Apply protection to all following routes
router.use(adminProtect);

// Prevent caching for all admin routes
router.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
});

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
router.post('/orders/:id/update', ordersController.updateOrder);
router.post('/orders/:id/delete', ordersController.deleteOrder);
router.post('/orders/bulk-status', ordersController.bulkUpdateStatus);
router.post('/orders/bulk-delete', ordersController.bulkDelete);
router.post('/orders/:id/no-answer', ordersController.sendNoAnswer);
router.post('/orders/:id/generate-ai-email', ordersController.generateAIEmail);
router.post('/orders/:id/send-ai-email', ordersController.sendAIEmail);
router.post('/orders/:id/bosta-ship', ordersController.createBostaShipment);

// Category Controller
const CategoryController = require('../controllers/api/categoryController');

// Products Routes
router.get('/products', ProductController.renderProductsPage.bind(ProductController));
router.get('/products/new', ProductController.renderNewProductPage.bind(ProductController));
router.post('/products', ProductController.createProductAdmin.bind(ProductController));
router.get('/products/:id/edit', ProductController.renderEditProductPage.bind(ProductController));
router.post('/products/:id', ProductController.updateProductAdmin.bind(ProductController));
router.delete('/products/:id', ProductController.deleteProductAdmin.bind(ProductController));

// Products Bulk Routes
router.post('/products/bulk-delete', ProductController.bulkDelete.bind(ProductController));
router.post('/products/bulk-update', ProductController.bulkUpdate.bind(ProductController));

// Categories Routes
router.get('/categories', CategoryController.renderCategoriesPage.bind(CategoryController));
router.post('/categories', upload.single('image'), CategoryController.createCategoryAdmin.bind(CategoryController));
router.get('/categories/:id/edit', CategoryController.renderEditPage.bind(CategoryController));
router.post('/categories/:id', upload.single('image'), CategoryController.updateCategoryAdmin.bind(CategoryController));
router.delete('/categories/:id', CategoryController.deleteCategoryAdmin.bind(CategoryController));
router.post('/categories/reorder', CategoryController.reorderCategories.bind(CategoryController));

// Shipping Settings Routes
router.get('/shipping', shippingController.index);
router.post('/shipping', shippingController.update);

// General Settings Routes
router.get('/settings', settingsController.index);
router.post('/settings', settingsController.update);

// Reviews Management Routes
router.get('/reviews', adminReviewsController.index);
router.post('/reviews', adminReviewsController.create);
router.delete('/reviews/:id', adminReviewsController.delete);

// Live Chat Inbox
router.get('/chat', adminChatController.renderChatInbox);
router.get('/chat/sessions', adminChatController.getSessions);
router.post('/chat/send', adminChatController.sendMessage);
router.post('/chat/takeover', adminChatController.takeOver);
router.post('/chat/end', adminChatController.endConversation);
router.post('/chat/return-to-bot', adminChatController.returnToBot);
router.get('/chat/orders/:sessionId', adminChatController.getSessionOrders);
router.post('/chat/mark-read', adminChatController.markRead);
router.get('/chat/media/:mediaId', adminChatController.getWhatsAppMedia);

module.exports = router;
