const express = require('express');
const router = express.Router();
const {
  getAboutMe,
  addAboutMe,
  updateAboutMe,
  deleteAboutMe
} = require('../controllers/aboutMeController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect);
router.use(adminOnly);

router.get('/', getAboutMe);
router.post('/', addAboutMe);
router.put('/:id', updateAboutMe);
router.delete('/:id', deleteAboutMe);

module.exports = router;
