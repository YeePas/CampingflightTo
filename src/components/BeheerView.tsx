'use client';

import { PackItem, CATEGORIES, TripType } from '@/lib/types';
import { useState } from 'react';
import SwipeableRow from './SwipeableRow';
import { PencilIcon, TentIcon, CalendarIcon, MountainIcon, BootIcon, KidsIcon } from './Icons';
import VoiceInput, { VoiceResult } from './VoiceInput';

interface Props {
  items: PackItem[];
  onAdd: (item: Omit<PackItem, 'id'>) => void;
  onDelete: (id: string) => void;
  onEdit: (item: PackItem) => void;
}

// Mirrors TripConfigurator — dag is retired
const TRIP_TYPE_OPTIONS: { value: TripType; label: string; Icon: (p: { className?: string }) => React.ReactElement }[] = [
  { value: 'weekend', label: '+1 nacht',   Icon: TentIcon },
  { value: 'week',    label: '+7 nachten', Icon: CalendarIcon },
  { value: 'wandeldag',  label: 'Wandeldag',  Icon: MountainIcon },
  { value: 'wandeltrip', label: 'Wandeltrip', Icon: BootIcon },
];

const TRIP_LABEL: Record<TripType, string> = {
  weekend: '+1 nacht', week: '+7 nachten',
  wandeldag: 'Wandeldag', wandeltrip: 'Wandeltrip',
};

const EMPTY_FORM = {
  name: '',
  category: 'Overig',
  tripTypes: ['weekend', 'week'] as TripType[],
  mountains: false,
  kids: false,
  quantity: '',
  notes: '',
};

