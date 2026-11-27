import { Clock, MapPin, ShieldCheck, Users } from 'lucide-react';
import type { FoodCategory, FoodDonation } from '../../shared/types.ts';
import { calculateDistanceKm, formatTimeRemaining } from '../lib/api.ts';
import { FoodImage } from './FoodImage.tsx';

interface FoodCardProps {
  donation: FoodDonation;
  userCoords: { lat: number; lng: number };
  onViewDetails: (donation: FoodDonation) => void;
  onRequestFood: (donation: FoodDonation) => void;
}

const CATEGORY_ACCENT: Record<
  FoodCategory,
  { bar: string; hoverBorder: string; btn: string; icon: string }
> = {
  'Rice and Biryani': {
    bar: 'from-orange-500 to-amber-400',
    hoverBorder: 'hover:border-orange-400',
    btn: 'bg-gradient-to-r from-[#EA580C] to-[#F97316] hover:from-[#C2410C] hover:to-[#EA580C]',
    icon: 'text-orange-600',
  },
  'Cooked Meals': {
    bar: 'from-rose-500 to-orange-400',
    hoverBorder: 'hover:border-rose-400',
    btn: 'bg-gradient-to-r from-[#E11D48] to-[#F97316] hover:from-[#BE123C] hover:to-[#EA580C]',
    icon: 'text-rose-600',
  },
  'Bakery Items': {
    bar: 'from-amber-500 to-yellow-400',
    hoverBorder: 'hover:border-amber-400',
    btn: 'bg-gradient-to-r from-[#D97706] to-[#F59E0B] hover:from-[#B45309] hover:to-[#D97706]',
    icon: 'text-amber-600',
  },
  Fruits: {
    bar: 'from-emerald-500 to-teal-400',
    hoverBorder: 'hover:border-emerald-400',
    btn: 'bg-gradient-to-r from-[#0F9D58] to-[#0D9488] hover:from-[#0D7A43] hover:to-[#0F766E]',
    icon: 'text-emerald-600',
  },
  Vegetables: {
    bar: 'from-lime-500 to-emerald-500',
    hoverBorder: 'hover:border-emerald-400',
    btn: 'bg-gradient-to-r from-[#0F9D58] to-[#10B981] hover:from-[#0D7A43] hover:to-[#059669]',
    icon: 'text-emerald-600',
  },
  'Packaged Food': {
    bar: 'from-sky-500 to-indigo-500',
    hoverBorder: 'hover:border-sky-400',
    btn: 'bg-gradient-to-r from-[#0284C7] to-[#4F46E5] hover:from-[#0369A1] hover:to-[#4338CA]',
    icon: 'text-sky-600',
  },
  Groceries: {
    bar: 'from-teal-500 to-cyan-500',
    hoverBorder: 'hover:border-teal-400',
    btn: 'bg-gradient-to-r from-[#0D9488] to-[#0891B2] hover:from-[#0F766E] hover:to-[#0E7490]',
    icon: 'text-teal-600',
  },
  Other: {
    bar: 'from-violet-500 to-fuchsia-500',
    hoverBorder: 'hover:border-violet-400',
    btn: 'bg-gradient-to-r from-[#7C3AED] to-[#DB2777] hover:from-[#6D28D9] hover:to-[#BE185D]',
    icon: 'text-violet-600',
  },
};

export function FoodCard({
  donation,
  userCoords,
  onViewDetails,
  onRequestFood,
}: FoodCardProps) {
  const remaining = formatTimeRemaining(donation.bestBefore);
  const distanceKm = calculateDistanceKm(
    userCoords.lat,
    userCoords.lng,
    donation.lat,
    donation.lng,
  );
  const theme = CATEGORY_ACCENT[donation.category] || CATEGORY_ACCENT['Cooked Meals'];

  return (
    <article
      className={`group bg-white/95 backdrop-blur-xs rounded-2xl border border-stone-200/80 overflow-hidden flex flex-col transition-all duration-200 ${theme.hoverBorder} hover:shadow-lg`}
    >
      <div className={`h-1.5 w-full bg-gradient-to-r ${theme.bar}`} />

      <div className="relative aspect-[4/3] overflow-hidden bg-orange-50">
        <FoodImage
          src={donation.imageUrl}
          alt={donation.foodName}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
        <div className="absolute bottom-3 left-3.5 right-3.5 flex items-center justify-between text-xs text-white font-semibold">
          <span className="tabular-nums">
            {donation.availableQuantity} {donation.unit} available
          </span>
          <span className="tabular-nums">{distanceKm} km away</span>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col">
        {/* Clean unboxed metadata line with accessible Veg/Non-Veg mark */}
        <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-xs text-[#4B5563] mb-1.5">
          <span className="inline-flex items-center gap-1.5 font-semibold text-[#1E242B]">
            <span
              className={`w-3 h-3 rounded-[2px] border flex items-center justify-center ${
                donation.dietaryType === 'Veg' ? 'border-[#0F9D58]' : 'border-rose-700'
              }`}
              aria-hidden="true"
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  donation.dietaryType === 'Veg' ? 'bg-[#0F9D58]' : 'bg-rose-700'
                }`}
              />
            </span>
            {donation.dietaryType}
          </span>
          <span aria-hidden="true">·</span>
          <span className={`font-medium ${theme.icon}`}>{donation.category}</span>
          {donation.isDemo && (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-[#6B7280]">Demo Sample</span>
            </>
          )}
        </div>

        <h3 className="font-display text-lg font-bold text-[#1E242B] leading-snug line-clamp-2 mb-2">
          {donation.foodName}
        </h3>

        <div className="space-y-1.5 text-xs text-[#4B5563] mb-4 flex-1">
          <div className="flex items-start gap-2">
            <MapPin className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${theme.icon}`} />
            <span className="line-clamp-1">
              {donation.pickupAddress}, {donation.city}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock
              className={`w-3.5 h-3.5 shrink-0 ${
                remaining.urgent ? 'text-rose-600' : 'text-teal-600'
              }`}
            />
            <span className={remaining.urgent ? 'text-rose-700 font-semibold' : ''}>
              Safe window: {remaining.label}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="tabular-nums">Serves ~{donation.servesCount} people</span>
          </div>
          <div className="flex items-center gap-2 pt-1 text-[#1E242B]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate font-medium">{donation.donorName}</span>
          </div>
        </div>

        <div className="pt-3.5 border-t border-stone-200/80 grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => onViewDetails(donation)}
            className="py-2 px-3 rounded-lg border border-stone-300 text-xs font-semibold text-[#1E242B] hover:bg-amber-50/70 transition-colors whitespace-nowrap"
          >
            View Details
          </button>
          <button
            type="button"
            onClick={() => onRequestFood(donation)}
            className={`py-2 px-3 rounded-lg text-white text-xs font-semibold transition-all whitespace-nowrap shadow-xs ${theme.btn}`}
          >
            Request Food
          </button>
        </div>
      </div>
    </article>
  );
}
