const router = require('express').Router();
const auth = require('../middleware/auth');
const { getCoachAdvice, logBodyWeight, getBodyLogs } = require('../controllers/aiController');

router.post('/coach', auth, getCoachAdvice);
router.post('/body-log', auth, logBodyWeight);
router.get('/body-log', auth, getBodyLogs);

module.exports = router;
