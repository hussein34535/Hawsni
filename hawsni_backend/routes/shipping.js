const express = require('express');
const router = express.Router();
const ShippingController = require('../controllers/admin/shippingController');

// Public endpoint for Flutter app: GET /api/shipping/settings
router.get('/settings', ShippingController.getSettings);

module.exports = router;
