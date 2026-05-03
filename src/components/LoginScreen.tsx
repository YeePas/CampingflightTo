'use client';

import { useState } from 'react';
import { User } from '@/hooks/useAuth';

interface Props {
  onLogin: (who: User, pin: string) => boolean;
}

const USERS: { id: User; name: string; emoji: string; color: string }[] = [
  { id: 'joep',  name: 'Joep',  emoji: '🧔', color: 'bg-green-600 hover:bg-green-700' },
  { id: 'sanne', name: 'Sanne', emoji: '👩', color: 'bg-rose-500  hover:bg-rose-600'  },
];

export default function LoginScreen({ onLogin }: Props) {
  const [selected, setSelected] = useState<User | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleSelect = (id: User) => {
    setSelected(id);
    setPin('');
    setError(false);
  };

  const handleSubmit = () => {
    if (!selected) return;
    const ok = onLogin(selected, pin);
    if (!ok) {
      setError(true);
      setPin('');
    }
  };

  const user = USERS.find(u => u.id === selected);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{
        backgroundImage:
          "linear-gradient(180deg, rgba(20,40,30,0.6) 0%, rgba(20,40,30,0.92) 100%), url('https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=70')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Logo */}
      <div className="text-center mb-10">
        <div className="text-5xl mb-3">⛺</div>
        <h1 className="text-2xl font-bold text-white tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
          A Campingflight To…
        </h1>
        <p className="text-white/60 text-sm mt-1 italic">Onderweg, paraat, gepakt.</p>
      </div>

      <div className="w-full max-w-sm">
        {!selected ? (
          /* Step 1 — kies wie je bent */
          <div>
            <p className="text-white/80 text-sm text-center mb-4">Wie ben jij?</p>
            <div className="flex gap-3">
              {USERS.map(u => (
                <button
                  key={u.id}
                  onClick={() => handleSelect(u.id)}
                  className={`flex-1 ${u.color} text-white rounded-2xl py-5 flex flex-col items-center gap-2 transition-all active:scale-95 shadow-lg`}
                >
                  <span className="text-4xl">{u.emoji}</span>
                  <span className="font-semibold text-base">{u.name}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Step 2 — PIN invoeren */
          <div>
            <button
              onClick={() => { setSelected(null); setPin(''); setError(false); }}
              className="flex items-center gap-2 text-white/60 hover:text-white/90 text-sm mb-6 transition-colors"
            >
              ← Terug
            </button>

            <div className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-5">
                <span className="text-3xl">{user?.emoji}</span>
                <div>
                  <p className="text-white font-semibold">{user?.name}</p>
                  <p className="text-white/60 text-xs">Voer je PIN in</p>
                </div>
              </div>

              <input
                type="password"
                inputMode="numeric"
                placeholder="PIN"
                value={pin}
                onChange={e => { setPin(e.target.value); setError(false); }}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                autoFocus
                className={`w-full text-center text-2xl tracking-[0.4em] bg-white/10 border rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 transition-all ${
                  error
                    ? 'border-red-400 focus:ring-red-400'
                    : 'border-white/20 focus:ring-white/40'
                }`}
              />

              {error && (
                <p className="text-red-400 text-xs text-center mt-2">Onjuiste PIN, probeer opnieuw</p>
              )}

              <button
                onClick={handleSubmit}
                disabled={pin.length < 1}
                className={`w-full mt-4 py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-40 ${user?.color}`}
              >
                Inloggen
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
