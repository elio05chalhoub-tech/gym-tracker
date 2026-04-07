const router = require('express').Router();
const auth = require('../middleware/auth');
const { calculate } = require('../controllers/tdeeController');

router.post('/calculate', auth, calculate);

module.exports = router;
