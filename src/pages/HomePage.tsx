import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Award,
  Bell,
  BookOpen,
  CalendarCheck2,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Compass,
  Flame,
  GraduationCap,
  HeartHandshake,
  MapPin,
  Moon,
  ShieldCheck,
  Sparkles,
  Square,
  Sun,
  Sunrise,
  Sunset,
  Volume2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useStudy } from '../context/StudyContext';
import {
  formatDateKey,
  formatHijriDateLocalized,
  formatTimeDisplay,
  getNextPrayerInfo,
  toBanglaDigits,
} from '../services/prayerService';
import { localizeLocation } from '../data/cities';
import { getSurahDisplayName } from '../data/surahMeta';
import { MosqueSilhouette, RamadanDomeIllustration } from '../components/MosqueArtwork';
import { TodaysTaskWidget } from '../components/TodaysTaskWidget';
import { LocationPickerModal } from '../components/LocationPickerModal';
import { TaskFormModal } from '../components/TaskFormModal';
import { IslamicToolsModal, type IslamicToolKind } from '../components/IslamicToolsModal';
import { PWAInstallButton } from '../components/PWAInstallButton';
import type { PrayerName } from '../types/app';

export const HomePage: React.FC = () => {
  const {
    state,
    t,
    metrics,
    prayerSchedule,
    purityStreakDays,
    startPurityStreak,
    stopPurityStreak,
    togglePrayerCheckIn,
    toggleTaskCompletion,
    toggleFastingDay,
    checkInPurityDay,
  } = useApp();
  const { studyData, metrics: studyMetrics } = useStudy();
  const navigate = useNavigate();
  const isBn = state.preferences.language === 'bn';
  const timeFmt = state.preferences.timeFormat ?? '12h';

  const [now, setNow] = useState(() => new Date());
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<IslamicToolKind>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const todayKey = formatDateKey(now);
  const nextInfo = getNextPrayerInfo(prayerSchedule, now);
  const todayCheckIns = state.prayerCheckIns[todayKey] ?? {
    fajr: false,
    dhuhr: false,
    asr: false,
    maghrib: false,
    isha: false,
  };
  const prayersDoneToday = Object.values(todayCheckIns).filter(Boolean).length;
  const isFastingToday = Boolean(state.fastingDays[todayKey]);
  const isPureToday = Boolean(state.purityTracker.cleanDays[todayKey]);

  const todaysTasks = state.tasks.filter(
    (task) => task.date === todayKey || task.repeat === 'daily'
  );
  const completedTasksToday = todaysTasks.filter((tk) =>
    tk.completedDates.includes(todayKey)
  ).length;
  const taskPctToday =
    todaysTasks.length === 0 ? 0 : Math.round((completedTasksToday / todaysTasks.length) * 100);

  const prayerLabels: Record<
    PrayerName,
    { label: string; short: string; time: Date; icon: React.FC<{ className?: string }> }
  > = {
    fajr: { label: t.fajr, short: isBn ? 'ফজর' : 'Fajr', time: prayerSchedule.times.fajr, icon: Sunrise },
    dhuhr: { label: t.dhuhr, short: isBn ? 'যোহর' : 'Dhuhr', time: prayerSchedule.times.dhuhr, icon: Sun },
    asr: { label: t.asr, short: isBn ? 'আসর' : 'Asr', time: prayerSchedule.times.asr, icon: Sun },
    maghrib: { label: t.maghrib, short: isBn ? 'মাগরিব' : 'Maghrib', time: prayerSchedule.times.maghrib, icon: Sunset },
    isha: { label: t.isha, short: isBn ? 'এশা' : 'Isha', time: prayerSchedule.times.isha, icon: Moon },
  };

  const localizedLoc = localizeLocation(state.location.city, state.location.country, isBn);
  const localizedHijri = formatHijriDateLocalized(prayerSchedule, isBn);
  const localizedLastSurah = getSurahDisplayName(
    state.quranProgress.lastRead.surahNumber,
    state.quranProgress.lastRead.surahName,
    isBn
  );

  const circularShortcuts = [
    { label: isBn ? 'নামাজ' : 'Prayer', icon: Clock, onClick: () => navigate('/prayers'), tint: 'bg-[#17704B]' },
    { label: isBn ? 'এসএসসি' : 'SSC Study', icon: GraduationCap, onClick: () => navigate('/ssc'), tint: 'bg-[#0B5E3F]' },
    { label: isBn ? 'পবিত্রতা' : 'Purity', icon: ShieldCheck, onClick: () => navigate('/purity'), tint: 'bg-[#1B6A4A]' },
    { label: isBn ? 'কিবলা' : 'Qibla', icon: Compass, onClick: () => setActiveTool('qibla'), tint: 'bg-[#17704B]' },
    { label: isBn ? 'তাসবিহ' : 'Tasbih', icon: Sparkles, onClick: () => setActiveTool('tasbih'), tint: 'bg-[#1B6A4A]' },
    { label: isBn ? 'দোয়া' : 'Duas', icon: Volume2, onClick: () => navigate('/duas'), tint: 'bg-[#17704B]' },
    { label: isBn ? 'স্ট্রিক' : 'Streak', icon: Flame, onClick: () => navigate('/stats'), tint: 'bg-[#1B6A4A]' },
    { label: isBn ? 'ব্যাজ' : 'Badges', icon: Award, onClick: () => navigate('/badges'), tint: 'bg-[#17704B]' },
  ];

  const deenShortcuts = [
    {
      label: isBn ? 'রিমাইন্ডার' : 'Reminder',
      icon: Bell,
      color: 'text-purple-700 bg-purple-100/80',
      onClick: () => setActiveTool('reminders'),
      tour: undefined,
    },
    {
      label: isBn ? 'পবিত্রতা' : 'Purity',
      icon: ShieldCheck,
      color: 'text-emerald-700 bg-emerald-100/80',
      onClick: () => navigate('/purity'),
      tour: undefined,
    },
    {
      label: isBn ? 'কুরআন' : 'Quran',
      icon: BookOpen,
      color: 'text-amber-700 bg-amber-100/80',
      onClick: () => navigate('/quran'),
      tour: 'quran-shortcut',
    },
    {
      label: isBn ? 'দোয়া ও যিকির' : 'Adhkar',
      icon: Sparkles,
      color: 'text-indigo-700 bg-indigo-100/80',
      onClick: () => navigate('/duas'),
      tour: 'duas-shortcut',
    },
    {
      label: isBn ? 'তাসবিহ' : 'Tasbih',
      icon: Moon,
      color: 'text-sky-700 bg-sky-100/80',
      onClick: () => setActiveTool('tasbih'),
      tour: undefined,
    },
    {
      label: isBn ? 'যাকাত' : 'Zakat',
      icon: HeartHandshake,
      color: 'text-rose-700 bg-rose-100/80',
      onClick: () => setActiveTool('zakat'),
      tour: undefined,
    },
  ];

  return (
    <div className="min-h-[100dvh] bg-[#FAF8F3]">
      {/* Reference Image D: Deep Emerald Forest Green Header */}
      <header className="bg-gradient-to-b from-[#07432D] to-[#095539] text-white px-4 sm:px-6 pt-5 pb-7 rounded-b-[32px] lg:rounded-none lg:rounded-b-[36px] shadow-md">
        <div className="flex items-center justify-between gap-3">
          <img
            src="/assets/aistudio/imgupscaler-enhanced__1_-Photoroom_04a70808.png"
            alt="Safar"
            loading="eager"
            decoding="sync"
            fetchPriority="high"
            className="h-11 sm:h-12 w-auto object-contain select-none"
          />

          <button
            type="button"
            onClick={() => setActiveTool('reminders')}
            aria-label={isBn ? 'রিমাইন্ডার ও নোটিফিকেশন' : 'Notification reminders'}
            className="w-11 h-11 rounded-full bg-white text-[#084B32] flex items-center justify-center shadow-sm relative hover:scale-105 transition-transform cursor-pointer shrink-0"
          >
            <Bell className="w-5 h-5" />
            {(state.notifications.prayers || state.notifications.tasks) && (
              <span className="w-2.5 h-2.5 rounded-full bg-[#FACC15] border-2 border-white absolute top-2 right-2" />
            )}
          </button>
        </div>

        <div className="mt-3.5 min-w-0">
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight truncate">
            {t.greeting}
          </h1>
          <div className="mt-1 flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/12 text-[#D9F275] tracking-wide">
              {state.auth.account.name}
            </span>
            <span className="text-[11px] text-emerald-100/80">
              · {now.toLocaleDateString(isBn ? 'bn-BD' : undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
          </div>
          <button
            type="button"
            data-tour="location-btn"
            onClick={() => setLocationModalOpen(true)}
            className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-[#D9F275] hover:underline cursor-pointer"
          >
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">
              {localizedLoc.city}, {localizedLoc.country}
            </span>
            <ChevronDown className="w-3.5 h-3.5 shrink-0" />
          </button>
        </div>

        {/* Circular shortcuts row matching Reference Image D */}
        <div className="mt-5 flex items-center gap-3 overflow-x-auto no-scrollbar pb-1">
          {circularShortcuts.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                onClick={item.onClick}
                className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer"
              >
                <div
                  className={`w-13 h-13 sm:w-14 sm:h-14 rounded-full ${item.tint} border-2 border-[#D9F275]/80 flex items-center justify-center text-white shadow-sm group-hover:bg-[#D9F275] group-hover:text-[#084B32] transition-colors`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-medium text-white/95 whitespace-nowrap">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Seasonal & Hijri Hero Banner (PRD 4.1) */}
        <div className="mt-5 rounded-[24px] bg-[#0B5E3F] border border-white/15 p-4 sm:p-5 flex items-center justify-between gap-3 overflow-hidden relative shadow-inner">
          <div className="space-y-2 z-10 min-w-0 flex-1">
            {prayerSchedule.isRamadan ? (
              <>
                <h2 className="text-base sm:text-lg font-extrabold text-white leading-tight">
                  {isBn ? 'রমজান মোবারক ✨' : 'Ramadan Mubarak ✨'}
                </h2>
                <p className="text-xs text-emerald-100/90 leading-relaxed">
                  {localizedHijri} · {isBn ? 'ইফতার:' : 'Iftar at'}{' '}
                  <span className="font-bold tabular-nums">
                    {formatTimeDisplay(prayerSchedule.times.maghrib, isBn, timeFmt)}
                  </span>
                </p>
              </>
            ) : (
              <>
                <h2 className="text-base sm:text-lg font-extrabold text-white leading-tight truncate">
                  {localizedHijri}
                </h2>
                <p className="text-xs text-emerald-100/90 leading-relaxed">
                  {isBn ? 'পরবর্তী ওয়াক্ত:' : 'Next:'}{' '}
                  <span className="font-bold text-[#D9F275]">
                    {prayerLabels[nextInfo.nextPrayer].label}
                  </span>{' '}
                  ·{' '}
                  <span className="tabular-nums font-semibold">
                    {isBn
                      ? `বাকি ${toBanglaDigits(nextInfo.remainingFormatted)}`
                      : `in ${nextInfo.remainingFormatted}`}
                  </span>
                </p>
              </>
            )}
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <button
                type="button"
                data-tour="prayer-schedule-btn"
                onClick={() => navigate('/prayers')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#22C55E] hover:bg-[#16A34A] text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
              >
                <span>{isBn ? 'নামাজের সময়সূচি' : 'Prayer Schedule'}</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/stats')}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-full bg-white/12 hover:bg-white/20 text-[#D9F275] text-xs font-bold transition-colors cursor-pointer tabular-nums"
              >
                <Flame className="w-3.5 h-3.5" />
                <span>
                  {isBn
                    ? `${toBanglaDigits(metrics.currentStreakDays)} দিনের স্ট্রিক`
                    : `${metrics.currentStreakDays} d streak`}
                </span>
              </button>
            </div>
          </div>
          <RamadanDomeIllustration className="w-24 h-20 sm:w-28 sm:h-24 shrink-0" />
        </div>
      </header>

      {/* Today's Spiritual Snapshot Strip */}
      <section className="px-4 sm:px-6 pt-5 space-y-3">
        <PWAInstallButton variant="card" />
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5">
          <button
            type="button"
            onClick={() => navigate('/prayers')}
            className="rounded-[22px] bg-white border border-slate-200/70 p-3.5 text-left shadow-xs hover:border-[#084B32]/40 transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="w-8 h-8 rounded-xl bg-emerald-50 text-[#084B32] flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </span>
              <span className="text-[11px] font-bold text-[#084B32] tabular-nums">
                {isBn ? `${toBanglaDigits(prayersDoneToday)}/৫` : `${prayersDoneToday}/5`}
              </span>
            </div>
            <div className="text-xs font-bold text-[#141517] mt-2 truncate">
              {isBn ? 'আজকের নামাজ' : 'Today Salah'}
            </div>
            <div className="text-[11px] text-slate-500 truncate">
              {isBn ? 'চেক-ইন করুন' : 'Tap to log'}
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate('/planner')}
            className="rounded-[22px] bg-white border border-slate-200/70 p-3.5 text-left shadow-xs hover:border-amber-400/60 transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <CalendarCheck2 className="w-4 h-4" />
              </span>
              <span className="text-[11px] font-bold text-amber-700 tabular-nums">
                {isBn ? `${toBanglaDigits(taskPctToday)}%` : `${taskPctToday}%`}
              </span>
            </div>
            <div className="text-xs font-bold text-[#141517] mt-2 truncate">
              {t.todayTask}
            </div>
            <div className="text-[11px] text-slate-500 truncate tabular-nums">
              {isBn
                ? `${toBanglaDigits(completedTasksToday)}/${toBanglaDigits(todaysTasks.length)} সম্পন্ন`
                : `${completedTasksToday}/${todaysTasks.length} done`}
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate('/purity')}
            className="rounded-[22px] bg-white border border-slate-200/70 p-3.5 text-left shadow-xs hover:border-[#084B32]/40 transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="w-8 h-8 rounded-xl bg-[#142018] text-[#A3F01C] flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </span>
              <span className="text-[11px] font-bold text-[#084B32] tabular-nums">
                {isBn ? `${toBanglaDigits(purityStreakDays)} দিন` : `${purityStreakDays} d`}
              </span>
            </div>
            <div className="text-xs font-bold text-[#141517] mt-2 truncate">
              {isBn ? 'পবিত্রতা ও সংযম' : 'Stay Pure'}
            </div>
            <div className="text-[11px] text-slate-500 truncate">
              {isPureToday
                ? isBn
                  ? 'আজ নিরাপদ ✓'
                  : 'Pure today ✓'
                : isBn
                ? 'চেক-ইন বাকি'
                : 'Check in'}
            </div>
          </button>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="px-4 sm:px-6 py-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left / Primary Column */}
        <div className="lg:col-span-7 space-y-5">
          {/* Reference Image F: Golden Banner with Mosque Silhouette & Remaining Time */}
          <section
            aria-label={isBn ? 'পরবর্তী নামাজের কাউন্টডাউন' : 'Next Prayer Countdown'}
            className="rounded-[28px] overflow-hidden shadow-xs border border-amber-200/70 relative"
            style={{
              background: 'linear-gradient(180deg, #FDE7BA 0%, #F7C778 52%, #FFFDF8 100%)',
            }}
          >
            <div className="px-4 sm:px-5 pt-5 pb-9 relative text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/10 text-[11px] font-bold text-amber-950/85">
                <span>
                  {t.nextPrayer}: {prayerLabels[nextInfo.nextPrayer].label}
                </span>
              </div>
              <div className="mt-2 text-4xl sm:text-5xl font-extrabold text-[#3B2106] tabular-nums tracking-tight">
                {formatTimeDisplay(nextInfo.nextPrayerTime, isBn, timeFmt)}
              </div>
              <div className="mt-1.5 flex items-center justify-center gap-2.5 text-xs font-semibold text-amber-950/80 flex-wrap">
                <span className="tabular-nums">
                  {t.remainingTime}:{' '}
                  {isBn ? toBanglaDigits(nextInfo.remainingFormatted) : nextInfo.remainingFormatted}
                </span>
                <span aria-hidden="true">·</span>
                <span>{localizedLoc.city}</span>
              </div>
              <MosqueSilhouette className="w-full h-18 text-white pointer-events-none mt-1 -mb-9" />
            </div>

            {/* Responsive 5 Prayer Quick Cards (safe on 360px mobile) */}
            <div className="bg-white/95 backdrop-blur-sm p-3.5 sm:p-4 border-t border-amber-100">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-[#141517]">{t.prayerTimes}</h2>
                <button
                  type="button"
                  onClick={() => navigate('/prayers')}
                  className="text-xs font-bold text-[#084B32] hover:underline cursor-pointer"
                >
                  {t.fullView} →
                </button>
              </div>
              <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                {(Object.keys(prayerLabels) as PrayerName[]).map((key) => {
                  const item = prayerLabels[key];
                  const Icon = item.icon;
                  const checked = todayCheckIns[key];
                  const isNext = nextInfo.nextPrayer === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => togglePrayerCheckIn(todayKey, key)}
                      className={`rounded-2xl px-1 py-2.5 sm:p-2.5 flex flex-col items-center gap-1 border transition-all cursor-pointer min-w-0 ${
                        checked
                          ? 'bg-[#084B32] text-white border-[#084B32] shadow-xs'
                          : isNext
                          ? 'bg-amber-50 border-amber-300 text-[#141517] shadow-xs'
                          : 'bg-[#FAF8F3] border-slate-200/70 text-[#141517] hover:bg-amber-50/50'
                      }`}
                    >
                      <Icon
                        className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                          checked ? 'text-[#D9F275]' : 'text-amber-600'
                        }`}
                      />
                      <span className="text-[10px] sm:text-[11px] font-bold truncate max-w-full">
                        {item.short}
                      </span>
                      <span className="text-[9.5px] sm:text-[10px] leading-tight text-center tabular-nums opacity-85">
                        {formatTimeDisplay(item.time, isBn, timeFmt)}
                      </span>
                      <span
                        className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center ${
                          checked ? 'bg-white/20' : 'bg-black/8'
                        }`}
                      >
                        {checked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Reference Image F: 6 Islamic Utility Shortcuts */}
          <section className="rounded-[26px] bg-white p-4 sm:p-5 border border-slate-200/70 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#141517]">
                {isBn ? 'দৈনিক ইসলামিক টুলস' : 'Islamic Tools'}
              </h2>
              <span className="text-[11px] text-slate-400 font-medium">
                {isBn ? 'অফলাইনেও ব্যবহারযোগ্য' : 'Works offline'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
              {deenShortcuts.map((sc) => {
                const Icon = sc.icon;
                return (
                  <button
                    key={sc.label}
                    type="button"
                    data-tour={sc.tour}
                    onClick={sc.onClick}
                    className="rounded-2xl p-3 bg-[#FAF8F3] hover:bg-amber-50/70 border border-transparent hover:border-amber-200/70 transition-all flex flex-col items-center gap-2 cursor-pointer min-h-[82px] justify-center"
                  >
                    <span
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${sc.color}`}
                    >
                      <Icon className="w-5 h-5" />
                    </span>
                    <span className="text-xs font-semibold text-[#141517] whitespace-nowrap">
                      {sc.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        {/* Right / Secondary Column */}
        <div className="lg:col-span-5 space-y-5">
          {/* Reference Image A: Today's Task Warm Amber/Orange Widget */}
          <div data-tour="planner-card">
            <TodaysTaskWidget
              tasks={todaysTasks}
              heading={t.todayTask}
              progressLabel={t.progress}
              emptyLabel={isBn ? 'আপনার প্রথম আমল যোগ করুন' : 'Add your first daily task'}
              isBn={isBn}
              onQuickAdd={() => setTaskModalOpen(true)}
              onToggleTask={(taskId) => toggleTaskCompletion(taskId, todayKey)}
              onOpenPlanner={() => navigate('/planner')}
            />
          </div>

          {/* SSC Examination Preparation Card */}
          <div
            data-tour="ssc-card"
            className="rounded-[26px] bg-gradient-to-br from-[#07432D] to-[#0A5A3C] text-white p-5 shadow-sm space-y-3.5 border border-emerald-800"
          >
            <div className="flex items-start justify-between gap-3">
              <button
                type="button"
                onClick={() => navigate('/ssc')}
                className="flex items-center gap-3.5 min-w-0 text-left cursor-pointer group flex-1"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#D9F275] text-[#084B32] flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-[#D9F275]">
                      {studyData.config.examTitle}
                    </span>
                    {studyMetrics.weakChaptersCount > 0 && (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-500/80 text-white">
                        {toBanglaDigits(studyMetrics.weakChaptersCount)}টি দুর্বল অধ্যায়
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-extrabold text-white mt-1 truncate group-hover:text-[#D9F275] transition-colors">
                    {isBn ? 'এসএসসি প্রস্তুতি ও লাইভ কাউন্টডাউন' : 'SSC Preparation & Countdown'}
                  </h3>
                  <div className="text-xs text-emerald-100/90 tabular-nums">
                    {isBn
                      ? `বাকি: ${toBanglaDigits(studyMetrics.daysRemaining)} দিন (${toBanglaDigits(studyMetrics.hoursRemaining)} ঘণ্টা)`
                      : `${studyMetrics.daysRemaining} days remaining`}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => navigate('/ssc')}
                aria-label={isBn ? 'এসএসসি স্টাডি হাবে যান' : 'Go to SSC Study'}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center shrink-0 cursor-pointer text-[#D9F275]"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Syllabus progress bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-emerald-100/90">
                  {isBn ? 'সিলেবাস সম্পন্নতা' : 'Syllabus Progress'}
                </span>
                <span className="text-[#D9F275] font-extrabold tabular-nums">
                  {toBanglaDigits(studyMetrics.overallCompletionPct)}% ({toBanglaDigits(studyMetrics.completedChapters)}/{toBanglaDigits(studyMetrics.totalChapters)} অধ্যায়)
                </span>
              </div>
              <div className="h-2 rounded-full bg-white/15 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#D9F275] to-[#22C55E] rounded-full transition-all duration-500"
                  style={{ width: `${studyMetrics.overallCompletionPct}%` }}
                />
              </div>
            </div>

            {/* Footer metrics & direct link */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/10">
              <div className="text-[11px] text-emerald-100/80 font-medium tabular-nums">
                {isBn
                  ? `CQ: ${toBanglaDigits(studyMetrics.totalCqSolved)}টি · MCQ: ${toBanglaDigits(studyMetrics.totalMcqSolved)}টি`
                  : `CQ: ${studyMetrics.totalCqSolved} · MCQ: ${studyMetrics.totalMcqSolved}`}
              </div>
              <button
                type="button"
                onClick={() => navigate('/ssc')}
                className="px-3.5 py-1.5 rounded-full bg-white text-[#084B32] hover:bg-[#D9F275] text-xs font-bold transition-colors cursor-pointer shrink-0"
              >
                {isBn ? 'স্টাডি হাব' : 'Study Hub'} →
              </button>
            </div>
          </div>

          {/* Purity & Self-Control (NoFap) Quick Action Card */}
          {(() => {
            const isActive = state.purityTracker.isActive && Boolean(state.purityTracker.streakStartedAt);
            const diffMs = isActive
              ? Math.max(0, now.getTime() - new Date(state.purityTracker.streakStartedAt!).getTime())
              : 0;
            const totalSecs = Math.floor(diffMs / 1000);
            const pDays = Math.max(purityStreakDays, Math.floor(totalSecs / 86400));
            const pHours = Math.floor((totalSecs % 86400) / 3600);
            const pMins = Math.floor((totalSecs % 3600) / 60);
            const pSecs = totalSecs % 60;
            const pad = (n: number) => String(n).padStart(2, '0');
            const purityBadgeCount = Object.keys(state.earnedBadges).filter((id) =>
              id.startsWith('purity-')
            ).length;

            return (
              <div
                data-tour="purity-card"
                className="rounded-[26px] bg-[#142018] text-white p-5 shadow-sm space-y-3.5 border border-emerald-950"
              >
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => navigate('/purity')}
                    className="flex items-center gap-3.5 min-w-0 text-left cursor-pointer group flex-1"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-[#A3F01C] text-[#141517] flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#A3F01C]">{t.purityTitle}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-emerald-100 tabular-nums">
                          {isBn
                            ? `অর্জন ${toBanglaDigits(purityBadgeCount)}/৮`
                            : `${purityBadgeCount}/8 badges`}
                        </span>
                      </div>
                      <div className="text-lg font-extrabold tabular-nums mt-0.5">
                        {isActive
                          ? isBn
                            ? `${toBanglaDigits(pad(pDays))} দিন : ${toBanglaDigits(pad(pHours))} ঘ. : ${toBanglaDigits(pad(pMins))} মি. : ${toBanglaDigits(pad(pSecs))} সে.`
                            : `${pad(pDays)}d : ${pad(pHours)}h : ${pad(pMins)}m : ${pad(pSecs)}s`
                          : isBn
                          ? 'টাইমার শুরু করার জন্য প্রস্তুত'
                          : 'Ready to start purity timer'}
                      </div>
                      <div className="text-[11px] text-slate-300 truncate group-hover:text-white transition-colors">
                        {isBn
                          ? 'টাইমার, পবিত্রতা অর্জন ও তাওবাহ গাইড খুলুন →'
                          : 'Open timer, achievements & grounding tools →'}
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate('/purity')}
                    aria-label={t.purityTitle}
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center shrink-0 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4 text-[#A3F01C]" />
                  </button>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                  {!isActive ? (
                    <button
                      type="button"
                      onClick={startPurityStreak}
                      className="flex-1 h-10 rounded-full bg-[#A3F01C] hover:bg-[#b6f640] text-[#141517] text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>{isBn ? '▶ পবিত্রতা টাইমার শুরু করুন' : '▶ Start Purity Timer'}</span>
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => checkInPurityDay(todayKey)}
                        className={`flex-1 h-10 px-3 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                          isPureToday
                            ? 'bg-[#A3F01C] text-[#141517]'
                            : 'bg-white/12 hover:bg-white/20 text-white'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
                        <span className="truncate">
                          {isPureToday
                            ? isBn
                              ? 'আজ পবিত্র ✓'
                              : 'Pure Today ✓'
                            : isBn
                            ? 'আজকের চেক-ইন'
                            : 'Check In Clean'}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={stopPurityStreak}
                        className="h-10 px-3.5 rounded-full bg-rose-500/20 hover:bg-rose-500/35 border border-rose-400/30 text-rose-100 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
                      >
                        <Square className="w-3 h-3 fill-current" />
                        <span>{isBn ? 'বন্ধ করুন' : 'Stop'}</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Reference Image D: Fasting Habit Tracker Card */}
          <div className="rounded-[24px] bg-white p-5 border border-slate-200/70 shadow-xs flex items-center justify-between gap-4">
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="text-sm font-bold text-[#141517]">
                {prayerSchedule.isRamadan
                  ? isBn
                    ? 'আজ কি রোজা রেখেছেন?'
                    : 'Do You Fast Today?'
                  : isBn
                  ? 'সুন্নাহ রোজা ট্র্যাকার'
                  : 'Sunnah Fasting Log'}
              </div>
              <p className="text-xs text-slate-500">
                {isFastingToday
                  ? isBn
                    ? 'আজকের রোজা সংরক্ষিত · আল্লাহ কবুল করুন।'
                    : 'Logged for today · May Allah accept your fast.'
                  : isBn
                  ? 'আজকের রোজা চিহ্নিত করতে ডানে ট্যাপ করুন।'
                  : 'Tap to log your fast for today.'}
              </p>
              <div className="flex items-center gap-3 pt-1">
                <span className="text-xs font-bold tabular-nums text-[#084B32] whitespace-nowrap">
                  {isBn
                    ? `${toBanglaDigits(metrics.totalFastingDays)} দিন`
                    : `${metrics.totalFastingDays} days`}
                </span>
                <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-[#22C55E] rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, Math.round((metrics.totalFastingDays / 30) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => toggleFastingDay(todayKey)}
              aria-label={isBn ? 'আজকের রোজা টগল করুন' : 'Toggle fasting today'}
              className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                isFastingToday
                  ? 'bg-[#22C55E] text-white shadow-md'
                  : 'bg-slate-100 text-slate-500 hover:bg-emerald-50 hover:text-[#084B32]'
              }`}
            >
              <Check className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>

          {/* Quran Last Read Shortcut Card */}
          <button
            type="button"
            onClick={() => navigate(`/quran/${state.quranProgress.lastRead.surahNumber}`)}
            className="w-full text-left rounded-[24px] p-5 relative overflow-hidden shadow-xs border border-amber-200/60 cursor-pointer group"
            style={{
              background: 'linear-gradient(135deg, #FDE6BA 0%, #F5BA63 100%)',
            }}
          >
            <div className="relative z-10 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-amber-950/75 uppercase">
                  {t.lastRead}
                </div>
                <div className="text-lg font-extrabold text-[#3B2106] mt-0.5 truncate">
                  {localizedLastSurah}
                </div>
                <div className="text-xs font-semibold text-amber-950/80 mt-0.5 tabular-nums">
                  {isBn
                    ? `আয়াত নং ${toBanglaDigits(state.quranProgress.lastRead.ayahNumber)} · তিলাওয়াত চালিয়ে যান →`
                    : `Ayah No: ${state.quranProgress.lastRead.ayahNumber} · Continue →`}
                </div>
              </div>
              <BookOpen className="w-8 h-8 text-[#3B2106]/80 group-hover:scale-110 transition-transform shrink-0" />
            </div>
          </button>
        </div>
      </div>

      <LocationPickerModal
        open={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
      />
      <TaskFormModal
        open={taskModalOpen}
        initialDate={todayKey}
        onClose={() => setTaskModalOpen(false)}
      />
      <IslamicToolsModal activeTool={activeTool} onClose={() => setActiveTool(null)} />
    </div>
  );
};
