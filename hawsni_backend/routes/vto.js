const express = require('express');
const router = express.Router();
const vtoController = require('../controllers/vtoController');

// Start generation
router.post('/try-on', vtoController.startTryOn);

// Check status
router.get('/status/:id', vtoController.checkStatus);

module.exports = router;
