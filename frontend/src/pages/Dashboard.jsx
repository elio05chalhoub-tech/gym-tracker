import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

import API from '../api.js';

const MUSCLE_ICONS = {
  chest: '🫁', back: '🔙', shoulders: '🦾', biceps: '💪',
  triceps: '🦵', legs: '🦿', abs: '⚡', cardio: '🏃'
};

function renderText(text) {
  return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}

export default function Dashboard() {
  const { token, user } = useAuth();
  const [coach, setCoach] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.post(`${API}/ai/coach`, {}, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setCoach(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const muscleStatus = (muscle) => {
    if (!coach) return '';
    const s = coach.suggestions?.join(' ') || '';
    if (s.includes(muscle) && s.includes('recovering')) return 'recovering';
    if (coach.summary?.muscleGroupsThisWeek) {
      const warned = coach.warnings?.some(w => w.includes(muscle) && w.includes("haven't trained"));
      if (!warned && coach.suggestions?.some(s => s.includes(muscle) && s.includes('Ready'))) return 'trained';
    }
    return '';
  };

  return (
    <div className="page">
      <div className="greeting">Hey, {user?.name?.split(' ')[0]} 👋</div>
      <div className="greeting-sub">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>

      {loading && <div className="loading"><div className="spinner" /> Loading coach data...</div>}

      {coach && (
        <>
          {/* Stats */}
          <div className="stat-row">
            <div className="stat-card">
              <div className="stat-value">{coach.summary?.workoutsThisWeek ?? 0}</div>
              <div className="stat-label">Workouts this week</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{coach.summary?.muscleGroupsThisWeek ?? '0/8'}</div>
              <div className="stat-label">Muscles covered</div>
            </div>
          </div>

          <div className="stat-row">
            <div className="stat-card" style={{ borderColor: 'rgba(163,230,53,0.3)' }}>
              <div className="stat-value" style={{ fontSize: 14 }}>{coach.summary?.cycleStatus}</div>
              <div className="stat-label">Cycle status</div>
            </div>
          </div>

          {/* AI Coach card */}
          <div className="coach-card">
            <div className="coach-header">
              <div className="coach-avatar">🤖</div>
              <div>
                <div className="coach-name">FitAI Coach</div>
                <div className="coach-role">Your personal trainer</div>
              </div>
            </div>
            <div className="coach-message" dangerouslySetInnerHTML={{ __html: renderText(coach.greeting) }} />
            {coach.calories && (
              <div className="coach-message" style={{ marginTop: 8 }} dangerouslySetInnerHTML={{ __html: renderText(coach.calories) }} />
            )}
            {coach.insights?.map((i, idx) => (
              <div key={idx} className="coach-message" style={{ marginTop: 8 }} dangerouslySetInnerHTML={{ __html: renderText(i) }} />
            ))}
            {coach.warnings?.map((w, idx) => (
              <div key={idx} className="coach-warning" dangerouslySetInnerHTML={{ __html: renderText(w) }} />
            ))}
            {coach.suggestions?.map((s, idx) => (
              <div key={idx} className="coach-suggestion" dangerouslySetInnerHTML={{ __html: renderText(s) }} />
            ))}
          </div>

          {/* Muscle tracker */}
          <div className="section-title" style={{ fontSize: 14, marginBottom: 10 }}>Muscle Group Tracker</div>
          <div className="muscle-grid">
            {Object.entries(MUSCLE_ICONS).map(([muscle, icon]) => (
              <div key={muscle} className={`muscle-chip ${muscleStatus(muscle)}`}>
                <span className="muscle-chip-icon">{icon}</span>
                {muscle}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
