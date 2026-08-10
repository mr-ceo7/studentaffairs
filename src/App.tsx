/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import BottomNav from './components/BottomNav';
import Sidebar from './components/Sidebar';
import ScrollVideo from './components/ScrollVideo';
import AuthModal from './components/AuthModal';
import FloatingSupportButton from './components/FloatingSupportButton';
import AboutUsPage from './pages/AboutUsPage';
import ContactPage from './pages/ContactPage';
import FAQPage from './pages/FAQPage';
import CatalogPage from './pages/CatalogPage';
import GpaCalculatorPage from './pages/GpaCalculatorPage';
import NoticesPage from './pages/NoticesPage';
import ClearancePage from './pages/ClearancePage';
import PrivacyPolicy from './pages/legal/PrivacyPolicy';
import TermsOfService from './pages/legal/TermsOfService';
import Footer from './components/Footer';
import PencilLoader from './components/PencilLoader';
import LoginPage from './pages/LoginPage';

import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster, toast } from 'sonner';

import { usePageTracking } from './hooks/usePageTracking';
import { useUser } from './context/UserContext';

function AppContent() {
  usePageTracking();
  const { user, loading, refreshUser } = useUser();
  const [searchParams] = useSearchParams();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [prefillEmail, setPrefillEmail] = useState<string | undefined>(undefined);
  const [prefillRole, setPrefillRole] = useState<'student' | 'lecturer' | 'admin' | undefined>(undefined);
  
  const location = useLocation();
  const navigate = useNavigate();

  // Redirect to /login if the user is not logged in and attempts to access protected routes
  useEffect(() => {
    if (!loading && !user) {
      const publicRoutes = ['/login', '/privacy', '/terms'];
      if (!publicRoutes.includes(location.pathname)) {
        navigate('/login', { replace: true });
      }
    }
  }, [user, loading, location.pathname, navigate]);

  const handleShowAuth = (email?: string, role?: 'student' | 'lecturer' | 'admin') => {
    const params = new URLSearchParams();
    if (email) params.set('email', email);
    if (role) params.set('role', role);
    navigate(`/login?${params.toString()}`);
  };

  const handleCloseAuth = () => {
    setShowAuth(false);
    setPrefillEmail(undefined);
    setPrefillRole(undefined);
  };

  const isLoginRoute = location.pathname === '/login';

  if (isLoginRoute) {
    return (
      <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </div>
    );
  }

  return (
    <div className="bg-transparent text-on-surface min-h-screen font-body selection:bg-blue-500/30 selection:text-slate-900 flex justify-center relative overflow-hidden">
      {/* Scroll-driven video background */}
      <ScrollVideo scrollContainerRef={scrollContainerRef} />

      {/* Content layer: outer container is now the scroll container */}
      <div 
        ref={scrollContainerRef}
        className="w-full relative h-[100dvh] overflow-y-auto scrollbar-hide z-10 flex flex-col"
      >
        {/* Full-width top navigation bar */}
        <Header onShowAuth={() => handleShowAuth()} />

        {/* Main upper content section with side-by-side sidebar & page flow */}
        <div className="flex-1 flex min-w-0 px-4 md:px-6 lg:px-8 gap-6">
          <Sidebar className="hidden md:flex sticky top-20 h-[calc(100dvh-96px)] mt-4" onShowAuth={() => handleShowAuth()} />
          <div className="flex-1 w-full flex flex-col pt-6 md:pt-8 pb-[100px] md:pb-8 min-w-0">
            <Routes>
              <Route path="/" element={<Dashboard onShowPricing={() => handleShowAuth()} onShowAuth={handleShowAuth} />} />
              <Route path="/catalog" element={<CatalogPage />} />
              <Route path="/gpa" element={<GpaCalculatorPage />} />
              <Route path="/notices" element={<NoticesPage />} />
              <Route path="/clearance" element={<ClearancePage />} />
              <Route path="/about" element={<AboutUsPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/faq" element={<FAQPage />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              {/* Fallback redirecting paths */}
              <Route path="/*" element={<Dashboard onShowPricing={() => handleShowAuth()} onShowAuth={handleShowAuth} />} />
            </Routes>
          </div>
        </div>
        
        {/* Full-width footer positioned directly below sidebar and main content */}
        <Footer />
        <BottomNav />
      </div>

      {/* Floating Support Button */}
      <FloatingSupportButton />

      {/* SSO Auth Modal (kept as fallback for any legacy actions, but normally unused) */}
      <AuthModal 
        isOpen={showAuth} 
        onClose={handleCloseAuth} 
        prefilledEmail={prefillEmail}
        prefilledRole={prefillRole}
      />
    </div>
  );
}

export default function App() {
  const [splashVisible, setSplashVisible] = useState(true);
  const [splashFading, setSplashFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setSplashFading(true), 1600);
    const removeTimer = setTimeout(() => setSplashVisible(false), 2100);
    return () => { clearTimeout(fadeTimer); clearTimeout(removeTimer); };
  }, []);

  const googleClientId = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID;

  const appTree = (
    <BrowserRouter>
      <UserProvider>
        {splashVisible && (
          <div
            className="splash-screen"
            style={{
              opacity: splashFading ? 0 : 1,
              pointerEvents: splashFading ? 'none' : 'all',
            }}
          >
            <PencilLoader message="Initializing UoN Clearinghouse..." size="lg" />
          </div>
        )}
        <div
          style={{
            opacity: splashFading ? 1 : 0,
            transition: 'opacity 0.5s ease-in-out',
          }}
        >
          <AppContent />
        </div>
        <Toaster position="top-right" richColors />
      </UserProvider>
    </BrowserRouter>
  );

  // Only wrap with GoogleOAuthProvider when a valid client ID is configured
  if (googleClientId) {
    return (
      <GoogleOAuthProvider clientId={googleClientId}>
        {appTree}
      </GoogleOAuthProvider>
    );
  }

  return appTree;
}

