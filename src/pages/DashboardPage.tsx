import React, { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Bell,
  Building2,
  CheckCircle2,
  ClipboardList,
  Edit3,
  HeartHandshake,
  LayoutDashboard,
  MailCheck,
  Package,
  Plus,
  Star,
  Trash2,
  Truck,
  User as UserIcon,
} from 'lucide-react';
import type {
  DeliveryTask,
  FoodDonation,
  FoodRequest,
  Organization,
  PublicUser,
} from '../../shared/types.ts';
import {
  apiRequest,
  formatDateTimeShort,
  formatTimeRemaining,
  INDIAN_CITIES,
  roleLabel,
} from '../lib/api.ts';
import { useApp } from '../context/AppContext.tsx';
import { FoodImage } from '../components/FoodImage.tsx';
import { DonationFormModal } from '../components/DonationFormModal.tsx';

type DashTab =
  | 'overview'
  | 'donations'
  | 'requests'
  | 'volunteer'
  | 'organization'
  | 'notifications'
  | 'profile';

const REQUEST_STATUS_STYLES: Record<string, string> = {
  pending: 'text-amber-800 bg-amber-50 border-amber-200',
  accepted: 'text-[#16834A] bg-[#EFFAF3] border-[#C6E8D2]',
  rejected: 'text-red-800 bg-red-50 border-red-200',
  ready_for_pickup: 'text-emerald-900 bg-emerald-50 border-emerald-200',
  collected: 'text-[#16834A] bg-[#EFFAF3] border-[#C6E8D2]',
  completed: 'text-[#16834A] bg-[#EFFAF3] border-[#C6E8D2]',
};

