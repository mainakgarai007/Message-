const express = require('express');
const router = express.Router();
const {
  sendMessage,
  editMessage,
  deleteMessage,
  addReaction,
  pinMessage,
  saveDraft,
  getDraft
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/', sendMessage);
router.put('/:messageId/edit', editMessage);
router.delete('/:messageId', deleteMessage);
router.post('/:messageId/reaction', addReaction);
router.post('/:messageId/pin', pinMessage);
router.post('/draft', saveDraft);
router.get('/draft/:chatId', getDraft);

module.exports = router;
