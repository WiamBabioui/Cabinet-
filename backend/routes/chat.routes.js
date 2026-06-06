import express from 'express';
import {
  getConversations,
  getMessages,
  sendMessage,
  getContacts,
  deleteMessage,
} from '../controllers/chat.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import {
  requireCanCommunicate,
  requireCanCommunicateBody,
} from '../middleware/hierarchy.middleware.js';

const router = express.Router();

// All chat routes require authentication
router.use(protect);

// Contact list — hierarchy enforced inside the controller
router.get('/contacts', getContacts);

// Conversations list — hierarchy enforced inside the controller
router.get('/conversations', getConversations);

// Messages for a specific user — hierarchy check via middleware before handler
router.get('/messages/:userId', requireCanCommunicate, getMessages);

// Send message — hierarchy check via middleware before handler
router.post('/messages', requireCanCommunicateBody, sendMessage);

// Delete own message — sender-only check inside controller
router.delete('/messages/:messageId', deleteMessage);

export default router;
