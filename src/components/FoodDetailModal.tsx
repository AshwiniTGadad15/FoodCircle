import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Flag,
  MapPin,
  ShieldCheck,
  Thermometer,
  Users,
  X,
} from 'lucide-react';
import type { FoodDonation } from '../../shared/types.ts';
import {
  apiRequest,
  calculateDistanceKm,
  formatDateTimeShort,
  formatTimeRemaining,
  roleLabel,
} from '../lib/api.ts';
import { useApp } from '../context/AppContext.tsx';
import { FoodImage } from './FoodImage.tsx';

interface FoodDetailModalProps {
  donation: FoodDonation | null;
  onClose: () => void;
  initialMode?: 'details' | 'request';
}

export function FoodDetailModal({
  donation,
  onClose,
  initialMode = 'details',
}: FoodDetailModalProps) {
  const { user, openAuthModal, userLocation, showToast, bumpDataVersion, navigate } = useApp();

  const [mode, setMode] = useState<'details' | 'request' | 'report'>(initialMode);
  const [quantityRequested, setQuantityRequested] = useState('2');
  const [peopleServed, setPeopleServed] = useState('2');
  const [fulfillmentType, setFulfillmentType] = useState<'pickup' | 'delivery'>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [message, setMessage] = useState('');

  const [reportReason, setReportReason] = useState('Suspected unsafe or spoiled food');
  const [reportDetails, setReportDetails] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!donation) return null;

  const remaining = formatTimeRemaining(donation.bestBefore);
  const distanceKm = calculateDistanceKm(
    userLocation.lat,
    userLocation.lng,
    donation.lat,
    donation.lng,
  );
  const isOwner = user?.id === donation.donorId;

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal('login');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await apiRequest('/requests', {
        method: 'POST',
        body: {
          donationId: donation.id,
          quantityRequested: Number(quantityRequested),
          peopleServed: Number(peopleServed),
          fulfillmentType,
          deliveryAddress: fulfillmentType === 'delivery' ? deliveryAddress : undefined,
          message,
        },
      });
      bumpDataVersion();
      showToast(
        donation.isDemo
          ? 'Demo request reserved! Track pickup or volunteer delivery in your Dashboard.'
          : 'Food request sent to the donor. You will be notified when they respond.',
      );
      onClose();
      navigate('dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal('login');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await apiRequest('/reports', {
        method: 'POST',
        body: {
          targetType: 'donation',
          targetId: donation.id,
          reason: reportReason,
          details: reportDetails,
        },
      });
      bumpDataVersion();
      showToast('Safety report submitted. Unsafe listings are hidden pending moderation.', 'info');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#202820]/50 backdrop-blur-xs p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={donation.foodName}
    >
      <div className="bg-white rounded-2xl border border-[#E2E8E0] shadow-xl w-full max-w-2xl my-auto overflow-hidden">
        <div className="relative h-56 sm:h-64 bg-[#EDF3EC]">
          <FoodImage src={donation.imageUrl} alt={donation.foodName} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close food details"
            className="absolute top-4 right-4 p-2 rounded-lg bg-white/90 text-[#202820] hover:bg-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="absolute bottom-4 left-6 right-6 text-white">
            <div className="text-xs text-white/85 flex flex-wrap items-center gap-2 mb-1">
              <span>{donation.category}</span>
              <span aria-hidden="true">·</span>
              <span>{donation.dietaryType}</span>
              {donation.isDemo && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>Demo Sample Listing</span>
                </>
              )}
            </div>
            <h2 className="font-display text-2xl font-bold leading-tight">{donation.foodName}</h2>
          </div>
        </div>

        <div className="p-6 max-h-[65vh] overflow-y-auto space-y-5">
          {error && (
            <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">
              {error}
            </div>
          )}

          {/* Mode Tabs */}
          <div className="flex items-center justify-between gap-4 border-b border-[#E2E8E0] pb-3">
            <div className="flex items-center gap-1 p-1 rounded-lg bg-[#F1F5F0]">
              <button
                type="button"
                onClick={() => setMode('details')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  mode === 'details' ? 'bg-white text-[#202820] shadow-xs' : 'text-[#526054]'
                }`}
              >
                Food & Safety Details
              </button>
              {!isOwner && !remaining.expired && donation.availableQuantity > 0 && (
                <button
                  type="button"
                  onClick={() => setMode('request')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    mode === 'request' ? 'bg-white text-[#16834A] shadow-xs' : 'text-[#526054]'
                  }`}
                >
                  Request Food
                </button>
              )}
            </div>

            {!isOwner && (
              <button
                type="button"
                onClick={() => setMode(mode === 'report' ? 'details' : 'report')}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#526054] hover:text-red-700"
              >
                <Flag className="w-3.5 h-3.5" />
                Report Unsafe Food
              </button>
            )}
          </div>

          {/* DETAILS VIEW */}
          {mode === 'details' && (
            <div className="space-y-5">
              <p className="text-sm text-[#202820] leading-relaxed">{donation.description}</p>

              {/* Key specs grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-y border-[#E2E8E0]">
                <div>
                  <div className="text-xs text-[#526054]">Available</div>
                  <div className="text-base font-bold text-[#202820] tabular-nums mt-0.5">
                    {donation.availableQuantity} {donation.unit}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#526054]">Serves Approx.</div>
                  <div className="text-base font-bold text-[#202820] tabular-nums mt-0.5">
                    {donation.servesCount} people
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#526054]">Safe Window</div>
                  <div
                    className={`text-sm font-semibold mt-0.5 ${
                      remaining.urgent ? 'text-amber-700' : 'text-[#16834A]'
                    }`}
                  >
                    {remaining.label}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#526054]">Distance</div>
                  <div className="text-base font-bold text-[#202820] tabular-nums mt-0.5">
                    {distanceKm} km
                  </div>
                </div>
              </div>

              {/* Food Safety & Logistics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-[#16834A] shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-medium text-[#526054]">Prepared / Packed</div>
                      <div className="text-[#202820]">{formatDateTimeShort(donation.preparedAt)}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-medium text-[#526054]">Best Before Deadline</div>
                      <div className="text-[#202820] font-medium">
                        {formatDateTimeShort(donation.bestBefore)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Thermometer className="w-4 h-4 text-[#16834A] shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-medium text-[#526054]">Storage & Handling</div>
                      <div className="text-[#202820]">{donation.storageInstructions}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-[#16834A] shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-medium text-[#526054]">Pickup Location</div>
                      <div className="text-[#202820]">
                        {donation.pickupAddress}, {donation.city}
                      </div>
                      <div className="text-xs text-[#526054] mt-0.5">{donation.pickupWindow}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Users className="w-4 h-4 text-[#16834A] shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-medium text-[#526054]">Shared By</div>
                      <div className="text-[#202820] font-medium flex items-center gap-1.5">
                        {donation.donorName}
                        {donation.donorVerified && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#16834A]" aria-label="Verified donor" />
                        )}
                      </div>
                      <div className="text-xs text-[#526054]">{roleLabel(donation.donorRole)}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-[#16834A] shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-medium text-[#526054]">Allergens & Safety</div>
                      <div className="text-[#202820]">Allergens: {donation.allergens || 'None declared'}</div>
                      <div className="text-xs text-[#16834A]">Donor safety declaration signed</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#E2E8E0] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg border border-[#D4DFD2] text-sm font-medium text-[#202820]"
                >
                  Close
                </button>
                {!isOwner && !remaining.expired && donation.availableQuantity > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!user) {
                        onClose();
                        openAuthModal('login');
                        return;
                      }
                      setMode('request');
                    }}
                    className="px-5 py-2 rounded-lg bg-[#16834A] hover:bg-[#126B3C] text-white text-sm font-semibold"
                  >
                    Request This Food
                  </button>
                )}
              </div>
            </div>
          )}

          {/* REQUEST FOOD FORM */}
          {mode === 'request' && (
            <form onSubmit={handleRequestSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#202820] mb-1">
                    Required Quantity ({donation.unit})
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={donation.availableQuantity}
                    value={quantityRequested}
                    onChange={(e) => setQuantityRequested(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#D4DFD2] text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-[#16834A]"
                  />
                  <p className="text-xs text-[#526054] mt-1">
                    Maximum available right now: {donation.availableQuantity} {donation.unit}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#202820] mb-1">
                    Number of People to Serve
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={5000}
                    value={peopleServed}
                    onChange={(e) => setPeopleServed(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#D4DFD2] text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-[#16834A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#202820] mb-1.5">
                  Collection Preference
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFulfillmentType('pickup')}
                    className={`p-3 rounded-xl border text-left transition-colors ${
                      fulfillmentType === 'pickup'
                        ? 'border-[#16834A] bg-[#EFFAF3]'
                        : 'border-[#E2E8E0] hover:bg-[#F8FAF7]'
                    }`}
                  >
                    <div className="text-sm font-semibold text-[#202820]">Self Pickup</div>
                    <div className="text-xs text-[#526054] mt-0.5">Collect directly from donor</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFulfillmentType('delivery')}
                    className={`p-3 rounded-xl border text-left transition-colors ${
                      fulfillmentType === 'delivery'
                        ? 'border-[#16834A] bg-[#EFFAF3]'
                        : 'border-[#E2E8E0] hover:bg-[#F8FAF7]'
                    }`}
                  >
                    <div className="text-sm font-semibold text-[#202820]">Volunteer Delivery</div>
                    <div className="text-xs text-[#526054] mt-0.5">Dispatch a community volunteer</div>
                  </button>
                </div>
              </div>

              {fulfillmentType === 'delivery' && (
                <div>
                  <label className="block text-sm font-medium text-[#202820] mb-1">
                    Delivery Destination Address
                  </label>
                  <input
                    type="text"
                    required
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Full street address & landmark for volunteer drop-off"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#D4DFD2] text-sm focus:outline-none focus:ring-2 focus:ring-[#16834A]"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[#202820] mb-1">
                  Short Message to Donor
                </label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Share estimated pickup time, container details, or community context."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#D4DFD2] text-sm focus:outline-none focus:ring-2 focus:ring-[#16834A]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#E2E8E0]">
                <button
                  type="button"
                  onClick={() => setMode('details')}
                  className="px-4 py-2 rounded-lg border border-[#D4DFD2] text-sm font-medium text-[#202820]"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg bg-[#16834A] hover:bg-[#126B3C] text-white text-sm font-semibold disabled:opacity-60"
                >
                  {submitting ? 'Sending Request...' : 'Confirm Food Request'}
                </button>
              </div>
            </form>
          )}

          {/* REPORT UNSAFE FOOD FORM */}
          {mode === 'report' && (
            <form onSubmit={handleReportSubmit} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed">
                FoodCircle prioritizes community health. Reporting suspected spoiled, expired, or
                unhygienic food immediately pauses this listing pending administrator inspection.
              </div>
              <div>
                <label className="block text-sm font-medium text-[#202820] mb-1">Reason for Report</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#D4DFD2] bg-white text-sm"
                >
                  <option>Suspected unsafe or spoiled food</option>
                  <option>Expired or misleading consumption deadline</option>
                  <option>Missing allergen or storage details</option>
                  <option>Inaccurate pickup location or spam listing</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#202820] mb-1">Details</label>
                <textarea
                  required
                  rows={3}
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Describe what you observed so our moderation team can take action."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#D4DFD2] text-sm"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#E2E8E0]">
                <button
                  type="button"
                  onClick={() => setMode('details')}
                  className="px-4 py-2 rounded-lg border border-[#D4DFD2] text-sm font-medium text-[#202820]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold disabled:opacity-60"
                >
                  {submitting ? 'Submitting...' : 'Submit Safety Report'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
