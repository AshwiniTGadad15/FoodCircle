# FoodCircle – Community Food Sharing Network

**"Connecting Surplus Food With People Who Need It."**
*Share Food. Spread Kindness. Reduce Waste.*

FoodCircle is a full-stack community food-sharing platform built for India, enabling households, restaurants, hotels, bakeries, grocery stores, NGOs, and volunteers to redistribute safe surplus food before it goes to waste.

## Key Features

- **Landing Page & Impact Transparency**: Editorial hero with live food preview cards and a toggle distinguishing **Verified Live Impact** from the **Initial Demo Baseline**.
- **Complete Role-Based Authentication**: Registration (Food Donor, Food Seeker, Volunteer, NGO / Organization, Restaurant / Business), email/password sign-in with `scrypt` hashing, signed HMAC-SHA256 Bearer tokens, email verification codes, password reset flow, and a one-time First-Run Admin claim workflow.
- **Food Donation & Safety Enforcement**: 14-field donation workflow with image upload (validated MIME & size), Veg/Non-Veg indicators, preparation timestamps, safe consumption deadlines, allergens, storage instructions, mandatory hygiene declaration, and automatic server-side hiding of expired or flagged listings.
- **Explore Food & OpenStreetMap Discovery**: Search by dish or location, filter by category, Veg/Non-Veg, availability, distance (Haversine + browser geolocation), and minimum quantity, with both Card Grid and interactive Leaflet + OpenStreetMap Map Views.
- **Atomic Food Request System**: Quantity-locked reservations prevent double-booking; donors accept, reject, mark ready for pickup, or complete requests with live in-app notifications.
- **Volunteer Delivery Hub**: Delivery requests automatically enter the open volunteer task pool with pickup/dropoff addresses and step-by-step status tracking (`Assigned` → `Picked Up` → `In Transit` → `Delivered`).
- **NGO & Organization Portal**: Organization registration, daily capacity tracking, bulk surplus discovery, and Admin verification workflow.
- **Community, About Us, Support & Admin Console**: Awareness campaigns with join pledges, community leaderboard, contact/issue/feedback forms, FAQs, and full Admin moderation & Recharts analytics.

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Motion, Recharts, Leaflet (OpenStreetMap), Lucide React
- **Backend**: Node.js + Express (`server.ts`, `server/routes.ts`, `server/auth.ts`, `server/db.ts`)
- **Validation & Persistence**: Zod schema validation, atomic JSON relational persistence (`data/foodcircle.json`), safe local photo uploads (`uploads/`)

## Environment Variables

Configure optional variables in `.env` (see `.env.example`):

- `APP_URL`: Deployed application URL.
- `ADMIN_PASSCODE`: Optional server-side passcode for Admin login. If unset, the first administrator can claim the console once via the inline **First-Run Admin Setup** form.
- `GOOGLE_CLIENT_ID`: Optional Google OAuth client ID if configuring Google Sign-In.

## Installation & Running Locally

```bash
npm install
npm run dev
```

The Express + Vite server listens on `http://localhost:3000`.

## Production Build & Deployment

```bash
npm run build
NODE_ENV=production npm start
```
