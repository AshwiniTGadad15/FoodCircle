import { useState } from 'react';
import { Bell, LogOut, Menu, Shield, X } from 'lucide-react';
import { useApp, type AppPage } from '../context/AppContext.tsx';

const NAV_ITEMS: { id: AppPage; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'explore', label: 'Explore Food' },
  { id: 'how-it-works', label: 'How It Works' },
  { id: 'community', label: 'Community' },
  { id: 'about', label: 'About Us' },
];

export function Navbar() {
  const { page, navigate, user, openAuthModal, logout, unreadCount } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (target: AppPage) => {
    navigate(target);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-orange-200/60 shadow-[0_2px_16px_-6px_rgba(234,88,12,0.12)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <button
          type="button"
          onClick={() => handleNav('home')}
          className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EA580C] rounded-md"
        >
          <span className="w-8 h-8 rounded-lg foodcircle-brand-gradient flex items-center justify-center text-white font-display font-bold text-base shadow-sm">
            F
          </span>
          <span className="font-display font-bold text-xl tracking-tight bg-gradient-to-r from-[#0F766E] via-[#0F9D58] to-[#EA580C] bg-clip-text text-transparent">
            FoodCircle
          </span>
        </button>

        {/* Zone 2: 5 concise single-line text nav links */}
        <nav className="hidden md:flex items-center gap-7" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => {
            const active = page === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                className={`text-sm font-medium whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors duration-150 ${
                  active
                    ? 'text-[#EA580C] border-[#EA580C] font-semibold'
                    : 'text-[#4B5563] border-transparent hover:text-[#0F766E]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Account / Primary CTA */}
        <div className="hidden md:flex items-center gap-4 shrink-0">
          {!user ? (
            <>
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="text-sm font-semibold text-[#1E242B] hover:text-[#EA580C] transition-colors whitespace-nowrap shrink-0 px-2 py-2"
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => openAuthModal('register')}
                className="px-4 py-2 text-sm font-semibold text-white foodcircle-cta-gradient rounded-lg shadow-sm transition-all duration-150 whitespace-nowrap shrink-0"
              >
                Join FoodCircle
              </button>
            </>
          ) : (
            <>
              {user.role === 'admin' && (
                <button
                  type="button"
                  onClick={() => handleNav('admin')}
                  className={`inline-flex items-center gap-1.5 text-sm font-medium whitespace-nowrap shrink-0 px-2.5 py-1.5 rounded-lg transition-colors ${
                    page === 'admin'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-[#4B5563] hover:text-indigo-700'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  Admin
                </button>
              )}
              <button
                type="button"
                onClick={() => handleNav('dashboard')}
                aria-label="Open dashboard and notifications"
                className="relative p-2 text-[#4B5563] hover:text-[#EA580C] rounded-lg transition-colors"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-r from-[#F97316] to-[#E11D48] text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => handleNav('dashboard')}
                className="px-4 py-2 text-sm font-semibold text-white foodcircle-cta-gradient rounded-lg shadow-sm transition-all whitespace-nowrap shrink-0 max-w-[170px] truncate"
              >
                Dashboard
              </button>
              <button
                type="button"
                onClick={logout}
                aria-label="Sign out"
                title="Sign out"
                className="p-2 text-[#4B5563] hover:text-rose-600 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Mobile menu trigger */}
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle navigation menu"
          className="md:hidden p-2.5 rounded-lg text-[#202820] hover:bg-[#EDF3EC] transition-colors"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-b border-[#E2E8E0] px-4 py-4 space-y-2">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNav(item.id)}
              className={`block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium ${
                page === item.id
                  ? 'bg-[#EFFAF3] text-[#16834A]'
                  : 'text-[#202820] hover:bg-[#F8FAF7]'
              }`}
            >
              {item.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => handleNav('support')}
            className={`block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium ${
              page === 'support' ? 'bg-[#EFFAF3] text-[#16834A]' : 'text-[#202820] hover:bg-[#F8FAF7]'
            }`}
          >
            Contact & Support
          </button>

          <div className="pt-3 mt-2 border-t border-[#E2E8E0] flex flex-col gap-2">
            {!user ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    openAuthModal('login');
                  }}
                  className="w-full py-2.5 px-4 text-sm font-medium text-[#202820] border border-[#D4DFD2] rounded-lg"
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    openAuthModal('register');
                  }}
                  className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-[#16834A] rounded-lg"
                >
                  Join FoodCircle
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleNav('dashboard')}
                  className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-[#16834A] rounded-lg"
                >
                  Open Dashboard ({user.fullName})
                </button>
                {user.role === 'admin' && (
                  <button
                    type="button"
                    onClick={() => handleNav('admin')}
                    className="w-full py-2.5 px-4 text-sm font-medium text-[#16834A] bg-[#EFFAF3] rounded-lg"
                  >
                    Admin Console
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    logout();
                  }}
                  className="w-full py-2.5 px-4 text-sm font-medium text-red-700 border border-red-200 rounded-lg"
                >
                  Sign Out
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
