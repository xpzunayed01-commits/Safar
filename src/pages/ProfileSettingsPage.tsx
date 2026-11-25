import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Award,
  Bell,
  CheckCircle2,
  Download,
  Flame,
  HelpCircle,
  LogOut,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  Sun,
  Upload,
  X,
} from 'lucide-react';
import type { SupportedLanguage } from '../config/app';
import { useApp } from '../context/AppContext';
import {
  CALCULATION_METHOD_LABELS,
  CALCULATION_METHOD_LABELS_BN,
  toBanglaDigits,
} from '../services/prayerService';
import { localizeLocation } from '../data/cities';
import { validateBackupJson, type BackupValidationResult } from '../storage/backup';
import { useStudy } from '../context/StudyContext';
import { AVATAR_PRESETS, UserAvatar } from '../components/MosqueArtwork';
import { LocationPickerModal } from '../components/LocationPickerModal';
import { IslamicToolsModal, type IslamicToolKind } from '../components/IslamicToolsModal';
import { PWAInstallButton } from '../components/PWAInstallButton';
import type { CalculationMethodKey } from '../types/app';

export const ProfileSettingsPage: React.FC = () => {
  const {
    state,
    t,
    metrics,
    purityStreakDays,
    updateProfile,
    setLanguage,
    setTimeFormat,
    setDailyTaskGoal,
    setBottomNavOffset,
    resetTour,
    updatePrayerSettings,
    exportJsonBackup,
    restoreFromBackupState,
    resetAllLocalData,
    signOutLocal,
  } = useApp();
  const navigate = useNavigate();
  const { restoreStudyData } = useStudy();
  const isBn = state.preferences.language === 'bn';

  const [editOpen, setEditOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<IslamicToolKind>(null);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  const [nameInput, setNameInput] = useState(state.auth.account.name);
  const [avatarInput, setAvatarInput] = useState(state.auth.account.avatarId);
  const [customAvatar, setCustomAvatar] = useState<string | undefined>(
    state.auth.account.customAvatarDataUrl
  );
  const [goalInput, setGoalInput] = useState(state.preferences.dailyTaskGoal);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [restorePreview, setRestorePreview] = useState<BackupValidationResult | null>(null);

  const memberSinceLabel = new Date(state.auth.account.memberSince).toLocaleDateString(
    isBn ? 'bn-BD' : undefined,
    { month: 'long', year: 'numeric' }
  );

  const methodLabels = isBn ? CALCULATION_METHOD_LABELS_BN : CALCULATION_METHOD_LABELS;
  const localizedLoc = localizeLocation(state.location.city, state.location.country, isBn);

  const milestoneTargets = [
    { target: 7, label: isBn ? 'দিন' : 'days', value: metrics.longestStreakDays },
    { target: 30, label: isBn ? 'নামাজ' : 'prayers', value: metrics.totalPrayersChecked },
    { target: 100, label: isBn ? 'আমল' : 'tasks', value: metrics.totalTasksCompleted },
    { target: 365, label: isBn ? 'দিন' : 'days', value: metrics.totalActiveDays },
  ];

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCustomAvatar(reader.result);
        setAvatarInput('custom');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleBackupFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const validation = validateBackupJson(text);
      setRestorePreview(validation);
    } catch {
      setRestorePreview({
        valid: false,
        error: isBn
          ? 'নির্বাচিত ফাইলটি পড়া যায়নি। আপনার বিদ্যমান ডেটা সুরক্ষিত রয়েছে।'
          : 'Could not read the selected file. Existing data was not modified.',
      });
    }
  };

  const saveProfilePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: nameInput.trim() || state.auth.account.name,
      avatarId: avatarInput,
      customAvatarDataUrl: avatarInput === 'custom' ? customAvatar : undefined,
    });
    setDailyTaskGoal(goalInput);
    setEditOpen(false);
  };

  return (
    /* Reference Image C: Light neutral canvas with subtle organic lime-green ambient glow top-right */
    <div className="min-h-[100dvh] bg-[#F7F9F5] relative overflow-hidden px-4 sm:px-6 py-6">
      <div
        className="absolute -top-24 -right-24 w-80 h-80 rounded-full pointer-events-none opacity-55 blur-3xl"
        style={{ background: 'radial-gradient(circle, #C4F26E 0%, transparent 70%)' }}
      />

      <div className="relative z-10 max-w-4xl mx-auto space-y-5 pb-10">
        {/* Top Heading matching Reference Image C */}
        <div className="flex items-start justify-between gap-4 pt-2">
          <div>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#141517]">
              {t.profile}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {state.auth.account.name} ·{' '}
              {isBn ? `সদস্য ${memberSinceLabel} থেকে` : `member since ${memberSinceLabel}`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTool('reminders')}
            aria-label={isBn ? 'নোটিফিকেশন সেটিংস' : 'Notification preferences'}
            className="w-11 h-11 rounded-full bg-white/85 backdrop-blur border border-slate-200/80 flex items-center justify-center shadow-xs hover:bg-white cursor-pointer"
          >
            <Sun className="w-5 h-5 text-[#141517]" />
          </button>
        </div>

        {/* User Profile Card matching Reference Image C */}
        <div className="rounded-[28px] bg-white p-5 shadow-xs border border-slate-200/60 flex items-center gap-4">
          <UserAvatar
            avatarId={state.auth.account.avatarId}
            customAvatarDataUrl={state.auth.account.customAvatarDataUrl}
            name={state.auth.account.name}
            sizeClass="w-16 h-16"
          />
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold text-[#141517] truncate">
              {state.auth.account.name}
            </h2>
            <div className="text-xs text-slate-500 mt-0.5 tabular-nums">
              {state.auth.mode === 'local_account'
                ? state.auth.account.email
                : isBn
                ? 'গেস্ট মোড (শুধু এই ডিভাইসে)'
                : 'Guest Mode (Local Device Vault)'}{' '}
              ·{' '}
              {isBn
                ? `${toBanglaDigits(metrics.currentStreakDays)} দিনের স্ট্রিক`
                : `${metrics.currentStreakDays}-day streak`}
            </div>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#A3F01C] text-[#141517] text-[11px] font-extrabold tracking-wide">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>
                  {state.auth.mode === 'local_account'
                    ? isBn
                      ? 'লোকাল অ্যাকাউন্ট'
                      : 'LOCAL ACCOUNT'
                    : isBn
                    ? 'ডিভাইস ভল্ট'
                    : 'ON-DEVICE VAULT'}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* 3 Compact Stat Cards */}
        <div className="grid grid-cols-3 gap-2.5 relative items-center">
          <div className="rounded-[24px] bg-white p-4 shadow-xs border border-slate-200/60 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-[#141517] tabular-nums">
              {isBn ? toBanglaDigits(metrics.currentStreakDays) : metrics.currentStreakDays}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {isBn ? 'দিনের স্ট্রিক' : 'day streak'}
            </div>
          </div>
          <div className="rounded-[24px] bg-white p-4 shadow-xs border border-slate-200/60 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-[#141517] tabular-nums">
              {isBn ? toBanglaDigits(metrics.totalTasksCompleted) : metrics.totalTasksCompleted}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {isBn ? 'আমল সম্পন্ন' : 'tasks done'}
            </div>
          </div>
          <div className="rounded-[24px] bg-white p-4 shadow-xs border border-slate-200/60 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-[#141517] tabular-nums">
              {isBn ? toBanglaDigits(metrics.totalPrayersChecked) : metrics.totalPrayersChecked}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {isBn ? 'ওয়াক্ত নামাজ' : 'prayers logged'}
            </div>
          </div>
        </div>

        {/* Preferences Card */}
        <div className="rounded-[28px] bg-white p-5 shadow-xs border border-slate-200/60 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-slate-400">
              {isBn ? 'আপনার পছন্দ ও সেটিংস' : 'Your Preferences'}
            </span>
            <button
              type="button"
              onClick={() => {
                setNameInput(state.auth.account.name);
                setAvatarInput(state.auth.account.avatarId);
                setCustomAvatar(state.auth.account.customAvatarDataUrl);
                setGoalInput(state.preferences.dailyTaskGoal);
                setEditOpen(true);
              }}
              className="text-xs font-bold text-[#65A30D] hover:underline cursor-pointer"
            >
              {t.edit}
            </button>
          </div>

          <div className="divide-y divide-slate-100 text-sm">
            <div className="py-3 flex items-center justify-between gap-2">
              <span className="text-slate-600">{isBn ? 'অবস্থান (শহর)' : 'Location'}</span>
              <button
                type="button"
                onClick={() => setLocationOpen(true)}
                className="font-bold text-[#141517] hover:text-[#084B32] cursor-pointer"
              >
                {localizedLoc.city}, {localizedLoc.country}
              </button>
            </div>
            <div className="py-3 flex items-center justify-between gap-2">
              <span className="text-slate-600">{isBn ? 'ভাষা' : 'Language'}</span>
              <select
                value={state.preferences.language}
                onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
                className="font-bold text-[#141517] bg-slate-100 px-3 py-1 rounded-full text-xs"
              >
                <option value="bn">বাংলা</option>
                <option value="en">English</option>
                <option value="ar">العربية</option>
              </select>
            </div>
            <div className="py-3 flex items-center justify-between gap-2">
              <span className="text-slate-600">
                {isBn ? 'সময়ের ধরন' : 'Time Format'}
              </span>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-full">
                {(['12h', '24h'] as const).map((fmt) => {
                  const active = (state.preferences.timeFormat ?? '12h') === fmt;
                  return (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setTimeFormat(fmt)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                        active ? 'bg-[#084B32] text-white' : 'text-slate-600 hover:text-[#141517]'
                      }`}
                    >
                      {fmt === '12h'
                        ? isBn
                          ? '১২ ঘণ্টা (বাংলাদেশি)'
                          : '12h'
                        : isBn
                        ? '২৪ ঘণ্টা'
                        : '24h'}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="py-3 flex items-center justify-between gap-2">
              <span className="text-slate-600">
                {isBn ? 'নামাজের হিসাব পদ্ধতি' : 'Calculation Method'}
              </span>
              <span className="font-bold text-[#141517] text-xs text-right">
                {methodLabels[state.prayerSettings.method]}
              </span>
            </div>
            <div className="py-3 flex items-center justify-between gap-2">
              <span className="text-slate-600">{isBn ? 'আসর মাযহাব' : 'Asr Method'}</span>
              <span className="font-bold text-[#141517]">
                {isBn
                  ? state.prayerSettings.madhab === 'hanafi'
                    ? 'হানাফী'
                    : 'শাফেয়ী / সাধারণ'
                  : state.prayerSettings.madhab}
              </span>
            </div>
            <div className="py-3 flex items-center justify-between gap-2">
              <span className="text-slate-600">
                {isBn ? 'দৈনিক আমলের লক্ষ্য' : 'Daily Task Goal'}
              </span>
              <span className="font-bold text-[#141517] tabular-nums">
                {isBn
                  ? `প্রতিদিন ${toBanglaDigits(state.preferences.dailyTaskGoal)}টি আমল`
                  : `${state.preferences.dailyTaskGoal} tasks / day`}
              </span>
            </div>
          </div>

          {/* Mobile Bottom Nav Height Adjuster (for phones with Home/Back hardware or software buttons) */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Smartphone className="w-4 h-4 text-[#084B32] shrink-0" />
                <span className="text-xs font-bold text-[#141517]">
                  {isBn
                    ? 'মোবাইল নিচের নেভিগেশন বার উচ্চতা'
                    : 'Mobile Bottom Bar Offset'}
                </span>
              </div>
              <span className="text-xs font-extrabold text-[#084B32] tabular-nums">
                {isBn
                  ? `${toBanglaDigits(state.preferences.bottomNavOffset ?? 14)} px`
                  : `${state.preferences.bottomNavOffset ?? 14} px`}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={48}
              step={2}
              value={state.preferences.bottomNavOffset ?? 14}
              onChange={(e) => setBottomNavOffset(Number(e.target.value))}
              className="w-full accent-[#084B32] cursor-pointer"
              aria-label={isBn ? 'নিচের নেভিগেশন বার উচ্চতা' : 'Bottom navigation bar height'}
            />
            <p className="text-[11px] text-slate-500">
              {isBn
                ? 'আপনার ফোনে নিচে Home/Back বাটন থাকলে স্লাইডার বাড়িয়ে বারটি একটু উপরে তুলুন।'
                : 'Increase offset if your phone’s system Home/Back buttons sit near the bottom bar.'}
            </p>
          </div>
        </div>

        {/* Native App Install + Replay Feature Tour */}
        <PWAInstallButton variant="card" />

        <button
          type="button"
          onClick={() => {
            resetTour();
            navigate('/home');
          }}
          className="w-full rounded-[24px] bg-white hover:bg-emerald-50/70 border border-slate-200/80 p-4 flex items-center justify-between gap-3 shadow-xs cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-[#084B32]/10 text-[#084B32] flex items-center justify-center shrink-0">
              <HelpCircle className="w-5 h-5" />
            </span>
            <div className="text-left">
              <div className="text-sm font-bold text-[#141517]">
                {isBn ? 'অ্যাপ টিউটোরিয়াল আবার দেখুন' : 'Replay App Feature Tour'}
              </div>
              <div className="text-[11px] text-slate-500">
                {isBn
                  ? 'Safar-এর সব ফিচার ধাপে ধাপে জেনে নিন'
                  : 'Walk through every feature step by step'}
              </div>
            </div>
          </div>
          <span className="text-xs font-extrabold text-[#084B32]">→</span>
        </button>

        {/* Milestones Section */}
        <div className="rounded-[28px] bg-white p-5 shadow-xs border border-slate-200/60 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-slate-400">
              {t.milestones}
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/stats')}
                className="text-xs font-bold text-orange-600 inline-flex items-center gap-1 hover:underline cursor-pointer"
              >
                <Flame className="w-3.5 h-3.5" />
                <span>{isBn ? 'পরিসংখ্যান' : 'Stats'}</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/badges')}
                className="text-xs font-bold text-[#084B32] inline-flex items-center gap-1 hover:underline cursor-pointer"
              >
                <Award className="w-3.5 h-3.5" />
                <span>{isBn ? 'সব ব্যাজ' : 'All Badges'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 sm:gap-3 text-center">
            {milestoneTargets.map((m) => {
              const reached = m.value >= m.target;
              return (
                <button
                  key={`${m.target}-${m.label}`}
                  type="button"
                  onClick={() => navigate('/badges')}
                  className="flex flex-col items-center gap-1.5 cursor-pointer group"
                >
                  <div
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-base sm:text-lg font-extrabold tabular-nums transition-transform group-hover:scale-105 ${
                      reached
                        ? 'bg-[#A3F01C] text-[#141517] shadow-[0_6px_18px_rgba(163,240,28,0.45)]'
                        : 'bg-[#EEF1ED] text-slate-400'
                    }`}
                  >
                    {isBn ? toBanglaDigits(m.target) : m.target}
                  </div>
                  <span className="text-[11px] sm:text-xs font-medium text-slate-500">{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Purity & Self-Control Direct Access Card */}
        <button
          type="button"
          onClick={() => navigate('/purity')}
          className="w-full text-left rounded-[26px] bg-[#142018] text-white p-5 shadow-xs flex items-center justify-between gap-4 hover:bg-[#19281e] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <span className="w-11 h-11 rounded-2xl bg-[#A3F01C] text-[#141517] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#A3F01C]">{t.purityTitle}</div>
              <div className="text-base font-extrabold tabular-nums mt-0.5">
                {isBn
                  ? `${toBanglaDigits(purityStreakDays)} দিন পবিত্র · সর্বোচ্চ ${toBanglaDigits(
                      state.purityTracker.bestStreakDays
                    )} দিন`
                  : `${purityStreakDays} Clean Days · Best ${state.purityTracker.bestStreakDays}d`}
              </div>
            </div>
          </div>
          <span className="text-xs font-bold text-[#A3F01C] shrink-0">
            {isBn ? 'খুলুন →' : 'Open →'}
          </span>
        </button>

        {/* Local Storage & JSON Backup & Restore */}
        <div className="rounded-[28px] bg-white p-5 shadow-xs border border-slate-200/60 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-[#141517]">{t.backupRestore}</h2>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              {isBn
                ? 'আপনার আমল, নামাজের হিসাব, কুরআন বুকমার্ক, স্ট্রিক এবং ব্যাজ স্বয়ংক্রিয়ভাবে এই ডিভাইসে সংরক্ষিত থাকে। নিরাপদে রাখতে JSON ব্যাকআপ এক্সপোর্ট বা রিস্টোর করুন।'
                : 'Your tasks, prayer check-ins, Quran bookmarks, streaks, and badges are saved automatically on this device. Export a JSON backup to transfer or restore safely.'}
            </p>
            {state.preferences.lastBackupExportedAt && (
              <div className="text-[11px] text-[#084B32] font-semibold mt-1">
                {isBn ? 'সর্বশেষ ব্যাকআপ:' : 'Last backup exported:'}{' '}
                {new Date(state.preferences.lastBackupExportedAt).toLocaleString(
                  isBn ? 'bn-BD' : undefined
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={exportJsonBackup}
              className="h-12 rounded-2xl bg-[#142018] hover:bg-black text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#A3F01C]" />
              <span>{t.exportBackup}</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 text-[#141517] text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>{t.importBackup}</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              onChange={handleBackupFileSelected}
              className="hidden"
            />
          </div>

          {/* Account & Notification Quick Controls */}
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setActiveTool('reminders')}
              className="px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-[#141517] inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>{isBn ? 'নোটিফিকেশন' : 'Notifications'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setConfirmResetOpen(true)}
                className="px-4 py-2 rounded-full bg-rose-50 hover:bg-rose-100 text-xs font-semibold text-rose-700 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isBn ? 'ডেটা রিসেট' : 'Reset Data'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  signOutLocal();
                  navigate('/auth');
                }}
                className="px-4 py-2 rounded-full bg-slate-900 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t.signOut}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile & Preferences Modal */}
      {editOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={saveProfilePreferences}
            className="bg-white rounded-[28px] max-w-md w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#141517]">
                {isBn ? 'প্রোফাইল ও পছন্দ সম্পাদনা' : 'Edit Profile & Preferences'}
              </h2>
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                {isBn ? 'প্রদর্শিত নাম' : 'Display Name'}
              </label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="w-full h-11 px-4 rounded-2xl bg-slate-100 text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                {isBn ? 'অ্যাভাটার নির্বাচন করুন' : 'Avatar Style'}
              </label>
              <div className="flex items-center gap-2.5 flex-wrap">
                {AVATAR_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setAvatarInput(preset.id);
                      setCustomAvatar(undefined);
                    }}
                    className={`p-1 rounded-full border-2 cursor-pointer ${
                      avatarInput === preset.id ? 'border-[#084B32]' : 'border-transparent'
                    }`}
                  >
                    <UserAvatar avatarId={preset.id} name={nameInput || 'ন'} sizeClass="w-10 h-10" />
                  </button>
                ))}
                <label className="px-3 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-xs font-semibold cursor-pointer">
                  {isBn ? 'ছবি আপলোড' : 'Upload Photo'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                {isBn ? 'দৈনিক আমলের লক্ষ্য' : 'Daily Task Goal'}
              </label>
              <input
                type="number"
                min={1}
                max={25}
                value={goalInput}
                onChange={(e) => setGoalInput(Number(e.target.value) || 5)}
                className="w-full h-11 px-4 rounded-2xl bg-slate-100 text-sm tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                {isBn ? 'নামাজের হিসাব পদ্ধতি' : 'Prayer Calculation Method'}
              </label>
              <select
                value={state.prayerSettings.method}
                onChange={(e) =>
                  updatePrayerSettings({ method: e.target.value as CalculationMethodKey })
                }
                className="w-full h-11 px-3 rounded-2xl bg-slate-100 text-xs font-semibold"
              >
                {Object.entries(methodLabels).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full h-12 rounded-full bg-[#142018] text-white font-semibold text-sm cursor-pointer"
            >
              {t.save}
            </button>
          </form>
        </div>
      )}

      {/* Restore Backup Validation Modal */}
      {restorePreview && (
        <div
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-[28px] max-w-md w-full p-6 space-y-4 shadow-2xl">
            {restorePreview.valid && restorePreview.envelope && restorePreview.summary ? (
              <>
                <div className="flex items-center gap-3 text-[#084B32]">
                  <CheckCircle2 className="w-6 h-6 shrink-0" />
                  <h2 className="text-lg font-bold">
                    {isBn ? 'সঠিক ব্যাকআপ পাওয়া গেছে' : 'Valid Backup Ready to Restore'}
                  </h2>
                </div>
                <div className="rounded-2xl bg-[#F6F8F5] p-4 space-y-1.5 text-xs text-slate-700">
                  <div>
                    <span className="font-semibold">{isBn ? 'অ্যাকাউন্ট:' : 'Account:'}</span>{' '}
                    {restorePreview.summary.accountName}
                  </div>
                  <div>
                    <span className="font-semibold">{isBn ? 'আমল / কাজ:' : 'Tasks:'}</span>{' '}
                    {restorePreview.summary.tasksCount}
                  </div>
                  <div>
                    <span className="font-semibold">
                      {isBn ? 'নামাজের চেক-ইন:' : 'Prayer Check-ins:'}
                    </span>{' '}
                    {restorePreview.summary.prayersCheckedCount}
                  </div>
                  <div>
                    <span className="font-semibold">
                      {isBn ? 'কুরআন বুকমার্ক:' : 'Quran Bookmarks:'}
                    </span>{' '}
                    {restorePreview.summary.bookmarksCount}
                  </div>
                  <div>
                    <span className="font-semibold">
                      {isBn ? 'অর্জিত ব্যাজ:' : 'Earned Badges:'}
                    </span>{' '}
                    {restorePreview.summary.badgesCount}
                  </div>
                  {restorePreview.summary.studyChaptersCount !== undefined && (
                    <div>
                      <span className="font-semibold">
                        {isBn ? 'এসএসসি অধ্যায়:' : 'SSC Chapters:'}
                      </span>{' '}
                      {restorePreview.summary.studyChaptersCount}
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  {isBn
                    ? 'রিস্টোর করলে বর্তমান ডিভাইসের তথ্যগুলো এই ব্যাকআপ অনুযায়ী প্রতিস্থাপিত হবে।'
                    : 'Restoring will replace your current device records with this backup snapshot.'}
                </p>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setRestorePreview(null)}
                    className="flex-1 h-11 rounded-full bg-slate-100 text-xs font-bold cursor-pointer"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      restoreFromBackupState(restorePreview.envelope!.data);
                      if (restorePreview.envelope?.studyData) {
                        await restoreStudyData(restorePreview.envelope.studyData);
                      }
                      setRestorePreview(null);
                    }}
                    className="flex-1 h-11 rounded-full bg-[#084B32] text-white text-xs font-bold cursor-pointer"
                  >
                    {isBn ? 'রিস্টোর নিশ্চিত করুন' : 'Confirm Restore'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 text-rose-700">
                  <AlertTriangle className="w-6 h-6 shrink-0" />
                  <h2 className="text-lg font-bold">
                    {isBn ? 'অবৈধ ব্যাকআপ ফাইল' : 'Invalid Backup File'}
                  </h2>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {restorePreview.error}
                </p>
                <button
                  type="button"
                  onClick={() => setRestorePreview(null)}
                  className="w-full h-11 rounded-full bg-[#141517] text-white text-xs font-bold cursor-pointer"
                >
                  {isBn ? 'বন্ধ করুন (আগের ডেটা সুরক্ষিত)' : 'Close (Existing Data Safe)'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Confirm Reset Data Modal */}
      {confirmResetOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-[28px] max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <h2 className="text-lg font-bold text-[#141517]">
              {isBn ? 'লোকাল ডেটা রিসেট করবেন?' : 'Reset Local Data?'}
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              {isBn
                ? 'এতে এই ডিভাইসে সংরক্ষিত আপনার সব আমল, নামাজের হিসাব, কুরআন অগ্রগতি এবং ব্যাজ মুছে যাবে। চাইলে আগে একটি JSON ব্যাকআপ রেখে দিতে পারেন।'
                : 'This will clear all tasks, prayer logs, Quran progress, and earned badges stored on this device. Consider exporting a JSON backup first.'}
            </p>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmResetOpen(false)}
                className="flex-1 h-11 rounded-full bg-slate-100 text-xs font-bold cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={() => {
                  resetAllLocalData();
                  setConfirmResetOpen(false);
                }}
                className="flex-1 h-11 rounded-full bg-rose-600 text-white text-xs font-bold cursor-pointer"
              >
                {isBn ? 'এখনই রিসেট করুন' : 'Reset Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      <LocationPickerModal open={locationOpen} onClose={() => setLocationOpen(false)} />
      <IslamicToolsModal activeTool={activeTool} onClose={() => setActiveTool(null)} />
    </div>
  );
};
