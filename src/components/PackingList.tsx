'use client';

import { PackItem, CheckedItems, CATEGORIES, TripType, TripConfig } from '@/lib/types';
import { useState } from 'react';
import SwipeableRow from './SwipeableRow';

interface Props {
  items: PackItem[];
  checked: CheckedItems;
  onToggle: (id: string) => void;
  tripType: TripType;
  onDelete?: (id: string) => void;
  onAddItem?: (item: Omit<PackItem, 'id'>) => void;
  tripConfig?: TripConfig;
}

const CATEGORY_EMOJI: Record<string, string> = {
  'Kleding': '👕',
  'Slaap': '🛏️',
  'Keuken & Eten': '🍳',
  'Hygiëne': '🧴',
  'Kinderen': '🧒',
  'EHBO': '🩹',
  'Navigatie & Kaarten': '🗺️',
  'Gereedschap': '🔧',
  'Bergen': '⛰️',
  'Overig': '📦',
};

export default function PackingList({ items, checked, onToggle, tripType, onDelete, onAddItem, tripConfig }: Props) {
  const isHikingMode = tripType === 'wandeldag' || tripType === 'wandeltrip';
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [adding, setAdding] = useState<string | null>(null); // category being added to
  const [addName, setAddName] = useState('');

  const byCategory = CATEGORIES.reduce((acc, cat) => {
    const catItems = items.filter(i => i.category === cat);
    if (catItems.length > 0) acc[cat] = catItems;
    return acc;
  }, {} as Record<string, PackItem[]>);

  // Catch any item categories not in the predefined list
  items.forEach(item => {
    if (!CATEGORIES.includes(item.category as typeof CATEGORIES[number])) {
      byCategory[item.category] = byCategory[item.category] || [];
      if (!byCategory[item.category].find(i => i.id === item.id)) {
        byCategory[item.category].push(item);
      }
    }
  });

  const allCollapsed = Object.keys(byCategory).every(cat => collapsed[cat]);

  const toggleAll = () => {
    if (allCollapsed) {
      setCollapsed({});
    } else {
      const all: Record<string, boolean> = {};
      Object.keys(byCategory).forEach(cat => { all[cat] = true; });
      setCollapsed(all);
    }
  };

  const submitAdd = (category: string) => {
    if (!addName.trim() || !onAddItem || !tripConfig) return;
    onAddItem({
      name: addName.trim(),
      category,
      tripTypes: [tripConfig.type],
      mountains: category === 'Bergen',
      kids: false, // never inherit kids flag — user can set it explicitly in Beheer
    });
    setAddName('');
    setAdding(null);
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-stone-400">
        <div className="text-4xl mb-2">🎒</div>
        <p>Geen items voor deze trip configuratie.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end mb-2">
        <button
          onClick={toggleAll}
          aria-label={allCollapsed ? 'Alles uitklappen' : 'Alles inklappen'}
          className="w-7 h-7 rounded-full border border-stone-200 text-stone-400 hover:text-stone-600 hover:border-stone-300 flex items-center justify-center transition-colors"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            {allCollapsed
              ? <><line x1="5" y1="12" x2="19" y2="12" /><line x1="12" y1="5" x2="12" y2="19" /></>
              : <line x1="5" y1="12" x2="19" y2="12" />
            }
          </svg>
        </button>
      </div>
      {Object.entries(byCategory).map(([category, catItems]) => {
        const checkedInCat = catItems.filter(i => checked[i.id]).length;
        const isCollapsed = collapsed[category];

        return (
          <div key={category} className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
            <button
              className="w-full flex items-center justify-between p-4 text-left hover:bg-stone-50 transition-colors"
              onClick={() => setCollapsed(prev => ({ ...prev, [category]: !prev[category] }))}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{CATEGORY_EMOJI[category] || '📦'}</span>
                <span className="font-semibold text-stone-700">{category}</span>
                <span className="text-xs text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">
                  {checkedInCat}/{catItems.length}
                </span>
              </div>
              <span className="text-stone-400 text-sm">{isCollapsed ? '▶' : '▼'}</span>
            </button>

            {!isCollapsed && (
              <div className="border-t border-stone-100">
                {catItems.map((item, idx) => {
                  const rowContent = (
                    <button
                      onClick={() => onToggle(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors bg-white hover:bg-stone-50 ${
                        !onDelete && idx > 0 ? 'border-t border-stone-50' : ''
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        checked[item.id]
                          ? 'bg-green-500 border-green-500'
                          : 'border-stone-300'
                      }`}>
                        {checked[item.id] && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className={`text-sm ${checked[item.id] ? 'line-through text-stone-400' : 'text-stone-700'}`}>
                          {item.name}
                        </span>
                        {item.quantity && (
                          <span className="text-xs text-stone-400 ml-1">({item.quantity})</span>
                        )}
                        {item.notes && (
                          <p className="text-xs text-stone-400 mt-0.5">{item.notes}</p>
                        )}
                      </div>
                    </button>
                  );

                  return onDelete ? (
                    <SwipeableRow
                      key={item.id}
                      onDelete={() => onDelete(item.id)}
                      className={idx > 0 ? 'border-t border-stone-50' : ''}
                    >
                      {rowContent}
                    </SwipeableRow>
                  ) : (
                    <div key={item.id}>{rowContent}</div>
                  );
                })}

                {onAddItem && (
                  <div className="border-t border-stone-100">
                    {adding === category ? (
                      <div className="flex items-center gap-2 px-4 py-2">
                        <input
                          autoFocus
                          type="text"
                          placeholder="Naam item..."
                          value={addName}
                          onChange={e => setAddName(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') submitAdd(category);
                            if (e.key === 'Escape') { setAdding(null); setAddName(''); }
                          }}
                          className="flex-1 min-w-0 border border-stone-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                        />
                        <button
                          onClick={() => submitAdd(category)}
                          disabled={!addName.trim()}
                          className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-xl font-medium disabled:opacity-40"
                        >
                          Voeg toe
                        </button>
                        <button
                          onClick={() => { setAdding(null); setAddName(''); }}
                          className="text-xs text-stone-400 px-2 py-1.5"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setAdding(category); setAddName(''); }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-xs text-stone-400 hover:text-green-600 hover:bg-stone-50 transition-colors"
                      >
                        <span className="text-base leading-none">＋</span> Item toevoegen
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
