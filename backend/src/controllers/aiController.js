const pool = require('../config/db');

// Map exercise names to muscle groups
const muscleMap = {
  // Chest
  'bench press': 'chest', 'chest press': 'chest', 'push up': 'chest', 'pushup': 'chest',
  'chest fly': 'chest', 'cable fly': 'chest', 'incline press': 'chest', 'decline press': 'chest',
  'dumbbell press': 'chest', 'pec deck': 'chest', 'incline fly': 'chest',

  // Back
  'pull up': 'back', 'pullup': 'back', 'chin up': 'back', 'chinup': 'back',
  'lat pulldown': 'back', 'row': 'back', 'deadlift': 'back', 'cable row': 'back',
  'bent over row': 'back', 't-bar row': 'back', 'seated row': 'back', 'face pull': 'back',

  // Shoulders
  'shoulder press': 'shoulders', 'overhead press': 'shoulders', 'ohp': 'shoulders',
  'lateral raise': 'shoulders', 'front raise': 'shoulders', 'arnold press': 'shoulders',
  'military press': 'shoulders', 'rear delt': 'shoulders', 'upright row': 'shoulders',

  // Biceps
  'curl': 'biceps', 'bicep curl': 'biceps', 'hammer curl': 'biceps',
  'barbell curl': 'biceps', 'preacher curl': 'biceps', 'concentration curl': 'biceps',
  'incline curl': 'biceps', 'cable curl': 'biceps',

  // Triceps
  'tricep': 'triceps', 'skull crusher': 'triceps', 'dip': 'triceps',
  'pushdown': 'triceps', 'tricep pushdown': 'triceps', 'close grip': 'triceps',
  'overhead tricep': 'triceps', 'tricep extension': 'triceps', 'diamond push': 'triceps',

  // Legs
  'squat': 'legs', 'leg press': 'legs', 'lunge': 'legs', 'leg curl': 'legs',
  'leg extension': 'legs', 'calf raise': 'legs', 'romanian deadlift': 'legs', 'rdl': 'legs',
  'hip thrust': 'legs', 'glute': 'legs', 'quad': 'legs', 'hamstring': 'legs',
  'step up': 'legs', 'sumo squat': 'legs', 'hack squat': 'legs', 'bulgarian': 'legs',

  // Abs
  'crunch': 'abs', 'plank': 'abs', 'sit up': 'abs', 'situp': 'abs',
  'leg raise': 'abs', 'cable crunch': 'abs', 'russian twist': 'abs',
  'mountain climber': 'abs', 'ab wheel': 'abs', 'hanging knee': 'abs', 'v-up': 'abs',

  // Cardio
  'run': 'cardio', 'running': 'cardio', 'treadmill': 'cardio', 'cycling': 'cardio',
  'bike': 'cardio', 'elliptical': 'cardio', 'jump rope': 'cardio', 'hiit': 'cardio',
  'rowing machine': 'cardio', 'stairmaster': 'cardio', 'swimming': 'cardio', 'walk': 'cardio',
};

const ALL_MUSCLE_GROUPS = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'abs', 'cardio'];

const LARGE_MUSCLES = ['chest', 'back', 'legs'];
const SMALL_MUSCLES = ['biceps', 'triceps', 'shoulders', 'abs', 'cardio'];

function getMuscleGroup(exerciseName) {
  const lower = exerciseName.toLowerCase();
  for (const [keyword, muscle] of Object.entries(muscleMap)) {
    if (lower.includes(keyword)) return muscle;
  }
  return null;
}

function getLastTrainedMap(workouts) {
  const lastTrained = {};
  const sortedWorkouts = [...workouts].sort((a, b) => new Date(b.date) - new Date(a.date));

  for (const workout of sortedWorkouts) {
    for (const exercise of workout.exercises || []) {
      const muscle = getMuscleGroup(exercise.name);
      if (muscle && !lastTrained[muscle]) {
        lastTrained[muscle] = new Date(workout.date);
      }
    }
  }
  return lastTrained;
}

function getWeeklyVolumeMap(workouts) {
  const volume = {};
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  for (const workout of workouts) {
    if (new Date(workout.date) < oneWeekAgo) continue;
    for (const exercise of workout.exercises || []) {
      const muscle = getMuscleGroup(exercise.name);
      if (muscle && exercise.type === 'strength') {
        volume[muscle] = (volume[muscle] || 0) + (exercise.sets || 0);
      }
    }
  }
  return volume;
}

