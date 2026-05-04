'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  PackItem, Tip, CheckedItems, TripConfig,
  GroceryItem, CampingLocation, WishlistItem,
} from '@/lib/types';
import { DEFAULT_ITEMS } from '@/lib/defaultData';
import {
  subscribeItems, saveItems, fetchItems,
  subscribeTips, saveTips, fetchTips,
  subscribeState, saveChecked, saveTripConfig, fetchState,
  subscribeGroceries, saveGroceries, fetchGroceries,
  subscribeLocations, saveLocations, fetchLocations,
  subscribeWishlist, saveWishlist, fetchWishlist,
} from '@/lib/firestore';

const DEFAULT_IDS = new Set(DEFAULT_ITEMS.map(i => i.id));

export function useCampingStore() {
  const [items, setItemsState] = useState<PackItem[]>([]);
  const [tips, setTipsState] = useState<Tip[]>([]);
  const [checked, setCheckedState] = useState<CheckedItems>({});
  const [tripConfig, setTripConfigState] = useState<TripConfig>({ type: 'weekend', mountains: false, kids: false });
  const [groceries, setGroceriesState] = useState<GroceryItem[]>([]);
  const [locations, setLocationsState] = useState<CampingLocation[]>([]);
  const [wishlist, setWishlistState] = useState<WishlistItem[]>([]);

  // Always-current refs so functional updaters in setLocations/setWishlist read fresh state
  const locationsRef = useRef<CampingLocation[]>([]);
  const wishlistRef = useRef<WishlistItem[]>([]);

  const [mounted, setMounted] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // Tracks which default item IDs the user has deliberately deleted
  const deletedDefaultIdsRef = useRef<string[]>([]);

  const unsubsRef = useRef<Array<() => void>>([]);

  const refresh = useCallback(async () => {
    setSyncing(true);
    try {
      const [itemsDoc, t, s, g, l, w] = await Promise.all([
        fetchItems(), fetchTips(), fetchState(),
        fetchGroceries(), fetchLocations(), fetchWishlist(),
      ]);
      setItemsState(itemsDoc.items);
      deletedDefaultIdsRef.current = itemsDoc.deletedDefaultIds;
      setTipsState(t);
      setCheckedState(s.checked);
      setTripConfigState(s.tripConfig);
      setGroceriesState(g);
      locationsRef.current = l; setLocationsState(l);
      wishlistRef.current = w; setWishlistState(w);
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
      subscribeLocations(l => { locationsRef.current = l; setLocationsState(l); setLastSync(new Date()); }),
      subscribeWishlist(w => { wishlistRef.current = w; setWishlistState(w); setLastSync(new Date()); }),
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

  // setLocations / setWishlist support both plain arrays and functional updaters so that
  // closures (e.g. undo callbacks, checklist toggles) never operate on stale snapshot data.
  type Updater<T> = T | ((prev: T) => T);

  const setLocations = useCallback(async (updater: Updater<CampingLocation[]>) => {
    const next = typeof updater === 'function' ? updater(locationsRef.current) : updater;
    locationsRef.current = next;
    setLocationsState(next);
    setSyncing(true);
    try { await saveLocations(next); setLastSync(new Date()); } finally { setSyncing(false); }
  }, []);

  const setWishlist = useCallback(async (updater: Updater<WishlistItem[]>) => {
    const next = typeof updater === 'function' ? updater(wishlistRef.current) : updater;
    wishlistRef.current = next;
    setWishlistState(next);
    setSyncing(true);
    try { await saveWishlist(next); setLastSync(new Date()); } finally { setSyncing(false); }
  }, []);

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
    const effectiveMountains = tripConfig.mountains || tripConfig.type === 'wandeldag' || tripConfig.type === 'wandeltrip';
    if (item.mountains && !effectiveMountains) return false;
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
    locations, setLocations,
    wishlist, setWishlist,
  };
}
