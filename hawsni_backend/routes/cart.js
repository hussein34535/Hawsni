const express = require('express');
const router = express.Router();
const CartController = require('../controllers/api/cartController');
const { protect } = require('../middleware/auth');

// Get user cart
router.get('/', protect, CartController.getCart);

// Add item to cart
router.post('/items', protect, CartController.addToCart);

// Update cart item
router.put('/items/:itemId', protect, CartController.updateCartItem);

// Remove item from cart
router.delete('/items/:itemId', protect, CartController.removeFromCart);

// Clear cart
router.delete('/', protect, CartController.clearCart);

module.exports = router;
