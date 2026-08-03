const express = require('express');
const router = express.Router();
const ReviewController = require('../controllers/api/reviewController');
const { protect } = require('../middleware/auth');

// Get product reviews
router.get('/product/:productId', ReviewController.getProductReviews);

// Create review
router.post('/', protect, ReviewController.createReview);

// Update review
router.put('/:id', protect, ReviewController.updateReview);

// Delete review
router.delete('/:id', protect, ReviewController.deleteReview);

module.exports = router;