function getConsecutiveWorkoutDays(workouts) {
  if (!workouts.length) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const workoutDates = new Set(
    workouts.map(w => new Date(w.date).toDateString())
  );

  let count = 0;
  const check = new Date(today);
  while (workoutDates.has(check.toDateString())) {
    count++;
    check.setDate(check.getDate() - 1);
  }
  return count;
}

function detectPlateaus(workouts) {
  const exerciseHistory = {};
  const sorted = [...workouts].sort((a, b) => new Date(a.date) - new Date(b.date));

  for (const workout of sorted) {
    for (const ex of workout.exercises || []) {
      if (ex.type !== 'strength' || !ex.weight_kg) continue;
      const key = ex.name.toLowerCase();
      if (!exerciseHistory[key]) exerciseHistory[key] = [];
      exerciseHistory[key].push(ex.weight_kg);
    }
  }

  const plateaus = [];
  for (const [name, weights] of Object.entries(exerciseHistory)) {
    if (weights.length >= 4) {
      const last4 = weights.slice(-4);
      if (last4.every(w => w === last4[0])) {
        plateaus.push(name);
      }
    }
  }
  return plateaus;
}

function getPersonalRecords(workouts, latestWorkout) {
  if (!latestWorkout) return [];
  const allPrev = workouts.filter(w => w.id !== latestWorkout.id);
  const prs = [];

  for (const ex of latestWorkout.exercises || []) {
    if (!ex.weight_kg || ex.type !== 'strength') continue;
    const maxPrev = Math.max(0, ...allPrev.flatMap(w =>
      (w.exercises || [])
        .filter(e => e.name.toLowerCase() === ex.name.toLowerCase() && e.weight_kg)
        .map(e => e.weight_kg)
    ));
    if (ex.weight_kg > maxPrev) {
      prs.push({ name: ex.name, weight: ex.weight_kg });
    }
  }
  return prs;
}

function daysSince(date) {
  if (!date) return Infinity;
  return Math.floor((new Date() - new Date(date)) / (1000 * 60 * 60 * 24));
}

function hoursSince(date) {
  if (!date) return Infinity;
  return Math.floor((new Date() - new Date(date)) / (1000 * 60 * 60));
}

function getGreeting(name) {
  const hour = new Date().getHours();
  if (hour < 12) return `Good morning, ${name}!`;
  if (hour < 18) return `What's up ${name}!`;
  return `Evening, ${name}!`;
}

function getGoalLabel(goal) {
  if (goal === 'bulk') return 'building muscle';
  if (goal === 'cut') return 'cutting fat';
  return 'maintaining';
}

