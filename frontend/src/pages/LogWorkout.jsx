import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

import API from '../api.js';

const EXERCISES = {
  Chest: ['Bench Press', 'Incline Press', 'Cable Fly', 'Push Up', 'Chest Fly'],
  Back: ['Pull Up', 'Lat Pulldown', 'Bent Over Row', 'Cable Row', 'Deadlift'],
  Shoulders: ['Shoulder Press', 'Lateral Raise', 'Front Raise', 'Arnold Press'],
  Biceps: ['Barbell Curl', 'Hammer Curl', 'Preacher Curl', 'Cable Curl'],
  Triceps: ['Tricep Pushdown', 'Skull Crusher', 'Dip', 'Overhead Tricep'],
  Legs: ['Squat', 'Leg Press', 'Romanian Deadlift', 'Leg Curl', 'Calf Raise', 'Hip Thrust'],
  Abs: ['Plank', 'Crunch', 'Leg Raise', 'Russian Twist', 'Ab Wheel'],
  Cardio: ['Treadmill', 'Cycling', 'Rowing Machine', 'Jump Rope', 'HIIT'],
};

function newExercise() {
  return { name: '', sets: [{ reps: '', weight_kg: '' }], type: 'strength' };
}

export default function LogWorkout() {
  const { token } = useAuth();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [name, setName] = useState('');
  const [exercises, setExercises] = useState([newExercise()]);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(null);

  const addExercise = () => setExercises([...exercises, newExercise()]);

  const removeExercise = (i) => setExercises(exercises.filter((_, idx) => idx !== i));

  const updateEx = (i, field, val) => {
    const updated = [...exercises];
    updated[i] = { ...updated[i], [field]: val };
    setExercises(updated);
  };

  const addSet = (i) => {
    const updated = [...exercises];
    updated[i].sets = [...updated[i].sets, { reps: '', weight_kg: '' }];
    setExercises(updated);
  };

  const updateSet = (exIdx, setIdx, field, val) => {
    const updated = [...exercises];
    updated[exIdx].sets[setIdx] = { ...updated[exIdx].sets[setIdx], [field]: val };
    setExercises(updated);
  };

  const removeSet = (exIdx, setIdx) => {
    const updated = [...exercises];
    updated[exIdx].sets = updated[exIdx].sets.filter((_, i) => i !== setIdx);
    setExercises(updated);
  };

  const pickExercise = (exIdx, name) => {
    updateEx(exIdx, 'name', name);
    setShowPicker(null);
  };

  const save = async () => {
    setLoading(true);
    try {
      const payload = {
        name, date,
        exercises: exercises.flatMap(ex =>
          ex.sets.map(s => ({
            name: ex.name,
            type: ex.type,
            sets: 1,
            reps: parseInt(s.reps) || null,
            weight_kg: parseFloat(s.weight_kg) || null,
          }))
        ).filter(e => e.name)
      };
      await axios.post(`${API}/workouts`, payload, { headers: { Authorization: `Bearer ${token}` } });
      setSuccess(true);
      setTimeout(() => { setSuccess(false); setExercises([newExercise()]); setName(''); }, 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="section-title">Log Workout</div>

      {success && (
        <div style={{ background: 'rgba(163,230,53,0.1)', border: '1px solid rgba(163,230,53,0.3)', borderRadius: 10, padding: '10px 14px', color: 'var(--accent)', marginBottom: 12, fontSize: 13 }}>
          Workout saved! Great work 💪
        </div>
      )}

      <div className="card">
        <div className="row">
          <div>
            <label className="label">Date</label>
            <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div>
            <label className="label">Workout name</label>
            <input className="input" placeholder="Push Day" value={name} onChange={e => setName(e.target.value)} />
          </div>
        </div>
      </div>

      {exercises.map((ex, i) => (
        <div key={i} className="exercise-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <input
              className="input"
              style={{ flex: 1, marginRight: 8 }}
              placeholder="Exercise name"
              value={ex.name}
              onChange={e => updateEx(i, 'name', e.target.value)}
              onFocus={() => setShowPicker(i)}
            />
            <button onClick={() => removeExercise(i)} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 18 }}>×</button>
          </div>

          {showPicker === i && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 10, marginBottom: 8, maxHeight: 180, overflowY: 'auto' }}>
              {Object.entries(EXERCISES).map(([group, list]) => (
                <div key={group}>
                  <div style={{ fontSize: 10, color: 'var(--accent)', textTransform: 'uppercase', padding: '4px 0', letterSpacing: 1 }}>{group}</div>
                  {list.map(ex => (
                    <div key={ex} onClick={() => pickExercise(i, ex)}
                      style={{ padding: '6px 8px', fontSize: 13, cursor: 'pointer', borderRadius: 6, color: 'var(--text)' }}>
                      {ex}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
            <select className="input" style={{ fontSize: 12, padding: '6px 10px' }} value={ex.type} onChange={e => updateEx(i, 'type', e.target.value)}>
              <option value="strength">Strength</option>
              <option value="cardio">Cardio</option>
            </select>
          </div>

          <div className="set-row" style={{ paddingLeft: 4 }}>
            <span className="set-label">SET</span>
            <span className="set-label">{ex.type === 'cardio' ? 'MINS' : 'REPS'}</span>
            <span className="set-label">{ex.type === 'cardio' ? 'KM' : 'KG'}</span>
            <span />
          </div>

          {ex.sets.map((s, si) => (
            <div key={si} className="set-row">
              <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13, fontWeight: 700 }}>{si + 1}</div>
              <input className="input" style={{ padding: '8px', textAlign: 'center', fontSize: 14 }}
                type="number" placeholder="0" value={s.reps}
                onChange={e => updateSet(i, si, 'reps', e.target.value)} />
              <input className="input" style={{ padding: '8px', textAlign: 'center', fontSize: 14 }}
                type="number" placeholder="0" value={s.weight_kg}
                onChange={e => updateSet(i, si, 'weight_kg', e.target.value)} />
              <button onClick={() => removeSet(i, si)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 16 }}>×</button>
            </div>
          ))}

          <button className="add-btn" onClick={() => addSet(i)}>+ Add Set</button>
        </div>
      ))}

      <button className="add-btn" onClick={addExercise} style={{ marginBottom: 12 }}>+ Add Exercise</button>

      <button className="btn btn-primary" onClick={save} disabled={loading}>
        {loading ? 'Saving...' : 'Save Workout 💾'}
      </button>
    </div>
  );
}
