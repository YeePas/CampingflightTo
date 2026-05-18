export type TripType = 'weekend' | 'week' | 'wandeldag' | 'wandeltrip';

export interface PackItem {
  id: string;
  name: string;
  category: string;
  tripTypes: TripType[];
  mountains: boolean;
  kids: boolean;
  quantity?: string;
  notes?: string;
}

export interface CheckedItems {
  [itemId: string]: boolean;
}

export interface TripConfig {
  type: TripType;
  mountains: boolean;
  kids: boolean;
  departureDate?: string;    // yyyy-MM-dd
  weatherPlace?: string;     // free-text city/region for open-meteo geocoding
  savedMountains?: string[]; // saved berggebieden in MountainView
}

export interface Tip {
  id: string;
  title: string;
  content: string;
  category: string;
  imageUrl?: string;
  knotIcon?: string;
  linkUrl?: string; // override for the 3D animation link (defaults to knots3d.com)
}

export const CATEGORIES = [
  'Kleding',
  'Slaap',
  'Keuken & Eten',
  'Hygiëne',
  'Kinderen',
  'EHBO',
  'Navigatie & Kaarten',
  'Gereedschap',
  'Bergen',
  'Overig',
] as const;

export interface GroceryItem {
  id: string;
  name: string;
  quantity?: string;
  category?: string;
  checked: boolean;
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface CampingLocation {
  id: string;
  name: string;
  address?: string;
  gateCode?: string;
  wifi?: string;
  contact?: string;
  notes?: string;
  checklist?: ChecklistItem[];
}

export interface WishlistItem {
  id: string;
  name: string;
  notes?: string;
  address?: string;
  tipFrom?: string;
}

export const GROCERY_CATEGORIES = [
  'Vers',
  'Houdbaar',
  'Drinken',
  'Ontbijt',
  'Snacks',
  'Bbq / vlees',
  'Overig',
] as const;

export const TIP_CATEGORIES = [
  'Knopen',
  'Koken',
  'Bergen',
] as const;

// =============================================================================
// Multi-tenancy
// =============================================================================

/** A "group" is a shared workspace — couples, families, individuals. All app
 *  data (items, tips, locations, etc.) is scoped under a single groupId. */
export interface Group {
  id: string;            // short slug, e.g. "joep-sanne" or random "g-xyz123"
  name: string;          // display name, e.g. "Joep & Sanne"
  inviteCode: string;    // e.g. "BERG-2745" — used to join
  members: string[];     // member display names within this group
  createdAt: number;     // ms epoch
}

/** What the app remembers per device (in localStorage). */
export interface Session {
  groupId: string;
  memberName: string;    // human-friendly name, free-form
}
