'use client';

import { useState, useEffect, useCallback } from 'react';
import { PackItem, Tip, CheckedItems, TripConfig } from '@/lib/types';
import { storage } from '@/lib/storage';

export function useCampingStore() {
  const [items, setItemsState] = useState<PackItem[]>([]);
  const [tips, setTipsState] = useState<Tip[]>([]);
  const [checked, setCheckedState] = useState<CheckedItems>({});
  const [tripConfig, setTripConfigState] = useState<TripConfig>({ type: 'weekend', mountains: false, kids: false });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setItemsState(storage.getItems());
    setTipsState(storage.getTips());
    setCheckedState(storage.getChecked());
    setTripConfigState(storage.getTripConfig());
    setMounted(true);
  }, []);

  const setItems = useCallback((items: PackItem[]) => {
    storage.setItems(items);
    setItemsState(items);
  }, []);

  const setTips = useCallback((tips: Tip[]) => {
    storage.setTips(tips);
    setTipsState(tips);
  }, []);

  const setChecked = useCallback((checked: CheckedItems) => {
    storage.setChecked(checked);
    setCheckedState(checked);
  }, []);

  const setTripConfig = useCallback((config: TripConfig) => {
    storage.setTripConfig(config);
    setTripConfigState(config);
  }, []);

  const toggleCheck = useCallback((id: string) => {
    setCheckedState(prev => {
      const next = { ...prev, [id]: !prev[id] };
      storage.setChecked(next);
      return next;
    });
  }, []);

  const resetChecked = useCallback(() => {
    storage.resetChecked();
    setCheckedState({});
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
    setChecked,
    tripConfig,
    setTripConfig,
    toggleCheck,
    resetChecked,
    filteredItems,
    mounted,
  };
}
