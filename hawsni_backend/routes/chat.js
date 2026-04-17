const express = require('express');
const router = express.Router();
const chatController = require('../controllers/api/chatController');

router.post('/', chatController.sendMessage);

module.exports = router;
