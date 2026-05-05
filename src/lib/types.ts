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
  'Veiligheid',
  'Bergen',
  'Algemeen',
] as const;
