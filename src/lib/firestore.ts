import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import {
  PackItem, Tip, CheckedItems, TripConfig,
  GroceryItem, CampingLocation, WishlistItem,
} from './types';
import { DEFAULT_ITEMS, DEFAULT_TIPS } from './defaultData';

const REF = {
  items: () => doc(db, 'camping', 'items'),
  tips: () => doc(db, 'camping', 'tips'),
  state: () => doc(db, 'camping', 'state'),
  groceries: () => doc(db, 'camping', 'groceries'),
  locations: () => doc(db, 'camping', 'locations'),
  wishlist: () => doc(db, 'camping', 'wishlist'),
};

// --- Items ---

export interface ItemsDoc {
  items: PackItem[];
  /** IDs of default items the user deliberately deleted — never auto-merged back */
  deletedDefaultIds: string[];
}

export async function fetchItems(): Promise<ItemsDoc> {
  const snap = await getDoc(REF.items());

  if (!snap.exists()) {
    const doc: ItemsDoc = { items: DEFAULT_ITEMS, deletedDefaultIds: [] };
    await setDoc(REF.items(), doc);
    return doc;
  }

  const existing = snap.data().items as PackItem[];
  const deletedDefaultIds: string[] = snap.data().deletedDefaultIds ?? [];
  const deletedSet = new Set(deletedDefaultIds);

  // Migrate: sync tripTypes exactly for default items (adds new types AND removes removed ones)
  // Also strip retired 'dag' type from ALL items (default and custom).
  let migrated = false;
  const migratedExisting = existing.map(item => {
    const def = DEFAULT_ITEMS.find(d => d.id === item.id);

    if (def) {
      // Default item — sync tripTypes exactly to current defaults
      const currentTypes = item.tripTypes as string[];
      const same = def.tripTypes.length === currentTypes.length &&
                   def.tripTypes.every(t => currentTypes.includes(t));
      if (!same) { migrated = true; return { ...item, tripTypes: def.tripTypes }; }
      return item;
    }

    // Custom item — only strip retired 'dag' if present (old Firestore data)
    if ((item.tripTypes as string[]).includes('dag')) {
      migrated = true;
      const without = (item.tripTypes as string[]).filter(t => t !== 'dag') as PackItem['tripTypes'];
      return { ...item, tripTypes: without.length > 0 ? without : ['weekend' as const] };
    }
    return item;
  });
  const base = migrated ? migratedExisting : existing;
  const existingIds = new Set(base.map((i: PackItem) => i.id));

  // Merge new defaults that are not yet in the list AND not deliberately deleted
  const missing = DEFAULT_ITEMS.filter(i => !existingIds.has(i.id) && !deletedSet.has(i.id));

  if (missing.length > 0 || migrated) {
    const merged = [...base, ...missing];
    await setDoc(REF.items(), { items: merged, deletedDefaultIds });
    return { items: merged, deletedDefaultIds };
  }

  return { items: existing, deletedDefaultIds };
}

export async function saveItems(items: PackItem[], deletedDefaultIds: string[]): Promise<void> {
  await setDoc(REF.items(), { items, deletedDefaultIds });
}

export function subscribeItems(cb: (items: PackItem[], deletedDefaultIds: string[]) => void): () => void {
  return onSnapshot(REF.items(), snap => {
    if (snap.exists()) cb(
      snap.data().items as PackItem[],
      snap.data().deletedDefaultIds ?? [],
    );
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

  // Merge new default tips not yet in Firestore
  const missing = DEFAULT_TIPS.filter(t => !existingIds.has(t.id));

  // Backfill imageUrl and knotIcon from defaults onto existing tips
  let imagePatched = false;
  const patched = existing.map(tip => {
    const def = DEFAULT_TIPS.find(d => d.id === tip.id);
    if (!def) return tip;
    const updates: Partial<typeof tip> = {};
    if (def.imageUrl && !tip.imageUrl) updates.imageUrl = def.imageUrl;
    if (def.knotIcon && tip.knotIcon !== def.knotIcon) updates.knotIcon = def.knotIcon;
    if (Object.keys(updates).length > 0) { imagePatched = true; return { ...tip, ...updates }; }
    return tip;
  });

  if (missing.length > 0 || imagePatched) {
    const merged = [...patched, ...missing];
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
  if (snap.exists()) {
    const data = snap.data() as { checked: CheckedItems; tripConfig: TripConfig };
    // Migrate 'dag' to 'weekend' — dag is no longer a selectable trip type (old Firestore data)
    if ((data.tripConfig?.type as string) === 'dag') {
      data.tripConfig = { ...data.tripConfig, type: 'weekend' };
      await setDoc(REF.state(), data, { merge: true });
    }
    return data;
  }
  const defaults = { checked: {}, tripConfig: { type: 'weekend' as const, mountains: false, kids: false } };
  await setDoc(REF.state(), defaults);
  return defaults;
}

export async function saveChecked(checked: CheckedItems): Promise<void> {
  await setDoc(REF.state(), { checked }, { merge: true });
}

export async function saveTripConfig(tripConfig: TripConfig): Promise<void> {
  const clean: TripConfig = {
    type: tripConfig.type,
    mountains: tripConfig.mountains,
    kids: tripConfig.kids,
    ...(tripConfig.departureDate ? { departureDate: tripConfig.departureDate } : {}),
    ...(tripConfig.weatherPlace  ? { weatherPlace:  tripConfig.weatherPlace  } : {}),
  };
  await setDoc(REF.state(), { tripConfig: clean }, { merge: true });
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
  if (!snap.exists()) return fallback; // Don't create doc on fetch — it's created on first save
  return (snap.data()[key] ?? fallback) as T[];
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

// Locations
export const fetchLocations = () => fetchList<CampingLocation>(REF.locations(), 'locations');
export const saveLocations = (locations: CampingLocation[]) => setDoc(REF.locations(), { locations });
export const subscribeLocations = (cb: (l: CampingLocation[]) => void) => subscribeList<CampingLocation>(REF.locations(), 'locations', cb);

// Wishlist
export const fetchWishlist = () => fetchList<WishlistItem>(REF.wishlist(), 'wishlist');
export const saveWishlist = (wishlist: WishlistItem[]) => setDoc(REF.wishlist(), { wishlist });
export const subscribeWishlist = (cb: (w: WishlistItem[]) => void) => subscribeList<WishlistItem>(REF.wishlist(), 'wishlist', cb);
