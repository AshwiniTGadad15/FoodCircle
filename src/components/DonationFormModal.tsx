import React, { useState } from 'react';
import { AlertTriangle, ShieldCheck, Upload, X } from 'lucide-react';
import type { DietaryType, FoodCategory, FoodDonation } from '../../shared/types.ts';
import {
  apiRequest,
  CATEGORY_PRESET_IMAGES,
  FOOD_CATEGORIES,
  INDIAN_CITIES,
} from '../lib/api.ts';
import { useApp } from '../context/AppContext.tsx';
import { FoodImage } from './FoodImage.tsx';

interface DonationFormModalProps {
  open: boolean;
  onClose: () => void;
  existing?: FoodDonation | null;
  onSaved?: () => void;
}

function toLocalDatetimeInput(isoDate: string): string {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

export function DonationFormModal({
  open,
  onClose,
  existing,
  onSaved,
}: DonationFormModalProps) {
  const { user, showToast, bumpDataVersion } = useApp();

  const defaultPrepared = toLocalDatetimeInput(new Date(Date.now() - 60 * 60 * 1000).toISOString());
  const defaultBestBefore = toLocalDatetimeInput(new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString());

  const [foodName, setFoodName] = useState(existing?.foodName || '');
  const [category, setCategory] = useState<FoodCategory>(existing?.category || 'Cooked Meals');
  const [description, setDescription] = useState(existing?.description || '');
  const [imageUrl, setImageUrl] = useState(
    existing?.imageUrl || CATEGORY_PRESET_IMAGES[existing?.category || 'Cooked Meals'],
  );
  const [totalQuantity, setTotalQuantity] = useState(String(existing?.totalQuantity || 10));
  const [unit, setUnit] = useState(existing?.unit || 'meal boxes');
  const [servesCount, setServesCount] = useState(String(existing?.servesCount || 10));
  const [preparedAt, setPreparedAt] = useState(
    existing ? toLocalDatetimeInput(existing.preparedAt) : defaultPrepared,
  );
  const [bestBefore, setBestBefore] = useState(
    existing ? toLocalDatetimeInput(existing.bestBefore) : defaultBestBefore,
  );
  const [pickupAddress, setPickupAddress] = useState(existing?.pickupAddress || '');
  const [city, setCity] = useState(existing?.city || user?.city || 'Bengaluru');
  const [pickupWindow, setPickupWindow] = useState(
    existing?.pickupWindow || 'Available today until 9:00 PM',
  );
  const [dietaryType, setDietaryType] = useState<DietaryType>(existing?.dietaryType || 'Veg');
  const [storageInstructions, setStorageInstructions] = useState(
    existing?.storageInstructions || 'Keep covered and refrigerated below 5°C if not consumed within 2 hours.',
  );
  const [allergens, setAllergens] = useState(existing?.allergens || 'None declared');
  const [contactDetails, setContactDetails] = useState(
    existing?.contactDetails || user?.phone || '',
  );
  const [safetyDeclared, setSafetyDeclared] = useState(Boolean(existing?.safetyDeclared));

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const isExpiredInput = bestBefore ? new Date(bestBefore).getTime() <= Date.now() : false;
  const isShortWindow =
    bestBefore && !isExpiredInput
      ? new Date(bestBefore).getTime() - Date.now() < 3 * 3600 * 1000
      : false;

  const handleCategoryChange = (next: FoodCategory) => {
    setCategory(next);
    if (!imageUrl.startsWith('/uploads/')) {
      setImageUrl(CATEGORY_PRESET_IMAGES[next]);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Please upload a JPEG, PNG, or WebP food photo.');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setError('Photo size must be 3MB or smaller.');
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('Failed to read image file.'));
        reader.readAsDataURL(file);
      });
      const res = await apiRequest<{ imageUrl: string }>('/upload', {
        method: 'POST',
        body: { dataUrl },
      });
      setImageUrl(res.imageUrl);
      showToast('Food photo uploaded successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isExpiredInput) {
      setError('Safe consumption deadline must be in the future. Expired food cannot be shared.');
      return;
    }
    if (!existing && !safetyDeclared) {
      setError('Please confirm the mandatory food safety declaration.');
      return;
    }

    setSubmitting(true);
    try {
      if (existing) {
        await apiRequest(`/donations/${existing.id}`, {
          method: 'PATCH',
          body: {
            foodName,
            description,
            availableQuantity: Number(totalQuantity),
            pickupWindow,
            storageInstructions,
            bestBefore: new Date(bestBefore).toISOString(),
          },
        });
        showToast('Food donation updated.');
      } else {
        await apiRequest('/donations', {
          method: 'POST',
          body: {
            foodName,
            category,
            description,
            imageUrl,
            totalQuantity: Number(totalQuantity),
            unit,
            servesCount: Number(servesCount),
            preparedAt: new Date(preparedAt).toISOString(),
            bestBefore: new Date(bestBefore).toISOString(),
            pickupAddress,
            city,
            pickupWindow,
            dietaryType,
            storageInstructions,
            allergens,
            contactDetails,
            safetyDeclared: true,
          },
        });
        showToast('Food donation published to Explore Food!');
      }
      bumpDataVersion();
      onSaved?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save donation.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#202820]/50 backdrop-blur-xs p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={existing ? 'Edit Food Donation' : 'Share Surplus Food'}
    >
      <div className="bg-white rounded-2xl border border-[#E2E8E0] shadow-xl w-full max-w-2xl my-auto overflow-hidden">
        <div className="px-6 py-5 border-b border-[#E2E8E0] flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-[#202820]">
              {existing ? 'Edit Food Donation' : 'Share Surplus Food'}
            </h2>
            <p className="text-xs text-[#526054] mt-0.5">
              Provide accurate preparation timestamps, storage guidance, and safe consumption deadlines.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close donation modal"
            className="p-2 rounded-lg text-[#526054] hover:bg-[#F8FAF7]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 max-h-[80vh] overflow-y-auto space-y-5">
          {error && (
            <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">
              {error}
            </div>
          )}

          {/* Food Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#202820] mb-1">Food Name</label>
              <input
                type="text"
                required
                value={foodName}
                onChange={(e) => setFoodName(e.target.value)}
                placeholder="e.g., Fresh Vegetable Pulao & Raita"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#D4DFD2] text-sm focus:outline-none focus:ring-2 focus:ring-[#16834A]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#202820] mb-1">Food Category</label>
              <select
                value={category}
                disabled={Boolean(existing)}
                onChange={(e) => handleCategoryChange(e.target.value as FoodCategory)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#D4DFD2] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#16834A] disabled:bg-[#F8FAF7]"
              >
                {FOOD_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dietary Type & Image Upload */}
          {!existing && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
              <div>
                <label className="block text-sm font-medium text-[#202820] mb-1.5">Dietary Classification</label>
                <div className="flex gap-2 p-1 rounded-lg bg-[#F1F5F0]">
                  {(['Veg', 'Non-Veg'] as DietaryType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setDietaryType(type)}
                      className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                        dietaryType === type
                          ? 'bg-white text-[#202820] shadow-xs'
                          : 'text-[#526054] hover:text-[#202820]'
                      }`}
                    >
                      {type === 'Veg' ? 'Vegetarian' : 'Non-Vegetarian'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#202820] mb-1.5">Food Photograph</label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-12 rounded-lg overflow-hidden border border-[#E2E8E0] shrink-0">
                    <FoodImage src={imageUrl} alt={foodName || category} />
                  </div>
                  <label className="flex-1 cursor-pointer inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-[#D4DFD2] text-xs font-medium text-[#202820] hover:bg-[#F8FAF7]">
                    <Upload className="w-4 h-4 text-[#16834A]" />
                    <span>{uploading ? 'Uploading...' : 'Upload Photo (Max 3MB)'}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[#202820] mb-1">Food Description</label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe ingredients, packaging (e.g., sealed containers), and freshness."
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#D4DFD2] text-sm focus:outline-none focus:ring-2 focus:ring-[#16834A]"
            />
          </div>

          {/* Quantities */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#202820] mb-1">Quantity Available</label>
              <input
                type="number"
                required
                min={1}
                max={5000}
                value={totalQuantity}
                onChange={(e) => setTotalQuantity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#D4DFD2] text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-[#16834A]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#202820] mb-1">Unit</label>
              <input
                type="text"
                required
                disabled={Boolean(existing)}
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="meal boxes, kg, loaves"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#D4DFD2] text-sm focus:outline-none focus:ring-2 focus:ring-[#16834A] disabled:bg-[#F8FAF7]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#202820] mb-1">People It Can Serve</label>
              <input
                type="number"
                required
                min={1}
                max={10000}
                disabled={Boolean(existing)}
                value={servesCount}
                onChange={(e) => setServesCount(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#D4DFD2] text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-[#16834A] disabled:bg-[#F8FAF7]"
              />
            </div>
          </div>

          {/* Food Safety Timestamps */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#202820] mb-1">
                Preparation Date & Time
              </label>
              <input
                type="datetime-local"
                required
                disabled={Boolean(existing)}
                value={preparedAt}
                onChange={(e) => setPreparedAt(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#D4DFD2] text-sm focus:outline-none focus:ring-2 focus:ring-[#16834A] disabled:bg-[#F8FAF7]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#202820] mb-1">
                Best Before / Safe Consumption Deadline
              </label>
              <input
                type="datetime-local"
                required
                value={bestBefore}
                onChange={(e) => setBestBefore(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#D4DFD2] text-sm focus:outline-none focus:ring-2 focus:ring-[#16834A]"
              />
            </div>
          </div>

          {(isExpiredInput || isShortWindow) && (
            <div
              className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs ${
                isExpiredInput
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}
            >
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                {isExpiredInput
                  ? 'Warning: The selected Best Before time has already passed. Expired food is never permitted on FoodCircle.'
                  : 'Urgent safety window: Less than 3 hours remain. Consider noting immediate pickup readiness.'}
              </span>
            </div>
          )}

          {/* Location & Pickup */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#202820] mb-1">City</label>
              <select
                value={city}
                disabled={Boolean(existing)}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#D4DFD2] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#16834A] disabled:bg-[#F8FAF7]"
              >
                {INDIAN_CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#202820] mb-1">
                Available Pickup Time Window
              </label>
              <input
                type="text"
                required
                value={pickupWindow}
                onChange={(e) => setPickupWindow(e.target.value)}
                placeholder="e.g., Today 6:00 PM – 9:30 PM"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#D4DFD2] text-sm focus:outline-none focus:ring-2 focus:ring-[#16834A]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#202820] mb-1">Pickup Address</label>
              <input
                type="text"
                required
                disabled={Boolean(existing)}
                value={pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                placeholder="Street, neighborhood, landmark"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#D4DFD2] text-sm focus:outline-none focus:ring-2 focus:ring-[#16834A] disabled:bg-[#F8FAF7]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#202820] mb-1">Contact Details</label>
              <input
                type="text"
                required
                disabled={Boolean(existing)}
                value={contactDetails}
                onChange={(e) => setContactDetails(e.target.value)}
                placeholder="Phone or pickup desk contact"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#D4DFD2] text-sm focus:outline-none focus:ring-2 focus:ring-[#16834A] disabled:bg-[#F8FAF7]"
              />
            </div>
          </div>

          {/* Storage & Allergens */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#202820] mb-1">
                Storage Instructions
              </label>
              <input
                type="text"
                required
                value={storageInstructions}
                onChange={(e) => setStorageInstructions(e.target.value)}
                placeholder="Refrigeration or reheating guidance"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#D4DFD2] text-sm focus:outline-none focus:ring-2 focus:ring-[#16834A]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#202820] mb-1">
                Allergen Information
              </label>
              <input
                type="text"
                disabled={Boolean(existing)}
                value={allergens}
                onChange={(e) => setAllergens(e.target.value)}
                placeholder="e.g., Nuts, dairy, wheat gluten, or None"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#D4DFD2] text-sm focus:outline-none focus:ring-2 focus:ring-[#16834A] disabled:bg-[#F8FAF7]"
              />
            </div>
          </div>

          {/* Mandatory Food Safety Declaration */}
          {!existing && (
            <label className="flex items-start gap-3 p-4 rounded-xl bg-[#EFFAF3] border border-[#C6E8D2] cursor-pointer">
              <input
                type="checkbox"
                checked={safetyDeclared}
                onChange={(e) => setSafetyDeclared(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-[#16834A] text-[#16834A] focus:ring-[#16834A]"
              />
              <div className="text-xs text-[#202820] leading-relaxed">
                <span className="font-semibold inline-flex items-center gap-1.5 text-[#16834A]">
                  <ShieldCheck className="w-4 h-4" />
                  Donor Food Safety Declaration (Required)
                </span>
                <p className="mt-1 text-[#526054]">
                  I confirm that this food was hygienically prepared or stored, has not been served
                  to diners from open plates, shows no signs of spoilage, and is safe for human
                  consumption before the stated Best Before deadline.
                </p>
              </div>
            </label>
          )}

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#E2E8E0]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg border border-[#D4DFD2] text-sm font-medium text-[#202820] hover:bg-[#F8FAF7]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || uploading || isExpiredInput}
              className="px-5 py-2.5 rounded-lg bg-[#16834A] hover:bg-[#126B3C] text-white text-sm font-semibold transition-colors disabled:opacity-60"
            >
              {submitting ? 'Saving...' : existing ? 'Save Changes' : 'Publish Food Donation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
