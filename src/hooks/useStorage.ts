'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { PackItem, Tip, CheckedItems, TripConfig } from '@/lib/types';
import {
  subscribeItems, saveItems,
  subscribeTips, saveTips,
  subscribeState, saveChecked, saveTripConfig,
  fetchItems, fetchTips, fetchState,
} from '@/lib/firestore';

export function useCampingStore() {
  const [items, setItemsState] = useState<PackItem[]>([]);
  const [tips, setTipsState] = useState<Tip[]>([]);
  const [checked, setCheckedState] = useState<CheckedItems>({});
  const [tripConfig, setTripConfigState] = useState<TripConfig>({ type: 'weekend', mountains: false, kids: false });
  const [mounted, setMounted] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Track whether initial data is loaded to avoid overwriting remote with empty local
  const ready = useRef(false);

  useEffect(() => {
    // Initial fetch to seed data if needed, then subscribe for realtime updates
    Promise.all([fetchItems(), fetchTips(), fetchState()]).then(([i, t, s]) => {
      setItemsState(i);
      setTipsState(t);
      setCheckedState(s.checked);
      setTripConfigState(s.tripConfig);
      setMounted(true);
      ready.current = true;
    }).catch(() => {
      // Firebase not configured yet — fall through without crashing
      setMounted(true);
      ready.current = true;
    });

    const unsubItems = subscribeItems(items => setItemsState(items));
    const unsubTips = subscribeTips(tips => setTipsState(tips));
    const unsubState = subscribeState((checked, tripConfig) => {
      setCheckedState(checked);
      setTripConfigState(tripConfig);
    });

    return () => { unsubItems(); unsubTips(); unsubState(); };
  }, []);

  const setItems = useCallback(async (items: PackItem[]) => {
    setItemsState(items);
    setSyncing(true);
    await saveItems(items).finally(() => setSyncing(false));
  }, []);

  const setTips = useCallback(async (tips: Tip[]) => {
    setTipsState(tips);
    setSyncing(true);
    await saveTips(tips).finally(() => setSyncing(false));
  }, []);

  const setTripConfig = useCallback(async (config: TripConfig) => {
    setTripConfigState(config);
    setSyncing(true);
    await saveTripConfig(config).finally(() => setSyncing(false));
  }, []);

  const toggleCheck = useCallback(async (id: string) => {
    setCheckedState(prev => {
      const next = { ...prev, [id]: !prev[id] };
      saveChecked(next);
      return next;
    });
  }, []);

  const resetChecked = useCallback(async () => {
    setCheckedState({});
    setSyncing(true);
    await saveChecked({}).finally(() => setSyncing(false));
  }, []);

  const filteredItems = items.filter(item => {
    if (!item.tripTypes.includes(tripConfig.type)) return false;
    if (item.mountains && !tripConfig.mountains) return false;
    if (item.kids && !tripConfig.kids) return false;
    return true;
  });

  return {
    items,
    setItems,
    tips,
    setTips,
    checked,
    tripConfig,
    setTripConfig,
    toggleCheck,
    resetChecked,
    filteredItems,
    mounted,
    syncing,
  };
}
