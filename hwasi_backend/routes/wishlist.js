const express = require('express');
const router = express.Router();
const WishlistController = require('../controllers/api/wishlistController');
const { protect } = require('../middleware/auth');

// Get user wishlist
router.get('/', protect, WishlistController.getWishlist);

// Add product to wishlist
router.post('/products/:productId', protect, WishlistController.addToWishlist);

// Remove product from wishlist
router.delete('/products/:productId', protect, WishlistController.removeFromWishlist);

module.exports = router;
