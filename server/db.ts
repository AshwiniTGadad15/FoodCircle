import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type {
  AwarenessCampaign,
  CommunityStory,
  DeliveryTask,
  FoodDonation,
  FoodRequest,
  NotificationItem,
  Organization,
  PublicUser,
  ReviewItem,
  SafetyReport,
  SupportMessage,
  UserRole,
} from '../shared/types.ts';

export interface StoredUser extends PublicUser {
  passwordHash: string;
  passwordSalt: string;
}

export interface VerificationToken {
  email: string;
  code: string;
  expiresAt: number;
}

export interface ResetToken {
  email: string;
  code: string;
  expiresAt: number;
}

export interface AdminBootstrapState {
  claimed: boolean;
  adminUserId?: string;
}

export interface DatabaseSchema {
  users: StoredUser[];
  organizations: Organization[];
  donations: FoodDonation[];
  requests: FoodRequest[];
  deliveries: DeliveryTask[];
  notifications: NotificationItem[];
  reviews: ReviewItem[];
  reports: SafetyReport[];
  supportMessages: SupportMessage[];
  communityStories: CommunityStory[];
  campaigns: AwarenessCampaign[];
  verificationTokens: VerificationToken[];
  resetTokens: ResetToken[];
  adminBootstrap: AdminBootstrapState;
}

export const INDIAN_CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  Bengaluru: { lat: 12.9716, lng: 77.5946 },
  Mumbai: { lat: 19.076, lng: 72.8777 },
  'Delhi NCR': { lat: 28.6139, lng: 77.209 },
  Hyderabad: { lat: 17.385, lng: 78.4867 },
  Pune: { lat: 18.5204, lng: 73.8567 },
  Chennai: { lat: 13.0827, lng: 80.2707 },
  Kolkata: { lat: 22.5726, lng: 88.3639 },
  Jaipur: { lat: 26.9124, lng: 75.7873 },
  Ahmedabad: { lat: 23.0225, lng: 72.5714 },
  Kochi: { lat: 9.9312, lng: 76.2673 },
};

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'foodcircle.json');

const IMAGE_PATHS = {
  biryani: '/src/assets/images/food_hyderabadi_biryani_1795763656501.jpg',
  thali: '/src/assets/images/food_homestyle_thali_1795763656687.jpg',
  bakery: '/src/assets/images/food_artisan_bakery_1795763656215.jpg',
  produce: '/src/assets/images/food_fresh_produce_1795763656032.jpg',
  volunteer: '/src/assets/images/community_volunteer_delivery_1795763657096.jpg',
  hero: '/src/assets/images/hero_food_sharing_1795763655501.jpg',
};

function hoursFromNow(hours: number): string {
  return new Date(Date.now() + hours * 3600 * 1000).toISOString();
}

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 3600 * 1000).toISOString();
}

