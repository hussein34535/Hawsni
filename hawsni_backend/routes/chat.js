const express = require('express');
const router = express.Router();
const chatController = require('../controllers/api/chatController');

router.get('/session/:sessionId', chatController.getSession);
router.post('/', chatController.sendMessage);
router.post('/reset', chatController.resetSession);

module.exports = router;
