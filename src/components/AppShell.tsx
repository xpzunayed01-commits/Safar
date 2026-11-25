import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Award,
  BookOpen,
  CalendarCheck2,
  Clock,
  Flame,
  GraduationCap,
  Home,
  ShieldCheck,
  Sparkles,
  User,
  WifiOff,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { localizeLocation } from '../data/cities';
import { toBanglaDigits } from '../services/prayerService';
import { UserAvatar } from './MosqueArtwork';
import { ActiveAlarmBanner } from './ActiveAlarmBanner';
import { AppTourOverlay } from './AppTourOverlay';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state, t, isOnline, toasts, dismissToast, metrics } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const isBn = state.preferences.language === 'bn';
  const localizedLoc = localizeLocation(state.location.city, state.location.country, isBn);

  const navItems = [
    { to: '/home', label: t.home, icon: Home },
    { to: '/planner', label: t.planner, icon: CalendarCheck2 },
    { to: '/ssc', label: isBn ? 'এসএসসি' : 'SSC Study', icon: GraduationCap },
    { to: '/quran', label: t.quran, icon: BookOpen },
    { to: '/profile', label: t.profile, icon: User },
  ];

  const secondaryDesktopLinks = [
    { to: '/prayers', label: t.prayerTimes, icon: Clock },
    { to: '/duas', label: isBn ? 'দোয়া ও যিকির' : 'Duas & Dhikr', icon: Sparkles },
    { to: '/purity', label: isBn ? 'পবিত্রতা ও সংযম' : 'Purity & Self-Control', icon: ShieldCheck },
    { to: '/stats', label: t.dayStreak, icon: Flame },
    { to: '/badges', label: t.badges, icon: Award },
  ];

  const bottomOffset = state.preferences.bottomNavOffset ?? 14;

  const isImmersiveRoute =
    location.pathname === '/welcome' ||
    location.pathname === '/onboarding' ||
    location.pathname === '/auth';

  if (isImmersiveRoute) {
    return (
      <div className="min-h-[100dvh] bg-[#F8F9F6] text-[#141517]">
        {children}
        <ToastOverlay toasts={toasts} onDismiss={dismissToast} />
        <ActiveAlarmBanner />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#F6F8F5] text-[#141517] flex flex-col lg:flex-row">
      {/* Desktop Left Navigation Rail */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:left-0 bg-white border-r border-slate-200/70 px-5 py-6 justify-between z-30">
        <div>
          <button
            type="button"
            onClick={() => navigate('/home')}
            className="flex flex-col items-start gap-1.5 px-2 mb-8 cursor-pointer text-left group"
          >
            <img
              src="/assets/aistudio/6f7fdfc9-b075-47cb-82d6-43431092bd3b_c44308e1.png"
              alt="SAFAR"
              loading="eager"
              decoding="sync"
              fetchPriority="high"
              className="h-9 w-auto object-contain select-none group-hover:scale-[1.02] transition-transform"
            />
            <div className="text-[11px] font-medium text-slate-500 pl-0.5">
              {isBn ? 'ইসলামিক দৈনিক সঙ্গী' : 'Islamic Companion'}
            </div>
          </button>

          <nav className="space-y-1.5" aria-label="Primary Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-[#142018] text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-[#141517]'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="mt-7 pt-5 border-t border-slate-100 space-y-1.5">
            {secondaryDesktopLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-medium transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-[#084B32]/10 text-[#084B32] font-semibold'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-[#141517]'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          data-tour="profile-nav"
          onClick={() => navigate('/profile')}
          className="flex items-center gap-3 p-3 rounded-2xl bg-[#F6F8F5] hover:bg-slate-100 transition-colors text-left cursor-pointer"
        >
          <UserAvatar
            avatarId={state.auth.account.avatarId}
            customAvatarDataUrl={state.auth.account.customAvatarDataUrl}
            name={state.auth.account.name}
            sizeClass="w-10 h-10"
          />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-[#141517] truncate">
              {state.auth.account.name}
            </div>
            <div className="text-xs text-slate-500 tabular-nums">
              {isBn
                ? `${toBanglaDigits(metrics.currentStreakDays)} দিনের স্ট্রিক · ${localizedLoc.city}`
                : `${metrics.currentStreakDays}d streak · ${localizedLoc.city}`}
            </div>
          </div>
        </button>
      </aside>

      {/* Main Content Workspace */}
      <main className="flex-1 lg:pl-64 lg:pb-10 min-w-0">
        {!isOnline && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs font-medium text-amber-900 flex items-center justify-center gap-2">
            <WifiOff className="w-3.5 h-3.5 shrink-0" />
            <span>{t.offlineNotice}</span>
          </div>
        )}
        <div className="max-w-6xl mx-auto">{children}</div>
        {/* Dynamic mobile bottom spacer matching adjustable bottomNavOffset + safe-area */}
        <div
          className="lg:hidden"
          style={{
            height: `calc(${bottomOffset + 84}px + env(safe-area-inset-bottom, 0px))`,
          }}
        />
      </main>

      {/* Mobile Fixed Floating Pill Bottom Navigation */}
      <nav
        aria-label="Mobile Bottom Navigation"
        style={{
          bottom: `calc(${bottomOffset}px + env(safe-area-inset-bottom, 0px))`,
        }}
        className="lg:hidden fixed left-1/2 -translate-x-1/2 z-40 w-[calc(100%-24px)] max-w-[420px]"
      >
        <div className="bg-[#FFFFFF]/92 backdrop-blur-xl border border-slate-200/80 shadow-[0_12px_32px_rgba(15,23,42,0.12)] rounded-[32px] p-1.5 grid grid-cols-5 gap-0.5 items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                data-tour={item.to === '/profile' ? 'profile-nav' : undefined}
                className={({ isActive }) =>
                  `min-h-[48px] rounded-[24px] flex flex-col items-center justify-center gap-0.5 transition-all px-1 ${
                    isActive
                      ? 'bg-[#142018] text-white shadow-sm'
                      : 'text-slate-500 hover:text-[#141517]'
                  }`
                }
              >
                <Icon className="w-[18px] h-[18px]" />
                <span className="text-[10px] font-semibold tracking-tight whitespace-nowrap">
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </div>
      </nav>

      <ToastOverlay toasts={toasts} onDismiss={dismissToast} />
      <ActiveAlarmBanner />
      <AppTourOverlay />
    </div>
  );
};

const ToastOverlay: React.FC<{
  toasts: Array<{ id: string; title: string; subtitle?: string; tone: string }>;
  onDismiss: (id: string) => void;
}> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-xs w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto rounded-2xl bg-[#142018] text-white px-4 py-3 shadow-xl border border-white/10 flex items-start justify-between gap-3"
        >
          <div className="min-w-0">
            <div className="text-xs font-bold text-[#D9F275]">{toast.title}</div>
            {toast.subtitle && (
              <div className="text-xs text-slate-200 mt-0.5">{toast.subtitle}</div>
            )}
          </div>
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            className="text-slate-400 hover:text-white p-1 cursor-pointer"
            aria-label="নোটিফিকেশন বন্ধ করুন"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
