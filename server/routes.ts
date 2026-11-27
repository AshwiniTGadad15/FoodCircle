import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express, { type NextFunction, type Request, type Response } from 'express';
import { z } from 'zod';
import {
  generateSecureCode,
  hashPassword,
  safeCompareSecret,
  signAuthToken,
  verifyAuthToken,
  verifyPassword,
  type TokenPayload,
} from './auth.ts';
import {
  addNotification,
  loadDb,
  resolveCityCoordinates,
  saveDb,
  toPublicUser,
  type StoredUser,
} from './db.ts';
import type { ImpactStats, UserRole } from '../shared/types.ts';

interface AuthedRequest extends Request {
  auth?: TokenPayload;
  currentUser?: StoredUser;
}

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
const MAX_UPLOAD_BYTES = 3 * 1024 * 1024; // 3MB

function ensureUploadsDir() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

function getBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  return header.slice(7).trim();
}

function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const token = getBearerToken(req);
  if (!token) {
    res.status(401).json({ error: 'Authentication required. Please sign in.' });
    return;
  }
  const payload = verifyAuthToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
    return;
  }
  const db = loadDb();
  const user = db.users.find((u) => u.id === payload.sub);
  if (!user) {
    res.status(401).json({ error: 'Account not found.' });
    return;
  }
  req.auth = payload;
  req.currentUser = user;
  next();
}

function optionalAuth(req: AuthedRequest, _res: Response, next: NextFunction) {
  const token = getBearerToken(req);
  if (token) {
    const payload = verifyAuthToken(token);
    if (payload) {
      const db = loadDb();
      const user = db.users.find((u) => u.id === payload.sub);
      if (user) {
        req.auth = payload;
        req.currentUser = user;
      }
    }
  }
  next();
}

function requireRole(...roles: UserRole[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.currentUser) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    if (!roles.includes(req.currentUser.role)) {
      res.status(403).json({ error: 'You do not have permission for this action.' });
      return;
    }
    next();
  };
}

