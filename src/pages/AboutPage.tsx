import { ArrowRight, Globe2, HeartHandshake, Leaf, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { GENERATED_ASSETS } from '../lib/api.ts';
import { FoodImage } from '../components/FoodImage.tsx';

export function AboutPage() {
  const { openAuthModal, navigate } = useApp();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-6 space-y-5">
          <p className="text-sm font-medium text-[#16834A]">About FoodCircle</p>
          <h1 className="font-display text-3xl sm:text-5xl font-bold text-[#202820] tracking-tight leading-tight">
            Connecting Surplus Food With People Who Need It.
          </h1>
          <p className="text-base text-[#526054] leading-relaxed">
            FoodCircle is a community-driven food-sharing network built in India to bridge the gap
            between perfectly good edible surplus and neighborhood hunger. Every day, untouched
            food from weddings, office cafeterias, bakeries, restaurants, and households goes to
            waste while millions struggle for nutritious meals.
          </p>
        </div>

        <div className="lg:col-span-6 rounded-3xl overflow-hidden border border-[#E2E8E0] aspect-[16/10]">
          <FoodImage
            src={GENERATED_ASSETS.hero}
            alt="Community food sharing initiative in India"
          />
        </div>
      </div>

      {/* Mission & Vision */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-emerald-50 via-white to-teal-50/80 rounded-3xl border border-emerald-200/80 p-8 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <h2 className="font-display text-2xl font-bold text-[#1E242B]">Our Mission</h2>
          <p className="text-base text-[#1E242B] font-medium leading-relaxed">
            “To create a connected community where surplus food reaches people who need it instead
            of going to waste.”
          </p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 via-white to-rose-50/80 rounded-3xl border border-orange-200/80 p-8 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center">
            <Globe2 className="w-5 h-5" />
          </div>
          <h2 className="font-display text-2xl font-bold text-[#1E242B]">Our Vision</h2>
          <p className="text-base text-[#1E242B] font-medium leading-relaxed">
            “A world where everyone has access to food and no good food is unnecessarily wasted.”
          </p>
        </div>
      </div>

      {/* Why Food Waste Matters */}
      <section className="bg-white/95 rounded-3xl border border-stone-200/80 p-8 sm:p-10 space-y-8">
        <div className="max-w-2xl">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#1E242B]">
            Why Food Waste Matters
          </h2>
          <p className="text-sm sm:text-base text-[#4B5563] mt-2 leading-relaxed">
            Reducing food waste is one of the fastest ways to support local communities and lower
            environmental strain simultaneously.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl bg-emerald-50/70 border border-emerald-200/60 p-6 space-y-2">
            <Leaf className="w-5 h-5 text-emerald-600" />
            <h3 className="font-display text-lg font-bold text-[#1E242B]">Environmental Impact</h3>
            <p className="text-sm text-[#4B5563] leading-relaxed">
              Discarded food wastes the land, water, fertilizer, and energy invested to grow and
              cook it, while decomposing food in landfills releases potent methane emissions.
            </p>
          </div>
          <div className="rounded-2xl bg-orange-50/70 border border-orange-200/60 p-6 space-y-2">
            <HeartHandshake className="w-5 h-5 text-orange-600" />
            <h3 className="font-display text-lg font-bold text-[#1E242B]">Dignified Local Access</h3>
            <p className="text-sm text-[#4B5563] leading-relaxed">
              By coordinating hyper-local pickups between kitchens, students, families, and verified
              shelters, surplus reaches neighbors quickly and respectfully.
            </p>
          </div>
          <div className="rounded-2xl bg-indigo-50/70 border border-indigo-200/60 p-6 space-y-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            <h3 className="font-display text-lg font-bold text-[#1E242B]">Safety-First Culture</h3>
            <p className="text-sm text-[#4B5563] leading-relaxed">
              Every shared meal carries preparation timestamps, safe consumption limits, allergen
              notices, and instant unsafe-food reporting.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="bg-gradient-to-r from-[#0F766E] via-[#0F9D58] to-[#EA580C] text-white rounded-3xl p-8 sm:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-md">
        <div className="space-y-2 max-w-xl">
          <h2 className="font-display text-2xl font-bold">
            How You Can Contribute Today
          </h2>
          <p className="text-sm text-white/90">
            Register as a Donor, Restaurant, NGO, Seeker, or Volunteer. Even sharing one extra batch
            of meals or completing a single 3 km delivery makes a tangible difference.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => openAuthModal('register')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-[#0F766E] text-sm font-bold hover:bg-amber-50"
          >
            Join FoodCircle
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => navigate('support')}
            className="px-5 py-2.5 rounded-xl bg-white/15 border border-white/30 text-white text-sm font-semibold hover:bg-white/25"
          >
            Contact Our Team
          </button>
        </div>
      </div>
    </div>
  );
}
