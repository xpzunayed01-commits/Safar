import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Award,
  Check,
  CheckCircle2,
  Droplets,
  HeartHandshake,
  Lock,
  Play,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Square,
  Timer,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BADGE_CATALOG, type BadgeDefinition } from '../data/badges';
import { BadgeArtwork } from '../components/BadgeArtwork';
import { formatDateKey, toBanglaDigits } from '../services/prayerService';

const MILESTONE_TARGETS = [1, 3, 7, 14, 30, 60, 90];

const pad2 = (n: number) => String(Math.max(0, n)).padStart(2, '0');

export const PurityTrackerPage: React.FC = () => {
  const {
    state,
    t,
    metrics,
    purityStreakDays,
    startPurityStreak,
    stopPurityStreak,
    checkInPurityDay,
    resetPurityStreak,
    incrementTasbih,
  } = useApp();
  const navigate = useNavigate();
  const isBn = state.preferences.language === 'bn';

  const [now, setNow] = useState(() => new Date());
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [triggerNote, setTriggerNote] = useState('');
  const [checkedSteps, setCheckedSteps] = useState<Record<string, boolean>>({});
  const [inlineIstighfar, setInlineIstighfar] = useState(0);
  const [selectedBadge, setSelectedBadge] = useState<BadgeDefinition | null>(null);

  // Real-time 1-second timer tick
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const groundingSteps = useMemo(
    () => [
      {
        id: 'gaze',
        title: isBn
          ? 'দৃষ্টি নত করুন এবং প্রলুব্ধকর অ্যাপ বা স্ক্রিন সাথে সাথে বন্ধ করুন'
          : 'Lower your gaze & close triggering apps immediately',
      },
      {
        id: 'wudu',
        title: isBn
          ? 'ঠান্ডা পানি দিয়ে ওজু করুন এবং মানসিকভাবে রিসেট হোন'
          : 'Perform Wudu with cool water to reset focus',
      },
      {
        id: 'room',
        title: isBn
          ? 'দাঁড়িয়ে পড়ুন, ফোন রেখে খোলা জায়গায় বা পরিবারের কাছে যান'
          : 'Stand up, leave your phone, and move to an open room',
      },
      {
        id: 'salah',
        title: isBn
          ? '২ রাকাত নফল সালাত আদায় করুন অথবা সূরা মুলক / ইখলাস পড়ুন'
          : 'Pray 2 Rakahs of Salah or recite Surah Al-Mulk / Al-Ikhlas',
      },
    ],
    [isBn]
  );

  const todayKey = formatDateKey(now);
  const isCleanToday = Boolean(state.purityTracker.cleanDays[todayKey]);

  const liveDuration = useMemo(() => {
    if (!state.purityTracker.isActive || !state.purityTracker.streakStartedAt) {
      return { days: 0, hours: 0, mins: 0, secs: 0, totalMs: 0, exactDays: 0 };
    }
    const diffMs = Math.max(
      0,
      now.getTime() - new Date(state.purityTracker.streakStartedAt).getTime()
    );
    const totalSecs = Math.floor(diffMs / 1000);
    const timerDays = Math.floor(totalSecs / 86400);
    const days = Math.max(purityStreakDays, timerDays);
    const hours = Math.floor((totalSecs % 86400) / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    const exactDays = Math.max(purityStreakDays, diffMs / (1000 * 60 * 60 * 24));
    return { days, hours, mins, secs, totalMs: diffMs, exactDays };
  }, [state.purityTracker, now, purityStreakDays]);

  const nextMilestone = useMemo(
    () => MILESTONE_TARGETS.find((m) => m > liveDuration.days) ?? 180,
    [liveDuration.days]
  );

  const ringPct = useMemo(() => {
    if (!state.purityTracker.isActive) return 0;
    const pct = Math.round((liveDuration.exactDays / nextMilestone) * 100);
    return Math.min(100, Math.max(liveDuration.totalMs > 0 ? 2 : 0, pct));
  }, [state.purityTracker.isActive, liveDuration.exactDays, liveDuration.totalMs, nextMilestone]);

  const purityBadges = useMemo(
    () => BADGE_CATALOG.filter((b) => b.visualType === 'purity-shield'),
    []
  );

  const earnedPurityCount = useMemo(
    () => purityBadges.filter((b) => Boolean(state.earnedBadges[b.id])).length,
    [purityBadges, state.earnedBadges]
  );

  const nextPurityBadge = useMemo(
    () => purityBadges.find((b) => !state.earnedBadges[b.id]) ?? null,
    [purityBadges, state.earnedBadges]
  );

  const nextBadgeRemainingLabel = useMemo(() => {
    if (!nextPurityBadge) return '';
    if (nextPurityBadge.id === 'purity-covenant') {
      return isBn ? 'টাইমার শুরু করলেই আনলক হবে' : 'Unlocks as soon as timer starts';
    }
    if (!state.purityTracker.isActive || !state.purityTracker.streakStartedAt) {
      return isBn
        ? `${toBanglaDigits(nextPurityBadge.targetValue)} দিন লক্ষ্য`
        : `${nextPurityBadge.targetValue} day goal`;
    }
    const targetMs = nextPurityBadge.targetValue * 86400 * 1000;
    const remMs = Math.max(0, targetMs - liveDuration.totalMs);
    if (remMs === 0) {
      return isBn ? 'অর্জন প্রস্তুত!' : 'Ready to unlock!';
    }
    const remDays = Math.floor(remMs / 86400000);
    const remHours = Math.floor((remMs % 86400000) / 3600000);
    const remMins = Math.floor((remMs % 3600000) / 60000);
    if (remDays > 0) {
      return isBn
        ? `বাকি ${toBanglaDigits(remDays)} দিন ${toBanglaDigits(remHours)} ঘণ্টা`
        : `${remDays}d ${remHours}h remaining`;
    }
    return isBn
      ? `বাকি ${toBanglaDigits(remHours)} ঘণ্টা ${toBanglaDigits(remMins)} মি.`
      : `${remHours}h ${remMins}m remaining`;
  }, [nextPurityBadge, state.purityTracker, liveDuration.totalMs, isBn]);

  const last28Days = useMemo(() => {
    return Array.from({ length: 28 }).map((_, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() - (27 - i));
      const key = formatDateKey(d);
      const isClean = Boolean(state.purityTracker.cleanDays[key]);
      const hadReset = state.purityTracker.resetHistory.some((r) => r.date === key);
      return {
        key,
        dayNum: d.getDate(),
        isToday: key === todayKey,
        isClean,
        hadReset,
      };
    });
  }, [now, todayKey, state.purityTracker]);

  const handleConfirmReset = (e: React.FormEvent) => {
    e.preventDefault();
    resetPurityStreak(triggerNote);
    setTriggerNote('');
    setResetModalOpen(false);
  };

  const triggerPresets = isBn
    ? ['রাত জাগা ও ফোন', 'অলসতা / একাকিত্ব', 'দুশ্চিন্তা ও চাপ', 'সোশ্যাল মিডিয়া']
    : ['Late night phone', 'Boredom / Idle', 'Stress / Anxiety', 'Social media'];

  return (
    <div className="min-h-screen bg-[#F6F8F5] pb-14">
      {/* Deep Emerald Calm Header */}
      <div className="bg-gradient-to-b from-[#07432D] to-[#084B32] text-white px-4 sm:px-6 pt-5 pb-10 rounded-b-[32px] shadow-md">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white text-[#084B32] flex items-center justify-center shadow-xs cursor-pointer shrink-0"
            aria-label={isBn ? 'ফিরে যান' : 'Go back'}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="text-center min-w-0">
            <h1 className="text-base sm:text-lg font-extrabold tracking-tight truncate">
              {t.purityTitle}
            </h1>
            <p className="text-[11px] text-[#D9F275] font-medium">
              {isBn ? 'চারিত্রিক পবিত্রতা · দৃষ্টি সংযম ও তাযকিয়াহ' : 'Guarding Chastity · Lowering the Gaze'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/badges')}
            className="w-10 h-10 rounded-full bg-white/12 hover:bg-white/20 flex items-center justify-center shrink-0 cursor-pointer"
            aria-label={t.badges}
          >
            <Award className="w-5 h-5 text-[#D9F275]" />
          </button>
        </div>

        {/* Hero Progress Ring + Live Ticking Timer */}
        <div className="max-w-lg mx-auto mt-6 flex flex-col items-center text-center">
          <div className="relative w-44 h-44 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
              <circle
                cx="80"
                cy="80"
                r="68"
                fill="none"
                stroke="rgba(255,255,255,0.16)"
                strokeWidth="12"
              />
              <circle
                cx="80"
                cy="80"
                r="68"
                fill="none"
                stroke="#A3F01C"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={427.26}
                strokeDashoffset={427.26 - (427.26 * ringPct) / 100}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center px-3">
              {state.purityTracker.isActive && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#A3F01C] mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#A3F01C] animate-pulse" />
                  {isBn ? 'লাইভ টাইমার' : 'LIVE TIMER'}
                </span>
              )}
              <span className="text-5xl font-black tabular-nums leading-none">
                {isBn ? toBanglaDigits(liveDuration.days) : liveDuration.days}
              </span>
              <span className="text-xs font-bold text-[#D9F275] mt-1">
                {isBn ? 'পবিত্র দিন' : liveDuration.days === 1 ? 'Clean Day' : 'Clean Days'}
              </span>
            </div>
          </div>

          {/* 4-Box Live Countdown/Up Timer (Days : Hours : Mins : Secs) */}
          <div className="mt-4 w-full max-w-sm rounded-2xl bg-black/20 border border-white/12 p-3">
            <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-emerald-100/85 mb-2">
              <Timer className="w-3.5 h-3.5 text-[#A3F01C]" />
              <span>
                {state.purityTracker.isActive
                  ? isBn
                    ? 'অবিরাম পবিত্রতা টাইমার চলছে'
                    : 'Purity Streak Timer Running'
                  : isBn
                  ? 'টাইমার শুরু করতে নিচের বাটনে চাপ দিন'
                  : 'Press start below to begin your timer'}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { val: pad2(liveDuration.days), label: isBn ? 'দিন' : 'Days' },
                { val: pad2(liveDuration.hours), label: isBn ? 'ঘণ্টা' : 'Hours' },
                { val: pad2(liveDuration.mins), label: isBn ? 'মিনিট' : 'Mins' },
                { val: pad2(liveDuration.secs), label: isBn ? 'সেকেন্ড' : 'Secs' },
              ].map((slot) => (
                <div
                  key={slot.label}
                  className="rounded-xl bg-white/10 border border-white/10 py-2 px-1 text-center"
                >
                  <div className="text-xl sm:text-2xl font-black tabular-nums leading-none text-white">
                    {isBn ? toBanglaDigits(slot.val) : slot.val}
                  </div>
                  <div className="text-[10px] font-semibold text-[#D9F275] mt-1">
                    {slot.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5 w-full">
            {!state.purityTracker.isActive ? (
              <button
                type="button"
                onClick={startPurityStreak}
                className="h-12 px-7 rounded-full bg-[#A3F01C] hover:bg-[#b5f542] text-[#141517] font-extrabold text-sm shadow-lg flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{isBn ? 'পবিত্রতা টাইমার শুরু করুন' : 'Start Purity Timer'}</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => checkInPurityDay(todayKey)}
                  className={`h-11 px-5 rounded-full text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
                    isCleanToday
                      ? 'bg-[#A3F01C] text-[#141517] shadow-md'
                      : 'bg-white text-[#084B32] hover:bg-emerald-50'
                  }`}
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>
                    {isCleanToday
                      ? isBn
                        ? 'আজ পবিত্রতা রক্ষা হয়েছে ✓'
                        : 'Checked In Pure Today'
                      : isBn
                      ? 'আজ পবিত্র ছিলাম (চেক-ইন)'
                      : 'Check In Clean Today'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={stopPurityStreak}
                  className="h-11 px-4 rounded-full bg-rose-500/20 hover:bg-rose-500/35 border border-rose-300/30 text-rose-100 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>{isBn ? 'টাইমার বন্ধ করুন' : 'Stop Timer'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setResetModalOpen(true)}
                  className="h-11 px-4 rounded-full bg-white/12 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{isBn ? 'তাওবাহ ও রিসেট' : 'Reset'}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Cards */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 -mt-4 space-y-5">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="bg-white rounded-[22px] p-4 border border-slate-200/70 shadow-xs text-center">
            <div className="text-xl sm:text-2xl font-extrabold text-[#141517] tabular-nums">
              {isBn ? `${toBanglaDigits(liveDuration.days)} দিন` : `${liveDuration.days} d`}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {isBn ? 'বর্তমান স্ট্রিক' : 'Current Streak'}
            </div>
          </div>
          <div className="bg-white rounded-[22px] p-4 border border-slate-200/70 shadow-xs text-center">
            <div className="text-xl sm:text-2xl font-extrabold text-[#084B32] tabular-nums">
              {isBn
                ? `${toBanglaDigits(Math.max(state.purityTracker.bestStreakDays, liveDuration.days))} দিন`
                : `${Math.max(state.purityTracker.bestStreakDays, liveDuration.days)} d`}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {isBn ? 'সর্বোচ্চ স্ট্রিক' : 'Best Streak'}
            </div>
          </div>
          <div className="bg-white rounded-[22px] p-4 border border-slate-200/70 shadow-xs text-center">
            <div className="text-xl sm:text-2xl font-extrabold text-amber-600 tabular-nums">
              {isBn
                ? `${toBanglaDigits(earnedPurityCount)}/${toBanglaDigits(purityBadges.length)}`
                : `${earnedPurityCount}/${purityBadges.length}`}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {isBn ? 'পবিত্রতা অর্জন' : 'Achievements'}
            </div>
          </div>
        </div>

        {/* Purity & Self-Control Achievements Card */}
        <section className="bg-white rounded-[28px] p-5 border border-slate-200/70 shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-emerald-50 text-[#084B32] flex items-center justify-center">
                <Award className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-[#141517]">
                  {isBn ? 'পবিত্রতা অর্জন ও মাইলফলক ব্যাজ' : 'Purity Achievements & Badges'}
                </h2>
                <p className="text-[11px] text-slate-500 tabular-nums">
                  {isBn
                    ? `${toBanglaDigits(purityBadges.length)}টির মধ্যে ${toBanglaDigits(earnedPurityCount)}টি অর্জন আনলক হয়েছে`
                    : `${earnedPurityCount} of ${purityBadges.length} unlocked`}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/badges')}
              className="text-xs font-bold text-[#084B32] hover:underline shrink-0 cursor-pointer"
            >
              {isBn ? 'সব ব্যাজ →' : 'All Badges →'}
            </button>
          </div>

          {/* Next Achievement Progress Banner */}
          {nextPurityBadge && (
            <div className="rounded-2xl bg-[#142018] text-white p-4 flex items-center gap-3.5">
              <BadgeArtwork badge={nextPurityBadge} unlocked={false} size={54} isBn={isBn} />
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-[#A3F01C] truncate">
                    {isBn
                      ? `পরবর্তী অর্জন: ${nextPurityBadge.titleBn}`
                      : `Next: ${nextPurityBadge.title}`}
                  </span>
                  <span className="text-[11px] text-emerald-100/80 tabular-nums shrink-0">
                    {nextBadgeRemainingLabel}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-white/12 overflow-hidden">
                  <div
                    className="h-full bg-[#A3F01C] rounded-full transition-all"
                    style={{
                      width: `${
                        nextPurityBadge.id === 'purity-covenant'
                          ? state.purityTracker.isActive
                            ? 100
                            : 5
                          : Math.min(
                              100,
                              Math.max(
                                state.purityTracker.isActive ? 4 : 0,
                                Math.round(
                                  (liveDuration.exactDays / nextPurityBadge.targetValue) * 100
                                )
                              )
                            )
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Purity Badges Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {purityBadges.map((badge) => {
              const earned = state.earnedBadges[badge.id];
              const progressVal = badge.evaluateProgress(state, metrics);
              const pct = Math.min(100, Math.round((progressVal / badge.targetValue) * 100));
              return (
                <button
                  key={badge.id}
                  type="button"
                  onClick={() => setSelectedBadge(badge)}
                  className={`rounded-2xl p-3 border text-center flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    earned
                      ? 'bg-emerald-50/70 border-emerald-200 hover:border-[#084B32]/50 shadow-xs'
                      : 'bg-[#F8FAFC] border-slate-200/70 hover:border-slate-300'
                  }`}
                >
                  <BadgeArtwork badge={badge} unlocked={Boolean(earned)} size={60} isBn={isBn} />
                  <div className="text-xs font-bold text-[#141517] truncate w-full">
                    {isBn ? badge.titleBn : badge.title}
                  </div>
                  {earned ? (
                    <span className="text-[10px] font-extrabold text-[#084B32] bg-[#A3F01C]/45 px-2 py-0.5 rounded-full">
                      {isBn ? 'অর্জিত ✓' : 'Unlocked ✓'}
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-slate-500 tabular-nums">
                      {isBn ? `বাকি · ${toBanglaDigits(pct)}%` : `${pct}%`}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Authentic Quranic Reminder (Surah An-Nur 24:30) */}
        <div className="bg-[#FAF8F3] rounded-[26px] p-5 border border-amber-200/70 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>
              {isBn
                ? 'কুরআনের দিকনির্দেশনা · সূরা আন-নূর (২৪:৩০)'
                : 'Quranic Guidance · Surah An-Nur (24:30)'}
            </span>
          </div>
          <p className="font-arabic text-2xl text-right text-[#3B2106] leading-loose" dir="rtl">
            قُل لِّلْمُؤْمِنِينَ يَغُضُّوا۟ مِنْ أَبْصَٰرِهِمْ وَيَحْفَظُوا۟ فُرُوجَهُمْ ۚ ذَٰلِكَ أَزْكَىٰ لَهُمْ
          </p>
          <p className="text-xs text-slate-700 leading-relaxed">
            {isBn
              ? '“মুমিন পুরুষদের বলুন, তারা যেন তাদের দৃষ্টি নত রাখে এবং তাদের লজ্জাস্থানের হেফাজত করে। এটিই তাদের জন্য অধিক পবিত্র।”'
              : '"Tell the believing men to reduce [some] of their vision and guard their private parts. That is purer for them." — Saheeh International'}
          </p>
        </div>

        {/* Urgent Grounding Actions & Quick Istighfar */}
        <div className="bg-white rounded-[28px] p-5 border border-slate-200/70 shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-[#141517]">
                {isBn ? 'প্রলোভন এলে সাথে সাথে করণীয়' : 'If Temptation Strikes — Act Now'}
              </h2>
              <p className="text-xs text-slate-500">
                {isBn
                  ? 'শারীরিক ও আত্মিক পদক্ষেপের মাধ্যমে তাৎক্ষণিক নিয়ন্ত্রণ নিন'
                  : 'Break the habit loop immediately with physical & spiritual reset'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setInlineIstighfar((c) => c + 1);
                incrementTasbih();
              }}
              className="px-4 py-2 rounded-full bg-[#084B32] text-white text-xs font-bold shrink-0 active:scale-95 transition-transform cursor-pointer tabular-nums"
            >
              {isBn
                ? `আস্তাগফিরুল্লাহ (${toBanglaDigits(inlineIstighfar)})`
                : `Astaghfirullah (${inlineIstighfar})`}
            </button>
          </div>

          <div className="space-y-2">
            {groundingSteps.map((step) => {
              const checked = Boolean(checkedSteps[step.id]);
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() =>
                    setCheckedSteps((prev) => ({ ...prev, [step.id]: !prev[step.id] }))
                  }
                  className={`w-full p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-colors cursor-pointer ${
                    checked
                      ? 'bg-emerald-50 border-emerald-300 text-[#084B32]'
                      : 'bg-[#F8FAFC] border-slate-200/70 text-[#141517]'
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                      checked ? 'bg-[#084B32] text-white' : 'bg-white border border-slate-300'
                    }`}
                  >
                    {checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </span>
                  <span className="text-xs font-semibold">{step.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 28-Day Purity Calendar */}
        <div className="bg-white rounded-[28px] p-5 border border-slate-200/70 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Droplets className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-[#141517]">
                {isBn ? '২৮ দিনের পবিত্রতা লগ' : '28-Day Chastity Log'}
              </h2>
            </div>
            <span className="text-[11px] text-slate-500">
              {isBn ? 'যেকোনো দিন ট্যাপ করে চিহ্নিত করুন' : 'Tap any day to toggle'}
            </span>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {last28Days.map((day) => (
              <button
                key={day.key}
                type="button"
                onClick={() => checkInPurityDay(day.key)}
                className={`h-10 rounded-xl text-xs font-bold tabular-nums flex items-center justify-center border transition-all cursor-pointer ${
                  day.isClean
                    ? 'bg-[#084B32] text-white border-[#084B32]'
                    : day.hadReset
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : day.isToday
                    ? 'bg-emerald-50 text-[#084B32] border-emerald-300'
                    : 'bg-slate-50 text-slate-600 border-slate-200/70'
                }`}
              >
                {isBn ? toBanglaDigits(day.dayNum) : day.dayNum}
              </button>
            ))}
          </div>
        </div>

        {/* Recent Trigger Reflections (if any) */}
        {state.purityTracker.resetHistory.length > 0 && (
          <div className="bg-white rounded-[26px] p-5 border border-slate-200/70 shadow-xs space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
              <HeartHandshake className="w-4 h-4 text-[#084B32]" />
              <span>
                {isBn ? 'তাওবাহ ও আত্মসচেতনতা নোট' : 'Tawbah & Trigger Awareness Log'}
              </span>
            </div>
            <div className="space-y-2">
              {state.purityTracker.resetHistory.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="text-xs px-3.5 py-2.5 rounded-2xl bg-slate-50 flex items-center justify-between gap-2"
                >
                  <span className="text-slate-700">
                    {item.trigger ||
                      (isBn ? 'খাঁটি তাওবাহ ও নতুন সংকল্প' : 'Fresh restart with sincere Tawbah')}
                  </span>
                  <span className="text-[11px] text-slate-400 tabular-nums shrink-0">
                    {isBn ? toBanglaDigits(item.date) : item.date}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Achievement Detail Modal */}
      {selectedBadge && (
        <div
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white text-[#141517] rounded-[30px] max-w-sm w-full p-6 space-y-5 relative shadow-2xl border border-slate-200/70">
            <button
              type="button"
              onClick={() => setSelectedBadge(null)}
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center absolute top-4 right-4 cursor-pointer"
              aria-label={isBn ? 'বন্ধ করুন' : 'Close'}
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col items-center text-center pt-2 space-y-3">
              <BadgeArtwork
                badge={selectedBadge}
                unlocked={Boolean(state.earnedBadges[selectedBadge.id])}
                size={104}
                isBn={isBn}
              />
              <h3 className="text-xl font-extrabold">
                {isBn ? selectedBadge.titleBn : selectedBadge.title}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {isBn ? selectedBadge.descriptionBn : selectedBadge.description}
              </p>
            </div>

            {(() => {
              const earned = state.earnedBadges[selectedBadge.id];
              const progressVal = selectedBadge.evaluateProgress(state, metrics);
              const remaining = Math.max(0, selectedBadge.targetValue - progressVal);
              const pct = Math.min(100, Math.round((progressVal / selectedBadge.targetValue) * 100));
              return (
                <div className="rounded-2xl bg-[#F8FAFC] p-4 space-y-2.5 border border-slate-200/80">
                  <div className="flex items-center justify-between text-xs gap-2">
                    <span className="text-slate-500">{isBn ? 'শর্ত' : 'Condition'}</span>
                    <span className="font-bold text-[#141517] text-right">
                      {isBn ? selectedBadge.conditionLabelBn : selectedBadge.conditionLabel}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">{t.progress}</span>
                    <span className="font-bold tabular-nums text-[#084B32]">
                      {isBn
                        ? `${toBanglaDigits(Math.min(progressVal, selectedBadge.targetValue))} / ${toBanglaDigits(selectedBadge.targetValue)}`
                        : `${Math.min(progressVal, selectedBadge.targetValue)} / ${selectedBadge.targetValue}`}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full bg-[#084B32] rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  {earned ? (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#084B32] pt-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {isBn ? 'অর্জনের তারিখ:' : 'Earned on'}{' '}
                        {new Date(earned.earnedAt).toLocaleDateString(isBn ? 'bn-BD' : undefined)}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-1">
                      <Lock className="w-3.5 h-3.5" />
                      <span>
                        {selectedBadge.id === 'purity-covenant'
                          ? isBn
                            ? 'পবিত্রতা টাইমার শুরু করলেই আনলক হবে'
                            : 'Start the Purity timer to unlock'
                          : isBn
                          ? `আনলক করতে আরও ${toBanglaDigits(remaining)} দিন বাকি`
                          : `${remaining} more day(s) to unlock`}
                      </span>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Reset / Tawbah Modal */}
      {resetModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleConfirmReset}
            className="bg-white w-full sm:max-w-md rounded-t-[28px] sm:rounded-[28px] p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#141517]">
                {isBn ? 'খাঁটি তাওবাহ করে নতুন শুরু' : 'Restart with Sincere Tawbah'}
              </h2>
              <button
                type="button"
                onClick={() => setResetModalOpen(false)}
                className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {isBn
                ? 'আল্লাহর রহমত থেকে কখনো নিরাশ হবেন না। ভবিষ্যতে সতর্ক থাকতে কোন কারণে বিচ্যুতি ঘটেছে তা লিখে রাখতে পারেন (ঐচ্ছিক)।'
                : 'Do not despair of the mercy of Allah. Note what triggered the slip (optional) so you can guard against it next time.'}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {triggerPresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setTriggerNote(preset)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer ${
                    triggerNote === preset
                      ? 'bg-[#084B32] text-white border-[#084B32]'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={triggerNote}
              onChange={(e) => setTriggerNote(e.target.value)}
              placeholder={isBn ? 'কারণ বা নোট লিখুন (ঐচ্ছিক)...' : 'Optional trigger note...'}
              className="w-full h-11 px-4 rounded-2xl bg-slate-100 text-xs focus:outline-none"
            />
            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setResetModalOpen(false)}
                className="flex-1 h-11 rounded-full bg-slate-100 text-xs font-bold cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                className="flex-1 h-11 rounded-full bg-[#141517] text-white text-xs font-bold cursor-pointer"
              >
                {isBn ? 'নতুন করে শুরু করুন' : 'Restart Counter'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
