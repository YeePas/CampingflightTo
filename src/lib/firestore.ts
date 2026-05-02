import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import {
  PackItem, Tip, CheckedItems, TripConfig,
  GroceryItem, TripPreset, CampingLocation, DiaryEntry,
} from './types';
import { DEFAULT_ITEMS, DEFAULT_TIPS } from './defaultData';

const REF = {
  items: () => doc(db, 'camping', 'items'),
  tips: () => doc(db, 'camping', 'tips'),
  state: () => doc(db, 'camping', 'state'),
  groceries: () => doc(db, 'camping', 'groceries'),
  presets: () => doc(db, 'camping', 'presets'),
  locations: () => doc(db, 'camping', 'locations'),
  diary: () => doc(db, 'camping', 'diary'),
};

// --- Items ---

export async function fetchItems(): Promise<PackItem[]> {
  const snap = await getDoc(REF.items());
  if (!snap.exists()) {
    await setDoc(REF.items(), { items: DEFAULT_ITEMS });
    return DEFAULT_ITEMS;
  }
  // Merge any new defaults that aren't yet in the user's list (by id)
  const existing = snap.data().items as PackItem[];
  const existingIds = new Set(existing.map(i => i.id));
  const missing = DEFAULT_ITEMS.filter(i => !existingIds.has(i.id));
  if (missing.length > 0) {
    const merged = [...existing, ...missing];
    await setDoc(REF.items(), { items: merged });
    return merged;
  }
  return existing;
}

export async function saveItems(items: PackItem[]): Promise<void> {
  await setDoc(REF.items(), { items });
}

export function subscribeItems(cb: (items: PackItem[]) => void): () => void {
  return onSnapshot(REF.items(), snap => {
    if (snap.exists()) cb(snap.data().items as PackItem[]);
  });
}

// --- Tips ---

export async function fetchTips(): Promise<Tip[]> {
  const snap = await getDoc(REF.tips());
  if (!snap.exists()) {
    await setDoc(REF.tips(), { tips: DEFAULT_TIPS });
    return DEFAULT_TIPS;
  }
  const existing = snap.data().tips as Tip[];
  const existingIds = new Set(existing.map(t => t.id));
  const missing = DEFAULT_TIPS.filter(t => !existingIds.has(t.id));
  if (missing.length > 0) {
    const merged = [...existing, ...missing];
    await setDoc(REF.tips(), { tips: merged });
    return merged;
  }
  return existing;
}

export async function saveTips(tips: Tip[]): Promise<void> {
  await setDoc(REF.tips(), { tips });
}

export function subscribeTips(cb: (tips: Tip[]) => void): () => void {
  return onSnapshot(REF.tips(), snap => {
    if (snap.exists()) cb(snap.data().tips as Tip[]);
  });
}

// --- State (checked + tripConfig) ---

export async function fetchState(): Promise<{ checked: CheckedItems; tripConfig: TripConfig }> {
  const snap = await getDoc(REF.state());
  if (snap.exists()) return snap.data() as { checked: CheckedItems; tripConfig: TripConfig };
  const defaults = { checked: {}, tripConfig: { type: 'weekend' as const, mountains: false, kids: false } };
  await setDoc(REF.state(), defaults);
  return defaults;
}

export async function saveChecked(checked: CheckedItems): Promise<void> {
  await setDoc(REF.state(), { checked }, { merge: true });
}

export async function saveTripConfig(tripConfig: TripConfig): Promise<void> {
  await setDoc(REF.state(), { tripConfig }, { merge: true });
}

export function subscribeState(cb: (checked: CheckedItems, tripConfig: TripConfig) => void): () => void {
  return onSnapshot(REF.state(), snap => {
    if (snap.exists()) {
      const data = snap.data();
      cb(data.checked ?? {}, data.tripConfig ?? { type: 'weekend', mountains: false, kids: false });
    }
  });
}

// --- Generic helpers for new collections ---

async function fetchList<T>(ref: ReturnType<typeof REF.groceries>, key: string, fallback: T[] = []): Promise<T[]> {
  const snap = await getDoc(ref);
  if (snap.exists()) return (snap.data()[key] ?? fallback) as T[];
  await setDoc(ref, { [key]: fallback });
  return fallback;
}

function subscribeList<T>(ref: ReturnType<typeof REF.groceries>, key: string, cb: (list: T[]) => void) {
  return onSnapshot(ref, snap => {
    if (snap.exists()) cb((snap.data()[key] ?? []) as T[]);
  });
}

// Groceries
export const fetchGroceries = () => fetchList<GroceryItem>(REF.groceries(), 'groceries');
export const saveGroceries = (groceries: GroceryItem[]) => setDoc(REF.groceries(), { groceries });
export const subscribeGroceries = (cb: (g: GroceryItem[]) => void) => subscribeList<GroceryItem>(REF.groceries(), 'groceries', cb);

// Presets
export const fetchPresets = () => fetchList<TripPreset>(REF.presets(), 'presets');
export const savePresets = (presets: TripPreset[]) => setDoc(REF.presets(), { presets });
export const subscribePresets = (cb: (p: TripPreset[]) => void) => subscribeList<TripPreset>(REF.presets(), 'presets', cb);

// Locations
export const fetchLocations = () => fetchList<CampingLocation>(REF.locations(), 'locations');
export const saveLocations = (locations: CampingLocation[]) => setDoc(REF.locations(), { locations });
export const subscribeLocations = (cb: (l: CampingLocation[]) => void) => subscribeList<CampingLocation>(REF.locations(), 'locations', cb);

// Diary
export const fetchDiary = () => fetchList<DiaryEntry>(REF.diary(), 'diary');
export const saveDiary = (diary: DiaryEntry[]) => setDoc(REF.diary(), { diary });
export const subscribeDiary = (cb: (d: DiaryEntry[]) => void) => subscribeList<DiaryEntry>(REF.diary(), 'diary', cb);
