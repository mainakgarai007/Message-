const express = require('express');
const router = express.Router();
const {
  getGroups,
  createGroup,
  updateGroupSettings,
  addMembers,
  searchMembers,
  getMessages
} = require('../controllers/groupController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getGroups);
router.post('/', createGroup);
router.put('/:groupId/settings', updateGroupSettings);
router.post('/:groupId/members', addMembers);
router.get('/:groupId/members/search', searchMembers);
router.get('/:groupId/messages', getMessages);

module.exports = router;