function createInitialSeedData(): DatabaseSchema {
  const nowIso = new Date().toISOString();

  // Sample showcase profiles (marked isDemo: true, non-loginable showcase records for realistic demo listings)
  const demoUsers: StoredUser[] = [
    {
      id: 'demo-donor-1',
      fullName: 'Ananya Deshmukh (Demo Kitchen)',
      email: 'demo.kitchen.blr@example.invalid',
      phone: '+91 98000 11223',
      city: 'Bengaluru',
      role: 'business',
      emailVerified: true,
      verifiedByAdmin: true,
      organizationId: 'demo-org-2',
      bio: 'Sample neighborhood catering kitchen demonstrating surplus meal sharing.',
      createdAt: hoursAgo(240),
      passwordHash: '',
      passwordSalt: '',
      isDemo: true,
    },
    {
      id: 'demo-donor-2',
      fullName: 'Rohan Kulkarni (Demo Bakery)',
      email: 'demo.bakery.pune@example.invalid',
      phone: '+91 98000 22334',
      city: 'Pune',
      role: 'business',
      emailVerified: true,
      verifiedByAdmin: true,
      bio: 'Sample artisan sourdough bakery sharing end-of-day fresh loaves.',
      createdAt: hoursAgo(190),
      passwordHash: '',
      passwordSalt: '',
      isDemo: true,
    },
    {
      id: 'demo-donor-3',
      fullName: 'Meera Nair (Demo Home Donor)',
      email: 'demo.home.hyd@example.invalid',
      phone: '+91 98000 33445',
      city: 'Hyderabad',
      role: 'donor',
      emailVerified: true,
      verifiedByAdmin: true,
      bio: 'Sample home cook sharing clean excess event meals safely.',
      createdAt: hoursAgo(160),
      passwordHash: '',
      passwordSalt: '',
      isDemo: true,
    },
    {
      id: 'demo-ngo-1',
      fullName: 'Asha Community Kitchen (Demo NGO)',
      email: 'demo.ngo.blr@example.invalid',
      phone: '+91 98000 44556',
      city: 'Bengaluru',
      role: 'ngo',
      emailVerified: true,
      verifiedByAdmin: true,
      organizationId: 'demo-org-1',
      bio: 'Sample grassroots meal redistribution network.',
      createdAt: hoursAgo(300),
      passwordHash: '',
      passwordSalt: '',
      isDemo: true,
    },
    {
      id: 'demo-vol-1',
      fullName: 'Vikramjit Singh (Demo Volunteer)',
      email: 'demo.volunteer.del@example.invalid',
      phone: '+91 98000 55667',
      city: 'Delhi NCR',
      role: 'volunteer',
      emailVerified: true,
      verifiedByAdmin: true,
      bio: 'Sample weekend food rescue rider.',
      createdAt: hoursAgo(120),
      passwordHash: '',
      passwordSalt: '',
      isDemo: true,
    },
  ];

  const demoOrgs: Organization[] = [
    {
      id: 'demo-org-1',
      userId: 'demo-ngo-1',
      name: 'Asha Community Kitchen (Demo)',
      registrationNumber: 'DEMO-NGO-KA-2024-01',
      type: 'Community Kitchen',
      city: 'Bengaluru',
      address: '14th Cross, Indiranagar 2nd Stage, Bengaluru',
      capacityPerDay: 250,
      description:
        'Sample community kitchen demonstrating bulk food coordination for local day-shelter residents and students.',
      contactPhone: '+91 98000 44556',
      verifiedStatus: 'verified',
      createdAt: hoursAgo(300),
      isDemo: true,
    },
    {
      id: 'demo-org-2',
      userId: 'demo-donor-1',
      name: 'Saffron & Leaf Catering (Demo)',
      registrationNumber: 'DEMO-FSSAI-KA-8821',
      type: 'Restaurant',
      city: 'Bengaluru',
      address: '80 Feet Road, Koramangala 4th Block, Bengaluru',
      capacityPerDay: 120,
      description:
        'Sample sustainable catering kitchen sharing untouched corporate lunch surplus in compostable containers.',
      contactPhone: '+91 98000 11223',
      verifiedStatus: 'verified',
      createdAt: hoursAgo(240),
      isDemo: true,
    },
    {
      id: 'demo-org-3',
      userId: 'demo-donor-2',
      name: 'Seva Annadan Shelter Network (Demo)',
      registrationNumber: 'DEMO-NGO-MH-2023-44',
      type: 'NGO',
      city: 'Mumbai',
      address: 'Near Dadar East Station Road, Mumbai',
      capacityPerDay: 400,
      description:
        'Sample urban food recovery collective redistributing bakery and fresh produce surplus across Mumbai wards.',
      contactPhone: '+91 98000 77889',
      verifiedStatus: 'verified',
      createdAt: hoursAgo(220),
      isDemo: true,
    },
  ];

  const demoDonations: FoodDonation[] = [
    {
      id: 'demo-don-1',
      donorId: 'demo-donor-1',
      donorName: 'Saffron & Leaf Catering (Demo)',
      donorRole: 'business',
      donorVerified: true,
      foodName: 'Veg & Paneer Hyderabadi Dum Biryani',
      category: 'Rice and Biryani',
      description:
        'Freshly prepared untouched catering trays of fragrant basmati dum biryani with paneer, mint, and cucumber raita packed cleanly in sealed food-grade containers.',
      imageUrl: IMAGE_PATHS.biryani,
      totalQuantity: 24,
      availableQuantity: 24,
      unit: 'meal boxes',
      servesCount: 24,
      preparedAt: hoursAgo(1.5),
      bestBefore: hoursFromNow(18),
      pickupAddress: '80 Feet Road, Koramangala 4th Block, Bengaluru',
      city: 'Bengaluru',
      lat: 12.9352,
      lng: 77.6245,
      pickupWindow: 'Today, within next 6 hours',
      dietaryType: 'Veg',
      storageInstructions: 'Keep refrigerated below 5°C if not consumed within 2 hours. Reheat thoroughly to 75°C.',
      allergens: 'Dairy (paneer, yogurt raita), trace cashews',
      contactDetails: '+91 98000 11223 (Front Desk)',
      safetyDeclared: true,
      status: 'available',
      createdAt: hoursAgo(1),
      updatedAt: nowIso,
      isDemo: true,
    },
    {
      id: 'demo-don-2',
      donorId: 'demo-donor-3',
      donorName: 'Meera Nair (Demo Home Donor)',
      donorRole: 'donor',
      donorVerified: true,
      foodName: 'Home-Style Dal Tadka, Jeera Rice & Phulka Meals',
      category: 'Cooked Meals',
      description:
        'Clean, hygienically cooked excess lunch from a family gathering. Packed individually into compostable kraft bowls with fresh rotis and mixed vegetable sabzi.',
      imageUrl: IMAGE_PATHS.thali,
      totalQuantity: 14,
      availableQuantity: 14,
      unit: 'meal packs',
      servesCount: 14,
      preparedAt: hoursAgo(2),
      bestBefore: hoursFromNow(14),
      pickupAddress: 'Road No. 12, Banjara Hills, Hyderabad',
      city: 'Hyderabad',
      lat: 17.4126,
      lng: 78.4398,
      pickupWindow: 'Available now until 9:30 PM',
      dietaryType: 'Veg',
      storageInstructions: 'Store in a cool dry spot or refrigerate immediately; reheat before serving.',
      allergens: 'Gluten (wheat rotis), ghee',
      contactDetails: '+91 98000 33445',
      safetyDeclared: true,
      status: 'available',
      createdAt: hoursAgo(1.5),
      updatedAt: nowIso,
      isDemo: true,
    },
    {
      id: 'demo-don-3',
      donorId: 'demo-donor-2',
      donorName: 'Rohan Kulkarni (Demo Bakery)',
      donorRole: 'business',
      donorVerified: true,
      foodName: 'Artisan Whole-Wheat Sourdough & Multigrain Rolls',
      category: 'Bakery Items',
      description:
        'Same-day morning bake surplus: whole-wheat sourdough loaves, seeded dinner rolls, and butter croissants neatly boxed in kraft cartons.',
      imageUrl: IMAGE_PATHS.bakery,
      totalQuantity: 18,
      availableQuantity: 18,
      unit: 'bakery boxes',
      servesCount: 36,
      preparedAt: hoursAgo(4),
      bestBefore: hoursFromNow(36),
      pickupAddress: 'Lane 6, Koregaon Park, Pune',
      city: 'Pune',
      lat: 18.5362,
      lng: 73.894,
      pickupWindow: '5:00 PM – 9:00 PM daily',
      dietaryType: 'Veg',
      storageInstructions: 'Keep sealed at cool room temperature away from moisture.',
      allergens: 'Wheat gluten, sesame seeds, dairy (croissants)',
      contactDetails: '+91 98000 22334',
      safetyDeclared: true,
      status: 'available',
      createdAt: hoursAgo(2),
      updatedAt: nowIso,
      isDemo: true,
    },
    {
      id: 'demo-don-4',
      donorId: 'demo-donor-1',
      donorName: 'GreenHarvest Co-op (Demo)',
      donorRole: 'business',
      donorVerified: true,
      foodName: 'Farm-Surplus Mangoes, Pomegranates & Leafy Spinach',
      category: 'Fruits',
      description:
        'Ripe grade-A seasonal produce crates from morning mandi delivery — Alphonso mangoes, pomegranates, fresh spinach bunches, and vine tomatoes.',
      imageUrl: IMAGE_PATHS.produce,
      totalQuantity: 10,
      availableQuantity: 10,
      unit: 'produce crates (4kg each)',
      servesCount: 40,
      preparedAt: hoursAgo(5),
      bestBefore: hoursFromNow(48),
      pickupAddress: '100 Feet Road, Indiranagar, Bengaluru',
      city: 'Bengaluru',
      lat: 12.9784,
      lng: 77.6408,
      pickupWindow: 'Open for pickup 10:00 AM – 8:00 PM',
      dietaryType: 'Veg',
      storageInstructions: 'Wash thoroughly before use. Keep leafy greens refrigerated.',
      allergens: 'None',
      contactDetails: '+91 98000 11223',
      safetyDeclared: true,
      status: 'available',
      createdAt: hoursAgo(3),
      updatedAt: nowIso,
      isDemo: true,
    },
    {
      id: 'demo-don-5',
      donorId: 'demo-donor-2',
      donorName: 'Spice Route Kitchen (Demo)',
      donorRole: 'business',
      donorVerified: true,
      foodName: 'Chicken Tikka Pulao & Roasted Veg Boxes',
      category: 'Cooked Meals',
      description:
        'Surplus hot buffet trays kept strictly above 65°C in covered chafers and packed into tamper-evident foil containers for same-evening sharing.',
      imageUrl: IMAGE_PATHS.biryani,
      totalQuantity: 16,
      availableQuantity: 16,
      unit: 'meal boxes',
      servesCount: 16,
      preparedAt: hoursAgo(1),
      bestBefore: hoursFromNow(10),
      pickupAddress: 'Bandra West, Pali Hill Road, Mumbai',
      city: 'Mumbai',
      lat: 19.0607,
      lng: 72.8362,
      pickupWindow: 'Pickup within 4 hours',
      dietaryType: 'Non-Veg',
      storageInstructions: 'Consume promptly or refrigerate below 4°C within 90 minutes. Do not refreeze.',
      allergens: 'Dairy (yogurt marinade)',
      contactDetails: '+91 98000 66778',
      safetyDeclared: true,
      status: 'available',
      createdAt: hoursAgo(0.8),
      updatedAt: nowIso,
      isDemo: true,
    },
    {
      id: 'demo-don-6',
      donorId: 'demo-donor-3',
      donorName: 'Janata Dry Rations Collective (Demo)',
      donorRole: 'ngo',
      donorVerified: true,
      foodName: 'Sealed Dry Grocery Kits (Toor Dal, Rice, Atta)',
      category: 'Groceries',
      description:
        'Unopened factory-sealed staple grocery packs with clear FSSAI dates suitable for families, student hostels, and community kitchens.',
      imageUrl: IMAGE_PATHS.produce,
      totalQuantity: 20,
      availableQuantity: 20,
      unit: 'grocery kits',
      servesCount: 80,
      preparedAt: hoursAgo(24),
      bestBefore: hoursFromNow(720),
      pickupAddress: 'Hauz Khas Enclave, New Delhi',
      city: 'Delhi NCR',
      lat: 28.5494,
      lng: 77.2001,
      pickupWindow: '9:00 AM – 7:00 PM',
      dietaryType: 'Veg',
      storageInstructions: 'Store in a cool, dry pantry away from direct sunlight.',
      allergens: 'Wheat gluten (atta)',
      contactDetails: '+91 98000 88990',
      safetyDeclared: true,
      status: 'available',
      createdAt: hoursAgo(4),
      updatedAt: nowIso,
      isDemo: true,
    },
  ];

  const demoDeliveries: DeliveryTask[] = [
    {
      id: 'demo-del-1',
      requestId: 'demo-req-open-1',
      donationId: 'demo-don-1',
      donationName: 'Veg & Paneer Hyderabadi Dum Biryani (Demo Route)',
      donorName: 'Saffron & Leaf Catering (Demo)',
      requesterName: 'Asha Community Kitchen (Demo)',
      pickupAddress: '80 Feet Road, Koramangala 4th Block, Bengaluru',
      pickupCity: 'Bengaluru',
      pickupLat: 12.9352,
      pickupLng: 77.6245,
      dropoffAddress: '14th Cross, Indiranagar 2nd Stage, Bengaluru',
      dropoffCity: 'Bengaluru',
      mealsCount: 15,
      status: 'open',
      notes: 'Insulated bag recommended; pickup at side service counter.',
      createdAt: hoursAgo(0.5),
      updatedAt: nowIso,
    },
  ];

  const demoStories: CommunityStory[] = [
    {
      id: 'story-1',
      title: 'How Koramangala Bakeries Diverted 180 Loaves Weekly to Night Shelters',
      summary:
        'Sample community case study illustrating how scheduled 8:30 PM pickups paired neighborhood bakeries with three student volunteers on electric scooters.',
      city: 'Bengaluru',
      mealsSaved: 420,
      category: 'Bakery Rescue',
      authorName: 'Asha Community Kitchen (Demo)',
      authorRole: 'Community Kitchen',
      publishedAt: hoursAgo(48),
      imageUrl: IMAGE_PATHS.bakery,
      isDemo: true,
    },
    {
      id: 'story-2',
      title: 'Zero-Waste Wedding Feast: Sharing 140 Fresh Meals Within 90 Minutes',
      summary:
        'Sample story demonstrating temperature-checked stainless steel transfers and fast volunteer dispatch after a weekend family reception in Hyderabad.',
      city: 'Hyderabad',
      mealsSaved: 140,
      category: 'Event Surplus',
      authorName: 'Meera Nair (Demo)',
      authorRole: 'Food Donor',
      publishedAt: hoursAgo(96),
      imageUrl: IMAGE_PATHS.hero,
      isDemo: true,
    },
    {
      id: 'story-3',
      title: 'Morning Mandi Produce Drives Supporting Community Kitchens in Pune',
      summary:
        'Sample neighborhood initiative rescuing cosmetically imperfect mangoes, spinach, and tomatoes from wholesale crates for nutritious lunchtime thalis.',
      city: 'Pune',
      mealsSaved: 310,
      category: 'Fresh Produce',
      authorName: 'GreenHarvest Co-op (Demo)',
      authorRole: 'Partner Collective',
      publishedAt: hoursAgo(144),
      imageUrl: IMAGE_PATHS.volunteer,
      isDemo: true,
    },
  ];

  const demoCampaigns: AwarenessCampaign[] = [
    {
      id: 'camp-1',
      title: 'Zero-Waste Festival Table Pledge',
      city: 'Pan-India',
      dateRange: 'Ongoing Monthly Drive',
      goalMeals: 1000,
      currentMeals: 340,
      participantsCount: 48,
      description:
        'Commit to planning realistic portions for family celebrations and listing safe, untouched surplus meals on FoodCircle within 2 hours of cooking.',
      joinedUserIds: [],
      isDemo: true,
    },
    {
      id: 'camp-2',
      title: 'Campus Canteen Evening Rescue',
      city: 'Bengaluru & Pune',
      dateRange: 'Every Weekday, 7:30 PM',
      goalMeals: 600,
      currentMeals: 215,
      participantsCount: 29,
      description:
        'Student volunteers coordinate safe evening redistribution from university dining halls to nearby hostel kitchens and community centers.',
      joinedUserIds: [],
      isDemo: true,
    },
    {
      id: 'camp-3',
      title: 'Sunday Fresh Produce Harvest Share',
      city: 'Mumbai & Delhi NCR',
      dateRange: 'Every Sunday Morning',
      goalMeals: 800,
      currentMeals: 290,
      participantsCount: 37,
      description:
        'Connect neighborhood vegetable vendors and urban terrace gardeners with local families and shelters before perishable greens spoil.',
      joinedUserIds: [],
      isDemo: true,
    },
  ];

  return {
    users: demoUsers,
    organizations: demoOrgs,
    donations: demoDonations,
    requests: [],
    deliveries: demoDeliveries,
    notifications: [],
    reviews: [],
    reports: [],
    supportMessages: [],
    communityStories: demoStories,
    campaigns: demoCampaigns,
    verificationTokens: [],
    resetTokens: [],
    adminBootstrap: {
      claimed: false,
    },
  };
}

