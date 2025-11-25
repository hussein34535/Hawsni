const express = require('express');
const router = express.Router();

// Controllers
const dashboardController = require('../controllers/admin/dashboardController');
const bannersController = require('../controllers/admin/bannersController');
const usersController = require('../controllers/admin/usersController');
const ordersController = require('../controllers/admin/ordersController');

// Dashboard
router.get('/dashboard', dashboardController.getDashboard);

// Banners Routes
router.get('/banners', bannersController.index);
router.get('/banners/new', bannersController.new);
router.post('/banners', bannersController.create);
router.get('/banners/:id/edit', bannersController.edit);
router.post('/banners/:id', bannersController.update); // Using POST with _method for PUT
router.delete('/banners/:id', bannersController.delete);

// Users Routes
router.get('/users', usersController.index);

// Orders Routes
router.get('/orders', ordersController.index);

// Settings Route (placeholder)
router.get('/settings', (req, res) => {
    res.render('settings', { page: 'settings' });
});

module.exports = router;
