import { AlertTriangle, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';

export function HowItWorksPage() {
  const { openDonateModal, navigate, openAuthModal } = useApp();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      <div className="max-w-3xl space-y-4">
        <p className="text-sm font-medium text-[#16834A]">Workflow & Food Safety Standards</p>
        <h1 className="font-display text-3xl sm:text-5xl font-bold text-[#202820] tracking-tight">
          How FoodCircle Connects Surplus Food Safely
        </h1>
        <p className="text-base text-[#526054] leading-relaxed">
          From a neighborhood bakery closing at 8 PM to a family celebration with untouched trays,
          FoodCircle turns time-sensitive surplus into safe community meals in four structured steps.
        </p>
      </div>

      {/* 4-Step Editorial Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          {
            step: '01. Post With Verified Safety Details',
            audience: 'Food Donors, Restaurants & Bakeries',
            points: [
              'Upload a clear photo and declare Veg or Non-Veg classification.',
              'Record exact preparation time, storage instructions, and allergens.',
              'Set a realistic Best Before deadline and sign the hygiene declaration.',
            ],
          },
          {
            step: '02. Search Nearby & Reserve Exact Quantity',
            audience: 'Food Seekers, Students & Verified NGOs',
            points: [
              'Filter live listings by distance, dietary preference, category, and bulk volume.',
              'Specify exact units needed so multiple families can share a large batch fairly.',
              'Atomic reservation locking prevents double-booking the same available portions.',
            ],
          },
          {
            step: '03. Self Pickup or Volunteer Delivery',
            audience: 'Collectors & Community Volunteers',
            points: [
              'Once accepted, donor pickup details and timing appear directly in your dashboard.',
              'If delivery is requested, an open delivery task is immediately posted to volunteers.',
              'Volunteers update status live from Assigned to Picked Up, In Transit, and Delivered.',
            ],
          },
          {
            step: '04. Confirm Handover & Build Trust',
            audience: 'Everyone in the Circle',
            points: [
              'Mark food as Collected or Completed to update verified meals saved.',
              'Leave constructive feedback for donors and flag any hygiene issues immediately.',
              'Track your cumulative waste reduction across your personal or NGO dashboard.',
            ],
          },
        ].map((card, i) => {
          const styles = [
            { box: 'bg-gradient-to-br from-white to-orange-50/80 border-orange-200/80', tag: 'text-orange-600', icon: 'text-orange-500' },
            { box: 'bg-gradient-to-br from-white to-emerald-50/80 border-emerald-200/80', tag: 'text-emerald-700', icon: 'text-emerald-600' },
            { box: 'bg-gradient-to-br from-white to-sky-50/80 border-sky-200/80', tag: 'text-sky-700', icon: 'text-sky-600' },
            { box: 'bg-gradient-to-br from-white to-rose-50/80 border-rose-200/80', tag: 'text-rose-600', icon: 'text-rose-500' },
          ][i % 4];
          return (
          <div key={card.step} className={`rounded-2xl border p-7 space-y-4 ${styles.box}`}>
            <div className={`text-xs font-bold ${styles.tag}`}>{card.audience}</div>
            <h2 className="font-display text-xl font-bold text-[#1E242B]">{card.step}</h2>
            <ul className="space-y-2.5 text-sm text-[#4B5563]">
              {card.points.map((pt) => (
                <li key={pt} className="flex items-start gap-2.5">
                  <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${styles.icon}`} />
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>
          );
        })}
      </div>

      {/* Food Safety Rules Table */}
      <section className="bg-white rounded-3xl border border-[#E2E8E0] p-8 space-y-6">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-6 h-6 text-[#16834A] shrink-0 mt-0.5" />
          <div>
            <h2 className="font-display text-2xl font-bold text-[#202820]">
              Food Safety & Redistribution Guidelines
            </h2>
            <p className="text-sm text-[#526054] mt-1">
              Not every type of leftover food is safe to share. Please follow these strict standards.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 rounded-2xl bg-[#EFFAF3] border border-[#C6E8D2] space-y-2.5">
            <h3 className="font-semibold text-sm text-[#16834A]">Accepted for Sharing</h3>
            <ul className="space-y-2 text-sm text-[#202820]">
              <li>• Untouched cooked meals kept covered and temperature-controlled.</li>
              <li>• Same-day bakery breads, rolls, and pastries stored hygienically.</li>
              <li>• Fresh unspoiled fruits, vegetables, and surplus farm produce.</li>
              <li>• Unopened packaged foods and dry groceries well within FSSAI expiry dates.</li>
            </ul>
          </div>

          <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 space-y-2.5">
            <h3 className="font-semibold text-sm text-amber-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Never Permitted on FoodCircle
            </h3>
            <ul className="space-y-2 text-sm text-amber-950">
              <li>• Plate leftovers or partially eaten meals from dining tables.</li>
              <li>• Cooked food left unrefrigerated in warm weather beyond safe windows.</li>
              <li>• Opened dairy, raw meat/seafood without unbroken cold chain, or swollen tins.</li>
              <li>• Any item past its Best Before / Use By timestamp (automatically blocked).</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Action Footer */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-[#EA580C] via-[#E11D48] to-[#7C3AED] text-white rounded-3xl p-8 shadow-md">
        <div>
          <h2 className="font-display text-2xl font-bold">Ready to make your first food share?</h2>
          <p className="text-sm text-white/90 mt-1">
            Start by exploring meals in your neighborhood or posting surplus food in under 2 minutes.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={openDonateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-[#C2410C] text-sm font-bold hover:bg-amber-50"
          >
            Share Surplus Food
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => navigate('explore')}
            className="px-5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-sm font-semibold"
          >
            Browse Explore Food
          </button>
          <button
            type="button"
            onClick={() => openAuthModal('register')}
            className="px-5 py-2.5 rounded-xl border border-white/30 hover:bg-white/10 text-white text-sm font-semibold"
          >
            Become a Volunteer
          </button>
        </div>
      </div>
    </div>
  );
}
