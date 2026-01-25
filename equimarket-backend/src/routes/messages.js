const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');

const {
    getConversations,
    getMessages,
    sendMessage,
    respondToOffer,
    getUnreadCount
} = require('../controllers/messageController');

// Tüm message route'ları auth gerektiriyor
router.use(protect);

router.get('/conversations', getConversations);
router.get('/conversations/:conversationId', getMessages);
router.post('/send', sendMessage);
router.put('/:messageId/offer-response', respondToOffer);
router.get('/unread-count', getUnreadCount);

module.exports = router;
