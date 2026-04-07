const pool = require('../config/db');

// ─── Keyword detection helpers ────────────────────────────────────────────────

function detectWeight(msg) {
  const m = msg.match(/(\d+\.?\d*)\s*kg/i) || msg.match(/weigh(?:s|ed|ing)?\s+(\d+\.?\d*)/i);
  return m ? parseFloat(m[1]) : null;
}

function detectCalories(msg) {
  const m = msg.match(/(\d{3,4})\s*(?:kcal|cal(?:ories)?)/i) || msg.match(/ate\s+(\d{3,4})/i);
  return m ? parseInt(m[1]) : null;
}

function detectExercises(msg) {
  const exerciseKeywords = [
    'bench press','squat','deadlift','pull up','chin up','lat pulldown','row','shoulder press',
    'overhead press','curl','bicep curl','hammer curl','tricep','pushdown','dip','leg press',
    'lunge','hip thrust','calf raise','plank','crunch','treadmill','cycling','run','cardio','hiit'
  ];
  return exerciseKeywords.filter(ex => msg.toLowerCase().includes(ex));
}

function detectMuscles(msg) {
  const muscles = ['chest','back','shoulders','biceps','triceps','legs','abs','cardio','arms','glutes','quads','hamstrings'];
  return muscles.filter(m => msg.toLowerCase().includes(m));
}

