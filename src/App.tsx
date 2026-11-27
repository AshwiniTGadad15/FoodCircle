import { AppProvider, useApp } from './context/AppContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { DonationFormModal } from './components/DonationFormModal.tsx';
import { ToastContainer } from './components/ToastContainer.tsx';
import { LandingPage } from './pages/LandingPage.tsx';
import { ExplorePage } from './pages/ExplorePage.tsx';
import { HowItWorksPage } from './pages/HowItWorksPage.tsx';
import { CommunityPage } from './pages/CommunityPage.tsx';
import { AboutPage } from './pages/AboutPage.tsx';
import { SupportPage } from './pages/SupportPage.tsx';
import { DashboardPage } from './pages/DashboardPage.tsx';
import { AdminDashboardPage } from './pages/AdminDashboardPage.tsx';

function AppShell() {
  const { page, donateModalOpen, closeDonateModal } = useApp();

  return (
    <div className="min-h-screen flex flex-col foodcircle-canvas text-[#1E242B]">
      <Navbar />
      <div className="flex-1">
        {page === 'home' && <LandingPage />}
        {page === 'explore' && <ExplorePage />}
        {page === 'how-it-works' && <HowItWorksPage />}
        {page === 'community' && <CommunityPage />}
        {page === 'about' && <AboutPage />}
        {page === 'support' && <SupportPage />}
        {page === 'dashboard' && <DashboardPage />}
        {page === 'admin' && <AdminDashboardPage />}
      </div>
      <Footer />
      <AuthModal />
      <DonationFormModal open={donateModalOpen} onClose={closeDonateModal} />
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
