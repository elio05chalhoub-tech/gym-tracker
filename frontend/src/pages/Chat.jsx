import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

import API from '../api.js';

function renderText(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--accent)">$1</strong>')
    .replace(/\n/g, '<br/>');
}

const QUICK_PROMPTS = [
  "What should I train today?",
  "How am I doing this week?",
  "What are my calorie targets?",
  "I need motivation",
  "I feel like skipping today",
  "Give me a chest workout",
];

export default function Chat() {
  const { token, user } = useAuth();
  const [messages, setMessages] = useState([
    {
      role: 'coach',
      text: `Hey ${user?.name?.split(' ')[0]}! 💪 I'm your FitAI coach. Tell me about your workout, ask for a plan, share your weight — I'll handle the rest. What's up?`,
      time: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const bottomRef = useRef();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    if (!text?.trim()) return;
    const userMsg = { role: 'user', text, time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const { data } = await axios.post(`${API}/user/chat`, { message: text }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const coachMsg = { role: 'coach', text: data.text, time: new Date() };
      setMessages(prev => [...prev, coachMsg]);

      // If coach detected an action, show confirm buttons
      if (data.action) {
        setPendingAction({
          type: data.action,
          weight: data.weight,
          exercises: data.exercises,
          muscles: data.muscles,
        });
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'coach',
        text: "Sorry, I had a hiccup. Try again!",
        time: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const confirmAction = async (confirmed) => {
    if (!confirmed || !pendingAction) {
      setPendingAction(null);
      setMessages(prev => [...prev, { role: 'coach', text: "No problem, just let me know if you need anything!", time: new Date() }]);
      return;
    }

    try {
      if (pendingAction.type === 'log_weight_confirm') {
        await axios.post(`${API}/user/chat/confirm`, {
          action: 'log_weight',
          data: { weight_kg: pendingAction.weight },
        }, { headers: { Authorization: `Bearer ${token}` } });
        setMessages(prev => [...prev, { role: 'coach', text: `✅ **${pendingAction.weight} kg** logged to your progress tracker!`, time: new Date() }]);
      }

      if (pendingAction.type === 'log_workout_confirm') {
        const exercises = (pendingAction.exercises || pendingAction.muscles || []).map(name => ({
          name: typeof name === 'string' ? name : name,
          type: 'strength',
        }));
        await axios.post(`${API}/user/chat/confirm`, {
          action: 'log_workout',
          data: { name: 'Chat Workout', exercises },
        }, { headers: { Authorization: `Bearer ${token}` } });
        setMessages(prev => [...prev, { role: 'coach', text: `✅ Workout logged! Keep up the consistency 🔥`, time: new Date() }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'coach', text: "Couldn't log that. Try using the Log tab instead.", time: new Date() }]);
    } finally {
      setPendingAction(null);
    }
  };

  const formatTime = (d) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface)' }}>
        <div style={{ width: 38, height: 38, background: 'var(--accent)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🤖</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>FitAI Coach</div>
          <div style={{ fontSize: 11, color: 'var(--accent)' }}>● Online</div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '82%',
              padding: '10px 14px',
              borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              background: msg.role === 'user' ? 'var(--accent)' : 'var(--surface)',
              color: msg.role === 'user' ? '#000' : 'var(--text)',
              fontSize: 13,
              lineHeight: 1.6,
              border: msg.role === 'coach' ? '1px solid var(--border)' : 'none',
            }}>
              <div dangerouslySetInnerHTML={{ __html: renderText(msg.text) }} />
              <div style={{ fontSize: 10, color: msg.role === 'user' ? 'rgba(0,0,0,0.5)' : 'var(--muted)', marginTop: 4, textAlign: 'right' }}>
                {formatTime(msg.time)}
              </div>
            </div>
          </div>
        ))}

        {/* Pending action confirm */}
        {pendingAction && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ background: 'var(--surface)', border: '1px solid rgba(163,230,53,0.3)', borderRadius: 12, padding: '12px 14px', maxWidth: '82%' }}>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>Log this data?</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => confirmAction(true)}
                  style={{ flex: 1, padding: '8px', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  ✅ Yes, log it
                </button>
                <button onClick={() => confirmAction(false)}
                  style={{ flex: 1, padding: '8px', background: 'var(--surface2)', color: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>
                  Skip
                </button>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px 18px 18px 4px', padding: '12px 16px' }}>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: 6, height: 6, background: 'var(--muted)', borderRadius: '50%', animation: `bounce 1s ${i * 0.2}s infinite` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      <div style={{ padding: '8px 12px', overflowX: 'auto', display: 'flex', gap: 6, whiteSpace: 'nowrap', borderTop: '1px solid var(--border)' }}>
        {QUICK_PROMPTS.map(p => (
          <button key={p} onClick={() => sendMessage(p)}
            style={{ padding: '6px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, color: 'var(--muted)', fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
            {p}
          </button>
        ))}
      </div>

      {/* Input */}
      <div style={{ padding: '8px 12px 12px', display: 'flex', gap: 8, background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
        <input
          className="input"
          style={{ flex: 1, borderRadius: 24, padding: '10px 16px', fontSize: 13 }}
          placeholder="Message your coach..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
          disabled={loading}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || loading}
          style={{ width: 40, height: 40, borderRadius: '50%', background: input.trim() ? 'var(--accent)' : 'var(--surface2)', border: 'none', cursor: input.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0, transition: 'background 0.2s' }}>
          ➤
        </button>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
