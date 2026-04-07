const pool = require('../config/db');

function getTDEE(user) {
  if (!user.weight_kg || !user.height_cm || !user.age) return null;
  const bmr = user.gender === 'male'
    ? 10 * user.weight_kg + 6.25 * user.height_cm - 5 * user.age + 5
    : 10 * user.weight_kg + 6.25 * user.height_cm - 5 * user.age - 161;
  const multipliers = { sedentary: 1.2, light: 1.375, moderate: 1.55, very_active: 1.725, extra_active: 1.9 };
  const tdee = Math.round(bmr * (multipliers[user.activity_level] || 1.55));
  const target = user.goal === 'cut' ? tdee - 400 : user.goal === 'bulk' ? tdee + 300 : tdee;
  const protein = Math.round(user.weight_kg * 2);
  const fat = Math.round((target * 0.25) / 9);
  const carbs = Math.round((target - protein * 4 - fat * 9) / 4);
  return { tdee, target, protein, fat, carbs };
}

exports.logMeal = async (req, res) => {
  const { name, calories, protein_g, carbs_g, fat_g, meal_type, date } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO meals (user_id, date, name, calories, protein_g, carbs_g, fat_g, meal_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [req.userId, date || new Date().toISOString().split('T')[0], name, calories, protein_g, carbs_g, fat_g, meal_type || 'snack']
    );
    res.status(201).json({ message: 'Meal logged', id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getMeals = async (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0];
  try {
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [req.userId]);
    const user = users[0];
    const targets = getTDEE(user);

    const [meals] = await pool.query(
      'SELECT * FROM meals WHERE user_id = ? AND date = ? ORDER BY created_at ASC',
      [req.userId, date]
    );

    const totals = meals.reduce((acc, m) => ({
      calories: acc.calories + (m.calories || 0),
      protein_g: acc.protein_g + (m.protein_g || 0),
      carbs_g: acc.carbs_g + (m.carbs_g || 0),
      fat_g: acc.fat_g + (m.fat_g || 0),
    }), { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 });

    res.json({ meals, totals, targets });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.deleteMeal = async (req, res) => {
  try {
    await pool.query('DELETE FROM meals WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
    res.json({ message: 'Meal deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
