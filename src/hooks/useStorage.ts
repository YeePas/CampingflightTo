'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  PackItem, Tip, CheckedItems, TripConfig,
  GroceryItem, TripPreset, CampingLocation,
} from '@/lib/types';
import { DEFAULT_ITEMS } from '@/lib/defaultData';
import {
  subscribeItems, saveItems, fetchItems,
  subscribeTips, saveTips, fetchTips,
  subscribeState, saveChecked, saveTripConfig, fetchState,
  subscribeGroceries, saveGroceries, fetchGroceries,
  subscribePresets, savePresets, fetchPresets,
  subscribeLocations, saveLocations, fetchLocations,
} from '@/lib/firestore';

const DEFAULT_IDS = new Set(DEFAULT_ITEMS.map(i => i.id));

export function useCampingStore() {
  const [items, setItemsState] = useState<PackItem[]>([]);
  const [tips, setTipsState] = useState<Tip[]>([]);
  const [checked, setCheckedState] = useState<CheckedItems>({});
  const [tripConfig, setTripConfigState] = useState<TripConfig>({ type: 'weekend', mountains: false, kids: false });
  const [groceries, setGroceriesState] = useState<GroceryItem[]>([]);
  const [presets, setPresetsState] = useState<TripPreset[]>([]);
  const [locations, setLocationsState] = useState<CampingLocation[]>([]);

  const [mounted, setMounted] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // Tracks which default item IDs the user has deliberately deleted
  const deletedDefaultIdsRef = useRef<string[]>([]);

  const unsubsRef = useRef<Array<() => void>>([]);

  const refresh = useCallback(async () => {
    setSyncing(true);
    try {
      const [itemsDoc, t, s, g, p, l] = await Promise.all([
        fetchItems(), fetchTips(), fetchState(),
        fetchGroceries(), fetchPresets(), fetchLocations(),
      ]);
      setItemsState(itemsDoc.items);
      deletedDefaultIdsRef.current = itemsDoc.deletedDefaultIds;
      setTipsState(t);
      setCheckedState(s.checked);
      setTripConfigState(s.tripConfig);
      setGroceriesState(g);
      setPresetsState(p);
      setLocationsState(l);
      setLastSync(new Date());
    } finally {
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    refresh().catch(() => {}).finally(() => setMounted(true));

    unsubsRef.current = [
      subscribeItems(items => { setItemsState(items); setLastSync(new Date()); }),
      subscribeTips(tips => { setTipsState(tips); setLastSync(new Date()); }),
      subscribeState((checked, tripConfig) => {
        setCheckedState(checked);
        setTripConfigState(tripConfig);
        setLastSync(new Date());
      }),
      subscribeGroceries(g => { setGroceriesState(g); setLastSync(new Date()); }),
      subscribePresets(p => { setPresetsState(p); setLastSync(new Date()); }),
      subscribeLocations(l => { setLocationsState(l); setLastSync(new Date()); }),
    ];

    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh().catch(() => {});
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);

    return () => {
      unsubsRef.current.forEach(u => u());
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [refresh]);

  const wrapSet = <T,>(local: (v: T) => void, remote: (v: T) => Promise<unknown>) =>
    async (v: T) => {
      local(v);
      setSyncing(true);
      try { await remote(v); setLastSync(new Date()); } finally { setSyncing(false); }
    };

  // setItems: computes newly deleted default IDs and persists them
  const setItems = useCallback(async (newItems: PackItem[]) => {
    const newIds = new Set(newItems.map(i => i.id));
    const nowDeleted = [...DEFAULT_IDS].filter(id => !newIds.has(id));
    const allDeleted = [...new Set([...deletedDefaultIdsRef.current, ...nowDeleted])];
    deletedDefaultIdsRef.current = allDeleted;

    setItemsState(newItems);
    setSyncing(true);
    try {
      await saveItems(newItems, allDeleted);
      setLastSync(new Date());
    } finally {
      setSyncing(false);
    }
  }, []);

  const setTips = useCallback(wrapSet<Tip[]>(setTipsState, saveTips), []);
  const setTripConfig = useCallback(wrapSet<TripConfig>(setTripConfigState, saveTripConfig), []);
  const setGroceries = useCallback(wrapSet<GroceryItem[]>(setGroceriesState, saveGroceries), []);
  const setPresets = useCallback(wrapSet<TripPreset[]>(setPresetsState, savePresets), []);
  const setLocations = useCallback(wrapSet<CampingLocation[]>(setLocationsState, saveLocations), []);

  const toggleCheck = useCallback((id: string) => {
    setCheckedState(prev => {
      const next = { ...prev, [id]: !prev[id] };
      saveChecked(next).then(() => setLastSync(new Date()));
      return next;
    });
  }, []);

  const resetChecked = useCallback(async () => {
    setCheckedState({});
    setSyncing(true);
    try { await saveChecked({}); setLastSync(new Date()); } finally { setSyncing(false); }
  }, []);

  const filteredItems = items.filter(item => {
    if (!item.tripTypes.includes(tripConfig.type)) return false;
    if (item.mountains && !tripConfig.mountains) return false;
    if (item.kids && !tripConfig.kids) return false;
    return true;
  });

  return {
    items, setItems,
    tips, setTips,
    checked, tripConfig, setTripConfig,
    toggleCheck, resetChecked,
    filteredItems, mounted, syncing, lastSync, refresh,
    groceries, setGroceries,
    presets, setPresets,
    locations, setLocations,
  };
}
