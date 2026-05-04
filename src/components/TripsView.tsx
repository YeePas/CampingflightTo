'use client';

import { useState } from 'react';
import { CampingLocation, WishlistItem, ChecklistItem } from '@/lib/types';
import SwipeableRow from './SwipeableRow';
import { PencilIcon } from './Icons';

type Updater<T> = T | ((prev: T) => T);

interface Props {
  locations: CampingLocation[];
  setLocations: (updater: Updater<CampingLocation[]>) => void;
  wishlist: WishlistItem[];
  setWishlist: (updater: Updater<WishlistItem[]>) => void;
  onUndo?: (label: string, restore: () => void) => void;
}

type SubTab = 'plekken' | 'wishlist';

export default function TripsView(props: Props) {
  const [sub, setSub] = useState<SubTab>('plekken');

  return (
    <div>
      <div className="relative flex bg-stone-200/60 rounded-xl p-1 mb-4">
        <div
          className="absolute top-1 bottom-1 bg-white rounded-lg shadow-sm transition-all duration-200 ease-out"
          style={{
            left: sub === 'plekken' ? '0.25rem' : 'calc(50% + 0.25rem)',
            width: 'calc(50% - 0.5rem)',
          }}
        />
        <button
          onClick={() => setSub('plekken')}
          className={`relative flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-200 ${
            sub === 'plekken' ? 'text-stone-800' : 'text-stone-500'
          }`}
        >
          Plekken
        </button>
        <button
          onClick={() => setSub('wishlist')}
          className={`relative flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-200 ${
            sub === 'wishlist' ? 'text-stone-800' : 'text-stone-500'
          }`}
        >
          Wishlist
        </button>
      </div>

      {sub === 'plekken' && <LocationsList {...props} />}
      {sub === 'wishlist' && <WishlistList {...props} />}
    </div>
  );
}

const EMPTY_LOC = { name: '', address: '', gateCode: '', wifi: '', contact: '', notes: '' };

