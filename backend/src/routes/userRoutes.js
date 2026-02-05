const express = require('express');
const router = express.Router();
const {
  getUserByEmail,
  followUser,
  unfollowUser,
  blockUser,
  unblockUser
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/:email', getUserByEmail);
router.post('/:userId/follow', followUser);
router.delete('/:userId/follow', unfollowUser);
router.post('/:userId/block', blockUser);
router.delete('/:userId/block', unblockUser);

module.exports = router;
