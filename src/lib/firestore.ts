import {
  doc, getDoc, setDoc, onSnapshot,
  collection, query, where, getDocs, updateDoc, arrayUnion,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  PackItem, Tip, CheckedItems, TripConfig,
  GroceryItem, CampingLocation, WishlistItem, Group,
} from './types';
import { DEFAULT_ITEMS, DEFAULT_TIPS } from './defaultData';

// =============================================================================
// Refs — everything is scoped under groups/{groupId}/data/{collection}
// =============================================================================

const REF = (groupId: string) => ({
  group:     ()                => doc(db, 'groups', groupId),
  items:     ()                => doc(db, 'groups', groupId, 'data', 'items'),
  tips:      ()                => doc(db, 'groups', groupId, 'data', 'tips'),
  state:     ()                => doc(db, 'groups', groupId, 'data', 'state'),
  groceries: ()                => doc(db, 'groups', groupId, 'data', 'groceries'),
  locations: ()                => doc(db, 'groups', groupId, 'data', 'locations'),
  wishlist:  ()                => doc(db, 'groups', groupId, 'data', 'wishlist'),
});

// =============================================================================
// Groups (workspace management)
// =============================================================================

/** Generate a short, memorable invite code like "BERG-2745". */
function genInviteCode(): string {
  const words = ['BERG', 'TENT', 'KAMP', 'BOOM', 'VUUR', 'PAD', 'TOP', 'MEER', 'WIND', 'ROTS'];
  const w = words[Math.floor(Math.random() * words.length)];
  const n = Math.floor(1000 + Math.random() * 9000);
  return `${w}-${n}`;
}

/** Random short group id slug, e.g. "g-xa9q12". */
function genGroupId(): string {
  return 'g-' + Math.random().toString(36).slice(2, 8);
}

/** Look up a group by its invite code (case-insensitive). Returns null if not found. */
export async function findGroupByCode(code: string): Promise<Group | null> {
  const normalized = code.trim().toUpperCase();
  const q = query(collection(db, 'groups'), where('inviteCode', '==', normalized));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].data() as Group;
}

/** Create a new group. Returns the created Group (incl. generated id + code). */
export async function createGroup(name: string, firstMemberName: string): Promise<Group> {
  let id = genGroupId();
  // Tiny collision guard — extremely unlikely but safe
  for (let i = 0; i < 5; i++) {
    const existing = await getDoc(doc(db, 'groups', id));
    if (!existing.exists()) break;
    id = genGroupId();
  }

  let inviteCode = genInviteCode();
  for (let i = 0; i < 5; i++) {
    const dup = await findGroupByCode(inviteCode);
    if (!dup) break;
    inviteCode = genInviteCode();
  }

  const group: Group = {
    id,
    name: name.trim() || 'Mijn groep',
    inviteCode,
    members: [firstMemberName.trim()],
    createdAt: Date.now(),
  };
  await setDoc(doc(db, 'groups', id), group);
  return group;
}

/** Add a member name to an existing group (idempotent — won't add duplicates). */
export async function addMemberToGroup(groupId: string, memberName: string): Promise<void> {
  await updateDoc(doc(db, 'groups', groupId), {
    members: arrayUnion(memberName.trim()),
  });
}

/** Fetch a group by id, or null if missing. */
export async function fetchGroup(groupId: string): Promise<Group | null> {
  const snap = await getDoc(doc(db, 'groups', groupId));
  return snap.exists() ? (snap.data() as Group) : null;
}

// =============================================================================
// One-time migration: move legacy camping/* docs into groups/default/data/*
// =============================================================================

const LEGACY_GROUP_ID = 'default';

/**
 * If old data exists at `camping/...` and `groups/default` doesn't yet exist,
 * copy everything across and create the 'default' group (Joep & Sanne).
 * Idempotent: safe to call on every boot.
 */
