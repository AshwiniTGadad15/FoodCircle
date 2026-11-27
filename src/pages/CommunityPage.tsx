import { useEffect, useState } from 'react';
import { Award, Building2, Calendar, CheckCircle2, Heart, MapPin, Users } from 'lucide-react';
import type {
  AwarenessCampaign,
  CommunityStory,
  Organization,
  ReviewItem,
} from '../../shared/types.ts';
import { apiRequest, formatDateTimeShort, GENERATED_ASSETS, roleLabel } from '../lib/api.ts';
import { useApp } from '../context/AppContext.tsx';
import { FoodImage } from '../components/FoodImage.tsx';

interface CommunityPayload {
  stories: CommunityStory[];
  campaigns: AwarenessCampaign[];
  organizations: Organization[];
  leaderboard: { name: string; city: string; role: string; meals: number; isDemo: boolean }[];
  recentActivity: { id: string; text: string; city: string; timestamp: string; isDemo: boolean }[];
  reviews: ReviewItem[];
}

export function CommunityPage() {
  const { user, openAuthModal, showToast, dataVersion } = useApp();
  const [data, setData] = useState<CommunityPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const loadCommunity = () => {
    setLoading(true);
    apiRequest<CommunityPayload>('/community')
      .then((res) => setData(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCommunity();
  }, [dataVersion]);

  const handleJoinCampaign = async (campId: string) => {
    if (!user) {
      openAuthModal('register');
      showToast('Sign in or join FoodCircle to pledge for an awareness campaign.', 'info');
      return;
    }
    setJoiningId(campId);
    try {
      await apiRequest(`/campaigns/${campId}/join`, { method: 'POST' });
      showToast('Thank you for joining this community campaign!');
      loadCommunity();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to join campaign.', 'error');
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Header Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-6 space-y-4">
          <p className="text-sm font-medium text-[#16834A]">Community & Zero-Waste Movement</p>
          <h1 className="font-display text-3xl sm:text-5xl font-bold text-[#202820] tracking-tight leading-tight">
            Neighbors, Kitchens & Volunteers Acting Together
          </h1>
          <p className="text-base text-[#526054] leading-relaxed">
            Discover verified partner organizations, read real food-rescue workflows, join seasonal
            zero-waste campaigns, and celebrate community impact across India.
          </p>
        </div>
        <div className="lg:col-span-6 rounded-3xl overflow-hidden border border-[#E2E8E0] aspect-[16/9]">
          <FoodImage
            src={GENERATED_ASSETS.volunteer}
            alt="Bengaluru community volunteers organizing sealed meal boxes for neighborhood distribution"
          />
        </div>
      </div>

      {loading || !data ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 rounded-2xl bg-white border border-[#E2E8E0] animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Awareness Campaigns */}
          <section className="space-y-6">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#202820]">
                Active Awareness Campaigns
              </h2>
              <p className="text-sm text-[#526054] mt-1">
                Join local drives to prevent celebration, campus, and market food waste.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {data.campaigns.map((camp, idx) => {
                const pct = Math.min(100, Math.round((camp.currentMeals / camp.goalMeals) * 100));
                const joined = Boolean(user && camp.joinedUserIds.includes(user.id));
                const themes = [
                  {
                    card: 'bg-gradient-to-br from-white via-white to-orange-50/80 border-orange-200/80',
                    bar: 'bg-gradient-to-r from-orange-500 to-amber-400',
                    btn: 'bg-gradient-to-r from-[#EA580C] to-[#F97316] hover:from-[#C2410C] hover:to-[#EA580C]',
                    accent: 'text-orange-600',
                  },
                  {
                    card: 'bg-gradient-to-br from-white via-white to-teal-50/80 border-teal-200/80',
                    bar: 'bg-gradient-to-r from-teal-500 to-emerald-500',
                    btn: 'bg-gradient-to-r from-[#0D9488] to-[#0F9D58] hover:from-[#0F766E] hover:to-[#0D7A43]',
                    accent: 'text-teal-700',
                  },
                  {
                    card: 'bg-gradient-to-br from-white via-white to-rose-50/80 border-rose-200/80',
                    bar: 'bg-gradient-to-r from-rose-500 to-fuchsia-500',
                    btn: 'bg-gradient-to-r from-[#E11D48] to-[#9333EA] hover:from-[#BE123C] hover:to-[#7E22CE]',
                    accent: 'text-rose-600',
                  },
                ];
                const t = themes[idx % themes.length];
                return (
                  <div
                    key={camp.id}
                    className={`rounded-2xl border p-6 flex flex-col justify-between space-y-5 shadow-xs ${t.card}`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs text-[#4B5563]">
                        <Calendar className={`w-3.5 h-3.5 ${t.accent}`} />
                        <span>{camp.dateRange}</span>
                        <span aria-hidden="true">·</span>
                        <span className={`font-semibold ${t.accent}`}>{camp.city}</span>
                      </div>
                      <h3 className="font-display text-xl font-bold text-[#1E242B]">
                        {camp.title}
                      </h3>
                      <p className="text-sm text-[#4B5563] leading-relaxed">{camp.description}</p>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="font-medium text-[#1E242B] tabular-nums">
                            {camp.currentMeals} / {camp.goalMeals} meals target
                          </span>
                          <span className={`font-bold tabular-nums ${t.accent}`}>{pct}%</span>
                        </div>
                        <div className="h-2.5 rounded-full bg-stone-200/70 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${t.bar}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <span className="text-xs text-[#4B5563] inline-flex items-center gap-1.5 tabular-nums">
                          <Users className={`w-3.5 h-3.5 ${t.accent}`} />
                          {camp.participantsCount} pledged {camp.isDemo ? '(Demo + Live)' : ''}
                        </span>
                        <button
                          type="button"
                          disabled={joined || joiningId === camp.id}
                          onClick={() => handleJoinCampaign(camp.id)}
                          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                            joined
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                              : `text-white shadow-xs ${t.btn}`
                          }`}
                        >
                          {joined
                            ? 'Joined'
                            : joiningId === camp.id
                              ? 'Joining...'
                              : 'Join Campaign'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Leaderboard & Live Feed */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Leaderboard */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E2E8E0] p-6 sm:p-8 space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-2xl font-bold text-[#202820] flex items-center gap-2">
                    <Award className="w-5 h-5 text-[#FFAA45]" />
                    Community Impact Leaderboard
                  </h2>
                  <p className="text-xs text-[#526054] mt-1">
                    Ranked by total servings listed across FoodCircle. Sample demo entries are
                    clearly marked.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#E2E8E0] text-left text-xs text-[#526054]">
                      <th className="py-2.5 pr-3 font-medium">Rank</th>
                      <th className="py-2.5 px-3 font-medium">Contributor</th>
                      <th className="py-2.5 px-3 font-medium">City</th>
                      <th className="py-2.5 pl-3 text-right font-medium">Servings Shared</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8E0]">
                    {data.leaderboard.map((row, idx) => (
                      <tr key={`${row.name}-${idx}`} className="hover:bg-[#F8FAF7]">
                        <td className="py-3 pr-3 font-mono font-semibold text-[#16834A] tabular-nums">
                          #{idx + 1}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-[#202820]">{row.name}</div>
                          <div className="text-xs text-[#526054]">
                            {roleLabel(row.role)}
                            {row.isDemo ? ' · Demo Sample' : ' · Verified Member'}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-[#526054]">{row.city}</td>
                        <td className="py-3 pl-3 text-right font-mono font-semibold text-[#202820] tabular-nums">
                          {row.meals.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Live Community Activity */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E2E8E0] p-6 sm:p-8 space-y-5">
              <div>
                <h2 className="font-display text-2xl font-bold text-[#202820]">
                  Recent Sharing Activity
                </h2>
                <p className="text-xs text-[#526054] mt-1">
                  Latest surplus food contributions posted across Indian cities.
                </p>
              </div>
              <div className="divide-y divide-[#E2E8E0]">
                {data.recentActivity.map((act) => (
                  <div key={act.id} className="py-3.5 first:pt-0 last:pb-0 space-y-1">
                    <p className="text-sm text-[#202820] font-medium">{act.text}</p>
                    <div className="flex items-center gap-2 text-xs text-[#526054]">
                      <span>{act.city}</span>
                      <span aria-hidden="true">·</span>
                      <span>{formatDateTimeShort(act.timestamp)}</span>
                      {act.isDemo && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>Demo</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Stories */}
          <section className="space-y-6">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#202820]">
                Community Food-Sharing Stories
              </h2>
              <p className="text-sm text-[#526054] mt-1">
                Illustrative examples of how neighborhoods coordinate daily rescues.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {data.stories.map((story) => (
                <article
                  key={story.id}
                  className="bg-white rounded-2xl border border-[#E2E8E0] overflow-hidden flex flex-col"
                >
                  <div className="aspect-[16/10] bg-[#EDF3EC]">
                    <FoodImage src={story.imageUrl} alt={story.title} />
                  </div>
                  <div className="p-5 flex-1 flex flex-col space-y-2.5">
                    <div className="text-xs text-[#526054] flex items-center gap-2">
                      <span className="text-[#16834A] font-medium">{story.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>{story.city}</span>
                      {story.isDemo && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>Sample Case</span>
                        </>
                      )}
                    </div>
                    <h3 className="font-display text-lg font-bold text-[#202820] leading-snug">
                      {story.title}
                    </h3>
                    <p className="text-sm text-[#526054] leading-relaxed flex-1">{story.summary}</p>
                    <div className="pt-3 border-t border-[#E2E8E0] flex items-center justify-between text-xs text-[#526054]">
                      <span>{story.authorName}</span>
                      <span className="font-mono font-semibold text-[#16834A] tabular-nums">
                        {story.mealsSaved} meals
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* Verified Partner Organizations */}
          <section className="space-y-6">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#202820]">
                Nearby Organizations & Community Kitchens
              </h2>
              <p className="text-sm text-[#526054] mt-1">
                Verified NGOs, shelters, and partner kitchens coordinating surplus distribution.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {data.organizations.map((org) => (
                <div
                  key={org.id}
                  className="bg-white rounded-2xl border border-[#E2E8E0] p-6 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-10 h-10 rounded-xl bg-[#EFFAF3] text-[#16834A] flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#16834A]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Verified {org.type}
                    </span>
                  </div>
                  <h3 className="font-display text-lg font-bold text-[#202820]">{org.name}</h3>
                  <p className="text-sm text-[#526054] leading-relaxed">{org.description}</p>
                  <div className="pt-3 border-t border-[#E2E8E0] space-y-1 text-xs text-[#526054]">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#16834A]" />
                      <span>
                        {org.address}, {org.city}
                      </span>
                    </div>
                    <div className="tabular-nums">
                      Daily capacity: {org.capacityPerDay} meals · Reg: {org.registrationNumber}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Community Reviews if any */}
          {data.reviews.length > 0 && (
            <section className="space-y-5">
              <h2 className="font-display text-2xl font-bold text-[#202820] flex items-center gap-2">
                <Heart className="w-5 h-5 text-[#16834A]" />
                Recent Appreciation Notes
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {data.reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="bg-white rounded-2xl border border-[#E2E8E0] p-5 space-y-2"
                  >
                    <div className="text-xs font-semibold text-[#16834A] tabular-nums">
                      {rev.rating}/5 Rating · {rev.donationName}
                    </div>
                    <p className="text-sm text-[#202820]">“{rev.comment}”</p>
                    <div className="text-xs text-[#526054]">— {rev.fromUserName}</div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
