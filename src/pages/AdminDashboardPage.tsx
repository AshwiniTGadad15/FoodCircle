import { useEffect, useState } from 'react';
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
  AlertTriangle,
  Building2,
  CheckCircle2,
  Package,
  Shield,
  Trash2,
  Users,
} from 'lucide-react';
import type {
  DeliveryTask,
  FoodDonation,
  FoodRequest,
  Organization,
  PublicUser,
  SafetyReport,
  SupportMessage,
} from '../../shared/types.ts';
import { apiRequest, formatDateTimeShort, roleLabel } from '../lib/api.ts';
import { useApp } from '../context/AppContext.tsx';

interface AdminOverviewData {
  analytics: {
    totalUsers: number;
    totalDonations: number;
    verifiedDonations: number;
    totalMealsShared: number;
    activeListings: number;
    completedRequests: number;
    volunteerDeliveries: number;
    openReports: number;
  };
  users: PublicUser[];
  organizations: Organization[];
  donations: FoodDonation[];
  requests: FoodRequest[];
  deliveries: DeliveryTask[];
  reports: SafetyReport[];
  supportMessages: SupportMessage[];
}

type AdminTab = 'analytics' | 'users' | 'organizations' | 'donations' | 'reports' | 'support';

export function AdminDashboardPage() {
  const { user, openAuthModal, serverConfig, showToast, dataVersion, bumpDataVersion } = useApp();
  const [data, setData] = useState<AdminOverviewData | null>(null);
  const [tab, setTab] = useState<AdminTab>('analytics');
  const [roleFilter, setRoleFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    let active = true;
    setLoading(true);
    apiRequest<AdminOverviewData>('/admin/overview')
      .then((res) => {
        if (active) setData(res);
      })
      .catch((err) => {
        showToast(err instanceof Error ? err.message : 'Unable to load admin data.', 'error');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user, dataVersion, showToast]);

  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-[#EFFAF3] text-[#16834A] flex items-center justify-center mx-auto">
          <Shield className="w-6 h-6" />
        </div>
        <h1 className="font-display text-3xl font-bold text-[#202820]">
          FoodCircle Admin Console
        </h1>
        <p className="text-sm text-[#526054]">
          Administrator access is strictly protected by role-based server authorization.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          {serverConfig.adminClaimRequired ? (
            <button
              type="button"
              onClick={() => openAuthModal('admin-claim')}
              className="px-5 py-2.5 rounded-xl bg-[#16834A] text-white text-sm font-semibold"
            >
              Initialize First-Run Admin Account
            </button>
          ) : (
            <button
              type="button"
              onClick={() => openAuthModal('login')}
              className="px-5 py-2.5 rounded-xl bg-[#16834A] text-white text-sm font-semibold"
            >
              Sign In as Administrator
            </button>
          )}
        </div>
      </div>
    );
  }

  const toggleUserVerify = async (u: PublicUser) => {
    try {
      await apiRequest(`/admin/users/${u.id}/verify`, {
        method: 'PATCH',
        body: { verifiedByAdmin: !u.verifiedByAdmin },
      });
      showToast(`${u.fullName} verification updated.`);
      bumpDataVersion();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update user.', 'error');
    }
  };

  const updateOrgStatus = async (orgId: string, verifiedStatus: Organization['verifiedStatus']) => {
    try {
      await apiRequest(`/admin/organizations/${orgId}/verify`, {
        method: 'PATCH',
        body: { verifiedStatus },
      });
      showToast(`Organization status set to ${verifiedStatus}.`);
      bumpDataVersion();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update organization.', 'error');
    }
  };

  const deleteDonation = async (id: string) => {
    try {
      await apiRequest(`/donations/${id}`, { method: 'DELETE' });
      showToast('Food listing removed by admin.', 'info');
      bumpDataVersion();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Delete failed.', 'error');
    }
  };

  const flagOrRestoreDonation = async (don: FoodDonation) => {
    const nextStatus = don.status === 'flagged' ? 'available' : 'flagged';
    try {
      await apiRequest(`/donations/${don.id}`, { method: 'PATCH', body: { status: nextStatus } });
      showToast(`Listing status updated to ${nextStatus}.`);
      bumpDataVersion();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Update failed.', 'error');
    }
  };

  const resolveReport = async (
    repId: string,
    status: 'resolved' | 'dismissed',
    restoreDonation = false,
  ) => {
    try {
      await apiRequest(`/admin/reports/${repId}`, {
        method: 'PATCH',
        body: {
          status,
          restoreDonation,
          adminNote: restoreDonation ? 'Reviewed and restored' : 'Reviewed by admin',
        },
      });
      showToast(`Report marked as ${status}.`);
      bumpDataVersion();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to update report.', 'error');
    }
  };

  const categoryChart = data
    ? Object.entries(
        data.donations.reduce<Record<string, number>>((acc, d) => {
          acc[d.category] = (acc[d.category] || 0) + 1;
          return acc;
        }, {}),
      ).map(([category, count]) => ({ category, count }))
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-[#16834A]">Governance & Platform Moderation</p>
          <h1 className="font-display text-3xl font-bold text-[#202820]">
            FoodCircle Admin Dashboard
          </h1>
        </div>

        <div className="flex flex-wrap gap-1 p-1 rounded-xl bg-[#EDF3EC]">
          {(
            [
              { id: 'analytics', label: 'Analytics' },
              { id: 'users', label: 'Users' },
              { id: 'organizations', label: 'NGOs' },
              { id: 'donations', label: 'Listings' },
              { id: 'reports', label: `Reports (${data?.analytics.openReports ?? 0})` },
              { id: 'support', label: 'Support' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                tab === t.id ? 'bg-white text-[#16834A] shadow-xs' : 'text-[#526054]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {loading || !data ? (
        <div className="h-72 rounded-2xl bg-white border border-[#E2E8E0] animate-pulse" />
      ) : (
        <>
          {/* ANALYTICS TAB */}
          {tab === 'analytics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-indigo-50 to-violet-50/80 rounded-2xl border border-indigo-200/70 p-5">
                  <div className="text-xs font-medium text-indigo-900/75">Registered Users (Real)</div>
                  <div className="font-mono text-3xl font-bold text-indigo-700 tabular-nums mt-1">
                    {data.analytics.totalUsers}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-amber-50/80 rounded-2xl border border-orange-200/70 p-5">
                  <div className="text-xs font-medium text-orange-900/75">Active Food Listings</div>
                  <div className="font-mono text-3xl font-bold text-orange-600 tabular-nums mt-1">
                    {data.analytics.activeListings}
                  </div>
                  <div className="text-xs text-orange-800/80 mt-0.5 tabular-nums">
                    {data.analytics.totalDonations} total records
                  </div>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50/80 rounded-2xl border border-emerald-200/70 p-5">
                  <div className="text-xs font-medium text-emerald-900/75">Verified Meals Shared</div>
                  <div className="font-mono text-3xl font-bold text-emerald-700 tabular-nums mt-1">
                    {data.analytics.totalMealsShared}
                  </div>
                  <div className="text-xs text-emerald-800/80 mt-0.5 tabular-nums">
                    {data.analytics.completedRequests} completed requests
                  </div>
                </div>
                <div className="bg-gradient-to-br from-rose-50 to-pink-50/80 rounded-2xl border border-rose-200/70 p-5">
                  <div className="text-xs font-medium text-rose-900/75">Volunteer Deliveries</div>
                  <div className="font-mono text-3xl font-bold text-rose-600 tabular-nums mt-1">
                    {data.analytics.volunteerDeliveries}
                  </div>
                  <div className="text-xs text-rose-800/80 mt-0.5 tabular-nums">
                    {data.analytics.openReports} open safety reports
                  </div>
                </div>
              </div>

              <div className="bg-white/95 rounded-2xl border border-stone-200/80 p-6">
                <h2 className="font-display text-lg font-bold text-[#1E242B] mb-4">
                  Food Listings by Category
                </h2>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#4B5563' }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#4B5563' }} />
                      <Tooltip />
                      <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                        {categoryChart.map((entry, idx) => (
                          <Cell
                            key={entry.category}
                            fill={
                              ['#EA580C', '#0F9D58', '#E11D48', '#0D9488', '#D97706', '#4F46E5', '#7C3AED'][
                                idx % 7
                              ]
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* USERS TAB */}
          {tab === 'users' && (
            <div className="bg-white rounded-2xl border border-[#E2E8E0] p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-lg font-bold text-[#202820] flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#16834A]" />
                  Registered Users & Verification
                </h2>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-[#D4DFD2] bg-white text-xs font-medium"
                >
                  <option value="all">All Roles</option>
                  <option value="donor">Food Donors</option>
                  <option value="seeker">Food Seekers</option>
                  <option value="volunteer">Volunteers</option>
                  <option value="ngo">NGOs</option>
                  <option value="business">Restaurants / Businesses</option>
                  <option value="admin">Admins</option>
                </select>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#E2E8E0] text-left text-xs text-[#526054]">
                      <th className="py-2.5 pr-3">Name</th>
                      <th className="py-2.5 px-3">Role</th>
                      <th className="py-2.5 px-3">City</th>
                      <th className="py-2.5 px-3">Email</th>
                      <th className="py-2.5 pl-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8E0]">
                    {data.users
                      .filter((u) => roleFilter === 'all' || u.role === roleFilter)
                      .map((u) => (
                        <tr key={u.id}>
                          <td className="py-3 pr-3 font-medium text-[#202820]">
                            {u.fullName}
                            {u.isDemo && <span className="text-xs text-[#526054]"> (Demo)</span>}
                          </td>
                          <td className="py-3 px-3 text-xs text-[#526054]">{roleLabel(u.role)}</td>
                          <td className="py-3 px-3 text-xs text-[#526054]">{u.city}</td>
                          <td className="py-3 px-3 text-xs text-[#526054]">{u.email}</td>
                          <td className="py-3 pl-3 text-right">
                            <button
                              type="button"
                              onClick={() => toggleUserVerify(u)}
                              className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                                u.verifiedByAdmin
                                  ? 'bg-[#EFFAF3] text-[#16834A]'
                                  : 'border border-[#D4DFD2] text-[#202820] hover:bg-[#F8FAF7]'
                              }`}
                            >
                              {u.verifiedByAdmin ? 'Verified' : 'Verify User'}
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ORGANIZATIONS TAB */}
          {tab === 'organizations' && (
            <div className="bg-white rounded-2xl border border-[#E2E8E0] p-6 space-y-4">
              <h2 className="font-display text-lg font-bold text-[#202820] flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#16834A]" />
                NGO & Organization Verification Queue
              </h2>
              <div className="divide-y divide-[#E2E8E0]">
                {data.organizations.map((org) => (
                  <div
                    key={org.id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="font-semibold text-sm text-[#202820]">
                        {org.name} ({org.type})
                      </div>
                      <div className="text-xs text-[#526054]">
                        Reg: {org.registrationNumber} · {org.city} · Capacity: {org.capacityPerDay}
                        /day · Status: <strong className="uppercase">{org.verifiedStatus}</strong>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => updateOrgStatus(org.id, 'verified')}
                        className="px-3 py-1.5 rounded-lg bg-[#16834A] text-white text-xs font-semibold"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => updateOrgStatus(org.id, 'rejected')}
                        className="px-3 py-1.5 rounded-lg border border-red-200 text-red-700 text-xs font-semibold"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DONATIONS TAB */}
          {tab === 'donations' && (
            <div className="bg-white rounded-2xl border border-[#E2E8E0] p-6 space-y-4">
              <h2 className="font-display text-lg font-bold text-[#202820] flex items-center gap-2">
                <Package className="w-5 h-5 text-[#16834A]" />
                All Food Listings
              </h2>
              <div className="divide-y divide-[#E2E8E0]">
                {data.donations.map((don) => (
                  <div
                    key={don.id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="font-semibold text-sm text-[#202820]">{don.foodName}</div>
                      <div className="text-xs text-[#526054]">
                        {don.donorName} · {don.city} · {don.availableQuantity}/{don.totalQuantity}{' '}
                        {don.unit} · Status: <strong className="uppercase">{don.status}</strong>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => flagOrRestoreDonation(don)}
                        className="px-3 py-1.5 rounded-lg border border-[#D4DFD2] text-xs font-semibold text-[#202820]"
                      >
                        {don.status === 'flagged' ? 'Restore Listing' : 'Flag Unsafe'}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteDonation(don.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* REPORTS TAB */}
          {tab === 'reports' && (
            <div className="bg-white rounded-2xl border border-[#E2E8E0] p-6 space-y-4">
              <h2 className="font-display text-lg font-bold text-[#202820] flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                Food Safety & Content Reports
              </h2>
              {data.reports.length === 0 ? (
                <p className="text-sm text-[#526054] py-6">No safety reports filed.</p>
              ) : (
                <div className="divide-y divide-[#E2E8E0]">
                  {data.reports.map((rep) => (
                    <div key={rep.id} className="py-4 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="font-semibold text-sm text-[#202820]">
                          {rep.reason} — {rep.targetLabel}
                        </div>
                        <span className="text-xs font-semibold uppercase text-amber-700">
                          {rep.status}
                        </span>
                      </div>
                      <p className="text-xs text-[#526054]">
                        Reported by {rep.reporterName} on {formatDateTimeShort(rep.createdAt)}:{' '}
                        {rep.details}
                      </p>
                      {rep.status === 'open' && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => resolveReport(rep.id, 'resolved', false)}
                            className="px-3 py-1.5 rounded-lg bg-[#16834A] text-white text-xs font-semibold"
                          >
                            Confirm & Keep Hidden
                          </button>
                          <button
                            type="button"
                            onClick={() => resolveReport(rep.id, 'dismissed', true)}
                            className="px-3 py-1.5 rounded-lg border border-[#D4DFD2] text-xs font-semibold text-[#202820]"
                          >
                            Dismiss & Restore Listing
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SUPPORT TICKETS TAB */}
          {tab === 'support' && (
            <div className="bg-white rounded-2xl border border-[#E2E8E0] p-6 space-y-4">
              <h2 className="font-display text-lg font-bold text-[#202820] flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#16834A]" />
                Contact, Issue & Feedback Submissions
              </h2>
              {data.supportMessages.length === 0 ? (
                <p className="text-sm text-[#526054] py-6">No support messages received yet.</p>
              ) : (
                <div className="divide-y divide-[#E2E8E0]">
                  {data.supportMessages.map((msg) => (
                    <div key={msg.id} className="py-4 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-sm text-[#202820]">
                          [{msg.type.toUpperCase()}] {msg.subject}
                        </span>
                        <span className="text-xs text-[#526054]">
                          {formatDateTimeShort(msg.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-[#526054]">{msg.message}</p>
                      <div className="text-xs text-[#16834A]">
                        From {msg.name} ({msg.email})
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
