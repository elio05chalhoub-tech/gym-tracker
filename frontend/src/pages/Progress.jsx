import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

import API from '../api.js';

export default function Progress() {
  const { token } = useAuth();
  const [logs, setLogs] = useState([]);
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], weight_kg: '', body_fat_percent: '' });
  const [loading, setLoading] = useState(false);

  const load = () => {
    axios.get(`${API}/ai/body-log`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setLogs(r.data));
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.weight_kg) return;
    setLoading(true);
    try {
      await axios.post(`${API}/ai/body-log`, form, { headers: { Authorization: `Bearer ${token}` } });
      setForm({ ...form, weight_kg: '', body_fat_percent: '' });
      load();
    } finally { setLoading(false); }
  };

  const chartData = logs.map(l => ({
    date: new Date(l.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    weight: l.weight_kg,
    fat: l.body_fat_percent,
  }));

  const latest = logs[logs.length - 1];
  const first = logs[0];
  const diff = latest && first ? (latest.weight_kg - first.weight_kg).toFixed(1) : null;

  return (
    <div className="page">
      <div className="section-title">Body Progress</div>

      {/* Log weight */}
      <div className="card">
        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>Log today's weight</div>
        <div className="row" style={{ marginBottom: 10 }}>
          <div>
            <label className="label">Weight (kg)</label>
            <input className="input" type="number" placeholder="75.5" value={form.weight_kg}
              onChange={e => setForm({ ...form, weight_kg: e.target.value })} />
          </div>
          <div>
            <label className="label">Body fat %</label>
            <input className="input" type="number" placeholder="15" value={form.body_fat_percent}
              onChange={e => setForm({ ...form, body_fat_percent: e.target.value })} />
          </div>
        </div>
        <button className="btn btn-primary" onClick={save} disabled={loading}>
          {loading ? 'Saving...' : 'Log Weight'}
        </button>
      </div>

      {/* Stats */}
      {latest && (
        <div className="stat-row">
          <div className="stat-card">
            <div className="stat-value">{latest.weight_kg} kg</div>
            <div className="stat-label">Current weight</div>
          </div>
          {diff !== null && (
            <div className="stat-card">
              <div className="stat-value" style={{ color: parseFloat(diff) > 0 ? 'var(--accent)' : 'var(--accent2)' }}>
                {parseFloat(diff) > 0 ? '+' : ''}{diff} kg
              </div>
              <div className="stat-label">Total change</div>
            </div>
          )}
        </div>
      )}

      {/* Weight chart */}
      {chartData.length > 1 && (
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Weight Over Time</div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={chartData}>
              <XAxis dataKey="date" tick={{ fill: '#888', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#888', fontSize: 10 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
              <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, color: '#fff', fontSize: 12 }} />
              <Line type="monotone" dataKey="weight" stroke="#a3e635" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Body fat chart */}
      {chartData.some(d => d.fat) && (
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Body Fat %</div>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={chartData}>
              <XAxis dataKey="date" tick={{ fill: '#888', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#888', fontSize: 10 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
              <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, color: '#fff', fontSize: 12 }} />
              <Line type="monotone" dataKey="fat" stroke="#22d3ee" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {logs.length === 0 && (
        <div className="card" style={{ textAlign: 'center', color: 'var(--muted)', padding: 40 }}>
          Log your weight to track progress
        </div>
      )}
    </div>
  );
}
