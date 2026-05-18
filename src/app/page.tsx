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
import { BackpackIcon, LightbulbIcon, MapIcon, SlidersIcon } from '@/components/Icons';
import LogoMark from '@/components/LogoMark';
import LoginScreen from '@/components/LoginScreen';
import { PackItem, Tip } from '@/lib/types';

type Tab = 'paklijst' | 'tips' | 'trips' | 'beheer';
type PakSub = 'spullen' | 'boodschappen';

const TABS: { id: Tab; label: string; Icon: (p: { className?: string }) => React.ReactElement }[] = [
  { id: 'paklijst', label: 'Paklijst', Icon: BackpackIcon },
  { id: 'tips', label: 'Tips', Icon: LightbulbIcon },
  { id: 'trips', label: 'Trips', Icon: MapIcon },
  { id: 'beheer', label: 'Beheer', Icon: SlidersIcon },
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

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('paklijst');
  const [pakSub, setPakSub] = useState<PakSub>('spullen');
  const auth = useAuth();
  const s = useCampingStore(auth.session?.groupId ?? null);
  const { undo, arm, dismiss, trigger } = useUndoToast();
  const [showAccountSheet, setShowAccountSheet] = useState(false);

  // Wait for localStorage to be read
  if (!auth.mounted) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-stone-400">⛺ laden...</div>
      </div>
    );
  }

  if (!auth.session || !auth.group) {
    return <LoginScreen onJoin={auth.joinGroup} onCreate={auth.createGroup} />;
  }

  if (!s.mounted) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-stone-400">⛺ laden...</div>
      </div>
    );
  }

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
          backgroundColor: '#1a3a2a', // fallback when image unavailable / offline
          backgroundImage:
            "linear-gradient(180deg, rgba(20,40,30,0.55) 0%, rgba(20,40,30,0.85) 100%), url('https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=70')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setActiveTab('paklijst');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
              aria-label="Naar paklijst"
            >
              <LogoMark className="w-8 h-8 rounded-[8px] shadow-sm" />
              <h1 className="text-lg font-bold tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
                A Campingflight To…
              </h1>
            </button>
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
                onClick={() => setShowAccountSheet(true)}
                className="flex items-center gap-1.5 text-xs bg-white/15 hover:bg-white/25 backdrop-blur px-3 py-1.5 rounded-full transition-all"
                title="Account & groep"
              >
                <span>👤</span>
                <span>{auth.session.memberName}</span>
              </button>
            </div>
          </div>
          <p className="text-xs text-white/70 mt-0.5 italic">Onderweg, paraat, gepakt.</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 pb-32">
        {activeTab === 'paklijst' && (
          <>
            <div className="relative flex bg-stone-200/60 rounded-xl p-1 mb-4">
              <div
                className="absolute top-1 bottom-1 bg-white rounded-lg shadow-sm transition-all duration-200 ease-out"
                style={{
                  left: pakSub === 'spullen' ? '0.25rem' : 'calc(50% + 0.25rem)',
                  width: 'calc(50% - 0.5rem)',
                }}
              />
              <button
                onClick={() => setPakSub('spullen')}
                className={`relative flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-200 ${
                  pakSub === 'spullen' ? 'text-stone-800' : 'text-stone-500'
                }`}
              >
                Spullen
              </button>
              <button
                onClick={() => setPakSub('boodschappen')}
                className={`relative flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-200 ${
                  pakSub === 'boodschappen' ? 'text-stone-800' : 'text-stone-500'
                }`}
              >
                Boodschappen
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
            locations={s.locations}
            setLocations={s.setLocations}
            wishlist={s.wishlist}
            setWishlist={s.setWishlist}
            onUndo={arm}
            savedMountains={s.tripConfig.savedMountains ?? []}
            onSaveMountain={name => s.setTripConfig({
              ...s.tripConfig,
              savedMountains: [...(s.tripConfig.savedMountains ?? []).filter(m => m !== name), name],
            })}
            onRemoveMountain={name => s.setTripConfig({
              ...s.tripConfig,
              savedMountains: (s.tripConfig.savedMountains ?? []).filter(m => m !== name),
            })}
          />
        )}

        {activeTab === 'beheer' && (
          <BeheerView items={s.items} onAdd={addItem} onDelete={deleteItem} onEdit={editItem} />
        )}
      </div>

      {/* Bottom tab bar — floating iOS-style pill */}
      <nav
        className="fixed inset-x-0 z-20 px-4 pointer-events-none"
        style={{ bottom: `calc(0.75rem + env(safe-area-inset-bottom))` }}
      >
        <div className="max-w-[25rem] mx-auto bg-white/90 backdrop-blur-md rounded-full shadow-[0_8px_28px_rgba(0,0,0,0.12)] border border-stone-200/70 p-1.5 flex pointer-events-auto">
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            const Icon = tab.Icon;
            return (
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
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-full transition-all ${
                  isActive
                    ? 'bg-green-600 text-white shadow-sm'
                    : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium leading-none tracking-wide">{tab.label}</span>
              </button>
            );
          })}
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

      {/* Account & group sheet */}
      {showAccountSheet && auth.group && auth.session && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4"
          onClick={() => setShowAccountSheet(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-stone-800">Mijn groep</h2>
              <button
                onClick={() => setShowAccountSheet(false)}
                className="text-stone-400 hover:text-stone-600 text-xl leading-none"
                aria-label="Sluiten"
              >×</button>
            </div>

            <div className="space-y-3">
              <div>
                <div className="text-xs text-stone-400 uppercase tracking-wide mb-1">Groep</div>
                <div className="text-stone-700 font-medium">{auth.group.name}</div>
              </div>

              <div>
                <div className="text-xs text-stone-400 uppercase tracking-wide mb-1">Invite-code</div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-stone-100 rounded-lg px-3 py-2 font-mono text-stone-700 tracking-[0.15em]">
                    {auth.group.inviteCode}
                  </code>
                  <button
                    onClick={() => navigator.clipboard?.writeText(auth.group!.inviteCode)}
                    className="text-xs text-stone-500 hover:text-stone-700 px-2 py-2 border border-stone-200 rounded-lg"
                  >Kopieer</button>
                </div>
                <p className="text-xs text-stone-400 mt-1.5">Deel deze code met iemand om hen toegang te geven tot dezelfde paklijst, campings, etc.</p>
              </div>

              <div>
                <div className="text-xs text-stone-400 uppercase tracking-wide mb-1">Leden</div>
                <div className="flex flex-wrap gap-1.5">
                  {auth.group.members.map(m => (
                    <span
                      key={m}
                      className={`text-xs px-2.5 py-1 rounded-full ${
                        m === auth.session!.memberName
                          ? 'bg-green-100 text-green-700 border border-green-200'
                          : 'bg-stone-100 text-stone-600'
                      }`}
                    >{m}{m === auth.session!.memberName ? ' (jij)' : ''}</span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-stone-100">
                <button
                  onClick={() => { auth.logout(); setShowAccountSheet(false); }}
                  className="w-full text-sm text-red-500 hover:text-red-700 font-medium py-2"
                >
                  Uitloggen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