function detectIntent(msg) {
  const lower = msg.toLowerCase();

  if (/^(hey|hi|hello|sup|what'?s up|hola|yo\b)/.test(lower)) return 'greeting';
  if (/(how am i doing|on track|progress|doing well|results)/.test(lower)) return 'check_progress';
  if (/(just did|finished|completed|just trained|just lifted|crushed|killed it|just hit|did my)/.test(lower)) return 'workout_done';
  if (/(weigh|my weight|body weight|\d+\s*kg)/.test(lower)) return 'weight_mention';
  if (/(ate|eaten|eating|had|consumed|calories|kcal|macros|protein|food|meal|diet)/.test(lower)) return 'nutrition';
  if (/(what should i (do|train)|what (muscle|body part)|today'?s workout|what to train|my next workout)/.test(lower)) return 'ask_plan';
  if (/(tired|exhausted|no (energy|motivation)|don'?t want|lazy|skip|rest day|should i rest)/.test(lower)) return 'motivation';
  if (/(plateau|stuck|not (progressing|growing|losing)|same weight|not changing)/.test(lower)) return 'plateau';
  if (/(hurt|pain|injury|sore|aching)/.test(lower)) return 'injury';
  if (/(how much (protein|calories|carbs|fat)|macro|what should i eat|diet advice)/.test(lower)) return 'nutrition_advice';
  if (/(rest|recovery|sleep|deload)/.test(lower)) return 'recovery';
  if (/(pr|personal record|new record|best|max|1rm)/.test(lower)) return 'pr_mention';
  if (/(bulk|cut|maintain|lose weight|gain muscle|lose fat|build muscle)/.test(lower)) return 'goal_talk';
  return 'general';
}

// ─── Response generators ──────────────────────────────────────────────────────

function greetingResponse(user) {
  const hour = new Date().getHours();
  const timeGreet = hour < 12 ? 'Morning' : hour < 18 ? 'Hey' : 'Evening';
  const responses = [
    `${timeGreet}, ${user.name}! 💪 Ready to crush it today? Tell me what's on your mind or what you trained.`,
    `Yo ${user.name}! Your coach is online. What's the plan today?`,
    `${timeGreet} ${user.name}! Let's get to work. What's up?`,
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}

function checkProgressResponse(user, workouts, bodyLogs) {
  const thisWeek = workouts.filter(w => {
    const d = new Date(w.date);
    const now = new Date();
    const diff = (now - d) / (1000 * 60 * 60 * 24);
    return diff <= 7;
  }).length;

  let msg = `Here's your week, ${user.name}:\n\n`;
  msg += `📊 Workouts this week: **${thisWeek}** / ${user.training_days || 4} planned\n`;

  if (bodyLogs.length >= 2) {
    const diff = (bodyLogs[0].weight_kg - bodyLogs[bodyLogs.length - 1].weight_kg).toFixed(1);
    const direction = parseFloat(diff) > 0 ? '📈' : '📉';
    msg += `${direction} Weight change: **${parseFloat(diff) > 0 ? '+' : ''}${diff} kg** since you started\n`;
  }

  if (user.goal === 'bulk') msg += `\n💪 Bulking goal: keep eating in a surplus and hitting those compound lifts.`;
  else if (user.goal === 'cut') msg += `\n🔥 Cutting goal: stay in your deficit and protect that muscle with protein.`;
  else msg += `\n⚖️ Maintenance goal: you're building a sustainable lifestyle. Keep it consistent.`;

  return msg;
}

function workoutDoneResponse(user, exercises, muscles) {
  let msg = '';
  if (exercises.length > 0) {
    msg = `Let's go ${user.name}! 🔥 Sounds like you hit **${exercises.join(', ')}**. `;
    msg += `Want me to log that workout to your history?`;
    return { text: msg, action: 'log_workout_confirm', exercises };
  } else if (muscles.length > 0) {
    msg = `Nice work on the **${muscles.join(' + ')}** session, ${user.name}! 💪 `;
    msg += `Want me to log a workout for today with ${muscles.join(' + ')} exercises?`;
    return { text: msg, action: 'log_workout_confirm', muscles };
  }
  return {
    text: `Solid work, ${user.name}! 💪 What did you train? Tell me the exercises and I'll log it for you.`,
    action: null
  };
}

function weightMentionResponse(user, detectedWeight) {
  if (!detectedWeight) {
    return { text: `What's your current weight? Just tell me like "I weigh 76kg" and I'll add it to your progress tracker.`, action: null };
  }

  const diff = user.weight_kg ? (detectedWeight - user.weight_kg).toFixed(1) : null;
  let msg = '';

  if (user.goal === 'bulk') {
    if (diff !== null && parseFloat(diff) > 0) msg = `Up **${diff} kg** from when you started — that's the bulk working! `;
    else if (diff !== null && parseFloat(diff) < 0) msg = `You're down **${Math.abs(diff)} kg**. Make sure you're in a calorie surplus! `;
    msg += `Want me to log **${detectedWeight} kg** to your progress tracker?`;
  } else if (user.goal === 'cut') {
    if (diff !== null && parseFloat(diff) < 0) msg = `Down **${Math.abs(diff)} kg** — the cut is working, keep it up! `;
    else if (diff !== null && parseFloat(diff) > 0) msg = `Up **${diff} kg** — check your calorie intake, you might be in a surplus. `;
    msg += `Want me to log **${detectedWeight} kg** to your progress tracker?`;
  } else {
    msg = `Got it — **${detectedWeight} kg**. Want me to log that to your progress tracker?`;
  }

  return { text: msg, action: 'log_weight_confirm', weight: detectedWeight };
}

function nutritionResponse(user, detectedCalories) {
  if (!user.weight_kg || !user.height_cm) {
    return { text: `Complete your profile first so I can calculate your exact targets!`, action: null };
  }

  const bmr = user.gender === 'male'
    ? 10 * user.weight_kg + 6.25 * user.height_cm - 5 * user.age + 5
    : 10 * user.weight_kg + 6.25 * user.height_cm - 5 * user.age - 161;
  const multipliers = { sedentary: 1.2, light: 1.375, moderate: 1.55, very_active: 1.725, extra_active: 1.9 };
  const tdee = Math.round(bmr * (multipliers[user.activity_level] || 1.55));
  const target = user.goal === 'cut' ? tdee - 400 : user.goal === 'bulk' ? tdee + 300 : tdee;
  const protein = Math.round(user.weight_kg * 2);

  if (detectedCalories) {
    const diff = detectedCalories - target;
    if (Math.abs(diff) <= 150) return { text: `${detectedCalories} kcal — that's right on target! Your goal is **${target} kcal**. Nailed it. 🎯`, action: null };
    if (diff < 0) return { text: `${detectedCalories} kcal — you're **${Math.abs(diff)} kcal under** your ${target} target. ${user.goal === 'bulk' ? 'Add a protein shake or snack!' : 'Nice work staying in the deficit!'}`, action: null };
    return { text: `${detectedCalories} kcal — you're **${diff} kcal over** your ${target} target. ${user.goal === 'cut' ? 'Try to dial it back a bit tomorrow.' : 'That surplus will fuel the gains!'}`, action: null };
  }

  return {
    text: `Your daily targets:\n\n🍽️ **${target} kcal** total\n🥩 **${protein}g protein** (priority!)\n📊 TDEE: ${tdee} kcal\n\n${user.goal === 'bulk' ? `You're eating ${target - tdee > 0 ? '+' : ''}${target - tdee} kcal above maintenance.` : user.goal === 'cut' ? `You're eating ${target - tdee} kcal below maintenance.` : 'Eating at maintenance.'}`,
    action: null
  };
}

function askPlanResponse(user, workouts) {
  const MUSCLE_ICONS = { chest: '🫁', back: '🔙', shoulders: '🦾', biceps: '💪', triceps: '💪', legs: '🦿', abs: '⚡', cardio: '🏃' };
  const ALL_MUSCLES = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'abs'];

  const muscleMap = {
    'bench press': 'chest', 'incline press': 'chest', 'push up': 'chest', 'cable fly': 'chest',
    'pull up': 'back', 'lat pulldown': 'back', 'row': 'back', 'deadlift': 'back',
    'shoulder press': 'shoulders', 'lateral raise': 'shoulders', 'overhead press': 'shoulders',
    'curl': 'biceps', 'hammer curl': 'biceps', 'barbell curl': 'biceps',
    'tricep': 'triceps', 'pushdown': 'triceps', 'dip': 'triceps',
    'squat': 'legs', 'leg press': 'legs', 'lunge': 'legs', 'hip thrust': 'legs',
    'plank': 'abs', 'crunch': 'abs', 'leg raise': 'abs',
  };

  const lastTrained = {};
  for (const w of workouts) {
    for (const ex of w.exercises || []) {
      const name = ex.name?.toLowerCase() || '';
      for (const [kw, muscle] of Object.entries(muscleMap)) {
        if (name.includes(kw) && !lastTrained[muscle]) {
          lastTrained[muscle] = new Date(w.date);
        }
      }
    }
  }

  const notTrained = ALL_MUSCLES.filter(m => {
    const last = lastTrained[m];
    if (!last) return true;
    const hours = (new Date() - last) / (1000 * 60 * 60);
    return hours >= ((['chest','back','legs'].includes(m)) ? 72 : 48);
  }).sort((a, b) => {
    const dA = lastTrained[a] ? (new Date() - lastTrained[a]) : Infinity;
    const dB = lastTrained[b] ? (new Date() - lastTrained[b]) : Infinity;
    return dB - dA;
  });

  if (notTrained.length === 0) {
    return { text: `All your muscle groups are still recovering! Take a rest day today — your muscles grow when you rest. See you tomorrow 💤`, action: null };
  }

  const top = notTrained.slice(0, 3);
  const suggestions = {
    chest: ['Bench Press 4x8', 'Incline Press 3x10', 'Cable Fly 3x12'],
    back: ['Pull Ups 4x8', 'Lat Pulldown 3x10', 'Bent Over Row 3x8'],
    shoulders: ['Shoulder Press 4x10', 'Lateral Raise 3x15', 'Front Raise 3x12'],
    biceps: ['Barbell Curl 3x10', 'Hammer Curl 3x12', 'Cable Curl 3x15'],
    triceps: ['Tricep Pushdown 4x12', 'Skull Crusher 3x10', 'Dip 3x10'],
    legs: ['Squat 4x8', 'Leg Press 3x12', 'Romanian Deadlift 3x10', 'Calf Raise 4x15'],
    abs: ['Plank 3x60s', 'Leg Raise 3x15', 'Russian Twist 3x20'],
  };

  const mainMuscle = top[0];
  const plan = suggestions[mainMuscle] || [];

  let msg = `Based on your recovery, I suggest training **${top.map(m => `${MUSCLE_ICONS[m]} ${m}`).join(', ')}** today.\n\n`;
  msg += `Here's a ${mainMuscle} workout:\n`;
  plan.forEach(ex => { msg += `• ${ex}\n`; });
  if (top[1]) msg += `\nPair it with **${top[1]}** if you have energy left!`;

  return { text: msg, action: null };
}

function motivationResponse(user) {
  const msgs = [
    `I hear you ${user.name}, but hear me out — just show up for 20 minutes. If you still don't want to train after warmup, go home. But you won't. The hardest part is starting. 💪`,
    `You don't need motivation. You need discipline. Motivation is unreliable — discipline is what you build. Show up anyway. Future you will thank present you.`,
    `Even a bad workout beats skipping. 15 minutes of something always beats 0 minutes of nothing. Let's do a light session. What do you feel like hitting?`,
    `Rest days are real. But make sure it's a rest day, not a quit day. If you genuinely need rest — take it. If it's just resistance — push through it.`,
  ];
  return { text: msgs[Math.floor(Math.random() * msgs.length)], action: null };
}

function plateauResponse(user) {
  return {
    text: `Plateaus are normal — your body adapted. Here's how to break it:\n\n1️⃣ **Add weight** — even 1.25 kg counts\n2️⃣ **Add reps** — same weight, one more rep\n3️⃣ **Change tempo** — slower reps = more tension\n4️⃣ **Try a deload week** — lower volume for 7 days, then come back stronger\n5️⃣ **Check your calories** — are you actually eating enough to grow?\n\nWhat specifically feels stuck? Tell me the exercise and I'll give targeted advice.`,
    action: null
  };
}

function injuryResponse() {
  return {
    text: `First — don't train through sharp pain. Dull soreness is fine, sharp or joint pain is not.\n\nIf it's DOMS (muscle soreness 24-48h after training): light movement, stretching, and proper nutrition will speed recovery.\n\nIf it's actual pain: rest, ice, and see a physio if it persists 3+ days. Don't risk making it worse.\n\nWhat specifically hurts?`,
    action: null
  };
}

function prResponse(user) {
  return {
    text: `NEW PR?! Let's GO ${user.name}! 🏆 That's what all the consistency is for. Those breakthroughs don't happen by accident — they happen because you show up. Log it so we can track the record. What lift and what weight?`,
    action: null
  };
}

function recoveryResponse(user, workouts) {
  const consecutive = (() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const dates = new Set(workouts.map(w => new Date(w.date).toDateString()));
    let count = 0;
    const d = new Date(today);
    while (dates.has(d.toDateString())) { count++; d.setDate(d.getDate() - 1); }
    return count;
  })();

  if (consecutive >= 4) {
    return { text: `You've trained ${consecutive} days straight, ${user.name}. REST DAY is the right call. Your muscles literally grow during rest, not in the gym. Sleep 8h, eat your protein, hydrate. Come back tomorrow stronger. 💤`, action: null };
  }
  return {
    text: `Recovery tips:\n\n😴 **Sleep** — 7-9h is non-negotiable for muscle growth\n💧 **Hydration** — 3-4L water/day\n🥩 **Protein** — ${user.weight_kg ? Math.round(user.weight_kg * 2) : 150}g/day minimum\n🧘 **Active recovery** — light walk or stretch on rest days beats doing nothing\n\nYou've trained ${consecutive} day${consecutive !== 1 ? 's' : ''} in a row. ${consecutive >= 3 ? 'Consider a rest day soon.' : 'You\'re good to keep going!'}`,
    action: null
  };
}

function goalTalkResponse(user) {
  const goalMap = { bulk: 'building muscle', cut: 'losing fat', maintain: 'maintaining' };
  return {
    text: `Your current goal is set to **${goalMap[user.goal] || user.goal}**. ${user.goal === 'bulk' ? 'Stay in a 300-500 kcal surplus and prioritize compound lifts. Progressive overload is your best friend.' : user.goal === 'cut' ? 'Stay in a 300-500 kcal deficit. Keep protein high (${user.weight_kg ? Math.round(user.weight_kg * 2) : 150}g/day) to preserve muscle.' : 'Eat at maintenance calories and keep training consistently.'}\n\nWant to change your goal? Go to the TDEE tab to update it.`,
    action: null
  };
}

function generalResponse(user) {
  const responses = [
    `I'm here to help, ${user.name}! Ask me anything — workouts, nutrition, your progress, what to train today, or just tell me how the session went and I'll log it for you.`,
    `Talk to me! Tell me about your last workout, ask what to train, or check how your macros are looking. I've got you.`,
    `What's on your mind? Whether it's training, food, or progress — I'm your coach 24/7.`,
  ];
  return { text: responses[Math.floor(Math.random() * responses.length)], action: null };
}

// ─── Main chat handler ────────────────────────────────────────────────────────

exports.chat = async (req, res) => {
  const { message } = req.body;
  if (!message?.trim()) return res.status(400).json({ message: 'No message provided' });

  try {
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [req.userId]);
    const user = users[0];

    const [workoutsRaw] = await pool.query(
      `SELECT w.*, GROUP_CONCAT(JSON_OBJECT('name', e.name, 'sets', e.sets, 'reps', e.reps, 'weight_kg', e.weight_kg, 'type', e.type)) as exercises_json
       FROM workouts w LEFT JOIN exercises e ON e.workout_id = w.id
       WHERE w.user_id = ? GROUP BY w.id ORDER BY w.date DESC LIMIT 20`,
      [req.userId]
    );
    for (const w of workoutsRaw) {
      try { w.exercises = w.exercises_json ? JSON.parse(`[${w.exercises_json}]`) : []; } catch { w.exercises = []; }
    }

    const [bodyLogs] = await pool.query(
      'SELECT * FROM body_logs WHERE user_id = ? ORDER BY date DESC LIMIT 10', [req.userId]
    );

    const intent = detectIntent(message);
    const detectedWeight = detectWeight(message);
    const detectedCalories = detectCalories(message);
    const detectedExercises = detectExercises(message);
    const detectedMuscles = detectMuscles(message);

    let response;

    switch (intent) {
      case 'greeting':        response = { text: greetingResponse(user), action: null }; break;
      case 'check_progress':  response = { text: checkProgressResponse(user, workoutsRaw, bodyLogs), action: null }; break;
      case 'workout_done':    response = workoutDoneResponse(user, detectedExercises, detectedMuscles); break;
      case 'weight_mention':  response = weightMentionResponse(user, detectedWeight); break;
      case 'nutrition':       response = nutritionResponse(user, detectedCalories); break;
      case 'nutrition_advice':response = nutritionResponse(user, null); break;
      case 'ask_plan':        response = askPlanResponse(user, workoutsRaw); break;
      case 'motivation':      response = motivationResponse(user); break;
      case 'plateau':         response = plateauResponse(user); break;
      case 'injury':          response = injuryResponse(); break;
      case 'pr_mention':      response = prResponse(user); break;
      case 'recovery':        response = recoveryResponse(user, workoutsRaw); break;
      case 'goal_talk':       response = goalTalkResponse(user); break;
      default:
        if (detectedWeight) response = weightMentionResponse(user, detectedWeight);
        else if (detectedCalories) response = nutritionResponse(user, detectedCalories);
        else if (detectedExercises.length > 0) response = workoutDoneResponse(user, detectedExercises, detectedMuscles);
        else response = generalResponse(user);
    }

    res.json(response);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─── Confirm action (log weight / workout from chat) ─────────────────────────

exports.confirmAction = async (req, res) => {
  const { action, data } = req.body;
  try {
    if (action === 'log_weight') {
      await pool.query(
        'INSERT INTO body_logs (user_id, date, weight_kg) VALUES (?, CURDATE(), ?)',
        [req.userId, data.weight_kg]
      );
      await pool.query('UPDATE users SET weight_kg=? WHERE id=?', [data.weight_kg, req.userId]);
      return res.json({ message: 'Weight logged!' });
    }

    if (action === 'log_workout') {
      const [result] = await pool.query(
        'INSERT INTO workouts (user_id, name, date) VALUES (?, ?, CURDATE())',
        [req.userId, data.name || 'Chat Workout']
      );
      const workoutId = result.insertId;
      for (const ex of (data.exercises || [])) {
        await pool.query(
          'INSERT INTO exercises (workout_id, name, sets, reps, weight_kg, type) VALUES (?, ?, ?, ?, ?, ?)',
          [workoutId, ex.name, ex.sets || 3, ex.reps || null, ex.weight_kg || null, ex.type || 'strength']
        );
      }
      return res.json({ message: 'Workout logged!' });
    }

    res.status(400).json({ message: 'Unknown action' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
