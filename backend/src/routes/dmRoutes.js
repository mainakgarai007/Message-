const express = require('express');
const router = express.Router();
const {
  getDirectMessages,
  createOrGetDirectMessage,
  updateDMSettings,
  getMessages,
  searchMessages
} = require('../controllers/dmController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getDirectMessages);
router.post('/', createOrGetDirectMessage);
router.put('/:dmId/settings', updateDMSettings);
router.get('/:dmId/messages', getMessages);
router.get('/:dmId/search', searchMessages);

module.exports = router;
