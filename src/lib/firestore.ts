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

// =============================================================================
// Generic default-sync helper
// =============================================================================
//
// THE RULE: defaultData.ts is the single source of truth for default items/tips.
// Whatever fields you put on a default in code, will be in Firestore on next load.
//
// - Default items (id matches a default): code is authoritative for ALL fields,
//   except `preserveFields` which keep their user value (e.g. notes / quantity).
// - Custom items (user-created, id not in defaults): never touched.
// - Defaults the user explicitly deleted (in `deletedDefaultIds`) stay deleted.
//
// This avoids the recurring bug of having to add a per-field migration line for
// every new property added to defaultData.
//
function syncDefaults<T extends { id: string }>(opts: {
  existing: T[];
  defaults: T[];
  deletedDefaultIds: string[];
  preserveFields?: (keyof T)[];
}): { merged: T[]; changed: boolean } {
  const { existing, defaults, deletedDefaultIds, preserveFields = [] } = opts;
  const defaultIds = new Set(defaults.map(d => d.id));
  const deletedSet = new Set(deletedDefaultIds);
  const existingMap = new Map(existing.map(e => [e.id, e]));

  let changed = false;
  const result: T[] = [];

  // 1. Defaults — keep them in defaultData order, code wins on every field
  for (const def of defaults) {
    if (deletedSet.has(def.id)) continue;
    const cur = existingMap.get(def.id);

    if (!cur) {
      result.push(def);
      changed = true;
      continue;
    }

    const overlay: Partial<T> = {};
    for (const field of preserveFields) {
      const v = cur[field];
      if (v !== undefined) overlay[field] = v;
    }
    const merged = { ...def, ...overlay };

    if (!shallowEqual(merged, cur)) {
      result.push(merged);
      changed = true;
    } else {
      result.push(cur);
    }
  }

  // 2. Custom items at the end — left alone
  for (const item of existing) {
    if (!defaultIds.has(item.id)) result.push(item);
  }

  return { merged: result, changed };
}

function shallowEqual<T extends object>(a: T, b: T): boolean {
  const ak = Object.keys(a) as (keyof T)[];
  const bk = Object.keys(b) as (keyof T)[];
  if (ak.length !== bk.length) return false;
  for (const k of ak) {
    const av = a[k], bv = b[k];
    if (Array.isArray(av) && Array.isArray(bv)) {
      if (av.length !== bv.length) return false;
      for (let i = 0; i < av.length; i++) if (av[i] !== bv[i]) return false;
    } else if (av !== bv) {
      return false;
    }
  }
  return true;
}

// =============================================================================
// Items
// =============================================================================

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

  // Strip retired 'dag' tripType (legacy data)
  let stripped = false;
  const cleaned = existing.map(item => {
    const types = item.tripTypes as string[];
    if (types.includes('dag')) {
      stripped = true;
      const without = types.filter(t => t !== 'dag') as PackItem['tripTypes'];
      return { ...item, tripTypes: without.length > 0 ? without : ['weekend' as const] };
    }
    return item;
  });

  // User can add `quantity` and `notes` to a default item — preserve those across syncs
  const { merged, changed } = syncDefaults({
    existing: cleaned,
    defaults: DEFAULT_ITEMS,
    deletedDefaultIds,
    preserveFields: ['quantity', 'notes'],
  });

  if (changed || stripped) {
    await setDoc(REF.items(), { items: merged, deletedDefaultIds });
  }
  return { items: merged, deletedDefaultIds };
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

// =============================================================================
// Tips
// =============================================================================

export interface TipsDoc {
  tips: Tip[];
  deletedDefaultIds: string[];
}

// Tip IDs that should be removed entirely (was a default, now deprecated)
const RETIRED_TIP_IDS = new Set(['t6']); // Kinderen motiveren

export async function fetchTips(): Promise<TipsDoc> {
  const snap = await getDoc(REF.tips());

  if (!snap.exists()) {
    const doc: TipsDoc = { tips: DEFAULT_TIPS, deletedDefaultIds: [] };
    await setDoc(REF.tips(), doc);
    return doc;
  }

  const existing = (snap.data().tips ?? []) as Tip[];
  let deletedDefaultIds: string[] = snap.data().deletedDefaultIds ?? [];

  // First-time migration: if doc has no deletedDefaultIds field, infer it from
  // which defaults are missing (so prior user-deletions aren't undone)
  let firstTimeDeletionMigration = false;
  if (snap.data().deletedDefaultIds === undefined) {
    const presentIds = new Set(existing.map(t => t.id));
    deletedDefaultIds = DEFAULT_TIPS
      .filter(d => !presentIds.has(d.id) && !RETIRED_TIP_IDS.has(d.id))
      .map(d => d.id);
    firstTimeDeletionMigration = true;
  }

  // Drop retired tips and migrate retired categories on custom tips
  let cleanedChanged = false;
  const cleaned = existing
    .filter(t => {
      if (RETIRED_TIP_IDS.has(t.id)) { cleanedChanged = true; return false; }
      return true;
    })
    .map(tip => {
      const cat = tip.category as string;
      if (cat === 'Kinderen' || cat === 'Algemeen') {
        cleanedChanged = true;
        return { ...tip, category: tip.id === 't7' ? 'Knopen' : 'Bergen' };
      }
      if (cat === 'Veiligheid') {
        cleanedChanged = true;
        return { ...tip, category: 'Bergen' };
      }
      return tip;
    });

  const { merged, changed } = syncDefaults({
    existing: cleaned,
    defaults: DEFAULT_TIPS,
    deletedDefaultIds,
  });

  if (changed || cleanedChanged || firstTimeDeletionMigration) {
    await setDoc(REF.tips(), { tips: merged, deletedDefaultIds });
  }
  return { tips: merged, deletedDefaultIds };
}

export async function saveTips(tips: Tip[], deletedDefaultIds: string[]): Promise<void> {
  await setDoc(REF.tips(), { tips, deletedDefaultIds });
}

export function subscribeTips(cb: (tips: Tip[], deletedDefaultIds: string[]) => void): () => void {
  return onSnapshot(REF.tips(), snap => {
    if (snap.exists()) cb(
      (snap.data().tips ?? []) as Tip[],
      snap.data().deletedDefaultIds ?? [],
    );
  });
}

// =============================================================================
// State (checked + tripConfig)
// =============================================================================

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
    ...(tripConfig.savedMountains?.length ? { savedMountains: tripConfig.savedMountains } : {}),
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

// =============================================================================
// Generic helpers for plain list collections (no defaults)
// =============================================================================

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
