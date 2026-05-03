'use client';

import { useState, useRef, useCallback } from 'react';
import { useCampingStore } from '@/hooks/useStorage';
import { useAuth } from '@/hooks/useAuth';
import TripConfigurator from '@/components/TripConfigurator';
import PackingList from '@/components/PackingList';
import TipsView from '@/components/TipsView';
import BeheerView from '@/components/BeheerView';
import GroceryList from '@/components/GroceryList';
import TripsView from '@/components/TripsView';
import UndoToast from '@/components/UndoToast';
import LoginScreen from '@/components/LoginScreen';
import { PackItem, Tip } from '@/lib/types';

type Tab = 'paklijst' | 'tips' | 'trips' | 'beheer';
type PakSub = 'spullen' | 'boodschappen';

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'paklijst', label: 'Paklijst', emoji: '🎒' },
  { id: 'tips', label: 'Tips', emoji: '💡' },
  { id: 'trips', label: 'Trips', emoji: '📖' },
  { id: 'beheer', label: 'Beheer', emoji: '⚙️' },
];

function timeAgo(date: Date | null): string {
  if (!date) return '';
  const sec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (sec < 5) return 'net gesynced';
  if (sec < 60) return `${sec}s geleden`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m geleden`;
  const hr = Math.floor(min / 60);
  return `${hr}u geleden`;
}

type UndoState = { label: string; restore: () => void } | null;

function useUndoToast() {
  const [undo, setUndo] = useState<UndoState>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const arm = useCallback((label: string, restore: () => void) => {
    clearTimeout(timerRef.current);
    setUndo({ label, restore });
    timerRef.current = setTimeout(() => setUndo(null), 4200);
  }, []);

  const dismiss = useCallback(() => {
    clearTimeout(timerRef.current);
    setUndo(null);
  }, []);

  const trigger = useCallback(() => {
    if (!undo) return;
    clearTimeout(timerRef.current);
    undo.restore();
    setUndo(null);
  }, [undo]);

  return { undo, arm, dismiss, trigger };
}

const USER_DISPLAY: Record<string, { name: string; emoji: string }> = {
  joep:  { name: 'Joep',  emoji: '🧔' },
  sanne: { name: 'Sanne', emoji: '👩' },
};

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('paklijst');
  const [pakSub, setPakSub] = useState<PakSub>('spullen');
  const s = useCampingStore();
  const { undo, arm, dismiss, trigger } = useUndoToast();
  const auth = useAuth();

  // Wait for localStorage to be read
  if (!auth.mounted) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-stone-400">⛺ laden...</div>
      </div>
    );
  }

  if (!auth.user) {
    return <LoginScreen onLogin={auth.login} />;
  }

  if (!s.mounted) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-stone-400">⛺ laden...</div>
      </div>
    );
  }

  const currentUser = USER_DISPLAY[auth.user];

  const checkedCount = s.filteredItems.filter(i => s.checked[i.id]).length;

  const addItem = (item: Omit<PackItem, 'id'>) =>
    s.setItems([...s.items, { ...item, id: `custom_${Date.now()}` }]);

  const deleteItem = (id: string) => {
    const snapshot = s.items;
    s.setItems(s.items.filter(i => i.id !== id));
    const deleted = snapshot.find(i => i.id === id);
    arm(`"${deleted?.name ?? 'Item'}" verwijderd`, () => s.setItems(snapshot));
  };

  // Remove item only from the current trip type (not from other trip types)
  const removeItemFromTrip = (id: string) => {
    const snapshot = s.items;
    const item = snapshot.find(i => i.id === id);
    if (!item) return;
    const newTypes = item.tripTypes.filter(t => t !== s.tripConfig.type);
    if (newTypes.length === 0) {
      // No trip types left → remove item entirely
      s.setItems(snapshot.filter(i => i.id !== id));
    } else {
      s.setItems(snapshot.map(i => i.id === id ? { ...i, tripTypes: newTypes } : i));
    }
    arm(`"${item.name}" uit deze lijst verwijderd`, () => s.setItems(snapshot));
  };

  const editItem = (updated: PackItem) =>
    s.setItems(s.items.map(i => i.id === updated.id ? updated : i));

  const addTip = (tip: Omit<Tip, 'id'>) =>
    s.setTips([...s.tips, { ...tip, id: `tip_${Date.now()}` }]);

  const deleteTip = (id: string) => {
    const snapshot = s.tips;
    s.setTips(s.tips.filter(t => t.id !== id));
    const deleted = snapshot.find(t => t.id === id);
    arm(`"${deleted?.title ?? 'Tip'}" verwijderd`, () => s.setTips(snapshot));
  };

  const editTip = (updated: Tip) =>
    s.setTips(s.tips.map(t => t.id === updated.id ? updated : t));

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Hero header */}
      <div
        className="relative text-white"
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(20,40,30,0.55) 0%, rgba(20,40,30,0.85) 100%), url('https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=70')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">⛺</span>
              <h1 className="text-lg font-bold tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
                A Campingflight To…
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => s.refresh()}
                disabled={s.syncing}
                className="flex items-center gap-1.5 text-xs bg-white/15 hover:bg-white/25 backdrop-blur px-3 py-1.5 rounded-full transition-all disabled:opacity-50"
                title={s.lastSync ? `Laatst gesynced: ${timeAgo(s.lastSync)}` : 'Nog niet gesynced'}
              >
                <span className={s.syncing ? 'animate-spin inline-block' : 'inline-block'}>↻</span>
                <span className="hidden sm:inline">{s.syncing ? 'syncen…' : timeAgo(s.lastSync) || 'sync'}</span>
              </button>
              <button
                onClick={auth.logout}
                className="flex items-center gap-1.5 text-xs bg-white/15 hover:bg-white/25 backdrop-blur px-3 py-1.5 rounded-full transition-all"
                title="Uitloggen"
              >
                <span>{currentUser.emoji}</span>
                <span>{currentUser.name}</span>
              </button>
            </div>
          </div>
          <p className="text-xs text-white/70 mt-0.5 italic">Onderweg, paraat, gepakt.</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 pb-28">
        {activeTab === 'paklijst' && (
          <>
            <div className="flex gap-1 bg-white rounded-2xl border border-stone-200 p-1 mb-4">
              <button
                onClick={() => setPakSub('spullen')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  pakSub === 'spullen' ? 'bg-green-600 text-white' : 'text-stone-500'
                }`}
              >
                🎒 Spullen
              </button>
              <button
                onClick={() => setPakSub('boodschappen')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  pakSub === 'boodschappen' ? 'bg-green-600 text-white' : 'text-stone-500'
                }`}
              >
                🛒 Boodschappen
              </button>
            </div>

            {pakSub === 'spullen' && (
              <>
                <TripConfigurator
                  config={s.tripConfig}
                  onChange={s.setTripConfig}
                  onReset={s.resetChecked}
                  checkedCount={checkedCount}
                  totalCount={s.filteredItems.length}
                />
                <PackingList
                  items={s.filteredItems}
                  checked={s.checked}
                  onToggle={s.toggleCheck}
                  tripType={s.tripConfig.type}
                  tripConfig={s.tripConfig}
                  onDelete={removeItemFromTrip}
                  onAddItem={addItem}
                />
              </>
            )}

            {pakSub === 'boodschappen' && (
              <GroceryList groceries={s.groceries} onChange={s.setGroceries} onUndo={arm} />
            )}
          </>
        )}

        {activeTab === 'tips' && (
          <TipsView tips={s.tips} onAdd={addTip} onDelete={deleteTip} onEdit={editTip} />
        )}

        {activeTab === 'trips' && (
          <TripsView
            presets={s.presets}
            setPresets={s.setPresets}
            locations={s.locations}
            setLocations={s.setLocations}
            currentConfig={s.tripConfig}
            applyConfig={s.setTripConfig}
            onUndo={arm}
          />
        )}

        {activeTab === 'beheer' && (
          <BeheerView items={s.items} onAdd={addItem} onDelete={deleteItem} onEdit={editItem} />
        )}
      </div>

      {/* Bottom tab bar */}
      <nav
        className="fixed bottom-0 inset-x-0 bg-white border-t border-stone-200 shadow-[0_-2px_10px_rgba(0,0,0,0.04)] z-20"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="max-w-lg mx-auto flex">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                if (activeTab === tab.id) {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                } else {
                  setActiveTab(tab.id);
                  window.scrollTo({ top: 0 });
                }
              }}
              className={`flex-1 py-2 text-xs font-medium transition-all flex flex-col items-center gap-0.5 ${
                activeTab === tab.id ? 'text-green-700' : 'text-stone-500'
              }`}
            >
              <span className={`text-lg transition-transform ${activeTab === tab.id ? 'scale-110' : ''}`}>{tab.emoji}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Global undo toast */}
      {undo && (
        <UndoToast
          label={undo.label}
          onUndo={trigger}
          onDismiss={dismiss}
        />
      )}
    </div>
  );
}
