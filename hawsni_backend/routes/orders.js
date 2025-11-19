const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/api/orderController');

// Get user orders
router.get('/', OrderController.getOrders);

// Get order by ID
router.get('/:id', OrderController.getOrder);

// Create order
router.post('/', OrderController.createOrder);

// Update order status (Admin)
router.put('/:id/status', OrderController.updateStatus);

// Cancel order
router.put('/:id/cancel', OrderController.cancelOrder);

module.exports = router;