export async function migrateLegacyDataIfNeeded(): Promise<Group | null> {
  const defaultGroupRef = doc(db, 'groups', LEGACY_GROUP_ID);
  const defaultGroupSnap = await getDoc(defaultGroupRef);
  if (defaultGroupSnap.exists()) return defaultGroupSnap.data() as Group;

  // No default group yet — check if legacy data exists
  const legacyItemsSnap = await getDoc(doc(db, 'camping', 'items'));
  if (!legacyItemsSnap.exists()) return null; // brand new install, no migration needed

  const collections = ['items', 'tips', 'state', 'groceries', 'locations', 'wishlist'];
  await Promise.all(collections.map(async name => {
    const legacy = await getDoc(doc(db, 'camping', name));
    if (legacy.exists()) {
      await setDoc(doc(db, 'groups', LEGACY_GROUP_ID, 'data', name), legacy.data());
    }
  }));

  const group: Group = {
    id: LEGACY_GROUP_ID,
    name: 'Joep & Sanne',
    inviteCode: 'JOEP-SANNE',
    members: ['Joep', 'Sanne'],
    createdAt: Date.now(),
  };
  await setDoc(defaultGroupRef, group);
  return group;
}

// =============================================================================
// Generic default-sync helper
// =============================================================================
//
// THE RULE: defaultData.ts is the single source of truth for default items/tips.
// Whatever fields you put on a default in code, will be in Firestore on next load.
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

export async function fetchItems(groupId: string): Promise<ItemsDoc> {
  const r = REF(groupId);
  const snap = await getDoc(r.items());

  if (!snap.exists()) {
    const doc: ItemsDoc = { items: DEFAULT_ITEMS, deletedDefaultIds: [] };
    await setDoc(r.items(), doc);
    return doc;
  }

  const existing = snap.data().items as PackItem[];
  const deletedDefaultIds: string[] = snap.data().deletedDefaultIds ?? [];

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

  const { merged, changed } = syncDefaults({
    existing: cleaned,
    defaults: DEFAULT_ITEMS,
    deletedDefaultIds,
    preserveFields: ['quantity', 'notes'],
  });

  if (changed || stripped) {
    await setDoc(r.items(), { items: merged, deletedDefaultIds });
  }
  return { items: merged, deletedDefaultIds };
}

export async function saveItems(groupId: string, items: PackItem[], deletedDefaultIds: string[]): Promise<void> {
  await setDoc(REF(groupId).items(), { items, deletedDefaultIds });
}