export default function BeheerView({ items, onAdd, onDelete, onEdit }: Props) {
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('Alle');
  const [sortAZ, setSortAZ] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<PackItem | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const filtered = items
    .filter(item => {
      const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
      const matchCat = filterCat === 'Alle' || item.category === filterCat;
      return matchSearch && matchCat;
    })
    .sort((a, b) => sortAZ ? a.name.localeCompare(b.name, 'nl') : 0);

  const toggleTripType = (type: TripType) => {
    setForm(prev => ({
      ...prev,
      tripTypes: prev.tripTypes.includes(type)
        ? prev.tripTypes.filter(t => t !== type)
        : [...prev.tripTypes, type],
    }));
  };

  const handleVoiceResult = (data: VoiceResult) => {
    setForm(prev => ({
      ...prev,
      name: (data.name as string) || prev.name,
      category: (CATEGORIES as readonly string[]).includes(data.category as string)
        ? (data.category as string)
        : prev.category,
      tripTypes: Array.isArray(data.tripTypes) && data.tripTypes.length > 0
        ? (data.tripTypes as TripType[])
        : prev.tripTypes,
      mountains: typeof data.mountains === 'boolean' ? data.mountains : prev.mountains,
      kids: typeof data.kids === 'boolean' ? data.kids : prev.kids,
      quantity: (data.quantity as string) || prev.quantity,
      notes: (data.notes as string) || prev.notes,
    }));
    if (!showForm) setShowForm(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim() || form.tripTypes.length === 0) return;
    if (editingItem) {
      onEdit({ ...editingItem, ...form });
    } else {
      onAdd(form);
    }
    setForm(EMPTY_FORM);
    setShowForm(false);
    setEditingItem(null);
  };

  const startEdit = (item: PackItem) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      category: item.category,
      // Drop retired 'dag' type when editing (may exist in old Firestore data)
      tripTypes: (item.tripTypes as string[]).filter(t => t !== 'dag').length > 0
        ? item.tripTypes.filter(t => (t as string) !== 'dag')
        : ['weekend'],
      mountains: item.mountains,
      kids: item.kids,
      quantity: item.quantity || '',
      notes: item.notes || '',
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div>
      {/* Add button */}
      {!showForm && (
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => { setShowForm(true); setEditingItem(null); setForm(EMPTY_FORM); }}
            className="flex-1 py-3 rounded-2xl bg-green-600 text-white font-medium hover:bg-green-700 transition-colors"
          >
            + Nieuw item
          </button>
          <div className="flex items-center bg-white border border-stone-200 rounded-2xl px-3">
            <VoiceInput mode="item" onResult={(d) => { setEditingItem(null); setForm(EMPTY_FORM); handleVoiceResult(d); }} label="Inspreek" />
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-4 space-y-3 mb-4">
          <h3 className="font-semibold text-stone-700">{editingItem ? 'Item bewerken' : 'Nieuw item'}</h3>

          {/* Name + voice */}
          <div className="flex gap-2 items-center">
            <input
              type="text"
              placeholder="Naam (bijv. Wandelschoenen)"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              className="flex-1 min-w-0 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            <VoiceInput mode="item" onResult={handleVoiceResult} />
          </div>

          {/* Category — wrapped chips */}
          <div>
            <p className="text-xs font-medium text-stone-500 mb-1.5">Categorie</p>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map(c => {
                const isActive = form.category === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm(p => ({ ...p, category: c }))}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                      isActive
                        ? 'bg-green-600 border-green-600 text-white'
                        : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300'
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity + notes */}
          <input
            type="text"
            placeholder="Hoeveelheid (optioneel, bijv. 2x)"
            value={form.quantity}
            onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))}
            className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          <input
            type="text"
            placeholder="Notitie (optioneel)"
            value={form.notes}
            onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
            className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          />

          {/* Trip types — 2×2 grid matching TripConfigurator */}
          <div>
            <p className="text-xs font-medium text-stone-500 mb-1.5">Van toepassing bij:</p>
            <div className="grid grid-cols-2 gap-2">
              {TRIP_TYPE_OPTIONS.map(({ value, label, Icon }) => {
                const isActive = form.tripTypes.includes(value);
                const isHike = value === 'wandeldag' || value === 'wandeltrip';
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggleTripType(value)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                      isActive
                        ? isHike
                          ? 'bg-amber-500 border-amber-500 text-white'
                          : 'bg-green-600 border-green-600 text-white'
                        : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {label}
                  </button>
                );
              })}
            </div>
            {form.tripTypes.length === 0 && (
              <p className="text-xs text-red-500 mt-1">Selecteer minimaal één type.</p>
            )}
          </div>

          {/* Bergen / Kinderen — matching TripConfigurator chip style */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setForm(p => ({ ...p, mountains: !p.mountains }))}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium border transition-all ${
                form.mountains
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-white border-stone-200 text-stone-500 hover:border-stone-300'
              }`}
            >
              <MountainIcon className="w-3.5 h-3.5" /> Alleen bergen
            </button>
            <button
              type="button"
              onClick={() => setForm(p => ({ ...p, kids: !p.kids }))}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium border transition-all ${
                form.kids
                  ? 'bg-orange-50 border-orange-300 text-orange-700'
                  : 'bg-white border-stone-200 text-stone-500 hover:border-stone-300'
              }`}
            >
              <KidsIcon className="w-3.5 h-3.5" /> Alleen met kinderen
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={form.tripTypes.length === 0}
              className="flex-1 bg-green-600 text-white py-2 rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-40"
            >
              {editingItem ? 'Opslaan' : 'Toevoegen'}
            </button>
            <button
              onClick={() => { setShowForm(false); setEditingItem(null); }}
              className="flex-1 bg-stone-100 text-stone-600 py-2 rounded-xl text-sm font-medium hover:bg-stone-200"
            >
              Annuleren
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <input
        type="text"
        placeholder="Zoeken..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 mb-3"
      />

      {/* Category filter chips */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {['Alle', ...CATEGORIES].map(c => {
          const isActive = filterCat === c;
          return (
            <button
              key={c}
              onClick={() => setFilterCat(c)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                isActive
                  ? 'bg-green-600 border-green-600 text-white'
                  : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300'
              }`}
            >
              {c}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-stone-400">{filtered.length} items</p>
        <button
          onClick={() => setSortAZ(v => !v)}
          className={`text-xs font-medium px-2.5 py-1 rounded-full border transition-all ${
            sortAZ
              ? 'bg-green-600 border-green-600 text-white'
              : 'bg-white border-stone-200 text-stone-500 hover:border-stone-300'
          }`}
        >
          A→Z
        </button>
      </div>

      {/* Items list */}
      <div className="space-y-2">
        {filtered.map(item => {
          const displayTypes = item.tripTypes.filter(t => (t as string) !== 'dag');
          return (
            <SwipeableRow
              key={item.id}
              onDelete={() => onDelete(item.id)}
              className="rounded-xl border border-stone-200 bg-white"
            >
              <div className="bg-white rounded-xl px-4 py-3 flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-stone-700">{item.name}</div>
                  <div className="text-xs text-stone-400 mt-0.5 flex flex-wrap gap-1">
                    <span className="bg-stone-100 px-1.5 py-0.5 rounded">{item.category}</span>
                    {displayTypes.map(t => (
                      <span
                        key={t}
                        className={`px-1.5 py-0.5 rounded ${
                          t === 'wandeldag' || t === 'wandeltrip'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-green-50 text-green-700'
                        }`}
                      >
                        {TRIP_LABEL[t] ?? t}
                      </span>
                    ))}
                    {item.mountains && (
                      <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <MountainIcon className="w-3 h-3" /> Bergen
                      </span>
                    )}
                    {item.kids && (
                      <span className="bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <KidsIcon className="w-3 h-3" /> Kinderen
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={() => startEdit(item)} className="text-stone-400 hover:text-stone-600 p-1 flex-shrink-0" aria-label="Bewerken">
                  <PencilIcon />
                </button>
              </div>
            </SwipeableRow>
          );
        })}
      </div>
    </div>
  );
}
