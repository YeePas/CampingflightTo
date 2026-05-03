'use client';

import { useState } from 'react';
import { GroceryItem, GROCERY_CATEGORIES } from '@/lib/types';
import SwipeableRow from './SwipeableRow';

interface Props {
  groceries: GroceryItem[];
  onChange: (g: GroceryItem[]) => void;
}

const CATEGORY_EMOJI: Record<string, string> = {
  'Vers': '🥬',
  'Houdbaar': '🥫',
  'Drinken': '🥤',
  'Ontbijt': '🥐',
  'Snacks': '🍫',
  'Bbq / vlees': '🍖',
  'Overig': '🛒',
};

export default function GroceryList({ groceries, onChange }: Props) {
  const [newName, setNewName] = useState('');
  const [newQty, setNewQty] = useState('');
  const [newCat, setNewCat] = useState<string>('Vers');

  const checkedCount = groceries.filter(g => g.checked).length;

  const add = () => {
    if (!newName.trim()) return;
    onChange([
      ...groceries,
      { id: `g_${Date.now()}`, name: newName.trim(), quantity: newQty.trim() || undefined, category: newCat, checked: false },
    ]);
    setNewName('');
    setNewQty('');
  };

  const toggle = (id: string) => onChange(groceries.map(g => g.id === id ? { ...g, checked: !g.checked } : g));
  const remove = (id: string) => onChange(groceries.filter(g => g.id !== id));
  const clearChecked = () => onChange(groceries.filter(g => !g.checked));
  const uncheckAll = () => onChange(groceries.map(g => ({ ...g, checked: false })));

  const byCategory: Record<string, GroceryItem[]> = {};
  groceries.forEach(g => {
    const cat = g.category || 'Overig';
    byCategory[cat] = byCategory[cat] || [];
    byCategory[cat].push(g);
  });

  return (
    <div>
      {/* Add form */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-3 mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Boodschap (bijv. Eieren)"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && add()}
            className="flex-1 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          <input
            type="text"
            placeholder="2x"
            value={newQty}
            onChange={e => setNewQty(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && add()}
            className="w-14 border border-stone-200 rounded-xl px-2 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>
        <div className="flex gap-2 mt-2">
          <select
            value={newCat}
            onChange={e => setNewCat(e.target.value)}
            className="flex-1 border border-stone-200 rounded-xl px-2 py-1.5 text-xs bg-white"
          >
            {GROCERY_CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_EMOJI[c]} {c}</option>)}
          </select>
          <button
            onClick={add}
            disabled={!newName.trim()}
            className="bg-green-600 text-white px-4 py-1.5 rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-40"
          >
            + Voeg toe
          </button>
        </div>
      </div>

      {/* Status row */}
      {groceries.length > 0 && (
        <div className="flex justify-between items-center mb-3 px-1">
          <span className="text-xs text-stone-500">{checkedCount}/{groceries.length} in mandje</span>
          <div className="flex gap-3">
            {checkedCount > 0 && (
              <button onClick={clearChecked} className="text-xs text-red-500 font-medium">
                Verwijder afgevinkt
              </button>
            )}
            {checkedCount > 0 && (
              <button onClick={uncheckAll} className="text-xs text-stone-500 font-medium">
                ↺ reset
              </button>
            )}
          </div>
        </div>
      )}

      {groceries.length === 0 && (
        <div className="text-center py-12 text-stone-400">
          <div className="text-4xl mb-2">🛒</div>
          <p>Nog geen boodschappen.</p>
        </div>
      )}

      {/* List by category */}
      <div className="space-y-3">
        {GROCERY_CATEGORIES.filter(c => byCategory[c]).map(cat => (
          <div key={cat} className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
            <div className="px-4 py-2 border-b border-stone-100 flex items-center gap-2">
              <span>{CATEGORY_EMOJI[cat]}</span>
              <span className="text-sm font-semibold text-stone-700">{cat}</span>
              <span className="text-xs text-stone-400 ml-auto">{byCategory[cat].length}</span>
            </div>
            {byCategory[cat].map((g, idx) => (
              <SwipeableRow
                key={g.id}
                onDelete={() => remove(g.id)}
                className={`bg-white ${idx > 0 ? 'border-t border-stone-50' : ''}`}
              >
                <div className="flex items-center gap-3 px-4 py-2.5 bg-white">
                  <button
                    onClick={() => toggle(g.id)}
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      g.checked ? 'bg-green-500 border-green-500' : 'border-stone-300'
                    }`}
                  >
                    {g.checked && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  <button onClick={() => toggle(g.id)} className="flex-1 text-left text-sm">
                    <span className={g.checked ? 'line-through text-stone-400' : 'text-stone-700'}>
                      {g.name}
                    </span>
                    {g.quantity && <span className="text-xs text-stone-400 ml-2">({g.quantity})</span>}
                  </button>
                  <button onClick={() => remove(g.id)} className="text-stone-300 hover:text-red-500 text-xs hidden sm:inline-block">✕</button>
                </div>
              </SwipeableRow>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