function isSafeImageUrl(url: string): boolean {
  if (!url) return false;
  if (url.startsWith('/src/assets/images/') || url.startsWith('/uploads/')) {
    return !url.includes('..');
  }
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

const registerSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name is required').max(100),
  email: z.string().trim().email('Valid email is required').max(120),
  phone: z.string().trim().min(7, 'Valid phone number is required').max(25),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  city: z.string().trim().min(2, 'City is required').max(80),
  role: z.enum(['donor', 'seeker', 'volunteer', 'ngo', 'business']),
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

const donationSchema = z.object({
  foodName: z.string().trim().min(3, 'Food name is required').max(120),
  category: z.enum([
    'Cooked Meals',
    'Rice and Biryani',
    'Fruits',
    'Vegetables',
    'Bakery Items',
    'Packaged Food',
    'Groceries',
    'Other',
  ]),
  description: z.string().trim().min(10, 'Add a short helpful description').max(1000),
  imageUrl: z.string().trim().min(1),
  totalQuantity: z.coerce.number().int().min(1).max(5000),
  unit: z.string().trim().min(1).max(40).default('portions'),
  servesCount: z.coerce.number().int().min(1).max(10000),
  preparedAt: z.string().min(1),
  bestBefore: z.string().min(1),
  pickupAddress: z.string().trim().min(5, 'Pickup address is required').max(240),
  city: z.string().trim().min(2).max(80),
  pickupWindow: z.string().trim().min(3).max(120),
  dietaryType: z.enum(['Veg', 'Non-Veg']),
  storageInstructions: z.string().trim().min(3).max(400),
  allergens: z.string().trim().max(300).default('None declared'),
  contactDetails: z.string().trim().min(5).max(120),
  safetyDeclared: z.literal(true, {
    message: 'You must confirm the food safety declaration.',
  }),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
});

const requestSchema = z.object({
  donationId: z.string().min(1),
  quantityRequested: z.coerce.number().int().min(1).max(5000),
  peopleServed: z.coerce.number().int().min(1).max(10000),
  message: z.string().trim().max(500).default(''),
  fulfillmentType: z.enum(['pickup', 'delivery']),
  deliveryAddress: z.string().trim().max(240).optional(),
});

const orgSchema = z.object({
  name: z.string().trim().min(2).max(120),
  registrationNumber: z.string().trim().min(3).max(80),
  type: z.enum(['NGO', 'Trust', 'Shelter', 'Community Kitchen', 'Restaurant', 'Bakery']),
  city: z.string().trim().min(2).max(80),
  address: z.string().trim().min(5).max(240),
  capacityPerDay: z.coerce.number().int().min(1).max(50000),
  description: z.string().trim().min(10).max(1000),
  contactPhone: z.string().trim().min(7).max(30),
});

const reportSchema = z.object({
  targetType: z.enum(['donation', 'user']),
  targetId: z.string().min(1),
  reason: z.string().trim().min(3).max(120),
  details: z.string().trim().min(5).max(800),
});

const supportSchema = z.object({
  type: z.enum(['contact', 'issue', 'feedback']),
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(120),
  subject: z.string().trim().min(3).max(160),
  message: z.string().trim().min(10).max(2000),
});

const reviewSchema = z.object({
  donationId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(3).max(500),
});

export function createApiRouter() {
  const router = express.Router();

  // --- PUBLIC STATS & CONFIG ---
  router.get('/health', (_req, res) => {
    res.json({ ok: true, timestamp: new Date().toISOString() });
  });

  router.get('/config', (_req, res) => {
    const db = loadDb();
    const envAdminConfigured = Boolean(process.env.ADMIN_PASSCODE && process.env.ADMIN_PASSCODE.trim().length > 0);
    res.json({
      googleAuthConfigured: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID.trim().length > 0),
      adminClaimRequired: !envAdminConfigured && !db.adminBootstrap.claimed,
      adminEnvConfigured: envAdminConfigured,
    });
  });

  router.get('/stats/impact', (_req, res) => {
    const db = loadDb();
    const realUsers = db.users.filter((u) => !u.isDemo);
    const realDonations = db.donations.filter((d) => !d.isDemo);
    const completedRequests = db.requests.filter((r) => r.status === 'completed' || r.status === 'collected');
    const verifiedMealsFromRequests = completedRequests.reduce((acc, r) => acc + r.peopleServed, 0);
    const verifiedMealsFromCollectedDonations = realDonations
      .filter((d) => d.status === 'collected')
      .reduce((acc, d) => acc + d.servesCount, 0);
    const verifiedMeals = Math.max(verifiedMealsFromRequests, verifiedMealsFromCollectedDonations);

    const uniqueRealCities = new Set([
      ...realUsers.map((u) => u.city),
      ...realDonations.map((d) => d.city),
    ]);

    const stats: ImpactStats = {
      verified: {
        mealsShared: verifiedMeals,
        foodDonors: realUsers.filter((u) => ['donor', 'business', 'ngo'].includes(u.role)).length,
        volunteers: realUsers.filter((u) => u.role === 'volunteer').length,
        communitiesConnected: uniqueRealCities.size,
        activeListings: db.donations.filter((d) => d.status === 'available' && d.availableQuantity > 0).length,
        completedRequests: completedRequests.length,
      },
      demoBaseline: {
        mealsShared: 14820,
        foodDonors: 412,
        volunteers: 186,
        communitiesConnected: 24,
      },
    };
    res.json(stats);
  });

  // --- AUTHENTICATION ---
  router.post('/auth/register', (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid registration data.' });
      return;
    }
    const db = loadDb();
    const emailLower = parsed.data.email.toLowerCase();
    if (db.users.some((u) => u.email.toLowerCase() === emailLower)) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const { hash, salt } = hashPassword(parsed.data.password);
    const newUser: StoredUser = {
      id: `user-${crypto.randomUUID()}`,
      fullName: parsed.data.fullName,
      email: emailLower,
      phone: parsed.data.phone,
      city: parsed.data.city,
      role: parsed.data.role,
      emailVerified: false,
      verifiedByAdmin: false,
      createdAt: new Date().toISOString(),
      passwordHash: hash,
      passwordSalt: salt,
    };

    const verificationCode = generateSecureCode(6);
    db.verificationTokens = db.verificationTokens.filter((t) => t.email !== emailLower);
    db.verificationTokens.push({
      email: emailLower,
      code: verificationCode,
      expiresAt: Date.now() + 30 * 60 * 1000,
    });

    db.users.push(newUser);
    addNotification(db, {
      userId: newUser.id,
      type: 'system',
      title: 'Welcome to FoodCircle',
      message: 'Please verify your email address to build trust across your local food-sharing network.',
    });
    saveDb();

    const token = signAuthToken(newUser.id, newUser.role, newUser.email);
    res.status(201).json({
      token,
      user: toPublicUser(newUser),
      verificationCodePreview: verificationCode,
    });
  });

  router.post('/auth/login', (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Please provide a valid email and password.' });
      return;
    }
    const db = loadDb();
    const emailLower = parsed.data.email.toLowerCase();
    const user = db.users.find((u) => u.email.toLowerCase() === emailLower && !u.isDemo);

    // Check env-configured admin passcode login if email matches admin or user enters passcode
    const envAdminPass = process.env.ADMIN_PASSCODE?.trim();
    if (envAdminPass && safeCompareSecret(parsed.data.password, envAdminPass)) {
      let adminUser = db.users.find((u) => u.role === 'admin' && u.email.toLowerCase() === emailLower);
      if (!adminUser) {
        const { hash, salt } = hashPassword(parsed.data.password);
        adminUser = {
          id: `admin-${crypto.randomUUID()}`,
          fullName: 'FoodCircle Administrator',
          email: emailLower,
          phone: '+91 80000 00000',
          city: 'Bengaluru',
          role: 'admin',
          emailVerified: true,
          verifiedByAdmin: true,
          createdAt: new Date().toISOString(),
          passwordHash: hash,
          passwordSalt: salt,
        };
        db.users.push(adminUser);
        saveDb();
      }
      const token = signAuthToken(adminUser.id, adminUser.role, adminUser.email);
      res.json({ token, user: toPublicUser(adminUser) });
      return;
    }

    if (!user || !verifyPassword(parsed.data.password, user.passwordHash, user.passwordSalt)) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const token = signAuthToken(user.id, user.role, user.email);
    res.json({ token, user: toPublicUser(user) });
  });

  // First-run one-time Admin claim (locked once claimed or when ADMIN_PASSCODE env var is configured)
  router.post('/auth/admin-claim', (req, res) => {
    const schema = z.object({
      fullName: z.string().trim().min(2).max(100),
      email: z.string().trim().email().max(120),
      password: z.string().min(8, 'Admin password must be at least 8 characters').max(128),
      city: z.string().trim().min(2).max(80).default('Bengaluru'),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid admin setup fields.' });
      return;
    }

    if (process.env.ADMIN_PASSCODE && process.env.ADMIN_PASSCODE.trim().length > 0) {
      res.status(403).json({ error: 'Admin access is managed by server environment passcode.' });
      return;
    }

    const db = loadDb();
    if (db.adminBootstrap.claimed) {
      res.status(403).json({ error: 'Admin account has already been claimed. Please sign in normally.' });
      return;
    }

    const emailLower = parsed.data.email.toLowerCase();
    if (db.users.some((u) => u.email.toLowerCase() === emailLower)) {
      res.status(409).json({ error: 'Email already registered. Use a dedicated admin email.' });
      return;
    }

    const { hash, salt } = hashPassword(parsed.data.password);
    const adminUser: StoredUser = {
      id: `admin-${crypto.randomUUID()}`,
      fullName: parsed.data.fullName,
      email: emailLower,
      phone: '+91 80000 00000',
      city: parsed.data.city,
      role: 'admin',
      emailVerified: true,
      verifiedByAdmin: true,
      createdAt: new Date().toISOString(),
      passwordHash: hash,
      passwordSalt: salt,
    };

    db.users.push(adminUser);
    db.adminBootstrap = { claimed: true, adminUserId: adminUser.id };
    saveDb();

    const token = signAuthToken(adminUser.id, adminUser.role, adminUser.email);
    res.status(201).json({ token, user: toPublicUser(adminUser) });
  });

  router.get('/auth/me', requireAuth, (req: AuthedRequest, res) => {
    res.json({ user: toPublicUser(req.currentUser!) });
  });

  router.post('/auth/verify-email', requireAuth, (req: AuthedRequest, res) => {
    const schema = z.object({ code: z.string().trim().min(4).max(12) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Enter the 6-digit verification code.' });
      return;
    }
    const db = loadDb();
    const user = req.currentUser!;
    const idx = db.verificationTokens.findIndex(
      (t) => t.email === user.email && t.code === parsed.data.code && t.expiresAt > Date.now(),
    );
    if (idx === -1) {
      res.status(400).json({ error: 'Invalid or expired verification code.' });
      return;
    }
    db.verificationTokens.splice(idx, 1);
    user.emailVerified = true;
    saveDb();
    res.json({ user: toPublicUser(user), message: 'Email verified successfully.' });
  });

  router.post('/auth/resend-verification', requireAuth, (req: AuthedRequest, res) => {
    const db = loadDb();
    const user = req.currentUser!;
    const code = generateSecureCode(6);
    db.verificationTokens = db.verificationTokens.filter((t) => t.email !== user.email);
    db.verificationTokens.push({
      email: user.email,
      code,
      expiresAt: Date.now() + 30 * 60 * 1000,
    });
    saveDb();
    res.json({ message: 'Fresh verification code generated.', verificationCodePreview: code });
  });

  router.post('/auth/forgot-password', (req, res) => {
    const schema = z.object({ email: z.string().trim().email() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Enter a valid email address.' });
      return;
    }
    const db = loadDb();
    const emailLower = parsed.data.email.toLowerCase();
    const user = db.users.find((u) => u.email.toLowerCase() === emailLower && !u.isDemo);
    if (!user) {
      // Avoid enumerating nonexistent accounts with harsh errors while keeping preview flow helpful
      res.json({
        message: 'If an account matches that email, a password reset code has been generated.',
      });
      return;
    }
    const code = generateSecureCode(6);
    db.resetTokens = db.resetTokens.filter((t) => t.email !== emailLower);
    db.resetTokens.push({
      email: emailLower,
      code,
      expiresAt: Date.now() + 20 * 60 * 1000,
    });
    saveDb();
    res.json({
      message: 'Password reset code generated. Use it below within 20 minutes.',
      resetCodePreview: code,
    });
  });

  router.post('/auth/reset-password', (req, res) => {
    const schema = z.object({
      email: z.string().trim().email(),
      code: z.string().trim().min(4).max(12),
      newPassword: z.string().min(8, 'New password must be at least 8 characters').max(128),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid reset request.' });
      return;
    }
    const db = loadDb();
    const emailLower = parsed.data.email.toLowerCase();
    const idx = db.resetTokens.findIndex(
      (t) => t.email === emailLower && t.code === parsed.data.code && t.expiresAt > Date.now(),
    );
    if (idx === -1) {
      res.status(400).json({ error: 'Invalid or expired reset code.' });
      return;
    }
    const user = db.users.find((u) => u.email.toLowerCase() === emailLower && !u.isDemo);
    if (!user) {
      res.status(404).json({ error: 'Account not found.' });
      return;
    }
    const { hash, salt } = hashPassword(parsed.data.newPassword);
    user.passwordHash = hash;
    user.passwordSalt = salt;
    db.resetTokens.splice(idx, 1);
    saveDb();
    res.json({ message: 'Password updated successfully. You can now sign in.' });
  });

  router.patch('/profile', requireAuth, (req: AuthedRequest, res) => {
    const schema = z.object({
      fullName: z.string().trim().min(2).max(100).optional(),
      phone: z.string().trim().min(7).max(25).optional(),
      city: z.string().trim().min(2).max(80).optional(),
      bio: z.string().trim().max(400).optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid profile details.' });
      return;
    }
    const user = req.currentUser!;
    if (parsed.data.fullName !== undefined) user.fullName = parsed.data.fullName;
    if (parsed.data.phone !== undefined) user.phone = parsed.data.phone;
    if (parsed.data.city !== undefined) user.city = parsed.data.city;
    if (parsed.data.bio !== undefined) user.bio = parsed.data.bio;
    saveDb();
    res.json({ user: toPublicUser(user) });
  });

  // --- IMAGE UPLOAD ---
  router.post('/upload', requireAuth, (req: AuthedRequest, res) => {
    const schema = z.object({
      dataUrl: z.string().min(20),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid image payload.' });
      return;
    }

    const match = /^data:image\/(jpeg|jpg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(parsed.data.dataUrl);
    if (!match) {
      res.status(400).json({ error: 'Only JPEG, PNG, and WebP images are accepted.' });
      return;
    }

    const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
    const buffer = Buffer.from(match[2], 'base64');
    if (buffer.byteLength > MAX_UPLOAD_BYTES) {
      res.status(413).json({ error: 'Image must be 3MB or smaller.' });
      return;
    }

    ensureUploadsDir();
    const safeFilename = `${crypto.randomUUID()}.${ext}`;
    const targetPath = path.resolve(UPLOADS_DIR, safeFilename);
    if (!targetPath.startsWith(UPLOADS_DIR + path.sep)) {
      res.status(400).json({ error: 'Invalid upload destination.' });
      return;
    }
    fs.writeFileSync(targetPath, buffer);
    res.status(201).json({ imageUrl: `/uploads/${safeFilename}` });
  });

  // --- FOOD DONATIONS ---
  router.get('/donations', optionalAuth, (req: AuthedRequest, res) => {
    const db = loadDb();
    const includeMine = req.query.mine === 'true';
    const includeAll = req.query.all === 'true' && req.currentUser?.role === 'admin';

    let list = [...db.donations];
    if (includeMine && req.currentUser) {
      list = list.filter((d) => d.donorId === req.currentUser!.id);
    } else if (!includeAll) {
      // Public explore NEVER exposes expired or flagged/unsafe food
      const now = Date.now();
      list = list.filter(
        (d) =>
          d.status === 'available' &&
          d.availableQuantity > 0 &&
          new Date(d.bestBefore).getTime() > now,
      );
    }

    const q = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';
    const location = typeof req.query.location === 'string' ? req.query.location.trim().toLowerCase() : '';
    const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';
    const dietary = typeof req.query.dietary === 'string' ? req.query.dietary.trim() : '';
    const minQuantity = Number(req.query.minQuantity || 0);

    if (q) {
      list = list.filter(
        (d) =>
          d.foodName.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q) ||
          d.donorName.toLowerCase().includes(q),
      );
    }
    if (location) {
      list = list.filter(
        (d) => d.city.toLowerCase().includes(location) || d.pickupAddress.toLowerCase().includes(location),
      );
    }
    if (category && category !== 'All') {
      list = list.filter((d) => d.category === category);
    }
    if (dietary && dietary !== 'All') {
      list = list.filter((d) => d.dietaryType === dietary);
    }
    if (minQuantity > 0) {
      list = list.filter((d) => d.availableQuantity >= minQuantity);
    }

    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json({ donations: list });
  });

  router.post('/donations', requireAuth, (req: AuthedRequest, res) => {
    const parsed = donationSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid donation details.' });
      return;
    }

    const data = parsed.data;
    if (!isSafeImageUrl(data.imageUrl)) {
      res.status(400).json({ error: 'Invalid food image URL.' });
      return;
    }

    const preparedMs = new Date(data.preparedAt).getTime();
    const bestBeforeMs = new Date(data.bestBefore).getTime();
    if (Number.isNaN(preparedMs) || Number.isNaN(bestBeforeMs)) {
      res.status(400).json({ error: 'Invalid preparation or expiry date.' });
      return;
    }
    if (bestBeforeMs <= Date.now()) {
      res.status(400).json({
        error: 'Safe consumption deadline must be in the future. Expired food cannot be listed.',
      });
      return;
    }
    if (bestBeforeMs <= preparedMs) {
      res.status(400).json({
        error: 'Best before deadline must be after preparation time.',
      });
      return;
    }

    const db = loadDb();
    const user = req.currentUser!;
    const coords =
      typeof data.lat === 'number' && typeof data.lng === 'number'
        ? { lat: data.lat, lng: data.lng }
        : resolveCityCoordinates(data.city);

    const nowIso = new Date().toISOString();
    const donation = {
      id: `don-${crypto.randomUUID()}`,
      donorId: user.id,
      donorName: user.fullName,
      donorRole: user.role,
      donorVerified: user.verifiedByAdmin || user.emailVerified,
      foodName: data.foodName,
      category: data.category,
      description: data.description,
      imageUrl: data.imageUrl,
      totalQuantity: data.totalQuantity,
      availableQuantity: data.totalQuantity,
      unit: data.unit,
      servesCount: data.servesCount,
      preparedAt: new Date(preparedMs).toISOString(),
      bestBefore: new Date(bestBeforeMs).toISOString(),
      pickupAddress: data.pickupAddress,
      city: data.city,
      lat: coords.lat,
      lng: coords.lng,
      pickupWindow: data.pickupWindow,
      dietaryType: data.dietaryType,
      storageInstructions: data.storageInstructions,
      allergens: data.allergens || 'None declared',
      contactDetails: data.contactDetails,
      safetyDeclared: true,
      status: 'available' as const,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    db.donations.unshift(donation);
    saveDb();
    res.status(201).json({ donation });
  });

  router.patch('/donations/:id', requireAuth, (req: AuthedRequest, res) => {
    const db = loadDb();
    const donation = db.donations.find((d) => d.id === req.params.id);
    if (!donation) {
      res.status(404).json({ error: 'Donation not found.' });
      return;
    }
    if (donation.donorId !== req.currentUser!.id && req.currentUser!.role !== 'admin') {
      res.status(403).json({ error: 'Only the donor or an admin can edit this listing.' });
      return;
    }

    const patchSchema = z.object({
      foodName: z.string().trim().min(3).max(120).optional(),
      description: z.string().trim().min(10).max(1000).optional(),
      availableQuantity: z.coerce.number().int().min(0).max(5000).optional(),
      pickupWindow: z.string().trim().min(3).max(120).optional(),
      storageInstructions: z.string().trim().min(3).max(400).optional(),
      bestBefore: z.string().optional(),
      status: z.enum(['available', 'reserved', 'collected', 'expired', 'flagged']).optional(),
    });
    const parsed = patchSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid update values.' });
      return;
    }

    const patch = parsed.data;
    if (patch.bestBefore) {
      const ms = new Date(patch.bestBefore).getTime();
      if (Number.isNaN(ms) || ms <= Date.now()) {
        res.status(400).json({ error: 'Best before deadline must be in the future.' });
        return;
      }
      donation.bestBefore = new Date(ms).toISOString();
    }
    if (patch.foodName !== undefined) donation.foodName = patch.foodName;
    if (patch.description !== undefined) donation.description = patch.description;
    if (patch.availableQuantity !== undefined) {
      donation.availableQuantity = Math.min(patch.availableQuantity, donation.totalQuantity);
    }
    if (patch.pickupWindow !== undefined) donation.pickupWindow = patch.pickupWindow;
    if (patch.storageInstructions !== undefined) donation.storageInstructions = patch.storageInstructions;
    if (patch.status !== undefined) {
      if (donation.status === 'flagged' && req.currentUser!.role !== 'admin') {
        res.status(403).json({ error: 'Only an administrator can clear a safety-flagged listing.' });
        return;
      }
      if (patch.status === 'available' && new Date(donation.bestBefore).getTime() <= Date.now()) {
        res.status(400).json({ error: 'Cannot mark an expired listing as available.' });
        return;
      }
      donation.status = patch.status;
    }
    donation.updatedAt = new Date().toISOString();
    saveDb();
    res.json({ donation });
  });

  router.delete('/donations/:id', requireAuth, (req: AuthedRequest, res) => {
    const db = loadDb();
    const idx = db.donations.findIndex((d) => d.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Donation not found.' });
      return;
    }
    const donation = db.donations[idx];
    if (donation.donorId !== req.currentUser!.id && req.currentUser!.role !== 'admin') {
      res.status(403).json({ error: 'Only the donor or an admin can delete this listing.' });
      return;
    }
    db.donations.splice(idx, 1);
    saveDb();
    res.json({ deleted: true });
  });

  // --- FOOD REQUESTS (ATOMIC QUANTITY LOCKING) ---
  router.get('/requests', requireAuth, (req: AuthedRequest, res) => {
    const db = loadDb();
    const user = req.currentUser!;
    const scope = req.query.scope;

    let list = [...db.requests];
    if (user.role === 'admin' && scope === 'all') {
      // Admin sees all requests
    } else if (scope === 'incoming') {
      list = list.filter((r) => r.donorId === user.id);
    } else if (scope === 'outgoing') {
      list = list.filter((r) => r.requesterId === user.id);
    } else {
      list = list.filter((r) => r.donorId === user.id || r.requesterId === user.id);
    }

    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json({ requests: list });
  });

  router.post('/requests', requireAuth, (req: AuthedRequest, res) => {
    const parsed = requestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid food request.' });
      return;
    }

    const db = loadDb();
    const user = req.currentUser!;
    const donation = db.donations.find((d) => d.id === parsed.data.donationId);
    if (!donation) {
      res.status(404).json({ error: 'Food listing not found.' });
      return;
    }
    if (donation.donorId === user.id) {
      res.status(400).json({ error: 'You cannot request your own food donation.' });
      return;
    }
    if (donation.status !== 'available' || new Date(donation.bestBefore).getTime() <= Date.now()) {
      res.status(409).json({ error: 'This food listing is no longer available or has expired.' });
      return;
    }
    if (parsed.data.quantityRequested > donation.availableQuantity) {
      res.status(409).json({
        error: `Only ${donation.availableQuantity} ${donation.unit} remaining. Please adjust your quantity.`,
      });
      return;
    }
    if (parsed.data.fulfillmentType === 'delivery' && (!parsed.data.deliveryAddress || parsed.data.deliveryAddress.length < 5)) {
      res.status(400).json({ error: 'Please provide a delivery destination address.' });
      return;
    }

    const nowIso = new Date().toISOString();
    const foodRequest = {
      id: `req-${crypto.randomUUID()}`,
      donationId: donation.id,
      donationName: donation.foodName,
      donationImageUrl: donation.imageUrl,
      donorId: donation.donorId,
      donorName: donation.donorName,
      donorContact: undefined as string | undefined,
      pickupAddress: donation.pickupAddress,
      pickupCity: donation.city,
      requesterId: user.id,
      requesterName: user.fullName,
      requesterRole: user.role,
      quantityRequested: parsed.data.quantityRequested,
      unit: donation.unit,
      peopleServed: parsed.data.peopleServed,
      message: parsed.data.message,
      fulfillmentType: parsed.data.fulfillmentType,
      deliveryAddress: parsed.data.deliveryAddress,
      status: 'pending' as 'pending' | 'accepted' | 'rejected' | 'ready_for_pickup' | 'collected' | 'completed',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    // For demo showcase listings (non-loginable demo donor), reserve atomically immediately so the user can experience the end-to-end pickup/delivery workflow!
    if (donation.isDemo) {
      donation.availableQuantity = Math.max(0, donation.availableQuantity - parsed.data.quantityRequested);
      if (donation.availableQuantity === 0) {
        donation.status = 'reserved';
      }
      foodRequest.status = 'accepted';
      foodRequest.donorContact = donation.contactDetails;
      addNotification(db, {
        userId: user.id,
        type: 'request_accepted',
        title: 'Demo listing request accepted',
        message: `Your request for ${parsed.data.quantityRequested} ${donation.unit} of "${donation.foodName}" has been reserved.`,
      });

      if (foodRequest.fulfillmentType === 'delivery') {
        db.deliveries.unshift({
          id: `del-${crypto.randomUUID()}`,
          requestId: foodRequest.id,
          donationId: donation.id,
          donationName: donation.foodName,
          donorName: donation.donorName,
          requesterName: user.fullName,
          pickupAddress: donation.pickupAddress,
          pickupCity: donation.city,
          pickupLat: donation.lat,
          pickupLng: donation.lng,
          dropoffAddress: foodRequest.deliveryAddress || user.city,
          dropoffCity: user.city,
          mealsCount: foodRequest.peopleServed,
          status: 'open',
          notes: foodRequest.message || 'Volunteer delivery requested.',
          createdAt: nowIso,
          updatedAt: nowIso,
        });
      }
    } else {
      addNotification(db, {
        userId: donation.donorId,
        type: 'request_new',
        title: 'New food request received',
        message: `${user.fullName} requested ${parsed.data.quantityRequested} ${donation.unit} of "${donation.foodName}".`,
      });
    }

    db.requests.unshift(foodRequest);
    saveDb();
    res.status(201).json({ request: foodRequest });
  });

  router.patch('/requests/:id/status', requireAuth, (req: AuthedRequest, res) => {
    const schema = z.object({
      status: z.enum(['accepted', 'rejected', 'ready_for_pickup', 'collected', 'completed']),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid status transition.' });
      return;
    }

    const db = loadDb();
    const user = req.currentUser!;
    const requestItem = db.requests.find((r) => r.id === req.params.id);
    if (!requestItem) {
      res.status(404).json({ error: 'Food request not found.' });
      return;
    }

    const donation = db.donations.find((d) => d.id === requestItem.donationId);
    const isDonor = requestItem.donorId === user.id;
    const isRequester = requestItem.requesterId === user.id;
    const isAdmin = user.role === 'admin';
    const nextStatus = parsed.data.status;

    if (['accepted', 'rejected', 'ready_for_pickup'].includes(nextStatus) && !isDonor && !isAdmin) {
      res.status(403).json({ error: 'Only the donor can accept, reject, or mark ready for pickup.' });
      return;
    }
    if (['collected', 'completed'].includes(nextStatus) && !isDonor && !isRequester && !isAdmin) {
      res.status(403).json({ error: 'Not authorized to update collection status.' });
      return;
    }

    const nowIso = new Date().toISOString();

    if (nextStatus === 'accepted') {
      if (requestItem.status !== 'pending') {
        res.status(409).json({ error: 'Only pending requests can be accepted.' });
        return;
      }
      if (!donation || donation.status === 'expired' || donation.status === 'flagged') {
        res.status(409).json({ error: 'Food listing is no longer available.' });
        return;
      }
      // Atomic check prevents double-reserving available quantity
      if (donation.availableQuantity < requestItem.quantityRequested) {
        res.status(409).json({
          error: `Insufficient remaining quantity (${donation.availableQuantity} ${donation.unit} available).`,
        });
        return;
      }
      donation.availableQuantity -= requestItem.quantityRequested;
      if (donation.availableQuantity === 0) {
        donation.status = 'reserved';
      }
      donation.updatedAt = nowIso;
      requestItem.donorContact = donation.contactDetails;
      requestItem.status = 'accepted';

      addNotification(db, {
        userId: requestItem.requesterId,
        type: 'request_accepted',
        title: 'Food request accepted',
        message: `${requestItem.donorName} accepted your request for "${requestItem.donationName}".`,
      });

      if (requestItem.fulfillmentType === 'delivery') {
        const delivery = {
          id: `del-${crypto.randomUUID()}`,
          requestId: requestItem.id,
          donationId: donation.id,
          donationName: donation.foodName,
          donorName: donation.donorName,
          requesterName: requestItem.requesterName,
          pickupAddress: donation.pickupAddress,
          pickupCity: donation.city,
          pickupLat: donation.lat,
          pickupLng: donation.lng,
          dropoffAddress: requestItem.deliveryAddress || requestItem.pickupCity,
          dropoffCity: requestItem.pickupCity,
          mealsCount: requestItem.peopleServed,
          status: 'open' as const,
          notes: requestItem.message,
          createdAt: nowIso,
          updatedAt: nowIso,
        };
        db.deliveries.unshift(delivery);
        // Notify volunteers in the same city
        for (const vol of db.users.filter((u) => u.role === 'volunteer' && !u.isDemo)) {
          addNotification(db, {
            userId: vol.id,
            type: 'delivery_update',
            title: 'New volunteer delivery task available',
            message: `Pickup "${donation.foodName}" in ${donation.city} (${requestItem.peopleServed} meals).`,
          });
        }
      }
    } else if (nextStatus === 'rejected') {
      if (requestItem.status !== 'pending') {
        res.status(409).json({ error: 'Only pending requests can be rejected.' });
        return;
      }
      requestItem.status = 'rejected';
      addNotification(db, {
        userId: requestItem.requesterId,
        type: 'request_rejected',
        title: 'Food request declined',
        message: `Your request for "${requestItem.donationName}" could not be fulfilled.`,
      });
    } else if (nextStatus === 'ready_for_pickup') {
      requestItem.status = 'ready_for_pickup';
      addNotification(db, {
        userId: requestItem.requesterId,
        type: 'ready_for_pickup',
        title: 'Food ready for collection',
        message: `"${requestItem.donationName}" is packed and ready at ${requestItem.pickupAddress}.`,
      });
    } else if (nextStatus === 'collected' || nextStatus === 'completed') {
      requestItem.status = nextStatus;
      if (donation && donation.availableQuantity === 0) {
        donation.status = 'collected';
        donation.updatedAt = nowIso;
      }
      addNotification(db, {
        userId: requestItem.donorId,
        type: 'collection_complete',
        title: 'Food collection confirmed',
        message: `${requestItem.requesterName} confirmed collection of "${requestItem.donationName}". Thank you for sharing!`,
      });
      addNotification(db, {
        userId: requestItem.requesterId,
        type: 'collection_complete',
        title: 'Meal sharing completed',
        message: `Your request for "${requestItem.donationName}" is marked as ${nextStatus}.`,
      });
    }

    requestItem.updatedAt = nowIso;
    saveDb();
    res.json({ request: requestItem });
  });

  // --- VOLUNTEER DELIVERIES ---
  router.get('/deliveries', requireAuth, (req: AuthedRequest, res) => {
    const db = loadDb();
    const user = req.currentUser!;
    const list =
      user.role === 'admin' || user.role === 'volunteer' || user.role === 'ngo'
        ? db.deliveries
        : db.deliveries.filter((d) => {
            const linked = db.requests.find((r) => r.id === d.requestId);
            return linked && (linked.donorId === user.id || linked.requesterId === user.id);
          });
    res.json({ deliveries: list });
  });

  router.post('/deliveries/:id/accept', requireAuth, requireRole('volunteer', 'ngo', 'admin'), (req: AuthedRequest, res) => {
    const db = loadDb();
    const user = req.currentUser!;
    const task = db.deliveries.find((d) => d.id === req.params.id);
    if (!task) {
      res.status(404).json({ error: 'Delivery task not found.' });
      return;
    }
    if (task.status !== 'open') {
      res.status(409).json({ error: 'This delivery task has already been claimed.' });
      return;
    }
    task.volunteerId = user.id;
    task.volunteerName = user.fullName;
    task.status = 'assigned';
    task.updatedAt = new Date().toISOString();

    const linkedReq = db.requests.find((r) => r.id === task.requestId);
    if (linkedReq) {
      addNotification(db, {
        userId: linkedReq.requesterId,
        type: 'delivery_update',
        title: 'Volunteer assigned to your delivery',
        message: `${user.fullName} accepted the delivery for "${task.donationName}".`,
      });
      addNotification(db, {
        userId: linkedReq.donorId,
        type: 'delivery_update',
        title: 'Volunteer en route for pickup',
        message: `${user.fullName} will collect "${task.donationName}" for delivery.`,
      });
    }
    saveDb();
    res.json({ delivery: task });
  });

  router.patch('/deliveries/:id/status', requireAuth, (req: AuthedRequest, res) => {
    const schema = z.object({
      status: z.enum(['assigned', 'picked_up', 'in_transit', 'delivered']),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid delivery status.' });
      return;
    }
    const db = loadDb();
    const user = req.currentUser!;
    const task = db.deliveries.find((d) => d.id === req.params.id);
    if (!task) {
      res.status(404).json({ error: 'Delivery task not found.' });
      return;
    }
    if (task.volunteerId !== user.id && user.role !== 'admin') {
      res.status(403).json({ error: 'Only the assigned volunteer or admin can update this task.' });
      return;
    }

    const nowIso = new Date().toISOString();
    task.status = parsed.data.status;
    task.updatedAt = nowIso;

    const linkedReq = db.requests.find((r) => r.id === task.requestId);
    if (linkedReq) {
      if (parsed.data.status === 'delivered') {
        linkedReq.status = 'completed';
        linkedReq.updatedAt = nowIso;
        const don = db.donations.find((d) => d.id === linkedReq.donationId);
        if (don && don.availableQuantity === 0) {
          don.status = 'collected';
          don.updatedAt = nowIso;
        }
      }
      addNotification(db, {
        userId: linkedReq.requesterId,
        type: 'delivery_update',
        title: `Delivery ${parsed.data.status.replace('_', ' ')}`,
        message: `Volunteer ${task.volunteerName} marked "${task.donationName}" as ${parsed.data.status.replace('_', ' ')}.`,
      });
    }
    saveDb();
    res.json({ delivery: task });
  });

  // --- ORGANIZATIONS / NGO MODULE ---
  router.get('/organizations', (_req, res) => {
    const db = loadDb();
    res.json({ organizations: db.organizations });
  });

  router.post('/organizations', requireAuth, (req: AuthedRequest, res) => {
    const parsed = orgSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid organization details.' });
      return;
    }
    const db = loadDb();
    const user = req.currentUser!;
    const existing = db.organizations.find((o) => o.userId === user.id);
    if (existing) {
      Object.assign(existing, parsed.data);
      saveDb();
      res.json({ organization: existing });
      return;
    }

    const org = {
      id: `org-${crypto.randomUUID()}`,
      userId: user.id,
      ...parsed.data,
      verifiedStatus: 'pending' as const,
      createdAt: new Date().toISOString(),
    };
    db.organizations.unshift(org);
    user.organizationId = org.id;
    addNotification(db, {
      userId: user.id,
      type: 'system',
      title: 'Organization profile submitted',
      message: `${org.name} has been registered and queued for admin verification.`,
    });
    saveDb();
    res.status(201).json({ organization: org });
  });

  // --- NOTIFICATIONS ---
  router.get('/notifications', requireAuth, (req: AuthedRequest, res) => {
    const db = loadDb();
    const list = db.notifications.filter((n) => n.userId === req.currentUser!.id);
    res.json({ notifications: list });
  });

  router.patch('/notifications/read-all', requireAuth, (req: AuthedRequest, res) => {
    const db = loadDb();
    for (const n of db.notifications) {
      if (n.userId === req.currentUser!.id) n.read = true;
    }
    saveDb();
    res.json({ ok: true });
  });

  router.patch('/notifications/:id/read', requireAuth, (req: AuthedRequest, res) => {
    const db = loadDb();
    const item = db.notifications.find((n) => n.id === req.params.id && n.userId === req.currentUser!.id);
    if (!item) {
      res.status(404).json({ error: 'Notification not found.' });
      return;
    }
    item.read = true;
    saveDb();
    res.json({ notification: item });
  });

  // --- COMMUNITY, STORIES, CAMPAIGNS, REVIEWS ---
  router.get('/community', (_req, res) => {
    const db = loadDb();
    // Build verified + demo leaderboard transparently
    const donorCounts = new Map<string, { name: string; city: string; role: string; meals: number; isDemo: boolean }>();
    for (const d of db.donations) {
      const current = donorCounts.get(d.donorId) || {
        name: d.donorName,
        city: d.city,
        role: d.donorRole,
        meals: 0,
        isDemo: Boolean(d.isDemo),
      };
      current.meals += d.servesCount;
      donorCounts.set(d.donorId, current);
    }

    const leaderboard = Array.from(donorCounts.values())
      .sort((a, b) => b.meals - a.meals)
      .slice(0, 8);

    const recentActivity = [
      ...db.donations.slice(0, 6).map((d) => ({
        id: d.id,
        text: `${d.donorName} shared ${d.totalQuantity} ${d.unit} of ${d.foodName}`,
        city: d.city,
        timestamp: d.createdAt,
        isDemo: Boolean(d.isDemo),
      })),
    ];

    res.json({
      stories: db.communityStories,
      campaigns: db.campaigns,
      organizations: db.organizations.filter((o) => o.verifiedStatus === 'verified'),
      leaderboard,
      recentActivity,
      reviews: db.reviews.slice(0, 12),
    });
  });

  router.post('/campaigns/:id/join', requireAuth, (req: AuthedRequest, res) => {
    const db = loadDb();
    const camp = db.campaigns.find((c) => c.id === req.params.id);
    if (!camp) {
      res.status(404).json({ error: 'Campaign not found.' });
      return;
    }
    const uid = req.currentUser!.id;
    if (!camp.joinedUserIds.includes(uid)) {
      camp.joinedUserIds.push(uid);
      camp.participantsCount += 1;
      saveDb();
    }
    res.json({ campaign: camp });
  });

  router.post('/reviews', requireAuth, (req: AuthedRequest, res) => {
    const parsed = reviewSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Please provide a rating (1–5) and short review.' });
      return;
    }
    const db = loadDb();
    const don = db.donations.find((d) => d.id === parsed.data.donationId);
    if (!don) {
      res.status(404).json({ error: 'Donation not found.' });
      return;
    }
    const review = {
      id: `rev-${crypto.randomUUID()}`,
      donationId: don.id,
      donationName: don.foodName,
      fromUserId: req.currentUser!.id,
      fromUserName: req.currentUser!.fullName,
      toUserId: don.donorId,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
      createdAt: new Date().toISOString(),
    };
    db.reviews.unshift(review);
    saveDb();
    res.status(201).json({ review });
  });

  // --- SAFETY REPORTS & SUPPORT ---
  router.post('/reports', requireAuth, (req: AuthedRequest, res) => {
    const parsed = reportSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid report.' });
      return;
    }
    const db = loadDb();
    let targetLabel = parsed.data.targetId;
    if (parsed.data.targetType === 'donation') {
      const don = db.donations.find((d) => d.id === parsed.data.targetId);
      if (!don) {
        res.status(404).json({ error: 'Food listing not found.' });
        return;
      }
      targetLabel = don.foodName;
      // Immediately protect seekers by flagging unsafe/expired reports until reviewed
      const unsafeReason = /unsafe|spoil|expire|stale|contaminat|hygiene/i.test(
        `${parsed.data.reason} ${parsed.data.details}`,
      );
      if (unsafeReason) {
        don.status = 'flagged';
        don.updatedAt = new Date().toISOString();
      }
    }

    const report = {
      id: `rep-${crypto.randomUUID()}`,
      targetType: parsed.data.targetType,
      targetId: parsed.data.targetId,
      targetLabel,
      reporterId: req.currentUser!.id,
      reporterName: req.currentUser!.fullName,
      reason: parsed.data.reason,
      details: parsed.data.details,
      status: 'open' as const,
      createdAt: new Date().toISOString(),
    };
    db.reports.unshift(report);
    saveDb();
    res.status(201).json({ report });
  });

  router.post('/support', (req, res) => {
    const parsed = supportSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Please complete all fields.' });
      return;
    }
    const db = loadDb();
    const ticket = {
      id: `sup-${crypto.randomUUID()}`,
      ...parsed.data,
      status: 'open' as const,
      createdAt: new Date().toISOString(),
    };
    db.supportMessages.unshift(ticket);
    saveDb();
    res.status(201).json({ ticket, message: 'Thank you. Your message has been received by FoodCircle Support.' });
  });

  // --- ADMIN DASHBOARD ENDPOINTS ---
  router.get('/admin/overview', requireAuth, requireRole('admin'), (_req, res) => {
    const db = loadDb();
    const completedRequests = db.requests.filter((r) => r.status === 'completed' || r.status === 'collected');
    const mealsShared = completedRequests.reduce((acc, r) => acc + r.peopleServed, 0);

    res.json({
      analytics: {
        totalUsers: db.users.filter((u) => !u.isDemo).length,
        totalDonations: db.donations.length,
        verifiedDonations: db.donations.filter((d) => !d.isDemo).length,
        totalMealsShared: mealsShared,
        activeListings: db.donations.filter((d) => d.status === 'available').length,
        completedRequests: completedRequests.length,
        volunteerDeliveries: db.deliveries.length,
        openReports: db.reports.filter((r) => r.status === 'open').length,
      },
      users: db.users.map(toPublicUser),
      organizations: db.organizations,
      donations: db.donations,
      requests: db.requests,
      deliveries: db.deliveries,
      reports: db.reports,
      supportMessages: db.supportMessages,
    });
  });

  router.patch('/admin/users/:id/verify', requireAuth, requireRole('admin'), (req, res) => {
    const schema = z.object({ verifiedByAdmin: z.boolean() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid verification state.' });
      return;
    }
    const db = loadDb();
    const user = db.users.find((u) => u.id === req.params.id);
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }
    user.verifiedByAdmin = parsed.data.verifiedByAdmin;
    for (const d of db.donations) {
      if (d.donorId === user.id) d.donorVerified = user.verifiedByAdmin;
    }
    saveDb();
    res.json({ user: toPublicUser(user) });
  });

  router.patch('/admin/organizations/:id/verify', requireAuth, requireRole('admin'), (req, res) => {
    const schema = z.object({ verifiedStatus: z.enum(['verified', 'rejected', 'pending']) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid status.' });
      return;
    }
    const db = loadDb();
    const org = db.organizations.find((o) => o.id === req.params.id);
    if (!org) {
      res.status(404).json({ error: 'Organization not found.' });
      return;
    }
    org.verifiedStatus = parsed.data.verifiedStatus;
    addNotification(db, {
      userId: org.userId,
      type: 'system',
      title: `Organization verification ${org.verifiedStatus}`,
      message: `${org.name} status was updated to ${org.verifiedStatus} by FoodCircle Admin.`,
    });
    saveDb();
    res.json({ organization: org });
  });

  router.patch('/admin/reports/:id', requireAuth, requireRole('admin'), (req, res) => {
    const schema = z.object({
      status: z.enum(['reviewed', 'resolved', 'dismissed']),
      adminNote: z.string().trim().max(500).optional(),
      restoreDonation: z.boolean().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid report update.' });
      return;
    }
    const db = loadDb();
    const rep = db.reports.find((r) => r.id === req.params.id);
    if (!rep) {
      res.status(404).json({ error: 'Report not found.' });
      return;
    }
    rep.status = parsed.data.status;
    rep.adminNote = parsed.data.adminNote;

    if (rep.targetType === 'donation' && parsed.data.restoreDonation) {
      const don = db.donations.find((d) => d.id === rep.targetId);
      if (don && new Date(don.bestBefore).getTime() > Date.now() && don.availableQuantity > 0) {
        don.status = 'available';
        don.updatedAt = new Date().toISOString();
      }
    }
    saveDb();
    res.json({ report: rep });
  });

  return router;
}
