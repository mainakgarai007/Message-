const express = require('express');
const router = express.Router();
const {
  getRequests,
  sendFriendRequest,
  handleRequest,
  sendEmailRequest,
  sendWebsiteRequest
} = require('../controllers/requestController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getRequests);
router.post('/friend', protect, sendFriendRequest);
router.put('/:requestId', protect, handleRequest);
router.post('/email', sendEmailRequest);
router.post('/website', sendWebsiteRequest);

module.exports = router;
