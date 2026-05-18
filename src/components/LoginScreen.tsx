'use client';

import { useState } from 'react';
import LogoMark from './LogoMark';

interface Props {
  onJoin: (inviteCode: string, memberName: string) => Promise<boolean>;
  onCreate: (groupName: string, memberName: string) => Promise<{ inviteCode: string }>;
}

type Mode = 'pick' | 'join' | 'create' | 'created';

export default function LoginScreen({ onJoin, onCreate }: Props) {
  const [mode, setMode] = useState<Mode>('pick');
  const [inviteCode, setInviteCode] = useState('');
  const [groupName, setGroupName] = useState('');
  const [memberName, setMemberName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [createdCode, setCreatedCode] = useState('');

  const handleJoin = async () => {
    setError(null);
    if (!inviteCode.trim() || !memberName.trim()) {
      setError('Vul beide velden in');
      return;
    }
    setBusy(true);
    try {
      const ok = await onJoin(inviteCode, memberName);
      if (!ok) setError('Code niet gevonden. Check de code en probeer opnieuw.');
    } catch (err) {
      console.error('joinGroup failed:', err);
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('permission') || msg.includes('insufficient')) {
        setError('Database-toegang geweigerd. Firestore Security Rules moeten geüpdatet worden.');
      } else {
        setError(`Er ging iets mis: ${msg}`);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleCreate = async () => {
    setError(null);
    if (!groupName.trim() || !memberName.trim()) {
      setError('Vul beide velden in');
      return;
    }
    setBusy(true);
    try {
      const g = await onCreate(groupName, memberName);
      setCreatedCode(g.inviteCode);
      setMode('created');
    } catch (err) {
      console.error('createGroup failed:', err);
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('permission') || msg.includes('insufficient')) {
        setError('Database-toegang geweigerd. Firestore Security Rules moeten geüpdatet worden.');
      } else {
        setError(`Er ging iets mis: ${msg}`);
      }
    } finally {
      setBusy(false);
    }
  };

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
      <div className="text-center mb-10">
        <LogoMark className="w-20 h-20 rounded-2xl shadow-lg mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
          A Campingflight To…
        </h1>
        <p className="text-white/60 text-sm mt-1 italic">Onderweg, paraat, gepakt.</p>
      </div>

      <div className="w-full max-w-sm">
        {mode === 'pick' && (
          <div className="space-y-3">
            <button
              onClick={() => { setMode('join'); setError(null); }}
              className="w-full bg-white/15 hover:bg-white/25 backdrop-blur text-white rounded-2xl py-4 px-5 text-left transition-all border border-white/20"
            >
              <div className="font-semibold">Inloggen met code</div>
              <div className="text-xs text-white/70 mt-0.5">Iemand heeft je een code gegeven</div>
            </button>
            <button
              onClick={() => { setMode('create'); setError(null); }}
              className="w-full bg-green-600 hover:bg-green-700 text-white rounded-2xl py-4 px-5 text-left transition-all shadow-lg"
            >
              <div className="font-semibold">Nieuwe groep starten</div>
              <div className="text-xs text-white/90 mt-0.5">Voor jou + partner / vrienden / gezin</div>
            </button>
          </div>
        )}

        {mode === 'join' && (
          <div>
            <button
              onClick={() => { setMode('pick'); setError(null); }}
              className="flex items-center gap-2 text-white/60 hover:text-white/90 text-sm mb-6 transition-colors"
            >
              ← Terug
            </button>
            <div className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/20 space-y-4">
              <div>
                <label className="block text-white/80 text-xs mb-1.5">Invite-code</label>
                <input
                  type="text"
                  placeholder="BERG-2745"
                  value={inviteCode}
                  onChange={e => { setInviteCode(e.target.value.toUpperCase()); setError(null); }}
                  autoFocus
                  className="w-full text-center text-xl tracking-[0.2em] bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white/40 uppercase"
                />
              </div>
              <div>
                <label className="block text-white/80 text-xs mb-1.5">Jouw naam</label>
                <input
                  type="text"
                  placeholder="Bijv. Joep"
                  value={memberName}
                  onChange={e => { setMemberName(e.target.value); setError(null); }}
                  onKeyDown={e => e.key === 'Enter' && handleJoin()}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white/40"
                />
              </div>
              {error && <p className="text-red-300 text-xs">{error}</p>}
              <button
                onClick={handleJoin}
                disabled={busy}
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-3 rounded-xl font-semibold transition-all"
              >
                {busy ? 'Bezig…' : 'Inloggen'}
              </button>
            </div>
          </div>
        )}

        {mode === 'create' && (
          <div>
            <button
              onClick={() => { setMode('pick'); setError(null); }}
              className="flex items-center gap-2 text-white/60 hover:text-white/90 text-sm mb-6 transition-colors"
            >
              ← Terug
            </button>
            <div className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/20 space-y-4">
              <div>
                <label className="block text-white/80 text-xs mb-1.5">Groepsnaam</label>
                <input
                  type="text"
                  placeholder="Bijv. Joep & Sanne"
                  value={groupName}
                  onChange={e => { setGroupName(e.target.value); setError(null); }}
                  autoFocus
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white/40"
                />
              </div>
              <div>
                <label className="block text-white/80 text-xs mb-1.5">Jouw naam</label>
                <input
                  type="text"
                  placeholder="Bijv. Joep"
                  value={memberName}
                  onChange={e => { setMemberName(e.target.value); setError(null); }}
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white/40"
                />
              </div>
              {error && <p className="text-red-300 text-xs">{error}</p>}
              <button
                onClick={handleCreate}
                disabled={busy}
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-3 rounded-xl font-semibold transition-all"
              >
                {busy ? 'Bezig…' : 'Groep aanmaken'}
              </button>
            </div>
          </div>
        )}

        {mode === 'created' && (
          <div className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/20 text-center">
            <div className="text-4xl mb-3">⛺</div>
            <p className="text-white font-semibold mb-1">Groep aangemaakt!</p>
            <p className="text-white/70 text-sm mb-5">Deel deze code met je partner of vrienden:</p>
            <div className="bg-white/15 rounded-xl py-4 px-3 mb-4">
              <div className="text-2xl tracking-[0.25em] font-bold text-white font-mono">{createdCode}</div>
            </div>
            <button
              onClick={() => navigator.clipboard?.writeText(createdCode)}
              className="text-xs text-white/70 hover:text-white underline"
            >
              Kopieer code
            </button>
            <p className="text-white/50 text-[10px] mt-4">
              Je kunt deze code later altijd terugvinden onder je naam rechtsboven.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
