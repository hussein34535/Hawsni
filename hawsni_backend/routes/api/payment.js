const express = require('express');
const router = express.Router();
const PaymentController = require('../../controllers/api/paymentController');
const { protect } = require('../../middleware/auth');

// Apply protection to all payment routes
router.use(protect);

// Stripe Routes
router.post('/stripe/intent', PaymentController.createStripeIntent);

// PayPal Routes
router.post('/paypal/create', PaymentController.createPaypalOrder);
router.post('/paypal/capture', PaymentController.capturePaypalOrder);

module.exports = router;
