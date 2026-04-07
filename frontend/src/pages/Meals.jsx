import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

import API from '../api.js';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];
const MEAL_ICONS = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎' };

const QUICK_FOODS = [
  { name: 'Chicken Breast 150g', calories: 248, protein_g: 46, carbs_g: 0, fat_g: 5 },
  { name: 'White Rice 100g', calories: 130, protein_g: 2.7, carbs_g: 28, fat_g: 0.3 },
  { name: 'Eggs x2', calories: 140, protein_g: 12, carbs_g: 1, fat_g: 10 },
  { name: 'Protein Shake', calories: 150, protein_g: 30, carbs_g: 5, fat_g: 2 },
  { name: 'Oats 80g', calories: 300, protein_g: 10, carbs_g: 52, fat_g: 6 },
  { name: 'Banana', calories: 90, protein_g: 1, carbs_g: 23, fat_g: 0 },
  { name: 'Greek Yogurt 200g', calories: 130, protein_g: 17, carbs_g: 8, fat_g: 3 },
  { name: 'Tuna Can 160g', calories: 160, protein_g: 36, carbs_g: 0, fat_g: 1 },
  { name: 'Almonds 30g', calories: 170, protein_g: 6, carbs_g: 6, fat_g: 15 },
  { name: 'Sweet Potato 200g', calories: 172, protein_g: 3, carbs_g: 40, fat_g: 0 },
  { name: 'Bread Slice x2', calories: 160, protein_g: 6, carbs_g: 30, fat_g: 2 },
  { name: 'Avocado Half', calories: 160, protein_g: 2, carbs_g: 9, fat_g: 15 },
];

