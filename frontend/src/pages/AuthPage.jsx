import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

import API from '../api.js';

export default function AuthPage() {
  const { login } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async () => {
    setError(''); setLoading(true);
    try {
      const url = mode === 'login' ? `${API}/auth/login` : `${API}/auth/register`;
      const { data } = await axios.post(url, form);
      login(data.token, { id: data.userId, name: data.name });
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-logo">💪 FitAI</div>
      <div className="auth-sub">
        {mode === 'login' ? 'Welcome back! Let\'s get to work.' : 'Start your fitness journey.'}
      </div>

      {error && <div className="error-msg">{error}</div>}

      {mode === 'register' && (
        <div className="form-group">
          <label className="label">Name</label>
          <input className="input" name="name" placeholder="Elio" value={form.name} onChange={handle} />
        </div>
      )}
      <div className="form-group">
        <label className="label">Email</label>
        <input className="input" name="email" type="email" placeholder="you@email.com" value={form.email} onChange={handle} />
      </div>
      <div className="form-group">
        <label className="label">Password</label>
        <input className="input" name="password" type="password" placeholder="••••••••" value={form.password} onChange={handle} />
      </div>

      <button className="btn btn-primary" onClick={submit} disabled={loading} style={{ marginTop: 8 }}>
        {loading ? 'Loading...' : mode === 'login' ? 'Login' : 'Create Account'}
      </button>

      <div className="auth-switch">
        {mode === 'login' ? (
          <>No account? <span onClick={() => setMode('register')}>Sign up</span></>
        ) : (
          <>Already have one? <span onClick={() => setMode('login')}>Login</span></>
        )}
      </div>
    </div>
  );
}
