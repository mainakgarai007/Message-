const express = require('express');
const router = express.Router();
const {
  register,
  verifyEmail,
  login,
  getMe,
  updateProfile,
  toggleGhostMode
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/verify-email', verifyEmail);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/ghost-mode', protect, toggleGhostMode);

module.exports = router;
