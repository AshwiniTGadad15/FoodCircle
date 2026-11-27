import type { FoodCategory } from '../../shared/types.ts';

let memoryToken: string | null = null;

export function setAuthToken(token: string | null) {
  memoryToken = token;
}

export function getAuthToken(): string | null {
  return memoryToken;
}

export async function apiRequest<T>(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    body?: unknown;
  } = {},
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (memoryToken) {
    headers.Authorization = `Bearer ${memoryToken}`;
  }

  const res = await fetch(`/api${endpoint}`, {
    method: options.method || 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const data = (await res.json().catch(() => ({}))) as { error?: string } & T;
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export const FOOD_CATEGORIES: FoodCategory[] = [
  'Cooked Meals',
  'Rice and Biryani',
  'Fruits',
  'Vegetables',
  'Bakery Items',
  'Packaged Food',
  'Groceries',
  'Other',
];

export const INDIAN_CITIES = [
  'Bengaluru',
  'Mumbai',
  'Delhi NCR',
  'Hyderabad',
  'Pune',
  'Chennai',
  'Kolkata',
  'Jaipur',
  'Ahmedabad',
  'Kochi',
];

export const GENERATED_ASSETS = {
  hero: '/src/assets/images/hero_food_sharing_1795763655501.jpg',
  biryani: '/src/assets/images/food_hyderabadi_biryani_1795763656501.jpg',
  thali: '/src/assets/images/food_homestyle_thali_1795763656687.jpg',
  bakery: '/src/assets/images/food_artisan_bakery_1795763656215.jpg',
  produce: '/src/assets/images/food_fresh_produce_1795763656032.jpg',
  volunteer: '/src/assets/images/community_volunteer_delivery_1795763657096.jpg',
};

export const CATEGORY_PRESET_IMAGES: Record<FoodCategory, string> = {
  'Cooked Meals': GENERATED_ASSETS.thali,
  'Rice and Biryani': GENERATED_ASSETS.biryani,
  Fruits: GENERATED_ASSETS.produce,
  Vegetables: GENERATED_ASSETS.produce,
  'Bakery Items': GENERATED_ASSETS.bakery,
  'Packaged Food': GENERATED_ASSETS.thali,
  Groceries: GENERATED_ASSETS.produce,
  Other: GENERATED_ASSETS.hero,
};

export function calculateDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

export function formatTimeRemaining(isoDate: string): {
  label: string;
  urgent: boolean;
  expired: boolean;
} {
  const diffMs = new Date(isoDate).getTime() - Date.now();
  if (Number.isNaN(diffMs) || diffMs <= 0) {
    return { label: 'Expired', urgent: true, expired: true };
  }
  const totalMins = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return { label: `${days}d ${hours % 24}h left`, urgent: false, expired: false };
  }
  if (hours >= 3) {
    return { label: `${hours}h ${mins}m left`, urgent: false, expired: false };
  }
  return { label: `${hours}h ${mins}m left — urgent`, urgent: true, expired: false };
}

export function formatDateTimeShort(isoDate: string): string {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function roleLabel(role: string): string {
  const map: Record<string, string> = {
    donor: 'Food Donor',
    seeker: 'Food Seeker',
    volunteer: 'Volunteer',
    ngo: 'NGO / Organization',
    business: 'Restaurant / Business',
    admin: 'Administrator',
  };
  return map[role] || role;
}
