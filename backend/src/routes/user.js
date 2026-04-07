const router = require('express').Router();
const auth = require('../middleware/auth');
const { getProfile, completeOnboarding } = require('../controllers/userController');
const { chat, confirmAction } = require('../controllers/chatController');

router.get('/profile', auth, getProfile);
router.post('/onboarding', auth, completeOnboarding);
router.post('/chat', auth, chat);
router.post('/chat/confirm', auth, confirmAction);

module.exports = router;
