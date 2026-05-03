'use client';

import { useState } from 'react';
import { TripPreset, CampingLocation, TripConfig } from '@/lib/types';
import SwipeableRow from './SwipeableRow';
import { PencilIcon } from './Icons';

interface Props {
  presets: TripPreset[];
  setPresets: (p: TripPreset[]) => void;
  locations: CampingLocation[];
  setLocations: (l: CampingLocation[]) => void;
  currentConfig: TripConfig;
  applyConfig: (c: TripConfig) => void;
}

type SubTab = 'presets' | 'plekken';

const SUB_TABS: { id: SubTab; label: string; emoji: string }[] = [
  { id: 'presets', label: 'Presets', emoji: '🌟' },
  { id: 'plekken', label: 'Plekken', emoji: '📍' },
];

const TRIP_EMOJI: Record<TripConfig['type'], string> = {
  dag: '☀️',
  weekend: '⛺',
  week: '🗓️',
};

const TRIP_NAME: Record<TripConfig['type'], string> = {
  dag: 'Dag',
  weekend: 'Dag+',
  week: 'Week+',
};

const tripLabel = (c: TripConfig) => {
  const t = TRIP_NAME[c.type];
  const extras = [c.mountains && '⛰️', c.kids && '👧'].filter(Boolean).join(' ');
  return extras ? `${t} ${extras}` : t;
};

const sameConfig = (a: TripConfig, b: TripConfig) =>
  a.type === b.type && a.mountains === b.mountains && a.kids === b.kids;

export default function TripsView(props: Props) {
  const [sub, setSub] = useState<SubTab>('presets');

  return (
    <div>
      <div className="flex gap-1 bg-white rounded-2xl border border-stone-200 p-1 mb-4">
        {SUB_TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setSub(t.id)}
            className={`flex-1 py-1.5 rounded-xl text-xs font-medium transition-all ${
              sub === t.id ? 'bg-green-600 text-white' : 'text-stone-500'
            }`}
          >
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {sub === 'presets' && <PresetsList {...props} />}
      {sub === 'plekken' && <LocationsList {...props} />}
    </div>
  );
}

