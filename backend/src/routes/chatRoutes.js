const express = require('express');
const router = express.Router();
const { handleChat, getChatStatus } = require('../controllers/chatController');

router.get('/status', getChatStatus);
router.post('/', handleChat);

module.exports = router;
