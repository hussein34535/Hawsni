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
const settingsController = require('../controllers/admin/settingsController');

// ... existing routes ...

// Shipping Settings Routes
router.get('/shipping', shippingController.index);
router.post('/shipping', shippingController.update);

// General Settings Routes
router.get('/settings', settingsController.index);
router.post('/settings', settingsController.update);

module.exports = router;
