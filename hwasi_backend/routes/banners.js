const express = require('express');
const router = express.Router();
const bannerController = require('../controllers/bannerController');
const authMiddleware = require('../middleware/auth');

router.get('/', bannerController.getBanners);
router.post('/', authMiddleware.protect, bannerController.createBanner); // Only admins should create, but auth is enough for now

module.exports = router;
