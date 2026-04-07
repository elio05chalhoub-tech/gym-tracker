const router = require('express').Router();
const auth = require('../middleware/auth');
const { logMeal, getMeals, deleteMeal } = require('../controllers/mealController');

router.post('/', auth, logMeal);
router.get('/', auth, getMeals);
router.delete('/:id', auth, deleteMeal);

module.exports = router;
