'use client';

import { PackItem, CheckedItems, CATEGORIES, TripType } from '@/lib/types';
import { useState } from 'react';

interface Props {
  items: PackItem[];
  checked: CheckedItems;
  onToggle: (id: string) => void;
  tripType: TripType;
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

export default function PackingList({ items, checked, onToggle, tripType }: Props) {
  const isHikingMode = tripType === 'wandeldag' || tripType === 'wandeltrip';
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

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
        <button onClick={toggleAll} className="text-xs text-stone-400 hover:text-stone-600">
          {allCollapsed ? '↕ alles uitklappen' : '↕ alles inklappen'}
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
                {catItems.map((item, idx) => (
                  <button
                    key={item.id}
                    onClick={() => onToggle(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-stone-50 ${
                      idx > 0 ? 'border-t border-stone-50' : ''
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
                    {!isHikingMode && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {!item.tripTypes.includes('dag') && item.tripTypes.includes('weekend') && (
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-full font-medium">1+</span>
                        )}
                        {!item.tripTypes.includes('dag') && !item.tripTypes.includes('weekend') && item.tripTypes.includes('week') && (
                          <span className="text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded-full font-medium">7+</span>
                        )}
                        {item.mountains && <span className="text-xs">⛰️</span>}
                        {item.kids && <span className="text-xs">👧</span>}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
