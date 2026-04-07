import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

import API from '../api.js';

const STEPS = [
  {
    id: 'age',
    question: "First things first — how old are you?",
    emoji: '🎂',
    type: 'number',
    placeholder: '20',
    field: 'age',
    unit: 'years old',
  },
  {
    id: 'gender',
    question: "What's your biological sex?",
    emoji: '⚡',
    type: 'choice',
    field: 'gender',
    choices: [
      { label: '♂️ Male', value: 'male' },
      { label: '♀️ Female', value: 'female' },
    ],
  },
  {
    id: 'height',
    question: "How tall are you?",
    emoji: '📏',
    type: 'number',
    placeholder: '178',
    field: 'height_cm',
    unit: 'cm',
  },
  {
    id: 'weight',
    question: "What's your current weight?",
    emoji: '⚖️',
    type: 'number',
    placeholder: '75',
    field: 'weight_kg',
    unit: 'kg',
  },
  {
    id: 'goal',
    question: "What's your main goal right now?",
    emoji: '🎯',
    type: 'choice',
    field: 'goal',
    choices: [
      { label: '💪 Build Muscle', value: 'bulk', sub: 'Eat in a surplus, lift heavy' },
      { label: '🔥 Lose Fat', value: 'cut', sub: 'Calorie deficit, keep muscle' },
      { label: '⚖️ Stay the Same', value: 'maintain', sub: 'Recomp, stay consistent' },
    ],
  },
  {
    id: 'training_days',
    question: "How many days per week do you train?",
    emoji: '📅',
    type: 'choice',
    field: 'training_days',
    choices: [
      { label: '3 days', value: 3 },
      { label: '4 days', value: 4 },
      { label: '5 days', value: 5 },
      { label: '6 days', value: 6 },
    ],
  },
  {
    id: 'split',
    question: "What's your training split?",
    emoji: '🗓️',
    type: 'choice',
    field: 'split_type',
    choices: [
      { label: 'Push / Pull / Legs', value: 'PPL', sub: 'Most popular split' },
      { label: 'Upper / Lower', value: 'UL', sub: 'Great for 4 days/week' },
      { label: 'Bro Split', value: 'bro', sub: 'One muscle per day' },
      { label: 'Full Body', value: 'fullbody', sub: 'Best for 3 days/week' },
      { label: 'Custom', value: 'custom', sub: 'I do my own thing' },
    ],
  },
  {
    id: 'activity',
    question: "Outside the gym, how active are you?",
    emoji: '🚶',
    type: 'choice',
    field: 'activity_level',
    choices: [
      { label: '🛋️ Desk job, mostly sitting', value: 'sedentary' },
      { label: '🚶 Light movement daily', value: 'light' },
      { label: '🚴 Moderately active', value: 'moderate' },
      { label: '🏃 Very active job/sport', value: 'very_active' },
      { label: '⚡ Athlete level', value: 'extra_active' },
    ],
  },
];

export default function Onboarding({ onComplete }) {
  const { token, user } = useAuth();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [inputVal, setInputVal] = useState('');

  const current = STEPS[step];
  const progress = ((step) / STEPS.length) * 100;

  const next = (value) => {
    const newAnswers = { ...answers, [current.field]: value };
    setAnswers(newAnswers);
    setInputVal('');

    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      finish(newAnswers);
    }
  };

  const finish = async (data) => {
    setLoading(true);
    try {
      await axios.post(`${API}/user/onboarding`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onComplete();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '40px 24px', minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Progress bar */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>Step {step + 1} of {STEPS.length}</span>
          <span style={{ fontSize: 12, color: 'var(--accent)' }}>{Math.round(progress)}%</span>
        </div>
        <div style={{ height: 4, background: 'var(--surface2)', borderRadius: 4 }}>
          <div style={{ height: '100%', width: `${progress}%`, background: 'var(--accent)', borderRadius: 4, transition: 'width 0.4s ease' }} />
        </div>
      </div>

      {/* Greeting on first step */}
      {step === 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
            Hey {user?.name?.split(' ')[0]}! 👋
          </div>
          <div style={{ color: 'var(--muted)', fontSize: 14 }}>
            Let me learn about you so I can coach you properly. Takes 30 seconds.
          </div>
        </div>
      )}

      {/* Question */}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>{current.emoji}</div>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, lineHeight: 1.3 }}>
          {current.question}
        </div>

        {current.type === 'number' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                style={{ fontSize: 32, fontWeight: 800, textAlign: 'center', padding: '20px', color: 'var(--accent)' }}
                type="number"
                placeholder={current.placeholder}
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && inputVal && next(parseFloat(inputVal))}
                autoFocus
              />
              {current.unit && (
                <div style={{ textAlign: 'center', color: 'var(--muted)', marginTop: 6, fontSize: 13 }}>
                  {current.unit}
                </div>
              )}
            </div>
            <button
              className="btn btn-primary"
              style={{ marginTop: 8 }}
              disabled={!inputVal}
              onClick={() => next(parseFloat(inputVal))}
            >
              Continue →
            </button>
          </div>
        )}

        {current.type === 'choice' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {current.choices.map(c => (
              <button
                key={c.value}
                onClick={() => next(c.value)}
                style={{
                  padding: '14px 16px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  color: 'var(--text)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  transition: 'border-color 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                {c.label}
                {c.sub && <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 400 }}>{c.sub}</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {step > 0 && (
        <button
          onClick={() => setStep(step - 1)}
          style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 13, cursor: 'pointer', marginTop: 20 }}
        >
          ← Back
        </button>
      )}

      {loading && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
          <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
          <div style={{ color: 'var(--accent)', fontWeight: 600 }}>Setting up your profile...</div>
        </div>
      )}
    </div>
  );
}
