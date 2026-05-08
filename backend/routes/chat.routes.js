import express from 'express';
import { getConversations, getMessages, sendMessage, getContacts } from '../controllers/chat.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/conversations', getConversations);
router.get('/messages/:userId', getMessages);
router.post('/messages', sendMessage);
router.get('/contacts', getContacts);

export default router;