export function DashboardPage() {
  const {
    user,
    setUser,
    openAuthModal,
    openDonateModal,
    navigate,
    notifications,
    unreadCount,
    markNotificationRead,
    markAllNotificationsRead,
    showToast,
    dataVersion,
    bumpDataVersion,
  } = useApp();

  const defaultTab: DashTab = useMemo(() => {
    if (!user) return 'overview';
    if (user.role === 'volunteer') return 'volunteer';
    if (user.role === 'ngo') return 'organization';
    return 'overview';
  }, [user]);

  const [tab, setTab] = useState<DashTab>(defaultTab);
  const [myDonations, setMyDonations] = useState<FoodDonation[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FoodRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FoodRequest[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryTask[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingDonation, setEditingDonation] = useState<FoodDonation | null>(null);

  // Review modal inline state
  const [reviewingReq, setReviewingReq] = useState<FoodRequest | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  // Organization registration form
  const [orgName, setOrgName] = useState('');
  const [orgRegNo, setOrgRegNo] = useState('');
  const [orgType, setOrgType] = useState<Organization['type']>('NGO');
  const [orgCity, setOrgCity] = useState(user?.city || 'Bengaluru');
  const [orgAddress, setOrgAddress] = useState('');
  const [orgCapacity, setOrgCapacity] = useState('150');
  const [orgPhone, setOrgPhone] = useState(user?.phone || '');
  const [orgDesc, setOrgDesc] = useState('');
  const [savingOrg, setSavingOrg] = useState(false);

  // Profile form
  const [profName, setProfName] = useState(user?.fullName || '');
  const [profPhone, setProfPhone] = useState(user?.phone || '');
  const [profCity, setProfCity] = useState(user?.city || 'Bengaluru');
  const [profBio, setProfBio] = useState(user?.bio || '');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (!user) return;
    setProfName(user.fullName);
    setProfPhone(user.phone);
    setProfCity(user.city);
    setProfBio(user.bio || '');
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    setLoading(true);
    Promise.all([
      apiRequest<{ donations: FoodDonation[] }>('/donations?mine=true'),
      apiRequest<{ requests: FoodRequest[] }>('/requests?scope=incoming'),
      apiRequest<{ requests: FoodRequest[] }>('/requests?scope=outgoing'),
      apiRequest<{ deliveries: DeliveryTask[] }>('/deliveries'),
      apiRequest<{ organizations: Organization[] }>('/organizations'),
    ])
      .then(([donRes, incRes, outRes, delRes, orgRes]) => {
        if (!active) return;
        setMyDonations(donRes.donations);
        setIncomingRequests(incRes.requests);
        setOutgoingRequests(outRes.requests);
        setDeliveries(delRes.deliveries);
        setOrganizations(orgRes.organizations);

        const mine = orgRes.organizations.find((o) => o.userId === user.id);
        if (mine) {
          setOrgName(mine.name);
          setOrgRegNo(mine.registrationNumber);
          setOrgType(mine.type);
          setOrgCity(mine.city);
          setOrgAddress(mine.address);
          setOrgCapacity(String(mine.capacityPerDay));
          setOrgPhone(mine.contactPhone);
          setOrgDesc(mine.description);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user, dataVersion]);

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="font-display text-3xl font-bold text-[#202820]">
          Sign in to access your FoodCircle Dashboard
        </h1>
        <p className="text-sm text-[#526054]">
          Manage your food donations, track incoming requests, accept volunteer deliveries, or
          register your NGO.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => openAuthModal('login')}
            className="px-5 py-2.5 rounded-xl bg-[#16834A] text-white text-sm font-semibold"
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => openAuthModal('register')}
            className="px-5 py-2.5 rounded-xl border border-[#D4DFD2] bg-white text-[#202820] text-sm font-semibold"
          >
            Join FoodCircle
          </button>
        </div>
      </div>
    );
  }

  const myOrg = organizations.find((o) => o.userId === user.id);
  const myAssignedDeliveries = deliveries.filter((d) => d.volunteerId === user.id);
  const openDeliveries = deliveries.filter((d) => d.status === 'open');
  const completedDeliveries = myAssignedDeliveries.filter((d) => d.status === 'delivered');
  const mealsDelivered = completedDeliveries.reduce((sum, d) => sum + d.mealsCount, 0);
  const mealsListed = myDonations.reduce((sum, d) => sum + d.servesCount, 0);

  const chartData = [
    { name: 'Meals Listed', count: mealsListed },
    { name: 'Incoming Req.', count: incomingRequests.length },
    { name: 'My Requests', count: outgoingRequests.length },
    { name: 'Meals Delivered', count: mealsDelivered },
  ];

  const handleDonationStatus = async (id: string, status: FoodDonation['status']) => {
    try {
      await apiRequest(`/donations/${id}`, { method: 'PATCH', body: { status } });
      showToast(`Donation marked as ${status}.`);
      bumpDataVersion();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Update failed.', 'error');
    }
  };

  const handleDeleteDonation = async (id: string) => {
    try {
      await apiRequest(`/donations/${id}`, { method: 'DELETE' });
      showToast('Food donation deleted.', 'info');
      bumpDataVersion();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Delete failed.', 'error');
    }
  };

  const handleRequestStatus = async (id: string, status: FoodRequest['status']) => {
    try {
      await apiRequest(`/requests/${id}/status`, { method: 'PATCH', body: { status } });
      showToast(`Request updated to ${status.replace(/_/g, ' ')}.`);
      bumpDataVersion();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Action failed.', 'error');
    }
  };

  const handleAcceptDelivery = async (id: string) => {
    try {
      await apiRequest(`/deliveries/${id}/accept`, { method: 'POST' });
      showToast('Delivery task accepted! Check Active Deliveries to update progress.');
      bumpDataVersion();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to accept task.', 'error');
    }
  };

  const handleDeliveryStatus = async (id: string, status: DeliveryTask['status']) => {
    try {
      await apiRequest(`/deliveries/${id}/status`, { method: 'PATCH', body: { status } });
      showToast(`Delivery status updated to ${status.replace(/_/g, ' ')}.`);
      bumpDataVersion();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to update delivery.', 'error');
    }
  };

  const handleSaveOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingOrg(true);
    try {
      await apiRequest('/organizations', {
        method: 'POST',
        body: {
          name: orgName,
          registrationNumber: orgRegNo,
          type: orgType,
          city: orgCity,
          address: orgAddress,
          capacityPerDay: Number(orgCapacity),
          contactPhone: orgPhone,
          description: orgDesc,
        },
      });
      showToast('Organization details saved and submitted for verification.');
      bumpDataVersion();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not save organization.', 'error');
    } finally {
      setSavingOrg(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await apiRequest<{ user: PublicUser }>('/profile', {
        method: 'PATCH',
        body: {
          fullName: profName,
          phone: profPhone,
          city: profCity,
          bio: profBio,
        },
      });
      setUser(res.user);
      showToast('Profile updated.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Update failed.', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingReq) return;
    try {
      await apiRequest('/reviews', {
        method: 'POST',
        body: {
          donationId: reviewingReq.donationId,
          rating: reviewRating,
          comment: reviewComment,
        },
      });
      showToast('Thank you for sharing your appreciation note!');
      setReviewingReq(null);
      setReviewComment('');
      bumpDataVersion();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not post review.', 'error');
    }
  };

  const navTabs: { id: DashTab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'donations', label: 'My Donations', icon: Package, badge: incomingRequests.filter((r) => r.status === 'pending').length },
    { id: 'requests', label: 'Food Requests', icon: ClipboardList },
    { id: 'volunteer', label: 'Volunteer Hub', icon: Truck, badge: user.role === 'volunteer' ? openDeliveries.length : undefined },
    { id: 'organization', label: 'NGO / Organization', icon: Building2 },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
    { id: 'profile', label: 'Profile', icon: UserIcon },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Verification Reminder */}
      {!user.emailVerified && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-wrap items-center justify-between gap-3 text-sm text-amber-950">
          <div className="flex items-center gap-2.5">
            <MailCheck className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Your email ({user.email}) is not yet verified. Verify it to strengthen community trust.</span>
          </div>
          <button
            type="button"
            onClick={() => openAuthModal('verify')}
            className="px-3.5 py-1.5 rounded-lg bg-amber-900 text-white text-xs font-semibold hover:bg-amber-800 whitespace-nowrap"
          >
            Verify Email Now
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sidebar Navigation */}
        <aside className="lg:col-span-3 bg-white rounded-2xl border border-[#E2E8E0] p-4 space-y-4">
          <div className="px-2 pb-3 border-b border-[#E2E8E0]">
            <div className="font-display font-bold text-lg text-[#202820] truncate">
              {user.fullName}
            </div>
            <div className="text-xs text-[#526054] mt-0.5">
              {roleLabel(user.role)} · {user.city}
            </div>
          </div>

          <nav className="space-y-1">
            {navTabs.map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    active
                      ? 'bg-[#EFFAF3] text-[#16834A] font-semibold'
                      : 'text-[#526054] hover:bg-[#F8FAF7] hover:text-[#202820]'
                  }`}
                >
                  <span className="inline-flex items-center gap-2.5 truncate">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </span>
                  {item.badge && item.badge > 0 ? (
                    <span className="px-2 py-0.5 rounded-full bg-[#16834A] text-white text-[11px] font-semibold tabular-nums">
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>

          <div className="pt-3 border-t border-[#E2E8E0] space-y-2">
            <button
              type="button"
              onClick={openDonateModal}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl foodcircle-cta-gradient text-white text-xs font-semibold transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Share Surplus Food
            </button>
            <button
              type="button"
              onClick={() => navigate('explore')}
              className="w-full py-2.5 px-3 rounded-xl border border-[#D4DFD2] text-xs font-semibold text-[#202820] hover:bg-[#F8FAF7]"
            >
              Explore Food Nearby
            </button>
          </div>
        </aside>

        {/* Main Workspace Panel */}
        <main className="lg:col-span-9 space-y-6">
          {/* OVERVIEW TAB */}
          {tab === 'overview' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-orange-50 via-rose-50/70 to-emerald-50 rounded-2xl border border-orange-200/70 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold text-[#EA580C]">
                    {roleLabel(user.role)} Workspace
                  </p>
                  <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#1E242B] mt-1">
                    Welcome back, {user.fullName.split(' ')[0]}
                  </h1>
                  <p className="text-sm text-[#4B5563] mt-1">
                    Track your active surplus shares, food requests, and neighborhood deliveries in
                    real time.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openDonateModal}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl foodcircle-cta-gradient text-white text-sm font-semibold shadow-sm shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  New Donation
                </button>
              </div>

              {/* Colorful KPI Strip */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50/70 rounded-2xl border border-emerald-200/70 p-5">
                  <div className="text-xs font-medium text-emerald-900/75">My Listings</div>
                  <div className="font-mono text-2xl font-bold text-emerald-700 tabular-nums mt-1">
                    {myDonations.length}
                  </div>
                  <div className="text-xs text-emerald-800/80 mt-0.5 tabular-nums">
                    {mealsListed} servings total
                  </div>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-amber-50/80 rounded-2xl border border-orange-200/70 p-5">
                  <div className="text-xs font-medium text-orange-900/75">Incoming Requests</div>
                  <div className="font-mono text-2xl font-bold text-orange-600 tabular-nums mt-1">
                    {incomingRequests.length}
                  </div>
                  <div className="text-xs text-orange-800/80 mt-0.5 tabular-nums">
                    {incomingRequests.filter((r) => r.status === 'pending').length} pending review
                  </div>
                </div>
                <div className="bg-gradient-to-br from-rose-50 to-pink-50/80 rounded-2xl border border-rose-200/70 p-5">
                  <div className="text-xs font-medium text-rose-900/75">My Food Requests</div>
                  <div className="font-mono text-2xl font-bold text-rose-600 tabular-nums mt-1">
                    {outgoingRequests.length}
                  </div>
                  <div className="text-xs text-rose-800/80 mt-0.5 tabular-nums">
                    {outgoingRequests.filter((r) => r.status === 'completed' || r.status === 'collected').length}{' '}
                    completed
                  </div>
                </div>
                <div className="bg-gradient-to-br from-sky-50 to-indigo-50/80 rounded-2xl border border-sky-200/70 p-5">
                  <div className="text-xs font-medium text-sky-900/75">Volunteer Deliveries</div>
                  <div className="font-mono text-2xl font-bold text-indigo-700 tabular-nums mt-1">
                    {completedDeliveries.length}
                  </div>
                  <div className="text-xs text-sky-800/80 mt-0.5 tabular-nums">
                    {mealsDelivered} meals delivered
                  </div>
                </div>
              </div>

              {/* Multi-Color Activity Chart */}
              <div className="bg-white/95 rounded-2xl border border-stone-200/80 p-6">
                <h2 className="font-display text-lg font-bold text-[#1E242B] mb-1">
                  Your Verified Activity Summary
                </h2>
                <p className="text-xs text-[#4B5563] mb-5">
                  Live counts across donations, requests, and volunteer deliveries.
                </p>
                <div className="h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#4B5563' }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#4B5563' }} />
                      <Tooltip />
                      <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                        {chartData.map((entry, idx) => (
                          <Cell
                            key={entry.name}
                            fill={['#0F9D58', '#EA580C', '#E11D48', '#4F46E5'][idx % 4]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* MY DONATIONS & INCOMING REQUESTS TAB */}
          {tab === 'donations' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-2xl font-bold text-[#202820]">
                    My Food Donations
                  </h2>
                  <p className="text-sm text-[#526054]">
                    Manage active listings, update quantities, and respond to seeker requests.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openDonateModal}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#16834A] hover:bg-[#126B3C] text-white text-xs font-semibold"
                >
                  <Plus className="w-4 h-4" />
                  Post Surplus Food
                </button>
              </div>

              {loading ? (
                <div className="h-48 rounded-2xl bg-white border border-[#E2E8E0] animate-pulse" />
              ) : myDonations.length === 0 ? (
                <div className="bg-white rounded-2xl border border-[#E2E8E0] p-10 text-center space-y-3">
                  <p className="font-display text-lg font-bold text-[#202820]">
                    You haven&apos;t shared any surplus food yet
                  </p>
                  <p className="text-sm text-[#526054]">
                    List fresh surplus meals, bakery boxes, or produce to connect with nearby
                    neighbors and NGOs.
                  </p>
                  <button
                    type="button"
                    onClick={openDonateModal}
                    className="px-4 py-2 rounded-lg bg-[#16834A] text-white text-sm font-semibold"
                  >
                    Share Your First Donation
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {myDonations.map((don) => {
                    const rem = formatTimeRemaining(don.bestBefore);
                    return (
                      <div
                        key={don.id}
                        className="bg-white rounded-2xl border border-[#E2E8E0] p-5 flex flex-col sm:flex-row gap-5"
                      >
                        <div className="w-full sm:w-36 h-28 rounded-xl overflow-hidden shrink-0 bg-[#EDF3EC]">
                          <FoodImage src={don.imageUrl} alt={don.foodName} />
                        </div>
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h3 className="font-display text-lg font-bold text-[#202820]">
                              {don.foodName}
                            </h3>
                            <span className="text-xs font-semibold uppercase tracking-wide text-[#16834A]">
                              {don.status}
                            </span>
                          </div>
                          <div className="text-xs text-[#526054] flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span>{don.category}</span>
                            <span>·</span>
                            <span>{don.dietaryType}</span>
                            <span>·</span>
                            <span className="tabular-nums font-medium text-[#202820]">
                              {don.availableQuantity}/{don.totalQuantity} {don.unit} left
                            </span>
                            <span>·</span>
                            <span>{rem.label}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 pt-2">
                            <button
                              type="button"
                              onClick={() => setEditingDonation(don)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D4DFD2] text-xs font-medium text-[#202820] hover:bg-[#F8FAF7]"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              Edit
                            </button>
                            {don.status === 'available' && (
                              <button
                                type="button"
                                onClick={() => handleDonationStatus(don.id, 'reserved')}
                                className="px-3 py-1.5 rounded-lg border border-[#D4DFD2] text-xs font-medium text-[#202820] hover:bg-[#F8FAF7]"
                              >
                                Mark Reserved
                              </button>
                            )}
                            {don.status !== 'collected' && (
                              <button
                                type="button"
                                onClick={() => handleDonationStatus(don.id, 'collected')}
                                className="px-3 py-1.5 rounded-lg bg-[#EFFAF3] text-[#16834A] text-xs font-semibold hover:bg-[#D8F3E2]"
                              >
                                Mark Collected
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteDonation(don.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Incoming Requests for Donor */}
              <div className="bg-white rounded-2xl border border-[#E2E8E0] p-6 space-y-4">
                <h3 className="font-display text-lg font-bold text-[#202820]">
                  Incoming Requests on Your Donations
                </h3>
                {incomingRequests.length === 0 ? (
                  <p className="text-sm text-[#526054]">
                    No incoming requests yet. When seekers request your food, you can accept,
                    reject, or mark it ready for pickup here.
                  </p>
                ) : (
                  <div className="divide-y divide-[#E2E8E0]">
                    {incomingRequests.map((req) => (
                      <div key={req.id} className="py-4 first:pt-0 last:pb-0 space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <div className="font-semibold text-sm text-[#202820]">
                              {req.requesterName} ({roleLabel(req.requesterRole)}) requested{' '}
                              <span className="tabular-nums">
                                {req.quantityRequested} {req.unit}
                              </span>{' '}
                              of {req.donationName}
                            </div>
                            <div className="text-xs text-[#526054] mt-0.5">
                              Serves {req.peopleServed} people · Preference:{' '}
                              {req.fulfillmentType === 'delivery'
                                ? `Volunteer Delivery to ${req.deliveryAddress}`
                                : 'Self Pickup'}
                            </div>
                          </div>
                          <span
                            className={`px-2.5 py-1 rounded-md border text-xs font-semibold capitalize ${
                              REQUEST_STATUS_STYLES[req.status] || ''
                            }`}
                          >
                            {req.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        {req.message && (
                          <p className="text-xs text-[#526054] bg-[#F8FAF7] px-3 py-2 rounded-lg">
                            “{req.message}”
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {req.status === 'pending' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleRequestStatus(req.id, 'accepted')}
                                className="px-3.5 py-1.5 rounded-lg bg-[#16834A] text-white text-xs font-semibold hover:bg-[#126B3C]"
                              >
                                Accept & Reserve
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRequestStatus(req.id, 'rejected')}
                                className="px-3.5 py-1.5 rounded-lg border border-red-200 text-red-700 text-xs font-semibold hover:bg-red-50"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {req.status === 'accepted' && (
                            <button
                              type="button"
                              onClick={() => handleRequestStatus(req.id, 'ready_for_pickup')}
                              className="px-3.5 py-1.5 rounded-lg bg-[#16834A] text-white text-xs font-semibold"
                            >
                              Mark Ready for Pickup
                            </button>
                          )}
                          {(req.status === 'ready_for_pickup' || req.status === 'accepted') && (
                            <button
                              type="button"
                              onClick={() => handleRequestStatus(req.id, 'completed')}
                              className="px-3.5 py-1.5 rounded-lg border border-[#16834A] text-[#16834A] text-xs font-semibold"
                            >
                              Mark Completed
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* OUTGOING FOOD REQUESTS TAB */}
          {tab === 'requests' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-2xl font-bold text-[#202820]">
                    My Food Requests
                  </h2>
                  <p className="text-sm text-[#526054]">
                    Track approval status, pickup contacts, and confirm collection.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('explore')}
                  className="px-4 py-2 rounded-lg bg-[#16834A] text-white text-xs font-semibold"
                >
                  Find More Food
                </button>
              </div>

              {outgoingRequests.length === 0 ? (
                <div className="bg-white rounded-2xl border border-[#E2E8E0] p-10 text-center space-y-3">
                  <p className="font-display text-lg font-bold text-[#202820]">
                    No food requests yet
                  </p>
                  <p className="text-sm text-[#526054]">
                    Browse Explore Food to request available meals for yourself, your family, or
                    your community organization.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate('explore')}
                    className="px-4 py-2 rounded-lg bg-[#16834A] text-white text-sm font-semibold"
                  >
                    Explore Available Food
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {outgoingRequests.map((req) => (
                    <div
                      key={req.id}
                      className="bg-white rounded-2xl border border-[#E2E8E0] p-5 space-y-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="font-display text-lg font-bold text-[#202820]">
                            {req.donationName}
                          </h3>
                          <div className="text-xs text-[#526054] mt-0.5">
                            Donor: {req.donorName} · {req.quantityRequested} {req.unit} (serves{' '}
                            {req.peopleServed}) · {formatDateTimeShort(req.createdAt)}
                          </div>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-md border text-xs font-semibold capitalize ${
                            REQUEST_STATUS_STYLES[req.status] || ''
                          }`}
                        >
                          {req.status.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div className="text-xs text-[#202820] bg-[#F8FAF7] rounded-xl p-3 space-y-1">
                        <div>
                          <strong>Pickup:</strong> {req.pickupAddress}, {req.pickupCity}
                        </div>
                        {req.donorContact && (
                          <div>
                            <strong>Donor Contact:</strong> {req.donorContact}
                          </div>
                        )}
                        {req.fulfillmentType === 'delivery' && (
                          <div>
                            <strong>Delivery Destination:</strong> {req.deliveryAddress}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5">
                        {(req.status === 'accepted' || req.status === 'ready_for_pickup') && (
                          <button
                            type="button"
                            onClick={() => handleRequestStatus(req.id, 'collected')}
                            className="px-3.5 py-1.5 rounded-lg bg-[#16834A] text-white text-xs font-semibold"
                          >
                            Confirm Food Collected
                          </button>
                        )}
                        {(req.status === 'collected' || req.status === 'completed') && (
                          <button
                            type="button"
                            onClick={() => setReviewingReq(req)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-[#D4DFD2] text-xs font-semibold text-[#202820] hover:bg-[#F8FAF7]"
                          >
                            <Star className="w-3.5 h-3.5 text-[#FFAA45]" />
                            Leave Appreciation Note
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Inline Review Form */}
              {reviewingReq && (
                <form
                  onSubmit={handleReviewSubmit}
                  className="bg-white rounded-2xl border border-[#16834A] p-6 space-y-4"
                >
                  <h3 className="font-display text-lg font-bold text-[#202820]">
                    Thank {reviewingReq.donorName} for {reviewingReq.donationName}
                  </h3>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setReviewRating(n)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                          reviewRating >= n
                            ? 'bg-[#EFFAF3] border-[#16834A] text-[#16834A]'
                            : 'border-[#E2E8E0] text-[#526054]'
                        }`}
                      >
                        {n} ★
                      </button>
                    ))}
                  </div>
                  <textarea
                    required
                    rows={2}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share a quick thank-you note about packaging or freshness..."
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#D4DFD2] text-sm"
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setReviewingReq(null)}
                      className="px-4 py-2 rounded-lg border border-[#D4DFD2] text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-[#16834A] text-white text-xs font-semibold"
                    >
                      Post Note
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* VOLUNTEER HUB TAB */}
          {tab === 'volunteer' && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-2xl font-bold text-[#202820]">
                  Volunteer Delivery Hub
                </h2>
                <p className="text-sm text-[#526054]">
                  Claim open neighborhood rescue deliveries and update pickup-to-dropoff milestones.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl border border-[#E2E8E0] p-5">
                  <div className="text-xs text-[#526054]">Open Tasks</div>
                  <div className="font-mono text-2xl font-bold text-[#202820] tabular-nums mt-1">
                    {openDeliveries.length}
                  </div>
                </div>
                <div className="bg-white rounded-2xl border border-[#E2E8E0] p-5">
                  <div className="text-xs text-[#526054]">Completed Deliveries</div>
                  <div className="font-mono text-2xl font-bold text-[#16834A] tabular-nums mt-1">
                    {completedDeliveries.length}
                  </div>
                </div>
                <div className="bg-white rounded-2xl border border-[#E2E8E0] p-5">
                  <div className="text-xs text-[#526054]">Meals Delivered</div>
                  <div className="font-mono text-2xl font-bold text-[#16834A] tabular-nums mt-1">
                    {mealsDelivered}
                  </div>
                </div>
              </div>

              {/* Active Volunteer Tasks */}
              <div className="bg-white rounded-2xl border border-[#E2E8E0] p-6 space-y-4">
                <h3 className="font-display text-lg font-bold text-[#202820]">
                  My Claimed Deliveries
                </h3>
                {myAssignedDeliveries.length === 0 ? (
                  <p className="text-sm text-[#526054]">
                    You have no assigned deliveries yet. Accept an available task below to start
                    delivering.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {myAssignedDeliveries.map((task) => (
                      <div
                        key={task.id}
                        className="p-4 rounded-xl border border-[#E2E8E0] bg-[#F8FAF7] space-y-2.5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="font-semibold text-sm text-[#202820]">
                            {task.donationName} ({task.mealsCount} meals)
                          </div>
                          <span className="text-xs font-semibold text-[#16834A] uppercase">
                            {task.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="text-xs text-[#526054] space-y-1">
                          <div>
                            <strong>Pickup:</strong> {task.pickupAddress}, {task.pickupCity} (
                            {task.donorName})
                          </div>
                          <div>
                            <strong>Dropoff:</strong> {task.dropoffAddress} ({task.requesterName})
                          </div>
                        </div>
                        {task.status !== 'delivered' && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {task.status === 'assigned' && (
                              <button
                                type="button"
                                onClick={() => handleDeliveryStatus(task.id, 'picked_up')}
                                className="px-3.5 py-1.5 rounded-lg bg-[#16834A] text-white text-xs font-semibold"
                              >
                                Mark Picked Up
                              </button>
                            )}
                            {task.status === 'picked_up' && (
                              <button
                                type="button"
                                onClick={() => handleDeliveryStatus(task.id, 'in_transit')}
                                className="px-3.5 py-1.5 rounded-lg bg-[#16834A] text-white text-xs font-semibold"
                              >
                                Mark In Transit
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeliveryStatus(task.id, 'delivered')}
                              className="px-3.5 py-1.5 rounded-lg bg-[#126B3C] text-white text-xs font-semibold"
                            >
                              Mark Delivered
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Open Available Delivery Pool */}
              <div className="bg-white rounded-2xl border border-[#E2E8E0] p-6 space-y-4">
                <h3 className="font-display text-lg font-bold text-[#202820]">
                  Available Delivery Tasks Nearby
                </h3>
                {openDeliveries.length === 0 ? (
                  <p className="text-sm text-[#526054]">
                    All delivery requests are currently assigned. New tasks appear automatically
                    when seekers choose Volunteer Delivery.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {openDeliveries.map((task) => (
                      <div
                        key={task.id}
                        className="p-4 rounded-xl border border-[#E2E8E0] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1 text-xs text-[#526054]">
                          <div className="text-sm font-semibold text-[#202820]">
                            {task.donationName} ·{' '}
                            <span className="text-[#16834A] tabular-nums">
                              {task.mealsCount} meals
                            </span>
                          </div>
                          <div>
                            <strong>Pickup:</strong> {task.pickupAddress}, {task.pickupCity}
                          </div>
                          <div>
                            <strong>Dropoff:</strong> {task.dropoffAddress}
                          </div>
                          {task.notes && <div>Note: {task.notes}</div>}
                        </div>

                        {['volunteer', 'ngo', 'admin'].includes(user.role) ? (
                          <button
                            type="button"
                            onClick={() => handleAcceptDelivery(task.id)}
                            className="px-4 py-2 rounded-lg bg-[#16834A] hover:bg-[#126B3C] text-white text-xs font-semibold shrink-0"
                          >
                            Accept Delivery
                          </button>
                        ) : (
                          <span className="text-xs text-[#526054]">
                            Volunteer / NGO role required to claim
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* NGO / ORGANIZATION TAB */}
          {tab === 'organization' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl font-bold text-[#202820]">
                    NGO & Organization Portal
                  </h2>
                  <p className="text-sm text-[#526054]">
                    Register your NGO, shelter, community kitchen, or food business for verified
                    bulk distribution.
                  </p>
                </div>
                {myOrg && (
                  <span
                    className={`px-3 py-1 rounded-lg text-xs font-semibold border ${
                      myOrg.verifiedStatus === 'verified'
                        ? 'bg-[#EFFAF3] border-[#C6E8D2] text-[#16834A]'
                        : myOrg.verifiedStatus === 'rejected'
                          ? 'bg-red-50 border-red-200 text-red-700'
                          : 'bg-amber-50 border-amber-200 text-amber-800'
                    }`}
                  >
                    Verification: {myOrg.verifiedStatus.toUpperCase()}
                  </span>
                )}
              </div>

              <form
                onSubmit={handleSaveOrg}
                className="bg-white rounded-2xl border border-[#E2E8E0] p-6 space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#202820] mb-1">
                      Organization Name
                    </label>
                    <input
                      type="text"
                      required
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder="e.g., Seva Community Kitchen"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#D4DFD2] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#202820] mb-1">
                      Registration / FSSAI / Trust ID
                    </label>
                    <input
                      type="text"
                      required
                      value={orgRegNo}
                      onChange={(e) => setOrgRegNo(e.target.value)}
                      placeholder="NGO Darpan / Trust / FSSAI No."
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#D4DFD2] text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#202820] mb-1">Type</label>
                    <select
                      value={orgType}
                      onChange={(e) => setOrgType(e.target.value as Organization['type'])}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#D4DFD2] bg-white text-sm"
                    >
                      <option value="NGO">NGO</option>
                      <option value="Trust">Trust</option>
                      <option value="Shelter">Shelter</option>
                      <option value="Community Kitchen">Community Kitchen</option>
                      <option value="Restaurant">Restaurant</option>
                      <option value="Bakery">Bakery</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#202820] mb-1">City</label>
                    <select
                      value={orgCity}
                      onChange={(e) => setOrgCity(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#D4DFD2] bg-white text-sm"
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
                      Daily Meal Capacity
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={orgCapacity}
                      onChange={(e) => setOrgCapacity(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#D4DFD2] text-sm tabular-nums"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#202820] mb-1">
                      Operating Address
                    </label>
                    <input
                      type="text"
                      required
                      value={orgAddress}
                      onChange={(e) => setOrgAddress(e.target.value)}
                      placeholder="Full operating center address"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#D4DFD2] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#202820] mb-1">
                      Coordinator Phone
                    </label>
                    <input
                      type="tel"
                      required
                      value={orgPhone}
                      onChange={(e) => setOrgPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#D4DFD2] text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#202820] mb-1">
                    Distribution Mission & Service Area
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={orgDesc}
                    onChange={(e) => setOrgDesc(e.target.value)}
                    placeholder="Describe the communities you serve, food storage capacity, and pickup availability."
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#D4DFD2] text-sm"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => navigate('explore')}
                    className="text-xs font-semibold text-[#16834A] hover:underline"
                  >
                    Browse Bulk Food Listings →
                  </button>
                  <button
                    type="submit"
                    disabled={savingOrg}
                    className="px-5 py-2.5 rounded-lg bg-[#16834A] hover:bg-[#126B3C] text-white text-sm font-semibold disabled:opacity-60"
                  >
                    {savingOrg
                      ? 'Saving...'
                      : myOrg
                        ? 'Update Organization'
                        : 'Register & Request Verification'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {tab === 'notifications' && (
            <div className="bg-white rounded-2xl border border-[#E2E8E0] p-6 space-y-4">
              <div className="flex items-center justify-between gap-4 border-b border-[#E2E8E0] pb-4">
                <div>
                  <h2 className="font-display text-2xl font-bold text-[#202820]">
                    Notification Center
                  </h2>
                  <p className="text-xs text-[#526054] mt-0.5">
                    Real-time alerts for requests, acceptances, pickup readiness, deliveries, and
                    expiry windows.
                  </p>
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllNotificationsRead}
                    className="text-xs font-semibold text-[#16834A] hover:underline"
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <p className="text-sm text-[#526054] py-8 text-center">
                  You&apos;re all caught up. No notifications yet.
                </p>
              ) : (
                <div className="divide-y divide-[#E2E8E0]">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`py-4 flex items-start justify-between gap-4 ${
                        !n.read ? 'bg-[#EFFAF3]/45 -mx-3 px-3 rounded-xl' : ''
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="text-sm font-semibold text-[#202820]">{n.title}</div>
                        <p className="text-xs text-[#526054] leading-relaxed">{n.message}</p>
                        <div className="text-[11px] text-[#526054]">
                          {formatDateTimeShort(n.createdAt)}
                        </div>
                      </div>
                      {!n.read && (
                        <button
                          type="button"
                          onClick={() => markNotificationRead(n.id)}
                          className="text-xs font-semibold text-[#16834A] whitespace-nowrap hover:underline"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PROFILE TAB */}
          {tab === 'profile' && (
            <form
              onSubmit={handleSaveProfile}
              className="bg-white rounded-2xl border border-[#E2E8E0] p-6 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-[#E2E8E0] pb-4">
                <div>
                  <h2 className="font-display text-2xl font-bold text-[#202820]">
                    Account Profile
                  </h2>
                  <p className="text-xs text-[#526054] mt-0.5">
                    Role: {roleLabel(user.role)} · Email: {user.email}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-[#16834A]">
                  <CheckCircle2 className="w-4 h-4" />
                  {user.emailVerified ? 'Email Verified' : 'Unverified Email'}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#202820] mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={profName}
                    onChange={(e) => setProfName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#D4DFD2] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#202820] mb-1">Phone</label>
                  <input
                    type="tel"
                    required
                    value={profPhone}
                    onChange={(e) => setProfPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#D4DFD2] text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#202820] mb-1">City</label>
                <select
                  value={profCity}
                  onChange={(e) => setProfCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#D4DFD2] bg-white text-sm"
                >
                  {INDIAN_CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#202820] mb-1">Short Bio</label>
                <textarea
                  rows={3}
                  value={profBio}
                  onChange={(e) => setProfBio(e.target.value)}
                  placeholder="Tell your local food-sharing community a bit about yourself."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#D4DFD2] text-sm"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-5 py-2.5 rounded-lg bg-[#16834A] hover:bg-[#126B3C] text-white text-sm font-semibold disabled:opacity-60"
                >
                  {savingProfile ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          )}
        </main>
      </div>

      {/* Edit Donation Modal */}
      {editingDonation && (
        <DonationFormModal
          open={Boolean(editingDonation)}
          existing={editingDonation}
          onClose={() => setEditingDonation(null)}
          onSaved={() => setEditingDonation(null)}
        />
      )}
    </div>
  );
}
