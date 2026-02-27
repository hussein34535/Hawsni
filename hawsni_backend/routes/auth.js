const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const AuthController = require('../controllers/api/authController');
const { protect } = require('../middleware/auth');

// @route   POST /api/auth/register
// @desc    Register new user
router.post('/register', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], AuthController.register);

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP and complete registration
router.post('/verify-otp', AuthController.verifyOtp);

// @route   POST /api/auth/login
// @desc    Login user
router.post('/login', [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').exists().withMessage('Password required')
], AuthController.login);

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
router.post('/forgot-password', AuthController.forgotPassword);

// @route   POST /api/auth/reset-password
// @desc    Reset password using token
// @route   POST /api/auth/reset-password
// @desc    Reset password using token
router.post('/reset-password', AuthController.resetPassword);

// @route   POST /api/auth/change-password
// @desc    Change password for logged in user
router.post('/change-password', protect, [
  body('oldPassword').notEmpty().withMessage('Old password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], AuthController.changePassword);

// @route   POST /api/auth/refresh
// @desc    Refresh access token
router.post('/refresh', AuthController.refresh);

module.exports = router;