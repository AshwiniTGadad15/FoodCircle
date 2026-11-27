import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  Building2,
  HeartHandshake,
  ShieldCheck,
  Store,
  Truck,
  Utensils,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { apiRequest, GENERATED_ASSETS } from '../lib/api.ts';
import type { FoodDonation } from '../../shared/types.ts';
import { FoodImage } from '../components/FoodImage.tsx';
import { FoodCard } from '../components/FoodCard.tsx';
import { FoodDetailModal } from '../components/FoodDetailModal.tsx';

export function LandingPage() {
  const {
    navigate,
    openDonateModal,
    openAuthModal,
    impactStats,
    userLocation,
    dataVersion,
  } = useApp();

  const [featured, setFeatured] = useState<FoodDonation[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [statsMode, setStatsMode] = useState<'verified' | 'demo'>('demo');
  const [selectedDonation, setSelectedDonation] = useState<FoodDonation | null>(null);
  const [detailMode, setDetailMode] = useState<'details' | 'request'>('details');

  useEffect(() => {
    let active = true;
    setLoadingFeatured(true);
    apiRequest<{ donations: FoodDonation[] }>('/donations')
      .then((res) => {
        if (active) setFeatured(res.donations.slice(0, 3));
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingFeatured(false);
      });
    return () => {
      active = false;
    };
  }, [dataVersion]);

  const activeMetrics =
    statsMode === 'verified'
      ? {
          mealsShared: impactStats?.verified.mealsShared ?? 0,
          foodDonors: impactStats?.verified.foodDonors ?? 0,
          volunteers: impactStats?.verified.volunteers ?? 0,
          communitiesConnected: impactStats?.verified.communitiesConnected ?? 0,
        }
      : {
          mealsShared:
            (impactStats?.demoBaseline.mealsShared ?? 14820) +
            (impactStats?.verified.mealsShared ?? 0),
          foodDonors:
            (impactStats?.demoBaseline.foodDonors ?? 412) +
            (impactStats?.verified.foodDonors ?? 0),
          volunteers:
            (impactStats?.demoBaseline.volunteers ?? 186) +
            (impactStats?.verified.volunteers ?? 0),
          communitiesConnected:
            (impactStats?.demoBaseline.communitiesConnected ?? 24) +
            (impactStats?.verified.communitiesConnected ?? 0),
        };

  return (
    <div className="space-y-24 pb-8">
      {/* HERO SECTION */}
      <section className="pt-10 sm:pt-14 lg:pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
            {/* Left Copy Column */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-6 flex flex-col justify-center space-y-6"
            >
              <p className="text-sm font-semibold text-[#EA580C]">
                Community Food Sharing Network · India
              </p>

              <h1
                className="font-display font-bold text-[#1E242B] tracking-tight leading-[1.08]"
                style={{ fontSize: 'clamp(2.35rem, 4.2vw, 3.75rem)', textWrap: 'balance' }}
              >
                Good Food Deserves a{' '}
                <span className="bg-gradient-to-r from-[#EA580C] via-[#E11D48] to-[#0F9D58] bg-clip-text text-transparent">
                  Second Chance.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-[#4B5563] leading-relaxed max-w-xl">
                Share surplus food, support your community and help create a world where no meal
                goes to waste. Connect households, restaurants, bakeries, NGOs, and volunteers in
                minutes.
              </p>

              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <button
                  type="button"
                  onClick={openDonateModal}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl foodcircle-cta-gradient text-white text-sm font-semibold shadow-md shadow-orange-500/20 transition-all whitespace-nowrap"
                >
                  Share Food
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => navigate('explore')}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#0F9D58] to-[#0D9488] hover:from-[#0D7A43] hover:to-[#0F766E] text-white text-sm font-semibold shadow-md shadow-emerald-500/20 transition-all whitespace-nowrap"
                >
                  Find Food
                </button>
              </div>

              <div className="pt-4 border-t border-orange-200/70 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-[#4B5563]">
                <span className="text-emerald-700">Safety-verified deadlines</span>
                <span aria-hidden="true">·</span>
                <span className="text-teal-700">OpenStreetMap local discovery</span>
                <span aria-hidden="true">·</span>
                <span className="text-rose-700">Volunteer pickup dispatch</span>
              </div>
            </motion.div>

            {/* Right Editorial Hero Visual with Floating Live Food Cards */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-6 relative min-h-[340px] lg:min-h-[460px]"
            >
              <div className="absolute -inset-2 rounded-[2rem] bg-gradient-to-tr from-[#F97316]/25 via-[#E11D48]/15 to-[#0D9488]/25 blur-xl pointer-events-none" />
              <div className="relative w-full h-full rounded-3xl overflow-hidden border-2 border-white shadow-xl bg-orange-50">
                <FoodImage
                  src={GENERATED_ASSETS.hero}
                  alt="Indian community volunteers sharing neatly packed fresh meals at a sunlit table"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1E242B]/70 via-transparent to-transparent" />

                {/* Floating Food Card 1 */}
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                  className="hidden sm:flex items-center gap-3 absolute top-5 right-5 bg-white/95 backdrop-blur-md rounded-2xl p-3 border border-amber-200 shadow-lg max-w-[245px]"
                >
                  <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 ring-2 ring-orange-200">
                    <FoodImage src={GENERATED_ASSETS.biryani} alt="Hyderabadi Dum Biryani" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#1E242B] truncate">
                      Veg Dum Biryani
                    </div>
                    <div className="text-[11px] text-orange-700 font-medium tabular-nums">
                      24 boxes · Koramangala
                    </div>
                  </div>
                </motion.div>

                {/* Floating Food Card 2 */}
                <motion.div
                  animate={{ y: [0, 5, 0] }}
                  transition={{ duration: 5.8, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute bottom-5 left-5 right-5 sm:right-auto bg-white/95 backdrop-blur-md rounded-2xl p-3.5 border border-emerald-200 shadow-lg max-w-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 ring-2 ring-emerald-200">
                      <FoodImage src={GENERATED_ASSETS.bakery} alt="Artisan sourdough bakery boxes" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#1E242B] truncate">
                        Artisan Sourdough & Rolls
                      </div>
                      <div className="text-[11px] text-emerald-700 font-semibold">
                        Safety declaration verified · Ready now
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>

          {/* FULL-WIDTH COLORFUL IMPACT STATISTICS STRIP */}
          <div className="mt-12 bg-white/90 backdrop-blur-sm rounded-3xl border border-orange-200/70 shadow-sm p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200/80">
              <div>
                <h2 className="font-display text-lg font-bold text-[#1E242B]">
                  Community Impact Overview
                </h2>
                <p className="text-xs text-[#4B5563] mt-0.5">
                  {statsMode === 'verified'
                    ? 'Showing strictly verified completed transactions recorded in this FoodCircle database.'
                    : 'Includes initial illustrative India demonstration baseline alongside live verified records.'}
                </p>
              </div>
              <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-orange-50 border border-orange-200/60 self-start">
                <button
                  type="button"
                  onClick={() => setStatsMode('demo')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                    statsMode === 'demo'
                      ? 'bg-gradient-to-r from-[#EA580C] to-[#F97316] text-white shadow-xs'
                      : 'text-[#4B5563] hover:text-[#1E242B]'
                  }`}
                >
                  Demo + Live Baseline
                </button>
                <button
                  type="button"
                  onClick={() => setStatsMode('verified')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                    statsMode === 'verified'
                      ? 'bg-gradient-to-r from-[#0F9D58] to-[#0D9488] text-white shadow-xs'
                      : 'text-[#4B5563] hover:text-[#1E242B]'
                  }`}
                >
                  Verified Live Only
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
              <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/70 border border-emerald-200/70 p-5">
                <div className="font-mono text-3xl sm:text-4xl font-bold text-emerald-700 tabular-nums">
                  {activeMetrics.mealsShared.toLocaleString('en-IN')}
                </div>
                <div className="text-sm font-bold text-[#1E242B] mt-1">Meals Shared</div>
                <div className="text-xs text-emerald-800/80 mt-0.5">
                  {statsMode === 'verified' ? 'Confirmed collections' : 'Illustrative demo baseline'}
                </div>
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50/80 border border-orange-200/70 p-5">
                <div className="font-mono text-3xl sm:text-4xl font-bold text-orange-600 tabular-nums">
                  {activeMetrics.foodDonors.toLocaleString('en-IN')}
                </div>
                <div className="text-sm font-bold text-[#1E242B] mt-1">Food Donors</div>
                <div className="text-xs text-orange-800/80 mt-0.5">
                  Households, kitchens & bakeries
                </div>
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-sky-50 to-cyan-50/80 border border-sky-200/70 p-5">
                <div className="font-mono text-3xl sm:text-4xl font-bold text-sky-700 tabular-nums">
                  {activeMetrics.volunteers.toLocaleString('en-IN')}
                </div>
                <div className="text-sm font-bold text-[#1E242B] mt-1">Volunteers</div>
                <div className="text-xs text-sky-800/80 mt-0.5">
                  Neighborhood delivery riders
                </div>
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-rose-50 to-fuchsia-50/80 border border-rose-200/70 p-5">
                <div className="font-mono text-3xl sm:text-4xl font-bold text-rose-600 tabular-nums">
                  {activeMetrics.communitiesConnected.toLocaleString('en-IN')}
                </div>
                <div className="text-sm font-bold text-[#1E242B] mt-1">Communities Connected</div>
                <div className="text-xs text-rose-800/80 mt-0.5">
                  Active wards & cities in India
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED AVAILABLE FOOD */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#1E242B]">
              Fresh Surplus Available Right Now
            </h2>
            <p className="text-sm text-[#4B5563] mt-1.5">
              Every listing includes preparation time, storage instructions, and an enforced safe
              consumption deadline.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('explore')}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#EA580C] hover:text-[#C2410C] whitespace-nowrap"
          >
            Explore all listings & map
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {loadingFeatured ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((idx) => (
              <div
                key={idx}
                className="bg-white/80 rounded-2xl border border-stone-200 h-96 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featured.map((item) => (
              <FoodCard
                key={item.id}
                donation={item}
                userCoords={userLocation}
                onViewDetails={(d) => {
                  setDetailMode('details');
                  setSelectedDonation(d);
                }}
                onRequestFood={(d) => {
                  setDetailMode('request');
                  setSelectedDonation(d);
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* HOW IT WORKS COLORFUL EDITORIAL FLOW */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl border border-stone-200/80 p-8 sm:p-12 shadow-sm">
          <div className="max-w-2xl mb-10">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#1E242B]">
              How FoodCircle Turns Surplus Into Shared Meals
            </h2>
            <p className="text-sm sm:text-base text-[#4B5563] mt-2">
              A transparent, safety-first workflow designed for rapid neighborhood pickup before
              good food spoils.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                num: '01',
                title: 'List Surplus Safely',
                body: 'Donors upload food photos, portions, preparation time, allergens, and a mandatory safe consumption deadline.',
                bg: 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200/70',
                numColor: 'text-orange-600',
              },
              {
                num: '02',
                title: 'Discover & Request',
                body: 'Seekers, students, and NGOs filter nearby meals by Veg/Non-Veg, distance, and servings, reserving exact quantities.',
                bg: 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200/70',
                numColor: 'text-emerald-700',
              },
              {
                num: '03',
                title: 'Pickup or Volunteer Dispatch',
                body: 'Collectors pick up directly or request a neighborhood volunteer rider to transport sealed containers safely.',
                bg: 'bg-gradient-to-br from-sky-50 to-indigo-50 border-sky-200/70',
                numColor: 'text-sky-700',
              },
              {
                num: '04',
                title: 'Confirm & Track Impact',
                body: 'Both sides confirm handover, triggering live notifications and adding verified meals to community impact logs.',
                bg: 'bg-gradient-to-br from-rose-50 to-pink-50 border-rose-200/70',
                numColor: 'text-rose-600',
              },
            ].map((step) => (
              <div
                key={step.num}
                className={`rounded-2xl border p-6 space-y-2.5 ${step.bg}`}
              >
                <div className={`font-mono text-base font-bold ${step.numColor}`}>{step.num}.</div>
                <h3 className="font-display text-lg font-bold text-[#1E242B]">{step.title}</h3>
                <p className="text-sm text-[#4B5563] leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COLORFUL ROLE PATHWAYS & JEWEL-TONED SAFETY BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              {
                icon: Utensils,
                title: 'Individuals & Families',
                text: 'Share untouched celebration meals, extra home-cooked food, or sealed groceries with nearby neighbors.',
                iconBg: 'bg-orange-100 text-orange-700',
                cardAccent: 'border-orange-200/80 hover:border-orange-400',
                linkColor: 'text-orange-700 hover:text-orange-800',
              },
              {
                icon: Store,
                title: 'Restaurants, Hotels & Bakeries',
                text: 'Schedule daily end-of-service surplus pickups, reduce disposal costs, and track sustainability metrics.',
                iconBg: 'bg-rose-100 text-rose-700',
                cardAccent: 'border-rose-200/80 hover:border-rose-400',
                linkColor: 'text-rose-700 hover:text-rose-800',
              },
              {
                icon: Building2,
                title: 'NGOs & Community Kitchens',
                text: 'Register for verification, request bulk food lots, and coordinate volunteer distribution across wards.',
                iconBg: 'bg-indigo-100 text-indigo-700',
                cardAccent: 'border-indigo-200/80 hover:border-indigo-400',
                linkColor: 'text-indigo-700 hover:text-indigo-800',
              },
              {
                icon: Truck,
                title: 'Community Volunteers',
                text: 'Accept short-distance rescue deliveries on your schedule and track every meal you help deliver.',
                iconBg: 'bg-teal-100 text-teal-700',
                cardAccent: 'border-teal-200/80 hover:border-teal-400',
                linkColor: 'text-teal-700 hover:text-teal-800',
              },
            ].map((role) => {
              const Icon = role.icon;
              return (
                <div
                  key={role.title}
                  className={`bg-white/95 rounded-2xl border p-6 flex flex-col justify-between space-y-4 transition-all hover:shadow-md ${role.cardAccent}`}
                >
                  <div>
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${role.iconBg}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-display text-lg font-bold text-[#1E242B]">{role.title}</h3>
                    <p className="text-sm text-[#4B5563] mt-1.5 leading-relaxed">{role.text}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openAuthModal('register')}
                    className={`inline-flex items-center gap-1.5 text-xs font-bold ${role.linkColor}`}
                  >
                    Join as {role.title.split(' ')[0]}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="lg:col-span-5 bg-gradient-to-br from-[#0F766E] via-[#0F9D58] to-[#4338CA] text-white rounded-3xl p-8 flex flex-col justify-between space-y-6 overflow-hidden relative shadow-lg">
            <div className="space-y-4">
              <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-[#FDE047]" />
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold leading-tight">
                Food Safety Comes Before Every Single Meal.
              </h2>
              <p className="text-sm text-white/90 leading-relaxed">
                Not all surplus food is safe to redistribute. FoodCircle automatically hides expired
                listings, requires preparation timestamps and allergen disclosures, and lets any
                community member flag unsafe food immediately.
              </p>
            </div>

            <div className="space-y-3 pt-4 border-t border-white/20 text-sm">
              <div className="flex items-center gap-2.5">
                <HeartHandshake className="w-4 h-4 text-[#FDBA74] shrink-0" />
                <span>Mandatory donor food hygiene declaration</span>
              </div>
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#FDBA74] shrink-0" />
                <span>Automatic expiry cutoff — expired meals never listed</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate('about')}
                className="px-5 py-2.5 rounded-xl bg-white text-[#0F766E] text-sm font-bold hover:bg-amber-50 transition-colors"
              >
                Read Our Mission
              </button>
              <button
                type="button"
                onClick={() => navigate('support')}
                className="px-5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-sm font-semibold transition-colors"
              >
                Safety Guidelines & FAQ
              </button>
            </div>
          </div>
        </div>
      </section>

      <FoodDetailModal
        donation={selectedDonation}
        initialMode={detailMode}
        onClose={() => setSelectedDonation(null)}
      />
    </div>
  );
}
