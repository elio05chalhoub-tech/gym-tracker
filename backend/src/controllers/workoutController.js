const pool = require('../config/db');

exports.createWorkout = async (req, res) => {
  const { name, date, notes, exercises } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.query(
      'INSERT INTO workouts (user_id, name, date, notes) VALUES (?, ?, ?, ?)',
      [req.userId, name, date, notes]
    );
    const workoutId = result.insertId;

    for (const ex of exercises) {
      await conn.query(
        'INSERT INTO exercises (workout_id, name, sets, reps, weight_kg, duration_min, distance_km, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [workoutId, ex.name, ex.sets, ex.reps, ex.weight_kg, ex.duration_min, ex.distance_km, ex.type]
      );
    }

    await conn.commit();
    res.status(201).json({ message: 'Workout saved', workoutId });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ message: 'Server error', error: err.message });
  } finally {
    conn.release();
  }
};

exports.getWorkouts = async (req, res) => {
  try {
    const [workouts] = await pool.query(
      'SELECT * FROM workouts WHERE user_id = ? ORDER BY date DESC',
      [req.userId]
    );
    for (const w of workouts) {
      const [exercises] = await pool.query('SELECT * FROM exercises WHERE workout_id = ?', [w.id]);
      w.exercises = exercises;
    }
    res.json(workouts);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.deleteWorkout = async (req, res) => {
  try {
    await pool.query('DELETE FROM workouts WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
    res.json({ message: 'Workout deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
