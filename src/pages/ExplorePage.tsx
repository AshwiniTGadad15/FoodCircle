import { useEffect, useMemo, useState } from 'react';
import {
  Crosshair,
  LayoutGrid,
  Map as MapIcon,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import type { FoodDonation } from '../../shared/types.ts';
import {
  apiRequest,
  calculateDistanceKm,
  FOOD_CATEGORIES,
  INDIAN_CITIES,
} from '../lib/api.ts';
import { useApp } from '../context/AppContext.tsx';
import { FoodCard } from '../components/FoodCard.tsx';
import { FoodMap } from '../components/FoodMap.tsx';
import { FoodDetailModal } from '../components/FoodDetailModal.tsx';

export function ExplorePage() {
  const { userLocation, requestLocation, openDonateModal, dataVersion } = useApp();

  const [donations, setDonations] = useState<FoodDonation[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

  const [searchFood, setSearchFood] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [category, setCategory] = useState('All');
  const [dietary, setDietary] = useState<'All' | 'Veg' | 'Non-Veg'>('All');
  const [availableNowOnly, setAvailableNowOnly] = useState(true);
  const [maxDistanceKm, setMaxDistanceKm] = useState<number>(0); // 0 = Any distance across India
  const [minQuantity, setMinQuantity] = useState<number>(0);

  const [selectedDonation, setSelectedDonation] = useState<FoodDonation | null>(null);
  const [detailMode, setDetailMode] = useState<'details' | 'request'>('details');

  useEffect(() => {
    let active = true;
    setLoading(true);
    apiRequest<{ donations: FoodDonation[] }>('/donations')
      .then((res) => {
        if (active) setDonations(res.donations);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [dataVersion]);

  const filtered = useMemo(() => {
    return donations
      .filter((item) => {
        if (searchFood.trim()) {
          const q = searchFood.trim().toLowerCase();
          const hit =
            item.foodName.toLowerCase().includes(q) ||
            item.description.toLowerCase().includes(q) ||
            item.donorName.toLowerCase().includes(q);
          if (!hit) return false;
        }
        if (searchLocation.trim()) {
          const loc = searchLocation.trim().toLowerCase();
          if (
            !item.city.toLowerCase().includes(loc) &&
            !item.pickupAddress.toLowerCase().includes(loc)
          ) {
            return false;
          }
        }
        if (category !== 'All' && item.category !== category) return false;
        if (dietary !== 'All' && item.dietaryType !== dietary) return false;
        if (availableNowOnly && (item.availableQuantity <= 0 || item.status !== 'available')) {
          return false;
        }
        if (minQuantity > 0 && item.availableQuantity < minQuantity) return false;
        if (maxDistanceKm > 0) {
          const dist = calculateDistanceKm(userLocation.lat, userLocation.lng, item.lat, item.lng);
          if (dist > maxDistanceKm) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const dA = calculateDistanceKm(userLocation.lat, userLocation.lng, a.lat, a.lng);
        const dB = calculateDistanceKm(userLocation.lat, userLocation.lng, b.lat, b.lng);
        return dA - dB;
      });
  }, [
    donations,
    searchFood,
    searchLocation,
    category,
    dietary,
    availableNowOnly,
    minQuantity,
    maxDistanceKm,
    userLocation,
  ]);

  const resetFilters = () => {
    setSearchFood('');
    setSearchLocation('');
    setCategory('All');
    setDietary('All');
    setAvailableNowOnly(true);
    setMaxDistanceKm(0);
    setMinQuantity(0);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Row */}
      <div className="bg-gradient-to-r from-orange-50 via-rose-50/70 to-teal-50 rounded-3xl border border-orange-200/70 p-6 sm:p-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-[#EA580C] mb-1">Live Neighborhood Food Discovery</p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#1E242B]">
            Explore Surplus Food
          </h1>
          <p className="text-sm text-[#4B5563] mt-1.5">
            Discover verified, safe surplus meals, fresh produce, and bakery items available for
            pickup or volunteer delivery.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={requestLocation}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-teal-300 bg-white text-xs font-semibold text-teal-800 hover:bg-teal-50 transition-colors whitespace-nowrap"
          >
            <Crosshair className="w-4 h-4 text-teal-600" />
            {userLocation.source === 'gps' ? 'GPS Active' : 'Use My Location'}
          </button>

          <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-white/90 border border-stone-200">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                viewMode === 'grid'
                  ? 'bg-gradient-to-r from-[#EA580C] to-[#F97316] text-white shadow-xs'
                  : 'text-[#4B5563]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Cards
            </button>
            <button
              type="button"
              onClick={() => setViewMode('map')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                viewMode === 'map'
                  ? 'bg-gradient-to-r from-[#0D9488] to-[#0284C7] text-white shadow-xs'
                  : 'text-[#4B5563]'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              Map View
            </button>
          </div>

          <button
            type="button"
            onClick={openDonateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg foodcircle-cta-gradient text-white text-xs font-semibold transition-all shadow-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Share Food
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-[#E2E8E0] p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 text-[#526054] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchFood}
              onChange={(e) => setSearchFood(e.target.value)}
              placeholder="Search food name, dish, or donor..."
              className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-[#D4DFD2] text-sm focus:outline-none focus:ring-2 focus:ring-[#16834A]"
            />
          </div>

          <div className="md:col-span-3">
            <input
              type="text"
              list="indian-city-options"
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
              placeholder="Filter city or neighborhood..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#D4DFD2] text-sm focus:outline-none focus:ring-2 focus:ring-[#16834A]"
            />
            <datalist id="indian-city-options">
              {INDIAN_CITIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>

          <div className="md:col-span-3">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#D4DFD2] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#16834A]"
            >
              <option value="All">All Food Categories</option>
              {FOOD_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2 flex items-center gap-1 p-1 rounded-lg bg-[#F1F5F0]">
            {(['All', 'Veg', 'Non-Veg'] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setDietary(opt)}
                className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                  dietary === opt ? 'bg-white text-[#202820] shadow-xs' : 'text-[#526054]'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-3 border-t border-[#E2E8E0] flex flex-wrap items-center justify-between gap-4 text-xs text-[#526054]">
          <div className="flex flex-wrap items-center gap-5">
            <label className="inline-flex items-center gap-2 cursor-pointer text-[#202820] font-medium">
              <input
                type="checkbox"
                checked={availableNowOnly}
                onChange={(e) => setAvailableNowOnly(e.target.checked)}
                className="rounded border-[#16834A] text-[#16834A] focus:ring-[#16834A]"
              />
              Available now
            </label>

            <div className="inline-flex items-center gap-2">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#16834A]" />
              <span>Distance:</span>
              <select
                value={maxDistanceKm}
                onChange={(e) => setMaxDistanceKm(Number(e.target.value))}
                className="px-2 py-1 rounded-md border border-[#D4DFD2] bg-white text-[#202820] font-medium"
              >
                <option value={0}>Any distance</option>
                <option value={10}>Within 10 km</option>
                <option value={25}>Within 25 km</option>
                <option value={100}>Within 100 km</option>
              </select>
            </div>

            <div className="inline-flex items-center gap-2">
              <span>Min quantity:</span>
              <select
                value={minQuantity}
                onChange={(e) => setMinQuantity(Number(e.target.value))}
                className="px-2 py-1 rounded-md border border-[#D4DFD2] bg-white text-[#202820] font-medium"
              >
                <option value={0}>Any quantity</option>
                <option value={5}>5+ units</option>
                <option value={15}>15+ units (Bulk / NGO)</option>
                <option value={25}>25+ units</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="tabular-nums font-medium text-[#202820]">
              {filtered.length} safe {filtered.length === 1 ? 'listing' : 'listings'} found
            </span>
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 text-[#16834A] font-semibold hover:underline"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Results View */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-[#E2E8E0] h-96 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E2E8E0] p-12 text-center space-y-3">
          <h3 className="font-display text-xl font-bold text-[#202820]">
            No matching surplus food listings right now
          </h3>
          <p className="text-sm text-[#526054] max-w-md mx-auto">
            Try expanding your distance radius or clearing filters. Expired listings are
            automatically hidden for food safety.
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={resetFilters}
              className="px-4 py-2 rounded-lg border border-[#D4DFD2] text-sm font-semibold text-[#202820]"
            >
              Reset Filters
            </button>
            <button
              type="button"
              onClick={openDonateModal}
              className="px-4 py-2 rounded-lg bg-[#16834A] text-white text-sm font-semibold"
            >
              Share Surplus Food
            </button>
          </div>
        </div>
      ) : viewMode === 'map' ? (
        <FoodMap
          donations={filtered}
          center={userLocation}
          onSelectDonation={(d) => {
            setDetailMode('details');
            setSelectedDonation(d);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => (
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

      <FoodDetailModal
        donation={selectedDonation}
        initialMode={detailMode}
        onClose={() => setSelectedDonation(null)}
      />
    </div>
  );
}
