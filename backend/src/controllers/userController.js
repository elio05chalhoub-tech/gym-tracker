const pool = require('../config/db');

exports.getProfile = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.userId]);
    if (!rows.length) return res.status(404).json({ message: 'User not found' });
    const { password, ...user } = rows[0];
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.completeOnboarding = async (req, res) => {
  const { age, gender, height_cm, weight_kg, goal, activity_level, training_days, split_type } = req.body;
  try {
    await pool.query(
      `UPDATE users SET age=?, gender=?, height_cm=?, weight_kg=?, goal=?, activity_level=?, training_days=?, split_type=?, completed_onboarding=TRUE WHERE id=?`,
      [age, gender, height_cm, weight_kg, goal, activity_level, training_days, split_type, req.userId]
    );

    // Auto-log first body weight
    if (weight_kg) {
      await pool.query(
        'INSERT INTO body_logs (user_id, date, weight_kg) VALUES (?, CURDATE(), ?)',
        [req.userId, weight_kg]
      );
    }

    res.json({ message: 'Onboarding complete' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
