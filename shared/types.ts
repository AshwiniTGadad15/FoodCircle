export type UserRole = 'donor' | 'seeker' | 'volunteer' | 'ngo' | 'business' | 'admin';

export type FoodCategory =
  | 'Cooked Meals'
  | 'Rice and Biryani'
  | 'Fruits'
  | 'Vegetables'
  | 'Bakery Items'
  | 'Packaged Food'
  | 'Groceries'
  | 'Other';

export type DietaryType = 'Veg' | 'Non-Veg';

export type DonationStatus = 'available' | 'reserved' | 'collected' | 'expired' | 'flagged';

export type RequestStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'ready_for_pickup'
  | 'collected'
  | 'completed';

export type DeliveryStatus = 'open' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered';

export interface PublicUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  city: string;
  role: UserRole;
  emailVerified: boolean;
  verifiedByAdmin: boolean;
  organizationId?: string;
  bio?: string;
  createdAt: string;
  isDemo?: boolean;
}

export interface Organization {
  id: string;
  userId: string;
  name: string;
  registrationNumber: string;
  type: 'NGO' | 'Trust' | 'Shelter' | 'Community Kitchen' | 'Restaurant' | 'Bakery';
  city: string;
  address: string;
  capacityPerDay: number;
  description: string;
  contactPhone: string;
  verifiedStatus: 'pending' | 'verified' | 'rejected';
  createdAt: string;
  isDemo?: boolean;
}

export interface FoodDonation {
  id: string;
  donorId: string;
  donorName: string;
  donorRole: UserRole;
  donorVerified: boolean;
  foodName: string;
  category: FoodCategory;
  description: string;
  imageUrl: string;
  totalQuantity: number;
  availableQuantity: number;
  unit: string;
  servesCount: number;
  preparedAt: string;
  bestBefore: string;
  pickupAddress: string;
  city: string;
  lat: number;
  lng: number;
  pickupWindow: string;
  dietaryType: DietaryType;
  storageInstructions: string;
  allergens: string;
  contactDetails: string;
  safetyDeclared: boolean;
  status: DonationStatus;
  createdAt: string;
  updatedAt: string;
  isDemo?: boolean;
}

export interface FoodRequest {
  id: string;
  donationId: string;
  donationName: string;
  donationImageUrl: string;
  donorId: string;
  donorName: string;
  donorContact?: string;
  pickupAddress: string;
  pickupCity: string;
  requesterId: string;
  requesterName: string;
  requesterRole: UserRole;
  quantityRequested: number;
  unit: string;
  peopleServed: number;
  message: string;
  fulfillmentType: 'pickup' | 'delivery';
  deliveryAddress?: string;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryTask {
  id: string;
  requestId: string;
  donationId: string;
  donationName: string;
  donorName: string;
  requesterName: string;
  pickupAddress: string;
  pickupCity: string;
  pickupLat: number;
  pickupLng: number;
  dropoffAddress: string;
  dropoffCity: string;
  mealsCount: number;
  volunteerId?: string;
  volunteerName?: string;
  status: DeliveryStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  type:
    | 'request_new'
    | 'request_accepted'
    | 'request_rejected'
    | 'ready_for_pickup'
    | 'delivery_update'
    | 'expiry_reminder'
    | 'collection_complete'
    | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface ReviewItem {
  id: string;
  donationId: string;
  donationName: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface SafetyReport {
  id: string;
  targetType: 'donation' | 'user';
  targetId: string;
  targetLabel: string;
  reporterId: string;
  reporterName: string;
  reason: string;
  details: string;
  status: 'open' | 'reviewed' | 'resolved' | 'dismissed';
  adminNote?: string;
  createdAt: string;
}

export interface SupportMessage {
  id: string;
  type: 'contact' | 'issue' | 'feedback';
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'open' | 'resolved';
  createdAt: string;
}

export interface CommunityStory {
  id: string;
  title: string;
  summary: string;
  city: string;
  mealsSaved: number;
  category: string;
  authorName: string;
  authorRole: string;
  publishedAt: string;
  imageUrl: string;
  isDemo: boolean;
}

export interface AwarenessCampaign {
  id: string;
  title: string;
  city: string;
  dateRange: string;
  goalMeals: number;
  currentMeals: number;
  participantsCount: number;
  description: string;
  joinedUserIds: string[];
  isDemo: boolean;
}

export interface ImpactStats {
  verified: {
    mealsShared: number;
    foodDonors: number;
    volunteers: number;
    communitiesConnected: number;
    activeListings: number;
    completedRequests: number;
  };
  demoBaseline: {
    mealsShared: number;
    foodDonors: number;
    volunteers: number;
    communitiesConnected: number;
  };
}
