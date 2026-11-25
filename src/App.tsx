import React, { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { StudyProvider } from './context/StudyContext';
import { AppShell } from './components/AppShell';
import { AuthPage, OnboardingPage, WelcomePage } from './pages/WelcomeOnboardingPages';
import { HomePage } from './pages/HomePage';
import { PrayerTimesPage } from './pages/PrayerTimesPage';
import { DailyPlannerPage } from './pages/DailyPlannerPage';
import { QuranLibraryPage } from './pages/QuranLibraryPage';
import { SurahReaderPage } from './pages/SurahReaderPage';
import { StreakStatsPage } from './pages/StreakStatsPage';
import { BadgesPage } from './pages/BadgesPage';
import { ProfileSettingsPage } from './pages/ProfileSettingsPage';
import { PurityTrackerPage } from './pages/PurityTrackerPage';
import { DuasDhikrPage } from './pages/DuasDhikrPage';
import { SSCMainPage } from './pages/ssc/SSCMainPage';

function ScrollToTop() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    if (pathname === '/duas') return;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname, search]);
  return null;
}

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF8F3] flex items-center justify-center p-6">
          <div className="bg-white rounded-[28px] max-w-sm w-full p-6 text-center space-y-4 border border-slate-200 shadow-sm">
            <h1 className="text-lg font-extrabold text-[#141517]">কিছু একটা সমস্যা হয়েছে</h1>
            <p className="text-xs text-slate-600">
              আপনার সব লোকাল ডেটা এই ডিভাইসে নিরাপদে সংরক্ষিত রয়েছে।
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-full bg-[#084B32] text-white text-xs font-semibold cursor-pointer"
            >
              অ্যাপ রিলোড করুন
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function RootRedirect() {
  const { state } = useApp();
  if (!state.auth.isOnboarded) {
    return <Navigate to="/welcome" replace />;
  }
  if (!state.auth.isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  return <Navigate to="/home" replace />;
}

export default function App() {
  return (
    <AppErrorBoundary>
      <AppProvider>
        <StudyProvider>
          <BrowserRouter>
            <ScrollToTop />
            <AppShell>
              <Routes>
                <Route path="/" element={<RootRedirect />} />
                <Route path="/welcome" element={<WelcomePage />} />
                <Route path="/onboarding" element={<OnboardingPage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/home" element={<HomePage />} />
                <Route path="/ssc" element={<SSCMainPage />} />
                <Route path="/prayers" element={<PrayerTimesPage />} />
                <Route path="/planner" element={<DailyPlannerPage />} />
                <Route path="/quran" element={<QuranLibraryPage />} />
                <Route path="/quran/:surahNumber" element={<SurahReaderPage />} />
                <Route path="/stats" element={<StreakStatsPage />} />
                <Route path="/badges" element={<BadgesPage />} />
                <Route path="/purity" element={<PurityTrackerPage />} />
                <Route path="/duas" element={<DuasDhikrPage />} />
                <Route path="/profile" element={<ProfileSettingsPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AppShell>
          </BrowserRouter>
        </StudyProvider>
      </AppProvider>
    </AppErrorBoundary>
  );
}