export function subscribeItems(groupId: string, cb: (items: PackItem[], deletedDefaultIds: string[]) => void): () => void {
  return onSnapshot(REF(groupId).items(), snap => {
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

const RETIRED_TIP_IDS = new Set(['t6']); // Kinderen motiveren

export async function fetchTips(groupId: string): Promise<TipsDoc> {
  const r = REF(groupId);
  const snap = await getDoc(r.tips());

  if (!snap.exists()) {
    const doc: TipsDoc = { tips: DEFAULT_TIPS, deletedDefaultIds: [] };
    await setDoc(r.tips(), doc);
    return doc;
  }

  const existing = (snap.data().tips ?? []) as Tip[];
  let deletedDefaultIds: string[] = snap.data().deletedDefaultIds ?? [];

  let firstTimeDeletionMigration = false;
  if (snap.data().deletedDefaultIds === undefined) {
    const presentIds = new Set(existing.map(t => t.id));
    deletedDefaultIds = DEFAULT_TIPS
      .filter(d => !presentIds.has(d.id) && !RETIRED_TIP_IDS.has(d.id))
      .map(d => d.id);
    firstTimeDeletionMigration = true;
  }

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
    await setDoc(r.tips(), { tips: merged, deletedDefaultIds });
  }
  return { tips: merged, deletedDefaultIds };
}

export async function saveTips(groupId: string, tips: Tip[], deletedDefaultIds: string[]): Promise<void> {
  await setDoc(REF(groupId).tips(), { tips, deletedDefaultIds });
}

export function subscribeTips(groupId: string, cb: (tips: Tip[], deletedDefaultIds: string[]) => void): () => void {
  return onSnapshot(REF(groupId).tips(), snap => {
    if (snap.exists()) cb(
      (snap.data().tips ?? []) as Tip[],
      snap.data().deletedDefaultIds ?? [],
    );
  });
}

// =============================================================================
// State (checked + tripConfig)
// =============================================================================

export async function fetchState(groupId: string): Promise<{ checked: CheckedItems; tripConfig: TripConfig }> {
  const r = REF(groupId);
  const snap = await getDoc(r.state());
  if (snap.exists()) {
    const data = snap.data() as { checked: CheckedItems; tripConfig: TripConfig };
    if ((data.tripConfig?.type as string) === 'dag') {
      data.tripConfig = { ...data.tripConfig, type: 'weekend' };
      await setDoc(r.state(), data, { merge: true });
    }
    return data;
  }
  const defaults = { checked: {}, tripConfig: { type: 'weekend' as const, mountains: false, kids: false } };
  await setDoc(r.state(), defaults);
  return defaults;
}

export async function saveChecked(groupId: string, checked: CheckedItems): Promise<void> {
  await setDoc(REF(groupId).state(), { checked }, { merge: true });
}

export async function saveTripConfig(groupId: string, tripConfig: TripConfig): Promise<void> {
  const clean: TripConfig = {
    type: tripConfig.type,
    mountains: tripConfig.mountains,
    kids: tripConfig.kids,
    ...(tripConfig.departureDate ? { departureDate: tripConfig.departureDate } : {}),
    ...(tripConfig.weatherPlace  ? { weatherPlace:  tripConfig.weatherPlace  } : {}),
    ...(tripConfig.savedMountains?.length ? { savedMountains: tripConfig.savedMountains } : {}),
  };
  await setDoc(REF(groupId).state(), { tripConfig: clean }, { merge: true });
}

export function subscribeState(groupId: string, cb: (checked: CheckedItems, tripConfig: TripConfig) => void): () => void {
  return onSnapshot(REF(groupId).state(), snap => {
    if (snap.exists()) {
      const data = snap.data();
      cb(data.checked ?? {}, data.tripConfig ?? { type: 'weekend', mountains: false, kids: false });
    }
  });
}

// =============================================================================
// Generic helpers for plain list collections (no defaults)
// =============================================================================

async function fetchList<T>(ref: ReturnType<GroupRefsKey>, key: string, fallback: T[] = []): Promise<T[]> {
  const snap = await getDoc(ref);
  if (!snap.exists()) return fallback;
  return (snap.data()[key] ?? fallback) as T[];
}

type GroupRefsKey = () => ReturnType<typeof doc>;

function subscribeList<T>(ref: ReturnType<GroupRefsKey>, key: string, cb: (list: T[]) => void) {
  return onSnapshot(ref, snap => {
    if (snap.exists()) cb((snap.data()[key] ?? []) as T[]);
  });
}

// Groceries
export const fetchGroceries     = (groupId: string) => fetchList<GroceryItem>(REF(groupId).groceries(), 'groceries');
export const saveGroceries      = (groupId: string, groceries: GroceryItem[]) => setDoc(REF(groupId).groceries(), { groceries });
export const subscribeGroceries = (groupId: string, cb: (g: GroceryItem[]) => void) => subscribeList<GroceryItem>(REF(groupId).groceries(), 'groceries', cb);

// Locations
export const fetchLocations     = (groupId: string) => fetchList<CampingLocation>(REF(groupId).locations(), 'locations');
export const saveLocations      = (groupId: string, locations: CampingLocation[]) => setDoc(REF(groupId).locations(), { locations });
export const subscribeLocations = (groupId: string, cb: (l: CampingLocation[]) => void) => subscribeList<CampingLocation>(REF(groupId).locations(), 'locations', cb);

// Wishlist
export const fetchWishlist     = (groupId: string) => fetchList<WishlistItem>(REF(groupId).wishlist(), 'wishlist');
export const saveWishlist      = (groupId: string, wishlist: WishlistItem[]) => setDoc(REF(groupId).wishlist(), { wishlist });
export const subscribeWishlist = (groupId: string, cb: (w: WishlistItem[]) => void) => subscribeList<WishlistItem>(REF(groupId).wishlist(), 'wishlist', cb);
