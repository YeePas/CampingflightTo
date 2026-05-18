'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  PackItem, Tip, CheckedItems, TripConfig,
  GroceryItem, CampingLocation, WishlistItem,
} from '@/lib/types';
import { DEFAULT_ITEMS, DEFAULT_TIPS } from '@/lib/defaultData';
import {
  subscribeItems, saveItems, fetchItems,
  subscribeTips, saveTips, fetchTips,
  subscribeState, saveChecked, saveTripConfig, fetchState,
  subscribeGroceries, saveGroceries, fetchGroceries,
  subscribeLocations, saveLocations, fetchLocations,
  subscribeWishlist, saveWishlist, fetchWishlist,
} from '@/lib/firestore';

const DEFAULT_ITEM_IDS = new Set(DEFAULT_ITEMS.map(i => i.id));
const DEFAULT_TIP_IDS = new Set(DEFAULT_TIPS.map(t => t.id));

export function useCampingStore(groupId: string | null) {
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

  // Tracks which default IDs the user has deliberately deleted (per collection)
  const deletedDefaultItemIdsRef = useRef<string[]>([]);
  const deletedDefaultTipIdsRef = useRef<string[]>([]);

  const unsubsRef = useRef<Array<() => void>>([]);

  const refresh = useCallback(async () => {
    if (!groupId) return;
    setSyncing(true);
    try {
      const [itemsDoc, tipsDoc, s, g, l, w] = await Promise.all([
        fetchItems(groupId), fetchTips(groupId), fetchState(groupId),
        fetchGroceries(groupId), fetchLocations(groupId), fetchWishlist(groupId),
      ]);
      setItemsState(itemsDoc.items);
      deletedDefaultItemIdsRef.current = itemsDoc.deletedDefaultIds;
      setTipsState(tipsDoc.tips);
      deletedDefaultTipIdsRef.current = tipsDoc.deletedDefaultIds;
      setCheckedState(s.checked);
      setTripConfigState(s.tripConfig);
      setGroceriesState(g);
      locationsRef.current = l; setLocationsState(l);
      wishlistRef.current = w; setWishlistState(w);
      setLastSync(new Date());
    } finally {
      setSyncing(false);
    }
  }, [groupId]);

  useEffect(() => {
    // Switching groups: reset everything & re-subscribe
    unsubsRef.current.forEach(u => u());
    unsubsRef.current = [];
    setMounted(false);

    if (!groupId) {
      setItemsState([]); setTipsState([]); setCheckedState({});
      setGroceriesState([]); setLocationsState([]); setWishlistState([]);
      locationsRef.current = []; wishlistRef.current = [];
      setMounted(true);
      return;
    }

    refresh().catch(() => {}).finally(() => setMounted(true));

    unsubsRef.current = [
      subscribeItems(groupId, (items, deletedIds) => {
        setItemsState(items);
        if (deletedIds) deletedDefaultItemIdsRef.current = deletedIds;
        setLastSync(new Date());
      }),
      subscribeTips(groupId, (tips, deletedIds) => {
        setTipsState(tips);
        if (deletedIds) deletedDefaultTipIdsRef.current = deletedIds;
        setLastSync(new Date());
      }),
      subscribeState(groupId, (checked, tripConfig) => {
        setCheckedState(checked);
        setTripConfigState(tripConfig);
        setLastSync(new Date());
      }),
      subscribeGroceries(groupId, g => { setGroceriesState(g); setLastSync(new Date()); }),
      subscribeLocations(groupId, l => { locationsRef.current = l; setLocationsState(l); setLastSync(new Date()); }),
      subscribeWishlist(groupId, w => { wishlistRef.current = w; setWishlistState(w); setLastSync(new Date()); }),
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
  }, [refresh, groupId]);

  const noGroup = !groupId;

  // setItems: computes newly deleted default IDs and persists them
  const setItems = useCallback(async (newItems: PackItem[]) => {
    if (noGroup || !groupId) return;
    const newIds = new Set(newItems.map(i => i.id));
    const nowDeleted = [...DEFAULT_ITEM_IDS].filter(id => !newIds.has(id));
    const allDeleted = [...new Set([...deletedDefaultItemIdsRef.current, ...nowDeleted])];
    deletedDefaultItemIdsRef.current = allDeleted;

    setItemsState(newItems);
    setSyncing(true);
    try {
      await saveItems(groupId, newItems, allDeleted);
      setLastSync(new Date());
    } finally {
      setSyncing(false);
    }
  }, [groupId, noGroup]);

  // setTips: same pattern — track which default tips the user removed
  const setTips = useCallback(async (newTips: Tip[]) => {
    if (noGroup || !groupId) return;
    const newIds = new Set(newTips.map(t => t.id));
    const nowDeleted = [...DEFAULT_TIP_IDS].filter(id => !newIds.has(id));
    const allDeleted = [...new Set([...deletedDefaultTipIdsRef.current, ...nowDeleted])];
    deletedDefaultTipIdsRef.current = allDeleted;

    setTipsState(newTips);
    setSyncing(true);
    try {
      await saveTips(groupId, newTips, allDeleted);
      setLastSync(new Date());
    } finally {
      setSyncing(false);
    }
  }, [groupId, noGroup]);

  const setTripConfig = useCallback(async (v: TripConfig) => {
    if (!groupId) return;
    setTripConfigState(v);
    setSyncing(true);
    try { await saveTripConfig(groupId, v); setLastSync(new Date()); } finally { setSyncing(false); }
  }, [groupId]);

  const setGroceries = useCallback(async (v: GroceryItem[]) => {
    if (!groupId) return;
    setGroceriesState(v);
    setSyncing(true);
    try { await saveGroceries(groupId, v); setLastSync(new Date()); } finally { setSyncing(false); }
  }, [groupId]);

  // setLocations / setWishlist support both plain arrays and functional updaters so that
  // closures (e.g. undo callbacks, checklist toggles) never operate on stale snapshot data.
  type Updater<T> = T | ((prev: T) => T);

  const setLocations = useCallback(async (updater: Updater<CampingLocation[]>) => {
    if (!groupId) return;
    const next = typeof updater === 'function' ? updater(locationsRef.current) : updater;
    locationsRef.current = next;
    setLocationsState(next);
    setSyncing(true);
    try { await saveLocations(groupId, next); setLastSync(new Date()); } finally { setSyncing(false); }
  }, [groupId]);

  const setWishlist = useCallback(async (updater: Updater<WishlistItem[]>) => {
    if (!groupId) return;
    const next = typeof updater === 'function' ? updater(wishlistRef.current) : updater;
    wishlistRef.current = next;
    setWishlistState(next);
    setSyncing(true);
    try { await saveWishlist(groupId, next); setLastSync(new Date()); } finally { setSyncing(false); }
  }, [groupId]);

  const toggleCheck = useCallback((id: string) => {
    if (!groupId) return;
    setCheckedState(prev => {
      const next = { ...prev, [id]: !prev[id] };
      saveChecked(groupId, next).then(() => setLastSync(new Date()));
      return next;
    });
  }, [groupId]);

  const resetChecked = useCallback(async () => {
    if (!groupId) return;
    setCheckedState({});
    setSyncing(true);
    try { await saveChecked(groupId, {}); setLastSync(new Date()); } finally { setSyncing(false); }
  }, [groupId]);

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