function LocationsList({ locations, setLocations, onUndo }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CampingLocation | null>(null);
  const [form, setForm] = useState(EMPTY_LOC);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [newChecklistText, setNewChecklistText] = useState<Record<string, string>>({});

  // Strip undefined/empty fields so Firestore doesn't reject them
  const buildLocationData = (form: typeof EMPTY_LOC): Omit<CampingLocation, 'id' | 'checklist'> => {
    return {
      name: form.name.trim(),
      ...(form.address ? { address: form.address } : {}),
      ...(form.gateCode ? { gateCode: form.gateCode } : {}),
      ...(form.wifi ? { wifi: form.wifi } : {}),
      ...(form.contact ? { contact: form.contact } : {}),
      ...(form.notes ? { notes: form.notes } : {}),
    };
  };

  const submit = () => {
    if (!form.name.trim()) return;
    const data = buildLocationData(form);
    if (editing) {
      const editId = editing.id;
      const checklist = editing.checklist;
      setLocations(prev => prev.map(l =>
        l.id === editId ? { id: editId, ...(checklist ? { checklist } : {}), ...data } : l
      ));
    } else {
      const newId = `l_${Date.now()}`;
      setLocations(prev => [...prev, { id: newId, ...data }]);
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

  const remove = (id: string) => {
    const deleted = locations.find(l => l.id === id);
    const snapshot = [...locations];
    setLocations(prev => prev.filter(l => l.id !== id));
    onUndo?.(`"${deleted?.name ?? 'Camping'}" verwijderd`, () => setLocations(snapshot));
  };

  const toggleChecklistItem = (locId: string, itemId: string) => {
    setLocations(prev => prev.map(l => {
      if (l.id !== locId) return l;
      const checklist = (l.checklist ?? []).map(c =>
        c.id === itemId ? { ...c, done: !c.done } : c
      );
      return { ...l, checklist };
    }));
  };

  const addChecklistItem = (locId: string, text: string) => {
    if (!text.trim()) return;
    const newItem: ChecklistItem = { id: `c_${Date.now()}`, text: text.trim(), done: false };
    setLocations(prev => prev.map(l => {
      if (l.id !== locId) return l;
      return { ...l, checklist: [...(l.checklist ?? []), newItem] };
    }));
    setNewChecklistText(prev => ({ ...prev, [locId]: '' }));
  };

  const removeChecklistItem = (locId: string, itemId: string) => {
    setLocations(prev => prev.map(l => {
      if (l.id !== locId) return l;
      return { ...l, checklist: (l.checklist ?? []).filter(c => c.id !== itemId) };
    }));
  };

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
          const checklist = l.checklist ?? [];
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

                    <div className="pt-3 border-t border-stone-100 mt-2">
                      <div className="text-xs font-semibold text-stone-500 mb-2">Voor vertrek</div>
                      {checklist.length > 0 && (
                        <div className="space-y-1.5 mb-2">
                          {checklist.map(c => (
                            <div key={c.id} className="flex items-center gap-2 group">
                              <button
                                onClick={() => toggleChecklistItem(l.id, c.id)}
                                className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                                  c.done
                                    ? 'bg-green-600 border-green-600 text-white'
                                    : 'border-stone-300 bg-white'
                                }`}
                                aria-label={c.done ? 'Vink uit' : 'Vink af'}
                              >
                                {c.done && (
                                  <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </button>
                              <span className={`flex-1 text-xs ${c.done ? 'line-through text-stone-400' : 'text-stone-700'}`}>
                                {c.text}
                              </span>
                              <button
                                onClick={() => removeChecklistItem(l.id, c.id)}
                                className="text-stone-300 hover:text-stone-500 text-xs px-1"
                                aria-label="Verwijder taak"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <input
                        type="text"
                        placeholder="+ taak toevoegen"
                        value={newChecklistText[l.id] ?? ''}
                        onChange={e => setNewChecklistText(prev => ({ ...prev, [l.id]: e.target.value }))}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            addChecklistItem(l.id, newChecklistText[l.id] ?? '');
                          }
                        }}
                        className="w-full border border-stone-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-400"
                      />
                    </div>

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

const EMPTY_WISH = { name: '', address: '', notes: '' };

function WishlistList({ wishlist, setWishlist, locations, setLocations, onUndo }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_WISH);

  const submit = () => {
    if (!form.name.trim()) return;
    const newItem: WishlistItem = {
      id: `w_${Date.now()}`,
      name: form.name.trim(),
      address: form.address || undefined,
      notes: form.notes || undefined,
    };
    setWishlist(prev => [...prev, newItem]);
    setForm(EMPTY_WISH);
    setShowForm(false);
  };

  const remove = (id: string) => {
    const deleted = wishlist.find(w => w.id === id);
    const snapshot = [...wishlist];
    setWishlist(prev => prev.filter(w => w.id !== id));
    onUndo?.(`"${deleted?.name ?? 'Wishlist'}" verwijderd`, () => setWishlist(snapshot));
  };

  const promote = (w: WishlistItem) => {
    const newLoc: CampingLocation = {
      id: `l_${Date.now()}`,
      name: w.name,
      ...(w.address ? { address: w.address } : {}),
      ...(w.notes ? { notes: w.notes } : {}),
    };
    const wId = w.id;
    setLocations(prev => [...prev, newLoc]);
    setWishlist(prev => prev.filter(x => x.id !== wId));
  };

  return (
    <div>
      {!showForm ? (
        <button
          onClick={() => { setShowForm(true); setForm(EMPTY_WISH); }}
          className="w-full py-3 mb-4 rounded-2xl bg-green-600 text-white font-medium hover:bg-green-700"
        >
          + Plek toevoegen aan wishlist
        </button>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-4 space-y-2 mb-4">
          <h3 className="font-semibold text-stone-700 mb-1">Nieuwe wishlist-plek</h3>
          <input
            type="text"
            placeholder="Naam (verplicht)"
            value={form.name}
            onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
            className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          <input
            type="text"
            placeholder="Adres"
            value={form.address}
            onChange={e => setForm(prev => ({ ...prev, address: e.target.value }))}
            className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          <textarea
            placeholder="Notities (waarom, link, tips...)"
            value={form.notes}
            onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
            rows={3}
            className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
          />
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 bg-green-600 text-white py-2 rounded-xl text-sm font-medium hover:bg-green-700">
              Toevoegen
            </button>
            <button onClick={() => setShowForm(false)} className="flex-1 bg-stone-100 text-stone-600 py-2 rounded-xl text-sm font-medium">
              Annuleren
            </button>
          </div>
        </div>
      )}

      {wishlist.length === 0 && !showForm && (
        <div className="text-center py-8 text-stone-400 text-sm">Nog geen wishlist-plekken.</div>
      )}

      <div className="space-y-2">
        {wishlist.map(w => (
          <SwipeableRow
            key={w.id}
            onDelete={() => remove(w.id)}
            className="bg-white rounded-xl border border-stone-200 overflow-hidden"
          >
            <div className="bg-white px-4 py-3 flex items-center gap-3">
              <span>✨</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-stone-700 truncate">{w.name}</div>
                {w.address && (
                  <div className="text-xs text-stone-400 truncate">{w.address}</div>
                )}
                {!w.address && w.notes && (
                  <div className="text-xs text-stone-400 truncate">{w.notes}</div>
                )}
              </div>
              <button
                onClick={() => promote(w)}
                className="flex-shrink-0 text-xs bg-green-600 text-white px-3 py-1.5 rounded-full font-medium hover:bg-green-700"
              >
                → Plekken
              </button>
            </div>
          </SwipeableRow>
        ))}
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
