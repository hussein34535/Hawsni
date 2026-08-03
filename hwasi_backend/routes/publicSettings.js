const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/admin/settingsController');

// Public route to get store settings (Social links, Meta Pixel, etc.)
router.get('/public', settingsController.getSettingsApi);

module.exports = router;
