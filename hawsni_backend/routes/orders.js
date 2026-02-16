const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/api/orderController');
const { protect, protectOptional } = require('../middleware/auth');

// Get user orders
router.get('/', protect, OrderController.getUserOrders);

// Get order by ID
router.get('/:id', protect, OrderController.getOrder);

// Create order
router.post('/', protectOptional, OrderController.createOrder);

// Update order status (Admin)
router.put('/:id/status', protect, OrderController.updateStatus);

// Cancel order
router.put('/:id/cancel', protect, OrderController.cancelOrder);

module.exports = router;