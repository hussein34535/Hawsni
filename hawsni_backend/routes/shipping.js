const express = require('express');
const router = express.Router();
const ShippingController = require('../controllers/api/shippingController');
const AdminShippingController = require('../controllers/admin/shippingController');

// Public endpoints for API (Flutter/Web)
router.get('/cities', ShippingController.getCities);
router.get('/districts/:cityId', ShippingController.getDistricts);
router.get('/track/:trackingNumber', ShippingController.trackShipment);

// Admin-specific settings
router.get('/settings', AdminShippingController.getSettings);

module.exports = router;