function PresetsList({ presets, setPresets, currentConfig, applyConfig }: Props) {
  const [name, setName] = useState('');

  const save = () => {
    if (!name.trim()) return;
    setPresets([...presets, { id: `p_${Date.now()}`, name: name.trim(), config: currentConfig }]);
    setName('');
  };
  const remove = (id: string) => setPresets(presets.filter(p => p.id !== id));

  return (
    <div>
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 mb-4">
        <p className="text-xs text-amber-900 leading-relaxed">
          <strong>Presets</strong> zijn vaste trip-recepten. Stel je trip in (bv. <em>Week + Bergen + Kinderen</em>),
          bewaar onder een naam, en activeer hem later met één tap zodat je paklijst meteen klopt.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-3 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-stone-500">Huidige trip:</span>
          <span className="text-xs font-medium text-stone-700 bg-stone-100 px-2 py-0.5 rounded-full">
            {tripLabel(currentConfig)}
          </span>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Naam (bv. Bergen weekend met kids)"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && save()}
            className="flex-1 min-w-0 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          <button
            onClick={save}
            disabled={!name.trim()}
            className="flex-shrink-0 bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-40"
          >
            Bewaar
          </button>
        </div>
      </div>

      {presets.length === 0 ? (
        <div className="text-center py-8 text-stone-400 text-sm">Nog geen presets.</div>
      ) : (
        <div className="space-y-2">
          {presets.map(p => {
            const isActive = sameConfig(p.config, currentConfig);
            return (
              <SwipeableRow
                key={p.id}
                onDelete={() => remove(p.id)}
                className={`rounded-xl border ${isActive ? 'border-green-400 bg-green-50' : 'border-stone-200 bg-white'}`}
              >
                <div className={`rounded-xl px-4 py-3 flex items-center gap-3 ${isActive ? 'bg-green-50' : 'bg-white'}`}>
                  <span className="text-lg">{TRIP_EMOJI[p.config.type]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-stone-700 truncate">{p.name}</span>
                      {isActive && <span className="text-[10px] bg-green-600 text-white px-1.5 py-0.5 rounded-full font-medium">Actief</span>}
                    </div>
                    <div className="text-xs text-stone-400 flex items-center gap-1">
                      <span>{TRIP_NAME[p.config.type]}</span>
                      {p.config.mountains && <span>· ⛰️</span>}
                      {p.config.kids && <span>· 👧</span>}
                    </div>
                  </div>
                  {!isActive && (
                    <button
                      onClick={() => applyConfig(p.config)}
                      className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-full font-medium hover:bg-green-700 flex-shrink-0"
                    >
                      Activeer
                    </button>
                  )}
                </div>
              </SwipeableRow>
            );
          })}
        </div>
      )}
    </div>
  );
}

const EMPTY_LOC = { name: '', address: '', gateCode: '', wifi: '', contact: '', notes: '' };

function LocationsList({ locations, setLocations }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CampingLocation | null>(null);
  const [form, setForm] = useState(EMPTY_LOC);
  const [expanded, setExpanded] = useState<string | null>(null);

  const submit = () => {
    if (!form.name.trim()) return;
    const data = {
      name: form.name.trim(),
      address: form.address || undefined,
      gateCode: form.gateCode || undefined,
      wifi: form.wifi || undefined,
      contact: form.contact || undefined,
      notes: form.notes || undefined,
    };
    if (editing) {
      setLocations(locations.map(l => l.id === editing.id ? { ...editing, ...data } : l));
    } else {
      setLocations([...locations, { id: `l_${Date.now()}`, ...data }]);
    }
    setForm(EMPTY_LOC);
    setShowForm(false);
    setEditing(null);
  };

  const startEdit = (l: CampingLocation) => {
    setEditing(l);
    setForm({
      name: l.name, address: l.address ?? '', gateCode: l.gateCode ?? '',
      wifi: l.wifi ?? '', contact: l.contact ?? '', notes: l.notes ?? '',
    });
    setShowForm(true);
  };

  const remove = (id: string) => setLocations(locations.filter(l => l.id !== id));

  return (
    <div>
      {!showForm ? (
        <button
          onClick={() => { setShowForm(true); setEditing(null); setForm(EMPTY_LOC); }}
          className="w-full py-3 mb-4 rounded-2xl bg-green-600 text-white font-medium hover:bg-green-700"
        >
          + Camping toevoegen
        </button>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-4 space-y-2 mb-4">
          <h3 className="font-semibold text-stone-700 mb-1">{editing ? 'Camping bewerken' : 'Nieuwe camping'}</h3>
          {[
            { k: 'name', p: 'Naam (verplicht)' },
            { k: 'address', p: 'Adres' },
            { k: 'gateCode', p: 'Code poort/slagboom' },
            { k: 'wifi', p: 'WiFi (naam + ww)' },
            { k: 'contact', p: 'Contact / telefoon' },
          ].map(({ k, p }) => (
            <input
              key={k}
              type="text"
              placeholder={p}
              value={(form as Record<string, string>)[k]}
              onChange={e => setForm(prev => ({ ...prev, [k]: e.target.value }))}
              className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          ))}
          <textarea
            placeholder="Notities (route, tips, sanitair...)"
            value={form.notes}
            onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
            rows={3}
            className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
          />
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 bg-green-600 text-white py-2 rounded-xl text-sm font-medium hover:bg-green-700">
              {editing ? 'Opslaan' : 'Toevoegen'}
            </button>
            <button onClick={() => { setShowForm(false); setEditing(null); }} className="flex-1 bg-stone-100 text-stone-600 py-2 rounded-xl text-sm font-medium">
              Annuleren
            </button>
          </div>
        </div>
      )}

      {locations.length === 0 && !showForm && (
        <div className="text-center py-8 text-stone-400 text-sm">Nog geen plekken bewaard.</div>
      )}

      <div className="space-y-2">
        {locations.map(l => {
          const isOpen = expanded === l.id;
          return (
            <SwipeableRow
              key={l.id}
              onDelete={() => remove(l.id)}
              className="bg-white rounded-xl border border-stone-200 overflow-hidden"
            >
              <div className="bg-white">
                <button
                  onClick={() => setExpanded(isOpen ? null : l.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-stone-50"
                >
                  <span>📍</span>
                  <span className="flex-1 text-sm font-medium text-stone-700 truncate">{l.name}</span>
                  <span className="text-stone-400 text-xs">{isOpen ? '▲' : '▼'}</span>
                </button>
                {isOpen && (
                  <div className="border-t border-stone-100 px-4 py-3 space-y-1 text-sm">
                    {l.address && <Field label="Adres" value={l.address} />}
                    {l.gateCode && <Field label="Code" value={l.gateCode} mono />}
                    {l.wifi && <Field label="WiFi" value={l.wifi} mono />}
                    {l.contact && <Field label="Contact" value={l.contact} />}
                    {l.notes && (
                      <div className="pt-1">
                        <pre className="text-xs text-stone-600 whitespace-pre-wrap font-sans">{l.notes}</pre>
                      </div>
                    )}
                    <div className="flex gap-3 pt-2 border-t border-stone-100 mt-2">
                      <button onClick={() => startEdit(l)} className="text-xs text-stone-500 flex items-center gap-1">
                        <PencilIcon className="w-3.5 h-3.5" /> Bewerken
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </SwipeableRow>
          );
        })}
      </div>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex gap-2">
      <span className="text-xs text-stone-400 w-16 flex-shrink-0">{label}</span>
      <span className={`text-sm text-stone-700 break-all ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}
