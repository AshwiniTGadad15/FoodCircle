import { useApp } from '../context/AppContext.tsx';

export function Footer() {
  const { navigate, user, openAuthModal, serverConfig } = useApp();

  return (
    <footer className="bg-gradient-to-br from-[#0F2F2F] via-[#173A34] to-[#2B1F3D] text-white mt-20 border-t-4 border-[#F97316]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg foodcircle-brand-gradient flex items-center justify-center text-white font-display font-bold text-base shadow-sm">
                F
              </span>
              <span className="font-display font-bold text-xl tracking-tight text-white">
                FoodCircle
              </span>
            </div>
            <p className="text-sm text-emerald-100/80 max-w-md leading-relaxed">
              Connecting surplus food with people who need it across India. Built for households,
              restaurants, bakeries, NGOs, and neighborhood volunteers working toward zero food
              waste.
            </p>
            <p className="text-xs font-semibold text-[#FDBA74] pt-1">
              Share Food. Spread Kindness. Reduce Waste.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[#FDE68A]">Platform</h3>
            <ul className="space-y-2 text-sm text-emerald-100/80">
              <li>
                <button type="button" onClick={() => navigate('explore')} className="hover:text-[#FDBA74] transition-colors">
                  Explore Surplus Food
                </button>
              </li>
              <li>
                <button type="button" onClick={() => navigate('how-it-works')} className="hover:text-[#FDBA74] transition-colors">
                  How It Works
                </button>
              </li>
              <li>
                <button type="button" onClick={() => navigate('community')} className="hover:text-[#FDBA74] transition-colors">
                  Community & Campaigns
                </button>
              </li>
              <li>
                <button type="button" onClick={() => navigate('about')} className="hover:text-[#FDBA74] transition-colors">
                  About FoodCircle
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[#99F6E4]">Support & Governance</h3>
            <ul className="space-y-2 text-sm text-emerald-100/80">
              <li>
                <button type="button" onClick={() => navigate('support')} className="hover:text-[#FDBA74] transition-colors">
                  Help Center & FAQs
                </button>
              </li>
              <li>
                <button type="button" onClick={() => navigate('support')} className="hover:text-[#FDBA74] transition-colors">
                  Contact & Report an Issue
                </button>
              </li>
              <li>
                <a href="mailto:support@foodcircle.in" className="hover:text-[#FDBA74] transition-colors">
                  support@foodcircle.in
                </a>
              </li>
              <li>
                {user?.role === 'admin' ? (
                  <button
                    type="button"
                    onClick={() => navigate('admin')}
                    className="hover:text-[#FDBA74] font-medium transition-colors"
                  >
                    Open Admin Dashboard
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => openAuthModal(serverConfig.adminClaimRequired ? 'admin-claim' : 'login')}
                    className="hover:text-[#FDBA74] transition-colors"
                  >
                    {serverConfig.adminClaimRequired ? 'First-Run Admin Setup' : 'Admin Sign In'}
                  </button>
                )}
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-emerald-100/70">
          <p>© {new Date().getFullYear()} FoodCircle – Community Food Sharing Network, India.</p>
          <p>
            Sample demo listings are clearly labeled. Verify food temperature and safe consumption
            deadlines before every pickup.
          </p>
        </div>
      </div>
    </footer>
  );
}
