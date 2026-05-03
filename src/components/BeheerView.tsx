'use client';

import { PackItem, CATEGORIES, TripType } from '@/lib/types';
import { useState } from 'react';
import SwipeableRow from './SwipeableRow';
import { PencilIcon } from './Icons';

interface Props {
  items: PackItem[];
  onAdd: (item: Omit<PackItem, 'id'>) => void;
  onDelete: (id: string) => void;
  onEdit: (item: PackItem) => void;
}

const TRIP_TYPE_OPTIONS: { value: TripType; label: string }[] = [
  { value: 'dag', label: 'Dag' },
  { value: 'weekend', label: 'Weekend' },
  { value: 'week', label: 'Week+' },
];

const EMPTY_FORM = {
  name: '',
  category: 'Overig',
  tripTypes: ['dag', 'weekend', 'week'] as TripType[],
  mountains: false,
  kids: false,
  quantity: '',
  notes: '',
};

export default function BeheerView({ items, onAdd, onDelete, onEdit }: Props) {
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('Alle');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<PackItem | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const filtered = items.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === 'Alle' || item.category === filterCat;
    return matchSearch && matchCat;
  });

  const toggleTripType = (type: TripType) => {
    setForm(prev => ({
      ...prev,
      tripTypes: prev.tripTypes.includes(type)
        ? prev.tripTypes.filter(t => t !== type)
        : [...prev.tripTypes, type],
    }));
  };

  const handleSubmit = () => {
    if (!form.name.trim() || form.tripTypes.length === 0) return;
    const data = { ...form, tripTypes: form.tripTypes };
    if (editingItem) {
      onEdit({ ...editingItem, ...data });
    } else {
      onAdd(data);
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
      tripTypes: item.tripTypes,
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
        <button
          onClick={() => { setShowForm(true); setEditingItem(null); setForm(EMPTY_FORM); }}
          className="w-full py-3 mb-4 rounded-2xl bg-green-600 text-white font-medium hover:bg-green-700 transition-colors"
        >
          + Nieuw item toevoegen
        </button>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-4 space-y-3 mb-4">
          <h3 className="font-semibold text-stone-700">{editingItem ? 'Item bewerken' : 'Nieuw item'}</h3>

          <input
            type="text"
            placeholder="Naam (bijv. Wandelschoenen)"
            value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          />

          <select
            value={form.category}
            onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
            className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

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

          <div>
            <p className="text-xs font-medium text-stone-500 mb-1.5">Van toepassing bij:</p>
            <div className="flex gap-2">
              {TRIP_TYPE_OPTIONS.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => toggleTripType(t.value)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    form.tripTypes.includes(t.value)
                      ? 'bg-green-600 text-white'
                      : 'bg-stone-100 text-stone-500'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setForm(p => ({ ...p, mountains: !p.mountains }))}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                form.mountains ? 'bg-blue-600 text-white' : 'bg-stone-100 text-stone-500'
              }`}
            >
              ⛰️ Alleen bergen
            </button>
            <button
              type="button"
              onClick={() => setForm(p => ({ ...p, kids: !p.kids }))}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                form.kids ? 'bg-orange-500 text-white' : 'bg-stone-100 text-stone-500'
              }`}
            >
              👧 Alleen met kinderen
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              className="flex-1 bg-green-600 text-white py-2 rounded-xl text-sm font-medium hover:bg-green-700"
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

      {/* Search & filter */}
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          placeholder="Zoeken..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
        />
        <select
          value={filterCat}
          onChange={e => setFilterCat(e.target.value)}
          className="border border-stone-200 rounded-xl px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
        >
          <option value="Alle">Alle</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <p className="text-xs text-stone-400 mb-2">{filtered.length} items</p>

      {/* Items list */}
      <div className="space-y-2">
        {filtered.map(item => (
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
                  {item.tripTypes.map(t => (
                    <span key={t} className="bg-green-50 text-green-700 px-1.5 py-0.5 rounded">{t}</span>
                  ))}
                  {item.mountains && <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">⛰️ bergen</span>}
                  {item.kids && <span className="bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded">👧 kids</span>}
                </div>
              </div>
              <button onClick={() => startEdit(item)} className="text-stone-400 hover:text-stone-600 p-1 flex-shrink-0" aria-label="Bewerken">
                <PencilIcon />
              </button>
            </div>
          </SwipeableRow>
        ))}
      </div>
    </div>
  );
}
