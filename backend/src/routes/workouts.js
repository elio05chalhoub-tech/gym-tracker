const router = require('express').Router();
const auth = require('../middleware/auth');
const { createWorkout, getWorkouts, deleteWorkout } = require('../controllers/workoutController');

router.post('/', auth, createWorkout);
router.get('/', auth, getWorkouts);
router.delete('/:id', auth, deleteWorkout);

module.exports = router;
