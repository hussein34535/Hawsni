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

// Settings Route (placeholder)
router.get('/settings', (req, res) => {
    res.render('settings', { page: 'settings' });
});

module.exports = router;
