const express = require('express');
const router = express.Router();
const UserController = require('../controllers/api/userController');
const { protect } = require('../middleware/auth');

// Get user profile
router.get('/profile', protect, UserController.getProfile);

// Update user profile
router.put('/profile', protect, UserController.updateProfile);

// Upload avatar
const upload = require('../middleware/upload');
router.post('/profile/avatar', protect, upload.single('avatar'), UserController.uploadAvatar);

// Get addresses
router.get('/addresses', protect, UserController.getAddresses);

// Add address
router.post('/addresses', protect, UserController.addAddress);

// Update address
router.put('/addresses/:addressId', protect, UserController.updateAddress);

// Delete address
router.delete('/addresses/:addressId', protect, UserController.deleteAddress);

// Update FCM Token
router.post('/fcm-token', protect, UserController.updateFcmToken);

module.exports = router;