exports.getCoachAdvice = async (req, res) => {
  try {
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [req.userId]);
    const user = users[0];
    if (!user) return res.status(404).json({ message: 'User not found' });

    const [workouts] = await pool.query(
      `SELECT w.*, GROUP_CONCAT(
        JSON_OBJECT(
          'id', e.id, 'name', e.name, 'sets', e.sets,
          'reps', e.reps, 'weight_kg', e.weight_kg,
          'duration_min', e.duration_min, 'type', e.type
        )
      ) as exercises_json
      FROM workouts w
      LEFT JOIN exercises e ON e.workout_id = w.id
      WHERE w.user_id = ?
      GROUP BY w.id
      ORDER BY w.date DESC
      LIMIT 20`,
      [req.userId]
    );

    for (const w of workouts) {
      try {
        w.exercises = w.exercises_json
          ? JSON.parse(`[${w.exercises_json}]`)
          : [];
      } catch {
        w.exercises = [];
      }
    }

    const [bodyLogs] = await pool.query(
      'SELECT * FROM body_logs WHERE user_id = ? ORDER BY date DESC LIMIT 10',
      [req.userId]
    );

    const insights = [];
    const warnings = [];
    const suggestions = [];

    // ─── Greeting ───────────────────────────────────────────────
    insights.push(getGreeting(user.name));

    // ─── Calorie Target Reminder ─────────────────────────────────
    if (user.goal && user.weight_kg) {
      const bmr = user.gender === 'male'
        ? 10 * user.weight_kg + 6.25 * user.height_cm - 5 * user.age + 5
        : 10 * user.weight_kg + 6.25 * user.height_cm - 5 * user.age - 161;
      const multipliers = { sedentary: 1.2, light: 1.375, moderate: 1.55, very_active: 1.725, extra_active: 1.9 };
      const tdee = Math.round(bmr * (multipliers[user.activity_level] || 1.55));
      const target = user.goal === 'cut' ? tdee - 400 : user.goal === 'bulk' ? tdee + 300 : tdee;
      const protein = Math.round(user.weight_kg * 2);

      insights.push(
        `Your daily target is **${target} kcal** (${getGoalLabel(user.goal)}). ` +
        `Hit at least **${protein}g of protein** to protect your muscle.`
      );

      if (user.goal === 'bulk') {
        insights.push(`Bulking tip: Aim to gain 0.3-0.5 kg/week. More than that and you're adding fat, not muscle.`);
      } else if (user.goal === 'cut') {
        insights.push(`Cutting tip: Your deficit is ~400 kcal/day. Stay above ${tdee - 750} kcal or you'll lose muscle.`);
      }
    }

    // ─── Consecutive Days Check ───────────────────────────────────
    const consecutive = getConsecutiveWorkoutDays(workouts);
    if (consecutive >= 7) {
      warnings.push(`🚨 You've trained ${consecutive} days straight. Take a rest day TODAY. Your muscles grow during rest, not in the gym.`);
    } else if (consecutive >= 5) {
      warnings.push(`You've been at it ${consecutive} days in a row. Plan a rest day soon — your body will thank you.`);
    } else if (consecutive === 4) {
      insights.push(`Day 4 of your cycle done! Take your rest day tomorrow. You've earned it.`);
    }

    // ─── Muscle Group Tracking ────────────────────────────────────
    const lastTrained = getLastTrainedMap(workouts);
    const untrained = [];
    const tooSoon = [];

    for (const muscle of ALL_MUSCLE_GROUPS) {
      const last = lastTrained[muscle];
      const hours = hoursSince(last);
      const days = daysSince(last);
      const recoveryHours = LARGE_MUSCLES.includes(muscle) ? 72 : 48;

      if (!last) {
        untrained.push(muscle);
      } else if (hours < recoveryHours) {
        tooSoon.push({ muscle, hoursLeft: recoveryHours - hours });
      } else if (days > 7) {
        warnings.push(`⚠️ You haven't trained **${muscle}** in ${days} days. Don't let it go past 7 days — get it in your next session!`);
      }
    }

    if (untrained.length > 0) {
      warnings.push(`You've never logged: **${untrained.join(', ')}**. Make sure to hit every muscle group in your 4-day cycle!`);
    }

    if (tooSoon.length > 0) {
      const list = tooSoon.map(t => `${t.muscle} (${t.hoursLeft}h left)`).join(', ');
      suggestions.push(`These muscles are still recovering: **${list}**. Train something else today.`);
    }

    // ─── What to Train Next ───────────────────────────────────────
    const readyMuscles = ALL_MUSCLE_GROUPS.filter(m => {
      const hours = hoursSince(lastTrained[m]);
      const recovery = LARGE_MUSCLES.includes(m) ? 72 : 48;
      return hours >= recovery;
    });

    const priorityMuscles = readyMuscles.sort((a, b) => {
      const daysA = daysSince(lastTrained[a]) || 999;
      const daysB = daysSince(lastTrained[b]) || 999;
      return daysB - daysA;
    });

    if (priorityMuscles.length > 0) {
      const top3 = priorityMuscles.slice(0, 3);
      suggestions.push(`Ready to train: **${top3.join(', ')}** — these are your most overdue muscle groups. Hit them next!`);
    }

    // ─── Weekly Volume Check ──────────────────────────────────────
    const weeklyVolume = getWeeklyVolumeMap(workouts);
    const lowVolume = [];
    const highVolume = [];

    for (const muscle of ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs']) {
      const sets = weeklyVolume[muscle] || 0;
      if (sets > 0 && sets < 10) lowVolume.push(`${muscle} (${sets} sets)`);
      if (sets > 25) highVolume.push(`${muscle} (${sets} sets)`);
    }

    if (lowVolume.length > 0) {
      suggestions.push(`Low weekly volume for: **${lowVolume.join(', ')}**. Aim for 10-20 sets/week per muscle group.`);
    }
    if (highVolume.length > 0) {
      warnings.push(`You're overloading: **${highVolume.join(', ')}**. Past 25 sets/week you get diminishing returns and risk overtraining.`);
    }

    // ─── Plateau Detection ────────────────────────────────────────
    const plateaus = detectPlateaus(workouts);
    if (plateaus.length > 0) {
      suggestions.push(`Plateau detected on: **${plateaus.join(', ')}**. Same weight for 4+ sessions. It's time to add 2-3 kg and challenge your body again.`);
    }

    // ─── Personal Records ─────────────────────────────────────────
    const latestWorkout = workouts[0];
    const prs = getPersonalRecords(workouts, latestWorkout);
    if (prs.length > 0) {
      const prList = prs.map(p => `${p.name} @ ${p.weight}kg`).join(', ');
      insights.push(`New PR${prs.length > 1 ? 's' : ''}! 🔥 ${prList} — that's real progress, keep it going!`);
    }

    // ─── Body Weight Progress ─────────────────────────────────────
    if (bodyLogs.length >= 2) {
      const latest = bodyLogs[0].weight_kg;
      const oldest = bodyLogs[bodyLogs.length - 1].weight_kg;
      const diff = (latest - oldest).toFixed(1);
      const weeks = Math.max(1, Math.round(daysSince(bodyLogs[bodyLogs.length - 1].date) / 7));
      const weeklyChange = (diff / weeks).toFixed(2);

      if (user.goal === 'bulk') {
        if (parseFloat(weeklyChange) > 0.8) {
          warnings.push(`You're gaining ${weeklyChange} kg/week. That's too fast — you're adding fat. Reduce surplus by ~200 kcal.`);
        } else if (parseFloat(weeklyChange) >= 0.3) {
          insights.push(`Weight trend: +${weeklyChange} kg/week. Perfect bulk pace! Muscle gains on track.`);
        } else if (parseFloat(weeklyChange) < 0.1) {
          suggestions.push(`You're barely gaining weight (${weeklyChange} kg/week). Increase your calories by 200 kcal/day to fuel muscle growth.`);
        }
      } else if (user.goal === 'cut') {
        if (parseFloat(weeklyChange) < -2) {
          warnings.push(`Losing ${Math.abs(weeklyChange)} kg/week — too fast! You're burning muscle. Add 200 kcal back.`);
        } else if (parseFloat(weeklyChange) <= -0.5) {
          insights.push(`Weight trend: ${weeklyChange} kg/week. Perfect cut pace! Fat loss on track.`);
        }
      }
    }

    // ─── Motivational Closer ──────────────────────────────────────
    const motivations = {
      bulk: [
        `Stay consistent, eat your calories, and trust the process. Muscle doesn't build overnight — but it builds.`,
        `Every session adds up. You're building something real here. Keep showing up.`,
        `The reps you do when you don't feel like it are the ones that matter most.`,
      ],
      cut: [
        `Cutting is mentally tough. But every day in deficit is a day closer to your goal. Stay disciplined.`,
        `You're losing fat and keeping muscle — that's the hardest thing to do in fitness. Be proud of that.`,
        `Discipline beats motivation every time. You've got this.`,
      ],
      maintain: [
        `Maintenance is underrated. You're building a sustainable lifestyle. That's the real win.`,
        `Consistency at maintenance = long-term health. Keep it up.`,
      ],
    };

    const goalMotivations = motivations[user.goal] || motivations.maintain;
    const randomMotivation = goalMotivations[Math.floor(Math.random() * goalMotivations.length)];
    insights.push(randomMotivation);

    // ─── Build Final Response ─────────────────────────────────────
    const response = {
      greeting: insights[0],
      calories: insights[1] || null,
      insights: insights.slice(2),
      warnings,
      suggestions,
      summary: buildSummary(user, workouts, lastTrained, consecutive),
    };

    res.json(response);
  } catch (err) {
    console.error('AI COACH ERROR STACK:', err.stack);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

function buildSummary(user, workouts, lastTrained, consecutive) {
  const totalWorkouts = workouts.length;
  const thisWeek = workouts.filter(w => daysSince(w.date) <= 7).length;
  const musclesCovered = Object.keys(lastTrained).filter(m => daysSince(lastTrained[m]) <= 7).length;

  return {
    totalWorkoutsLogged: totalWorkouts,
    workoutsThisWeek: thisWeek,
    muscleGroupsThisWeek: `${musclesCovered} / ${ALL_MUSCLE_GROUPS.length}`,
    consecutiveWorkoutDays: consecutive,
    cycleStatus: consecutive < 4
      ? `Day ${consecutive + 1} of your 4-day cycle`
      : consecutive === 4
        ? 'Cycle complete — rest day tomorrow!'
        : 'Rest day recommended',
  };
}

exports.logBodyWeight = async (req, res) => {
  const { date, weight_kg, body_fat_percent, notes } = req.body;
  try {
    await pool.query(
      'INSERT INTO body_logs (user_id, date, weight_kg, body_fat_percent, notes) VALUES (?, ?, ?, ?, ?)',
      [req.userId, date, weight_kg, body_fat_percent, notes]
    );
    res.status(201).json({ message: 'Body log saved' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getBodyLogs = async (req, res) => {
  try {
    const [logs] = await pool.query(
      'SELECT * FROM body_logs WHERE user_id = ? ORDER BY date ASC',
      [req.userId]
    );
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