let dbCache: DatabaseSchema | null = null;

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function loadDb(): DatabaseSchema {
  if (dbCache) {
    sweepExpiredDonations(dbCache);
    return dbCache;
  }
  ensureDir();
  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      const parsed = JSON.parse(raw) as DatabaseSchema;
      dbCache = parsed;
      // Keep demo listings fresh if server restarted on a much later date
      const now = Date.now();
      let refreshed = false;
      for (const d of dbCache.donations) {
        if (d.isDemo && d.status !== 'flagged' && new Date(d.bestBefore).getTime() < now + 3600 * 1000) {
          d.preparedAt = hoursAgo(2);
          d.bestBefore = hoursFromNow(18);
          d.status = d.availableQuantity > 0 ? 'available' : 'reserved';
          refreshed = true;
        }
      }
      sweepExpiredDonations(dbCache);
      if (refreshed) saveDb();
      return dbCache;
    } catch {
      dbCache = createInitialSeedData();
      saveDb();
      return dbCache;
    }
  }
  dbCache = createInitialSeedData();
  saveDb();
  return dbCache;
}

export function saveDb(): void {
  if (!dbCache) return;
  ensureDir();
  const tmpFile = `${DB_FILE}.${crypto.randomBytes(6).toString('hex')}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(dbCache, null, 2), 'utf8');
  fs.renameSync(tmpFile, DB_FILE);
}

export function sweepExpiredDonations(db: DatabaseSchema): boolean {
  const now = Date.now();
  let changed = false;
  for (const donation of db.donations) {
    if (donation.status === 'available' || donation.status === 'reserved') {
      const expiryMs = new Date(donation.bestBefore).getTime();
      if (!Number.isNaN(expiryMs) && expiryMs <= now) {
        donation.status = 'expired';
        donation.updatedAt = new Date().toISOString();
        changed = true;
        if (!donation.isDemo) {
          addNotification(db, {
            userId: donation.donorId,
            type: 'expiry_reminder',
            title: 'Donation safety window expired',
            message: `"${donation.foodName}" has passed its safe consumption deadline and was automatically hidden from Explore Food.`,
          });
        }
      }
    }
  }
  if (changed) saveDb();
  return changed;
}

export function toPublicUser(user: StoredUser): PublicUser {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    city: user.city,
    role: user.role,
    emailVerified: user.emailVerified,
    verifiedByAdmin: user.verifiedByAdmin,
    organizationId: user.organizationId,
    bio: user.bio,
    createdAt: user.createdAt,
    isDemo: user.isDemo,
  };
}

export function addNotification(
  db: DatabaseSchema,
  input: {
    userId: string;
    type: NotificationItem['type'];
    title: string;
    message: string;
  },
): NotificationItem {
  const item: NotificationItem = {
    id: `notif-${crypto.randomUUID()}`,
    userId: input.userId,
    type: input.type,
    title: input.title,
    message: input.message,
    read: false,
    createdAt: new Date().toISOString(),
  };
  db.notifications.unshift(item);
  if (db.notifications.length > 500) {
    db.notifications = db.notifications.slice(0, 500);
  }
  return item;
}

export function resolveCityCoordinates(city: string): { lat: number; lng: number } {
  const exact = INDIAN_CITY_COORDS[city];
  if (exact) {
    // Small deterministic-ish jitter so pins in the same city do not stack identically
    const jitterLat = (Math.random() - 0.5) * 0.04;
    const jitterLng = (Math.random() - 0.5) * 0.04;
    return {
      lat: Number((exact.lat + jitterLat).toFixed(5)),
      lng: Number((exact.lng + jitterLng).toFixed(5)),
    };
  }
  return { lat: 12.9716, lng: 77.5946 };
}

export function isAllowedRole(role: string): role is UserRole {
  return ['donor', 'seeker', 'volunteer', 'ngo', 'business', 'admin'].includes(role);
}
