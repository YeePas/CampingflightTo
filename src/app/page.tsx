'use client';

import { useState } from 'react';
import { useCampingStore } from '@/hooks/useStorage';
import TripConfigurator from '@/components/TripConfigurator';
import PackingList from '@/components/PackingList';
import TipsView from '@/components/TipsView';
import BeheerView from '@/components/BeheerView';
import { PackItem, Tip } from '@/lib/types';

type Tab = 'paklijst' | 'tips' | 'beheer';

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'paklijst', label: 'Paklijst', emoji: '🎒' },
  { id: 'tips', label: 'Tips', emoji: '💡' },
  { id: 'beheer', label: 'Beheer', emoji: '⚙️' },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('paklijst');
  const {
    items, setItems,
    tips, setTips,
    checked, tripConfig,
    setTripConfig, toggleCheck, resetChecked,
    filteredItems, mounted,
  } = useCampingStore();

  if (!mounted) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-stone-400">⛺ laden...</div>
      </div>
    );
  }

  const checkedCount = filteredItems.filter(i => checked[i.id]).length;

  const addItem = (item: Omit<PackItem, 'id'>) => {
    const newItem: PackItem = { ...item, id: `custom_${Date.now()}` };
    setItems([...items, newItem]);
  };

  const deleteItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  const editItem = (updated: PackItem) => {
    setItems(items.map(i => i.id === updated.id ? updated : i));
  };

  const addTip = (tip: Omit<Tip, 'id'>) => {
    const newTip: Tip = { ...tip, id: `tip_${Date.now()}` };
    setTips([...tips, newTip]);
  };

  const deleteTip = (id: string) => {
    setTips(tips.filter(t => t.id !== id));
  };

  const editTip = (updated: Tip) => {
    setTips(tips.map(t => t.id === updated.id ? updated : t));
  };

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-green-700 text-white px-4 pb-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-2 pt-4 pb-1">
            <span className="text-2xl">⛺</span>
            <h1 className="text-xl font-bold tracking-tight">Kampeerapp</h1>
          </div>
          <p className="text-green-200 text-xs">Alles voor een geslaagde camping trip</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="bg-white border-b border-stone-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-lg mx-auto flex">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 text-sm font-medium transition-all flex flex-col items-center gap-0.5 ${
                activeTab === tab.id
                  ? 'text-green-700 border-b-2 border-green-700'
                  : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              <span>{tab.emoji}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 py-4 pb-8">
        {activeTab === 'paklijst' && (
          <>
            <TripConfigurator
              config={tripConfig}
              onChange={setTripConfig}
              onReset={resetChecked}
              checkedCount={checkedCount}
              totalCount={filteredItems.length}
            />
            <PackingList
              items={filteredItems}
              checked={checked}
              onToggle={toggleCheck}
            />
          </>
        )}

        {activeTab === 'tips' && (
          <TipsView
            tips={tips}
            onAdd={addTip}
            onDelete={deleteTip}
            onEdit={editTip}
          />
        )}

        {activeTab === 'beheer' && (
          <BeheerView
            items={items}
            onAdd={addItem}
            onDelete={deleteItem}
            onEdit={editItem}
          />
        )}
      </div>
    </div>
  );
}
