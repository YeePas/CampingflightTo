'use client';

import { useState } from 'react';
import { GroceryItem } from '@/lib/types';
import SwipeableRow from './SwipeableRow';
import VoiceInput, { VoiceResult } from './VoiceInput';

interface Props {
  groceries: GroceryItem[];
  onChange: (g: GroceryItem[]) => void;
}

export default function GroceryList({ groceries, onChange }: Props) {
  const [newName, setNewName] = useState('');
  const [newQty, setNewQty] = useState('');

  const checkedCount = groceries.filter(g => g.checked).length;

  const add = (name = newName, qty = newQty) => {
    if (!name.trim()) return;
    onChange([
      ...groceries,
      { id: `g_${Date.now()}`, name: name.trim(), quantity: qty.trim() || undefined, checked: false },
    ]);
    setNewName('');
    setNewQty('');
  };

  const handleVoiceResult = (data: VoiceResult) => {
    const items = data.items as { name: string; quantity?: string }[] | undefined;
    if (!items?.length) return;
    const now = Date.now();
    const newItems: GroceryItem[] = items.map((item, i) => ({
      id: `g_${now}_${i}`,
      name: item.name,
      quantity: item.quantity || undefined,
      checked: false,
    }));
    onChange([...groceries, ...newItems]);
  };

  const toggle = (id: string) => onChange(groceries.map(g => g.id === id ? { ...g, checked: !g.checked } : g));
  const remove = (id: string) => onChange(groceries.filter(g => g.id !== id));
  const clearChecked = () => onChange(groceries.filter(g => !g.checked));
  const uncheckAll = () => onChange(groceries.map(g => ({ ...g, checked: false })));

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
            className="flex-1 min-w-0 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          <input
            type="text"
            placeholder="2x"
            value={newQty}
            onChange={e => setNewQty(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && add()}
            className="w-14 border border-stone-200 rounded-xl px-2 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          <button
            onClick={() => add()}
            disabled={!newName.trim()}
            className="flex-shrink-0 bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-40"
          >
            +
          </button>
        </div>
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-stone-100">
          <VoiceInput mode="grocery" onResult={handleVoiceResult} label="Inspreek" />
          <span className="text-xs text-stone-400 italic">zeg bijv. "6 eieren, pak melk, kaas"</span>
        </div>
      </div>

      {/* Status + actions */}
      {groceries.length > 0 && (
        <div className="flex justify-between items-center mb-3 px-1">
          <span className="text-xs text-stone-500">{checkedCount}/{groceries.length} afgevinkt</span>
          <div className="flex gap-3">
            {checkedCount > 0 && (
              <>
                <button onClick={clearChecked} className="text-xs text-red-500 font-medium">
                  Verwijder afgevinkt
                </button>
                <button onClick={uncheckAll} className="text-xs text-stone-500 font-medium">
                  ↺ reset
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Empty state */}
      {groceries.length === 0 && (
        <div className="text-center py-12 text-stone-400">
          <div className="text-4xl mb-2">🛒</div>
          <p>Nog geen boodschappen.</p>
        </div>
      )}

      {/* Flat list */}
      {groceries.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
          {groceries.map((g, idx) => (
            <SwipeableRow
              key={g.id}
              onDelete={() => remove(g.id)}
              className={`bg-white ${idx > 0 ? 'border-t border-stone-100' : ''}`}
            >
              <button
                onClick={() => toggle(g.id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-stone-50 transition-colors"
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  g.checked ? 'bg-green-500 border-green-500' : 'border-stone-300'
                }`}>
                  {g.checked && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className={`flex-1 text-sm ${g.checked ? 'line-through text-stone-400' : 'text-stone-700'}`}>
                  {g.name}
                </span>
                {g.quantity && (
                  <span className="text-xs text-stone-400 flex-shrink-0">({g.quantity})</span>
                )}
              </button>
            </SwipeableRow>
          ))}
        </div>
      )}
    </div>
  );
}
