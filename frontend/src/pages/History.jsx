import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

import API from '../api.js';

export default function History() {
  const { token } = useAuth();
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    axios.get(`${API}/workouts`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setWorkouts(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const del = async (id) => {
    await axios.delete(`${API}/workouts/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    setWorkouts(w => w.filter(x => x.id !== id));
  };

  if (loading) return <div className="loading"><div className="spinner" /> Loading...</div>;

  return (
    <div className="page">
      <div className="section-title">Workout History</div>
      {workouts.length === 0 && (
        <div className="card" style={{ textAlign: 'center', color: 'var(--muted)', padding: 40 }}>
          No workouts yet. Log your first one!
        </div>
      )}
      {workouts.map(w => {
        const exList = Array.isArray(w.exercises) ? w.exercises : [];
        const unique = [...new Set(exList.map(e => e.name).filter(Boolean))];
        return (
          <div key={w.id} className="workout-history-card">
            <div className="workout-date">{new Date(w.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
            <div className="workout-name">{w.name || 'Workout'}</div>
            <div>{unique.map(n => <span key={n} className="exercise-pill">{n}</span>)}</div>
            <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>{exList.length} sets logged</span>
              <button className="btn btn-danger" style={{ width: 'auto', padding: '6px 14px', fontSize: 12 }} onClick={() => del(w.id)}>Delete</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
