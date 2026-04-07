import { useState, useEffect } from 'react';
import axios from 'axios';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import LogWorkout from './pages/LogWorkout';
import History from './pages/History';
import TDEE from './pages/TDEE';
import Progress from './pages/Progress';
import Chat from './pages/Chat';
import Meals from './pages/Meals';
import './index.css';

import API from './api.js';

const NAV = [
  { id: 'home',    label: 'Home',    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
  { id: 'log',     label: 'Log',     icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> },
  { id: 'meals',   label: 'Meals',   icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg> },
  { id: 'chat',    label: 'Coach',   icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg> },
  { id: 'more',    label: 'More',    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg> },
];

function MoreMenu({ setTab, logout }) {
  return (
    <div className="page">
      <div className="section-title">More</div>
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {[
          { icon: '📈', label: 'Body Progress', tab: 'progress' },
          { icon: '📊', label: 'TDEE Calculator', tab: 'tdee' },
          { icon: '🕐', label: 'Workout History', tab: 'history' },
        ].map(item => (
          <button key={item.tab} onClick={() => setTab(item.tab)}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', fontSize: 14, borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            {item.label}
            <span style={{ marginLeft: 'auto', color: 'var(--muted)' }}>›</span>
          </button>
        ))}
      </div>
      <button className="btn btn-danger" onClick={logout} style={{ marginTop: 16 }}>Logout</button>
    </div>
  );
}

function AppInner() {
  const { isLoggedIn, logout, token } = useAuth();
  const [tab, setTab] = useState('home');
  const [onboarded, setOnboarded] = useState(null);

  useEffect(() => {
    if (!isLoggedIn) return;
    axios.get(`${API}/user/profile`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setOnboarded(r.data.completed_onboarding))
      .catch(() => setOnboarded(true));
  }, [isLoggedIn, token]);

  const isChat = tab === 'chat';

  const renderPage = () => {
    if (!isLoggedIn) return <AuthPage />;
    if (onboarded === null) return <div className="loading"><div className="spinner" /></div>;
    if (!onboarded) return <Onboarding onComplete={() => setOnboarded(true)} />;
    switch (tab) {
      case 'home':     return <Dashboard />;
      case 'log':      return <LogWorkout />;
      case 'meals':    return <Meals />;
      case 'chat':     return <Chat />;
      case 'progress': return <Progress />;
      case 'tdee':     return <TDEE />;
      case 'history':  return <History />;
      case 'more':     return <MoreMenu setTab={setTab} logout={logout} />;
      default:         return <Dashboard />;
    }
  };

  return (
    <div className="phone-wrapper">
      <div className="phone-label">FitAI — Live Preview</div>
      <div className="phone-frame">
        <div className="phone-screen" style={isChat ? { display: 'flex', flexDirection: 'column', padding: 0 } : {}}>
          {renderPage()}
        </div>
        {isLoggedIn && onboarded && (
          <nav className="bottom-nav">
            {NAV.map(n => (
              <button key={n.id} className={`nav-item ${tab === n.id ? 'active' : ''}`} onClick={() => setTab(n.id)}>
                {n.icon}
                {n.label}
              </button>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
