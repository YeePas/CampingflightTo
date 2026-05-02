import { PackItem, Tip, CheckedItems, TripConfig } from './types';
import { DEFAULT_ITEMS, DEFAULT_TIPS } from './defaultData';

const KEYS = {
  items: 'camping_items',
  tips: 'camping_tips',
  checked: 'camping_checked',
  tripConfig: 'camping_trip_config',
};

function get<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function set<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

export const storage = {
  getItems: (): PackItem[] => get(KEYS.items, DEFAULT_ITEMS),
  setItems: (items: PackItem[]) => set(KEYS.items, items),

  getTips: (): Tip[] => get(KEYS.tips, DEFAULT_TIPS),
  setTips: (tips: Tip[]) => set(KEYS.tips, tips),

  getChecked: (): CheckedItems => get(KEYS.checked, {}),
  setChecked: (checked: CheckedItems) => set(KEYS.checked, checked),

  getTripConfig: (): TripConfig =>
    get(KEYS.tripConfig, { type: 'weekend', mountains: false, kids: false }),
  setTripConfig: (config: TripConfig) => set(KEYS.tripConfig, config),

  resetChecked: () => set(KEYS.checked, {}),
};