function MacroBar({ label, value, target, color }) {
  const pct = Math.min((value / (target || 1)) * 100, 100);
  return (
    <div style={{ flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase' }}>{label}</span>
        <span style={{ fontSize: 10, color }}>{Math.round(value)}g</span>
      </div>
      <div style={{ height: 4, background: 'var(--surface2)', borderRadius: 4 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4, transition: 'width 0.5s ease' }} />
      </div>
      <div style={{ fontSize: 9, color: 'var(--muted)', marginTop: 2 }}>/ {target}g</div>
    </div>
  );
}

export default function Meals() {
  const { token } = useAuth();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [data, setData] = useState({ meals: [], totals: {}, targets: null });
  const [showAdd, setShowAdd] = useState(false);
  const [showQuick, setShowQuick] = useState(false);
  const [mealType, setMealType] = useState('breakfast');
  const [form, setForm] = useState({ name: '', calories: '', protein_g: '', carbs_g: '', fat_g: '' });
  const [loading, setLoading] = useState(false);

  const load = () => {
    axios.get(`${API}/meals?date=${date}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setData(r.data))
      .catch(() => {});
  };

  useEffect(() => { load(); }, [date]);

  const addMeal = async (meal) => {
    setLoading(true);
    try {
      await axios.post(`${API}/meals`, { ...meal, meal_type: mealType, date }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      load();
      setShowAdd(false);
      setShowQuick(false);
      setForm({ name: '', calories: '', protein_g: '', carbs_g: '', fat_g: '' });
    } finally { setLoading(false); }
  };

  const deleteMeal = async (id) => {
    await axios.delete(`${API}/meals/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    load();
  };

  const { meals, totals, targets } = data;
  const calPct = targets ? Math.min((totals.calories / targets.target) * 100, 100) : 0;
  const calLeft = targets ? targets.target - (totals.calories || 0) : 0;

  const mealsByType = MEAL_TYPES.reduce((acc, t) => {
    acc[t] = meals.filter(m => m.meal_type === t);
    return acc;
  }, {});

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div className="section-title" style={{ margin: 0 }}>Nutrition</div>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '4px 8px', color: 'var(--text)', fontSize: 12 }} />
      </div>

      {/* Calorie ring / progress */}
      {targets && (
        <div className="card" style={{ background: 'linear-gradient(135deg, #1a2a0a, #0a1a0a)', border: '1px solid rgba(163,230,53,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Circle progress */}
            <div style={{ position: 'relative', width: 80, height: 80, flexShrink: 0 }}>
              <svg width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="40" cy="40" r="32" fill="none" stroke="var(--surface2)" strokeWidth="8" />
                <circle cx="40" cy="40" r="32" fill="none" stroke={calLeft < 0 ? 'var(--red)' : 'var(--accent)'} strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 32}`}
                  strokeDashoffset={`${2 * Math.PI * 32 * (1 - calPct / 100)}`}
                  strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: calLeft < 0 ? 'var(--red)' : 'var(--accent)' }}>{Math.round(calPct)}%</div>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: calLeft < 0 ? 'var(--red)' : 'var(--text)' }}>
                {totals.calories || 0} <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 400 }}>kcal eaten</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>
                Target: {targets.target} kcal · {calLeft >= 0 ? <span style={{ color: 'var(--accent)' }}>{calLeft} left</span> : <span style={{ color: 'var(--red)' }}>{Math.abs(calLeft)} over</span>}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <MacroBar label="Protein" value={totals.protein_g || 0} target={targets.protein} color="var(--red)" />
                <MacroBar label="Carbs" value={totals.carbs_g || 0} target={targets.carbs} color="var(--accent2)" />
                <MacroBar label="Fat" value={totals.fat_g || 0} target={targets.fat} color="var(--yellow)" />
              </div>
            </div>
          </div>
        </div>
      )}

      {!targets && (
        <div className="card" style={{ textAlign: 'center', color: 'var(--muted)', padding: 20 }}>
          Complete your profile in the TDEE tab to see calorie targets
        </div>
      )}

      {/* Add meal buttons */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button className="btn btn-primary" style={{ flex: 2, padding: '10px' }} onClick={() => { setShowAdd(true); setShowQuick(false); }}>
          + Log Meal
        </button>
        <button className="btn btn-secondary" style={{ flex: 1, padding: '10px', fontSize: 12 }} onClick={() => { setShowQuick(true); setShowAdd(false); }}>
          ⚡ Quick Add
        </button>
      </div>

      {/* Quick add food picker */}
      {showQuick && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Quick Add</span>
            <button onClick={() => setShowQuick(false)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}>✕</button>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label className="label">Meal type</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {MEAL_TYPES.map(t => (
                <button key={t} onClick={() => setMealType(t)}
                  style={{ flex: 1, padding: '6px 4px', borderRadius: 8, border: `1px solid ${mealType === t ? 'var(--accent)' : 'var(--border)'}`, background: mealType === t ? 'rgba(163,230,53,0.1)' : 'var(--surface2)', color: mealType === t ? 'var(--accent)' : 'var(--muted)', fontSize: 10, cursor: 'pointer', textTransform: 'capitalize' }}>
                  {MEAL_ICONS[t]} {t}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {QUICK_FOODS.map(f => (
              <button key={f.name} onClick={() => addMeal(f)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, cursor: 'pointer', textAlign: 'left' }}>
                <span style={{ fontSize: 13, color: 'var(--text)' }}>{f.name}</span>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 700 }}>{f.calories} kcal</div>
                  <div style={{ fontSize: 10, color: 'var(--muted)' }}>P{f.protein_g} C{f.carbs_g} F{f.fat_g}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Custom meal form */}
      {showAdd && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Add Meal</span>
            <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}>✕</button>
          </div>

          <div style={{ marginBottom: 10 }}>
            <label className="label">Meal type</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {MEAL_TYPES.map(t => (
                <button key={t} onClick={() => setMealType(t)}
                  style={{ flex: 1, padding: '6px 4px', borderRadius: 8, border: `1px solid ${mealType === t ? 'var(--accent)' : 'var(--border)'}`, background: mealType === t ? 'rgba(163,230,53,0.1)' : 'var(--surface2)', color: mealType === t ? 'var(--accent)' : 'var(--muted)', fontSize: 10, cursor: 'pointer', textTransform: 'capitalize' }}>
                  {MEAL_ICONS[t]} {t}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="label">Food name</label>
            <input className="input" placeholder="e.g. Chicken & Rice" value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>

          <div className="row" style={{ marginBottom: 10 }}>
            <div>
              <label className="label">Calories</label>
              <input className="input" type="number" placeholder="400" value={form.calories}
                onChange={e => setForm({ ...form, calories: e.target.value })} />
            </div>
            <div>
              <label className="label">Protein (g)</label>
              <input className="input" type="number" placeholder="30" value={form.protein_g}
                onChange={e => setForm({ ...form, protein_g: e.target.value })} />
            </div>
          </div>

          <div className="row" style={{ marginBottom: 14 }}>
            <div>
              <label className="label">Carbs (g)</label>
              <input className="input" type="number" placeholder="50" value={form.carbs_g}
                onChange={e => setForm({ ...form, carbs_g: e.target.value })} />
            </div>
            <div>
              <label className="label">Fat (g)</label>
              <input className="input" type="number" placeholder="10" value={form.fat_g}
                onChange={e => setForm({ ...form, fat_g: e.target.value })} />
            </div>
          </div>

          <button className="btn btn-primary" disabled={!form.name || loading} onClick={() => addMeal({
            name: form.name,
            calories: parseInt(form.calories) || 0,
            protein_g: parseFloat(form.protein_g) || 0,
            carbs_g: parseFloat(form.carbs_g) || 0,
            fat_g: parseFloat(form.fat_g) || 0,
          })}>
            {loading ? 'Saving...' : 'Add Meal'}
          </button>
        </div>
      )}

      {/* Meals by type */}
      {MEAL_TYPES.map(type => {
        const typeMeals = mealsByType[type];
        if (!typeMeals?.length) return null;
        const typeTotal = typeMeals.reduce((a, m) => a + (m.calories || 0), 0);
        return (
          <div key={type} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600, textTransform: 'capitalize' }}>{MEAL_ICONS[type]} {type}</span>
              <span style={{ fontSize: 12, color: 'var(--accent)' }}>{typeTotal} kcal</span>
            </div>
            {typeMeals.map(m => (
              <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, marginBottom: 6 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{m.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                    P{Math.round(m.protein_g || 0)}g · C{Math.round(m.carbs_g || 0)}g · F{Math.round(m.fat_g || 0)}g
                  </div>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>{m.calories || 0}</span>
                  <button onClick={() => deleteMeal(m.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 16, padding: '2px 4px' }}>×</button>
                </div>
              </div>
            ))}
          </div>
        );
      })}

      {meals.length === 0 && !showAdd && !showQuick && (
        <div className="card" style={{ textAlign: 'center', color: 'var(--muted)', padding: 30 }}>
          No meals logged today. Tap "Log Meal" to start tracking!
        </div>
      )}
    </div>
  );
}
