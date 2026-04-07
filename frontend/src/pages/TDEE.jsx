import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

import API from '../api.js';

export default function TDEE() {
  const { token } = useAuth();
  const [form, setForm] = useState({ age: '', gender: 'male', height_cm: '', weight_kg: '', activity_level: 'moderate', goal: 'bulk' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const h = e => setForm({ ...form, [e.target.name]: e.target.value });

  const calc = async () => {
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/tdee/calculate`, form, { headers: { Authorization: `Bearer ${token}` } });
      setResult(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const goalColor = { cut: 'var(--accent2)', bulk: 'var(--accent)', maintain: 'var(--yellow)' };

  return (
    <div className="page">
      <div className="section-title">TDEE Calculator</div>

      <div className="card">
        <div className="row" style={{ marginBottom: 12 }}>
          <div>
            <label className="label">Age</label>
            <input className="input" name="age" type="number" placeholder="20" value={form.age} onChange={h} />
          </div>
          <div>
            <label className="label">Gender</label>
            <select className="input" name="gender" value={form.gender} onChange={h}>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </div>
        <div className="row" style={{ marginBottom: 12 }}>
          <div>
            <label className="label">Height (cm)</label>
            <input className="input" name="height_cm" type="number" placeholder="178" value={form.height_cm} onChange={h} />
          </div>
          <div>
            <label className="label">Weight (kg)</label>
            <input className="input" name="weight_kg" type="number" placeholder="75" value={form.weight_kg} onChange={h} />
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label className="label">Activity Level</label>
          <select className="input" name="activity_level" value={form.activity_level} onChange={h}>
            <option value="sedentary">Sedentary (no exercise)</option>
            <option value="light">Light (1-3x/week)</option>
            <option value="moderate">Moderate (3-5x/week)</option>
            <option value="very_active">Very Active (6-7x/week)</option>
            <option value="extra_active">Extra Active (athlete)</option>
          </select>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label className="label">Goal</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {['cut', 'maintain', 'bulk'].map(g => (
              <button key={g} onClick={() => setForm({ ...form, goal: g })}
                style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: `1px solid ${form.goal === g ? goalColor[g] : 'var(--border)'}`, background: form.goal === g ? `${goalColor[g]}20` : 'var(--surface2)', color: form.goal === g ? goalColor[g] : 'var(--muted)', fontWeight: 600, fontSize: 13, cursor: 'pointer', textTransform: 'capitalize' }}>
                {g === 'cut' ? '🔥 Cut' : g === 'bulk' ? '💪 Bulk' : '⚖️ Maintain'}
              </button>
            ))}
          </div>
        </div>
        <button className="btn btn-primary" onClick={calc} disabled={loading}>
          {loading ? 'Calculating...' : 'Calculate'}
        </button>
      </div>

      {result && (
        <>
          <div className="tdee-result">
            <div className="tdee-label">Daily Target Calories</div>
            <div className="tdee-number">{result.targetCalories}</div>
            <div className="tdee-label">kcal / day</div>
            <div style={{ marginTop: 10, display: 'flex', gap: 16, justifyContent: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>BMR: <strong style={{ color: 'var(--text)' }}>{result.bmr}</strong></span>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>TDEE: <strong style={{ color: 'var(--text)' }}>{result.tdee}</strong></span>
            </div>
            <div className="macro-row">
              <div className="macro-card">
                <div className="macro-value" style={{ color: 'var(--red)' }}>{result.macros.protein}g</div>
                <div className="macro-label">Protein</div>
              </div>
              <div className="macro-card">
                <div className="macro-value" style={{ color: 'var(--accent2)' }}>{result.macros.carbs}g</div>
                <div className="macro-label">Carbs</div>
              </div>
              <div className="macro-card">
                <div className="macro-value" style={{ color: 'var(--yellow)' }}>{result.macros.fat}g</div>
                <div className="macro-label">Fat</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7 }}>
              {form.goal === 'bulk' && <>🎯 <strong style={{ color: 'var(--accent)' }}>Bulking surplus of +{result.targetCalories - result.tdee} kcal.</strong> Aim to gain 0.3–0.5 kg/week. If gaining faster, reduce by 150 kcal.</>}
              {form.goal === 'cut' && <>🎯 <strong style={{ color: 'var(--accent2)' }}>Cutting deficit of {result.tdee - result.targetCalories} kcal.</strong> Aim to lose 0.5–1 kg/week. Keep protein high to preserve muscle.</>}
              {form.goal === 'maintain' && <>⚖️ <strong style={{ color: 'var(--yellow)' }}>Maintenance calories.</strong> Stay within ±100 kcal of this target.</>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
