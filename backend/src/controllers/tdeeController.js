const pool = require('../config/db');

const activityMultipliers = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very_active: 1.725,
  extra_active: 1.9,
};

function calculateBMR(weight, height, age, gender) {
  if (gender === 'male') {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  }
  return 10 * weight + 6.25 * height - 5 * age - 161;
}

exports.calculate = async (req, res) => {
  const { age, gender, height_cm, weight_kg, activity_level, goal } = req.body;

  try {
    const bmr = calculateBMR(weight_kg, height_cm, age, gender);
    const tdee = Math.round(bmr * activityMultipliers[activity_level]);

    let targetCalories;
    if (goal === 'cut') targetCalories = tdee - 400;
    else if (goal === 'bulk') targetCalories = tdee + 300;
    else targetCalories = tdee;

    const protein = Math.round(weight_kg * 2);
    const fat = Math.round((targetCalories * 0.25) / 9);
    const carbs = Math.round((targetCalories - protein * 4 - fat * 9) / 4);

    await pool.query(
      `UPDATE users SET age=?, gender=?, height_cm=?, weight_kg=?, activity_level=?, goal=? WHERE id=?`,
      [age, gender, height_cm, weight_kg, activity_level, goal, req.userId]
    );

    res.json({ bmr: Math.round(bmr), tdee, targetCalories, macros: { protein, fat, carbs }, goal });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
