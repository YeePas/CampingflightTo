import {
  doc, getDoc, setDoc, onSnapshot,
  collection, getDocs, writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import { PackItem, Tip, CheckedItems, TripConfig } from './types';
import { DEFAULT_ITEMS, DEFAULT_TIPS } from './defaultData';

const REF = {
  items: () => doc(db, 'camping', 'items'),
  tips: () => doc(db, 'camping', 'tips'),
  state: () => doc(db, 'camping', 'state'),
};

// --- Items ---

export async function fetchItems(): Promise<PackItem[]> {
  const snap = await getDoc(REF.items());
  if (snap.exists()) return snap.data().items as PackItem[];
  // First run: seed defaults
  await setDoc(REF.items(), { items: DEFAULT_ITEMS });
  return DEFAULT_ITEMS;
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
  if (snap.exists()) return snap.data().tips as Tip[];
  await setDoc(REF.tips(), { tips: DEFAULT_TIPS });
  return DEFAULT_TIPS;
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
