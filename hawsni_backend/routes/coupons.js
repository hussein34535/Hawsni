const express = require('express');
const router = express.Router();
const CouponController = require('../controllers/api/couponController');
const { protect, authorize } = require('../middleware/auth');

// Get all coupons (Admin)
router.get('/', protect, authorize('admin'), CouponController.getAllCoupons);

// Validate coupon
router.post('/validate', protect, CouponController.validateCoupon);

// Create coupon (Admin)
router.post('/', protect, authorize('admin'), CouponController.createCoupon);

// Update coupon (Admin)
router.put('/:id', protect, authorize('admin'), CouponController.updateCoupon);

// Delete coupon (Admin)
router.delete('/:id', protect, authorize('admin'), CouponController.deleteCoupon);

module.exports = router;
