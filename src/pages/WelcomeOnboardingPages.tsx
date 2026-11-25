import React, { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, MotionConfig, motion, type PanInfo } from 'motion/react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  CalendarCheck2,
  Check,
  CheckCircle2,
  Clock,
  Globe,
  HardDriveDownload,
  LocateFixed,
  Lock,
  Search,
  ShieldCheck,
  Sparkles,
  Timer,
  Upload,
} from 'lucide-react';
import { APP_CONFIG, type SupportedLanguage } from '../config/app';
import { useApp } from '../context/AppContext';
import { useStudy } from '../context/StudyContext';
import { localizeLocation, PRESET_CITIES } from '../data/cities';
import { validateBackupJson, type BackupValidationResult } from '../storage/backup';
import { LocationPickerModal } from '../components/LocationPickerModal';
import {
  formatHijriDateLocalized,
  formatTimeDisplay,
  getNextPrayerInfo,
  PRAYER_NAME_BN,
  toBanglaDigits,
} from '../services/prayerService';

const BRAND_LOGO_DARK = '/assets/aistudio/6f7fdfc9-b075-47cb-82d6-43431092bd3b_c44308e1.png';
const BRAND_LOGO_WHITE = '/assets/aistudio/imgupscaler-enhanced__1_-Photoroom_04a70808.png';

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
    scale: 0.96,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
    scale: 0.96,
  }),
};

const bottomTextVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 32 : -32,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -32 : 32,
    opacity: 0,
  }),
};

export const WelcomePage: React.FC = () => {
  const { state } = useApp();
  const navigate = useNavigate();
  const isBn = state.preferences.language === 'bn';

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-[100dvh] bg-[#FAF8F3] relative overflow-hidden flex flex-col justify-between px-5 sm:px-8 py-7 max-w-md mx-auto">
        {/* Soft editorial ambient glow */}
        <div
          className="absolute -top-24 -right-20 w-72 h-72 rounded-full pointer-events-none opacity-45 blur-3xl"
          style={{ background: 'radial-gradient(circle, #D9F275 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-28 -left-24 w-64 h-64 rounded-full pointer-events-none opacity-35 blur-3xl"
          style={{ background: 'radial-gradient(circle, #FDE6BA 0%, transparent 70%)' }}
        />

        {/* Top Brand Logo (transparent, no box) */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="relative z-10 flex flex-col items-center justify-center gap-1.5 pt-2"
        >
          <img
            src={BRAND_LOGO_DARK}
            alt="Safar"
            loading="eager"
            decoding="sync"
            fetchPriority="high"
            className="h-12 sm:h-14 w-auto object-contain select-none"
          />
          <div className="text-[11px] font-semibold text-slate-500">
            {isBn ? 'ইসলামিক দৈনিক সঙ্গী ও সফর' : 'Islamic Daily Companion'}
          </div>
        </motion.div>

        {/* Staggered Tilted Bento Showcase */}
        <div className="relative z-10 my-auto py-5">
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="relative rounded-[32px] bg-white/85 backdrop-blur-md p-5 overflow-hidden border border-slate-200/70 shadow-[0_20px_50px_-20px_rgba(8,75,50,0.16)]"
          >
            <div className="grid grid-cols-2 gap-3 -rotate-4 scale-[0.98]">
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.45 }}
                className="rounded-[24px] bg-[#084B32] text-white p-4 shadow-md flex flex-col justify-between h-32"
              >
                <div className="flex items-center justify-between">
                  <Clock className="w-5 h-5 text-[#D9F275]" />
                  <span className="text-[10px] font-bold text-[#D9F275]/95">
                    {isBn ? 'সালাত' : 'Salah'}
                  </span>
                </div>
                <div>
                  <div className="text-[10px] text-emerald-100/75">
                    {isBn ? 'দৈনিক ৫ ওয়াক্ত' : '5 Daily Prayers'}
                  </div>
                  <div className="text-lg font-extrabold tabular-nums">
                    {isBn ? '৫× সালাত' : '5× Daily'}
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18, duration: 0.45 }}
                className="rounded-[24px] bg-gradient-to-br from-[#FDE6BA] to-[#F5BA63] text-[#3B2106] p-4 shadow-md flex flex-col justify-between h-32 translate-y-3"
              >
                <div className="flex items-center justify-between">
                  <BookOpen className="w-5 h-5 text-[#78350F]" />
                  <span className="text-[10px] font-bold text-[#78350F]">
                    {isBn ? 'কুরআন' : 'Quran'}
                  </span>
                </div>
                <div>
                  <div className="font-arabic text-xl font-bold leading-tight">القرآن</div>
                  <div className="text-[11px] font-bold text-[#78350F]/85">
                    {isBn ? '১১৪টি সূরা ও অর্থ' : '114 Surahs'}
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.26, duration: 0.45 }}
                className="rounded-[24px] bg-[#6E7BF2] text-white p-4 shadow-md flex flex-col justify-between h-32"
              >
                <div className="flex items-center justify-between">
                  <CalendarCheck2 className="w-5 h-5 text-white" />
                  <span className="text-[10px] font-bold text-indigo-100">
                    {isBn ? 'প্ল্যানার' : 'Planner'}
                  </span>
                </div>
                <div>
                  <div className="text-[10px] text-indigo-100">
                    {isBn ? 'অভ্যাস গঠন' : 'Habits'}
                  </div>
                  <div className="text-base font-extrabold">
                    {isBn ? 'দৈনিক আমল' : 'Daily Tasks'}
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 26 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.34, duration: 0.45 }}
                className="rounded-[24px] bg-[#142018] text-white p-4 shadow-md flex flex-col justify-between h-32 translate-y-3"
              >
                <div className="flex items-center justify-between">
                  <ShieldCheck className="w-5 h-5 text-[#A3F01C]" />
                  <span className="text-[10px] font-bold text-[#A3F01C]">
                    {isBn ? 'তাযকিয়াহ' : 'Tazkiyah'}
                  </span>
                </div>
                <div>
                  <div className="text-[10px] text-emerald-100/70">
                    {isBn ? 'আত্মনিয়ন্ত্রণ' : 'Self-Control'}
                  </div>
                  <div className="text-base font-extrabold">
                    {isBn ? 'পবিত্র থাকুন' : 'Stay Pure'}
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Centered Editorial Copy + Tactile CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="relative z-10 text-center space-y-5 pb-2"
        >
          <div className="space-y-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#084B32]/8 text-[#084B32] text-[11px] font-bold">
              <Sparkles className="w-3 h-3" />
              <span>{isBn ? 'আসসালামু আলাইকুম · স্বাগতম' : 'Assalamualaikum · Welcome'}</span>
            </span>
            <h1 className="text-[28px] sm:text-[32px] font-extrabold tracking-tight text-[#141517] leading-snug text-balance">
              {isBn
                ? 'প্রতিদিনের ইবাদত ও আত্মশুদ্ধির প্রশান্ত সঙ্গী'
                : `Welcome to ${APP_CONFIG.name}`}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xs mx-auto leading-relaxed">
              {isBn
                ? 'সঠিক নামাজের সময়সূচি, বাংলা অর্থসহ কুরআন তিলাওয়াত, দৈনিক আমলের প্ল্যানার এবং পবিত্র জীবনযাপনের নির্ভরযোগ্য সঙ্গী।'
                : 'Your private Islamic daily companion for Salah times, Quran reading, daily planning, and personal purity.'}
            </p>
          </div>

          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => navigate('/onboarding')}
              className="w-full h-14 rounded-full bg-[#084B32] hover:bg-[#063a26] text-white font-bold text-sm shadow-lg shadow-[#084B32]/20 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{isBn ? 'যাত্রা শুরু করুন' : 'Get Started'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => navigate('/auth')}
              className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-[#141517] transition-colors cursor-pointer"
            >
              {isBn ? 'আগে থেকেই অ্যাকাউন্ট আছে? সরাসরি প্রবেশ করুন' : 'Already set up? Sign in'}
            </button>
          </div>
        </motion.div>
      </div>
    </MotionConfig>
  );
};

export const OnboardingPage: React.FC = () => {
  const {
    state,
    prayerSchedule,
    setManualLocation,
    detectGeolocation,
    setLanguage,
    completeOnboarding,
  } = useApp();
  const navigate = useNavigate();
  const isBn = state.preferences.language === 'bn';

  const [[step, direction], setSlide] = useState<[number, number]>([0, 1]);
  const [geoMsg, setGeoMsg] = useState('');
  const [detecting, setDetecting] = useState(false);
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);

  const totalSlides = 4;

  const goToStep = (nextStep: number) => {
    if (nextStep === step || nextStep < 0 || nextStep >= totalSlides) return;
    setSlide([nextStep, nextStep > step ? 1 : -1]);
  };

  const handleSwipeEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    if (info.offset.x < -55 || info.velocity.x < -450) {
      if (step < totalSlides - 1) {
        goToStep(step + 1);
      }
    } else if (info.offset.x > 55 || info.velocity.x > 450) {
      if (step > 0) {
        goToStep(step - 1);
      }
    }
  };

  const nextPrayer = useMemo(
    () => getNextPrayerInfo(prayerSchedule, new Date()),
    [prayerSchedule]
  );

  const quickCities = useMemo(
    () =>
      ['Dhaka', 'Makkah', 'London', 'New York']
        .map((name) => PRESET_CITIES.find((c) => c.city === name))
        .filter(Boolean) as typeof PRESET_CITIES,
    []
  );

  const slidesMeta = useMemo(
    () => [
      {
        canvas: 'bg-gradient-to-b from-[#07432D] to-[#0A5A3C]',
        pill: 'bg-[#D9F275] text-[#084B32]',
        pillLabel: isBn ? 'ধাপ ১ · সালাত ও অবস্থান' : '01 · Salah & Location',
        title: isBn ? 'এক মুহূর্তও নামাজ মিস করবেন না' : 'Accurate Prayer Times for Your City',
        body: isBn
          ? 'আপনার শহরের সঠিক নামাজের সময়, কিবলার দিক এবং হিজরি তারিখ—ইন্টারনেট ছাড়াই আপনার হাতের নাগালে।'
          : 'Calculated astronomically on-device and synced when online—so your Salah schedule works even without internet.',
      },
      {
        canvas: 'bg-gradient-to-b from-[#16181D] to-[#232732]',
        pill: 'bg-[#FDE047] text-[#3B2106]',
        pillLabel: isBn ? 'ধাপ ২ · কুরআন ও দৈনিক আমল' : '02 · Quran & Daily Planner',
        title: isBn
          ? 'প্রতিদিন অল্প অল্প আমলে গড়ে তুলুন স্থায়ী অভ্যাস'
          : 'Plan Worship, Quran & Daily Habits',
        body: isBn
          ? 'বাংলা অর্থ ও অডিওসহ কুরআন তিলাওয়াত করুন, দৈনিক আমল সাজান এবং তাসবিহ ও মাসনুন দোয়ায় দিনটি বরকতময় রাখুন।'
          : 'Recite Quran with translations & audio, organize your daily worship tasks, and keep Tasbih & Duas close.',
      },
      {
        canvas: 'bg-gradient-to-b from-[#0E291E] to-[#142018]',
        pill: 'bg-[#A3F01C] text-[#141517]',
        pillLabel: isBn ? 'ধাপ ৩ · পবিত্রতা ও আত্মসংযম' : '03 · Purity & Self-Control',
        title: isBn
          ? 'মনের পবিত্রতা ও আত্মনিয়ন্ত্রণে অবিচল থাকুন'
          : 'Stay Pure & Master Self-Control',
        body: isBn
          ? 'লাইভ পবিত্রতা টাইমার, জরুরি মুহূর্তের তাৎক্ষণিক আমল এবং মাইলফলক ব্যাজ আপনাকে রাখবে দৃঢ় ও প্রশান্ত।'
          : 'Track your live Purity timer, follow urgent grounding steps, and unlock steadfastness achievements.',
      },
      {
        canvas: 'bg-gradient-to-b from-[#4F5BD5] to-[#6E7BF2]',
        pill: 'bg-white text-[#141517]',
        pillLabel: isBn ? 'ধাপ ৪ · সুরক্ষিত ডিভাইস ভল্ট' : '04 · Private Device Vault',
        title: isBn
          ? 'আপনার সব ইবাদতের তথ্য শুধু আপনারই'
          : '100% Stored Privately on Your Device',
        body: isBn
          ? 'কোনো বিজ্ঞাপন বা ট্র্যাকিং ছাড়াই সব তথ্য থাকবে আপনার ডিভাইসে। প্রয়োজনে এক ক্লিকেই JSON ব্যাকআপ সংরক্ষণ ও রিস্টোর করতে পারবেন।'
          : 'Everything auto-saves locally on your device. Export or restore a JSON backup file anytime with zero cloud lock-in.',
      },
    ],
    [isBn]
  );

  const slideTheme = slidesMeta[step];

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-[100dvh] bg-[#F6F8F5] flex items-center justify-center sm:p-6">
        <div
          className={`w-full max-w-md min-h-[100dvh] sm:min-h-[750px] sm:rounded-[38px] ${slideTheme.canvas} transition-colors duration-500 flex flex-col justify-between overflow-hidden shadow-2xl relative`}
        >
          {/* Top Bar: Animated Step Indicators + Skip */}
          <div className="px-6 pt-6 flex items-center justify-between gap-3 z-20">
            <div className="flex items-center gap-1.5" role="tablist" aria-label="Onboarding steps">
              {slidesMeta.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={i === step}
                  onClick={() => goToStep(i)}
                  aria-label={isBn ? `ধাপ ${i + 1}` : `Step ${i + 1}`}
                  className="py-1.5 px-0.5 cursor-pointer"
                >
                  <motion.span
                    layout
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    className={`block h-2 rounded-full ${
                      i === step ? 'w-7 bg-white shadow-xs' : i < step ? 'w-2.5 bg-white/70' : 'w-2 bg-white/30'
                    }`}
                  />
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-white/75 tabular-nums">
                {isBn
                  ? `${toBanglaDigits(step + 1)}/${toBanglaDigits(totalSlides)}`
                  : `${step + 1}/${totalSlides}`}
              </span>
              <button
                type="button"
                onClick={() => {
                  completeOnboarding();
                  navigate('/auth');
                }}
                className="text-xs font-bold text-white/90 hover:text-white px-3.5 py-1.5 rounded-full bg-white/12 hover:bg-white/20 backdrop-blur-sm transition-colors cursor-pointer"
              >
                {isBn ? 'এড়িয়ে যান' : 'Skip'}
              </button>
            </div>
          </div>

          {/* Horizontal Swipeable Visual Stage */}
          <div className="px-5 py-3 flex-1 flex flex-col justify-center overflow-hidden relative">
            {/* Onboarding White Transparent Brand Logo (no background box) */}
            <div className="flex justify-center mb-4">
              <img
                src={BRAND_LOGO_WHITE}
                alt="Safar"
                loading="eager"
                decoding="sync"
                fetchPriority="high"
                className="h-8 sm:h-9 w-auto object-contain select-none drop-shadow-xs"
              />
            </div>

            <AnimatePresence mode="wait" custom={direction} initial={false}>
              <motion.div
                key={step}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: 'spring', stiffness: 310, damping: 30 },
                  opacity: { duration: 0.22 },
                  scale: { duration: 0.25 },
                }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.22}
                onDragEnd={handleSwipeEnd}
                className="w-full cursor-grab active:cursor-grabbing touch-pan-y"
              >
                {step === 0 && (
                  <div className="space-y-3.5">
                    {/* Live Mini Prayer Card */}
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.08, duration: 0.35 }}
                      className="rounded-[26px] bg-white/12 backdrop-blur-md border border-white/18 p-4 text-white space-y-3 shadow-lg"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#D9F275] font-bold">
                          {(() => {
                            const loc = localizeLocation(
                              state.location.city,
                              state.location.country,
                              isBn
                            );
                            return `${loc.city}, ${loc.country}`;
                          })()}
                        </span>
                        <span className="tabular-nums text-white/80">
                          {formatHijriDateLocalized(prayerSchedule, isBn)}
                        </span>
                      </div>
                      <div className="flex items-end justify-between">
                        <div>
                          <div className="text-[11px] text-emerald-100/80 font-semibold">
                            {isBn
                              ? `পরবর্তী ওয়াক্ত: ${PRAYER_NAME_BN[nextPrayer.nextPrayer]}`
                              : `Next: ${nextPrayer.nextPrayer}`}
                          </div>
                          <div className="text-2xl sm:text-3xl font-extrabold tabular-nums">
                            {formatTimeDisplay(
                              nextPrayer.nextPrayerTime,
                              isBn,
                              state.preferences.timeFormat ?? '12h'
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[11px] text-emerald-100/80">
                            {isBn ? 'কিবলার দিক' : 'Qibla'}
                          </div>
                          <div className="text-base font-bold text-[#D9F275] tabular-nums">
                            {isBn
                              ? `${toBanglaDigits(prayerSchedule.qiblaDegrees)}° উ.`
                              : `${prayerSchedule.qiblaDegrees}° N`}
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    {/* Quick City Chips + Full Select + GPS */}
                    <motion.div
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.14, duration: 0.38 }}
                      onPointerDownCapture={(e) => e.stopPropagation()}
                      className="rounded-[26px] bg-white/95 p-4 text-[#141517] space-y-3 shadow-xl cursor-auto"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-600">
                          {isBn ? 'আপনার শহর বেছে নিন' : 'Choose Your City'}
                        </span>
                        <button
                          type="button"
                          disabled={detecting}
                          onClick={async () => {
                            setDetecting(true);
                            const res = await detectGeolocation();
                            setDetecting(false);
                            setGeoMsg(res.message);
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#084B32] bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-full cursor-pointer transition-colors"
                        >
                          <LocateFixed className="w-3 h-3" />
                          <span>
                            {detecting
                              ? isBn
                                ? 'খোঁজা হচ্ছে...'
                                : 'Detecting...'
                              : isBn
                              ? 'GPS দিয়ে খুঁজুন'
                              : 'Use GPS'}
                          </span>
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5">
                        {quickCities.map((c) => {
                          const active = c.city === state.location.city;
                          return (
                            <button
                              key={c.city}
                              type="button"
                              onClick={() => setManualLocation(c)}
                              className={`h-9 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer truncate ${
                                active
                                  ? 'bg-[#084B32] text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              }`}
                            >
                              {localizeLocation(c.city, c.country, isBn).city}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        type="button"
                        onClick={() => setLocationPickerOpen(true)}
                        className="w-full h-10 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-[#141517] flex items-center justify-between gap-2 cursor-pointer"
                      >
                        <span className="flex items-center gap-1.5 truncate">
                          <Search className="w-3.5 h-3.5 text-[#084B32] shrink-0" />
                          <span className="truncate">
                            {(() => {
                              const loc = localizeLocation(
                                state.location.city,
                                state.location.country,
                                isBn
                              );
                              return `${loc.city}, ${loc.country}`;
                            })()}
                          </span>
                        </span>
                        <span className="text-[11px] font-bold text-[#084B32] shrink-0">
                          {isBn ? 'বিশ্বব্যাপী খুঁজুন →' : 'Search World →'}
                        </span>
                      </button>
                      {geoMsg && <div className="text-[11px] text-slate-600">{geoMsg}</div>}
                    </motion.div>
                  </div>
                )}

                {step === 1 && (
                  <div className="space-y-3">
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.08, duration: 0.35 }}
                      className="rounded-[24px] p-4 text-[#141517] shadow-xl flex items-center justify-between gap-3"
                      style={{
                        background: 'linear-gradient(135deg, #FDE6BA 0%, #F5BA63 100%)',
                      }}
                    >
                      <div className="min-w-0">
                        <div className="text-[11px] font-bold text-[#78350F]">
                          {isBn ? 'দৈনিক আমল ও প্ল্যানার' : 'Daily Worship Planner'}
                        </div>
                        <div className="text-base font-extrabold truncate">
                          {isBn ? 'নিজের মতো আমল ও কাজের তালিকা সাজান' : 'Organize your own daily worship & tasks'}
                        </div>
                        <div className="text-[11px] text-[#78350F]/80 mt-0.5 tabular-nums">
                          {isBn ? 'রিয়েলটাইম প্রগ্রেস ও অ্যালার্ম সাপোর্ট' : 'Real-time tracking & reminders'}
                        </div>
                      </div>
                      <span className="w-10 h-10 rounded-full bg-white/85 flex items-center justify-center shrink-0 shadow-xs">
                        <Check className="w-4 h-4 text-[#141517] stroke-[3]" />
                      </span>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.14, duration: 0.35 }}
                      className="rounded-[24px] bg-white/10 backdrop-blur-md border border-white/15 p-4 text-white flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-10 h-10 rounded-2xl bg-[#FDE047]/15 text-[#FDE047] flex items-center justify-center shrink-0">
                          <BookOpen className="w-5 h-5" />
                        </span>
                        <div className="min-w-0">
                          <div className="text-sm font-extrabold truncate">
                            {isBn ? 'পবিত্র কুরআন (১১৪ সূরা)' : 'Holy Quran (114 Surahs)'}
                          </div>
                          <div className="text-[11px] text-slate-300 truncate">
                            {isBn ? 'বাংলা অনুবাদ, অডিও ও হিফজ ট্র্যাকার' : 'Translations, audio & memorization'}
                          </div>
                        </div>
                      </div>
                      <span className="font-arabic text-lg text-[#FDE047] shrink-0">اقرأ</span>
                    </motion.div>

                    {/* Language selector inside Onboarding */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2, duration: 0.35 }}
                      onPointerDownCapture={(e) => e.stopPropagation()}
                      className="rounded-[24px] bg-white/10 backdrop-blur-md border border-white/15 p-4 text-white space-y-2.5 cursor-auto"
                    >
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                        <Globe className="w-3.5 h-3.5 text-[#FDE047]" />
                        <span>{isBn ? 'অ্যাপের পছন্দের ভাষা' : 'App Language'}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {(
                          [
                            { code: 'bn', label: 'বাংলা' },
                            { code: 'en', label: 'English' },
                            { code: 'ar', label: 'العربية' },
                          ] as Array<{ code: SupportedLanguage; label: string }>
                        ).map((lang) => (
                          <button
                            key={lang.code}
                            type="button"
                            onClick={() => setLanguage(lang.code)}
                            className={`h-10 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              state.preferences.language === lang.code
                                ? 'bg-[#FDE047] text-[#141517] shadow-sm'
                                : 'bg-white/10 text-white hover:bg-white/20'
                            }`}
                          >
                            {lang.label}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-3.5">
                    {/* Purity Timer Preview Card */}
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.08, duration: 0.35 }}
                      className="rounded-[26px] bg-white/10 backdrop-blur-md border border-[#A3F01C]/30 p-5 text-white space-y-3 shadow-xl"
                    >
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#A3F01C]">
                          <Timer className="w-4 h-4" />
                          <span>{isBn ? 'লাইভ পবিত্রতা টাইমার' : 'Live Purity Timer'}</span>
                        </span>
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#A3F01C] text-[#141517]">
                          {isBn ? 'আত্মসংযম' : 'Self-Control'}
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-center">
                        {[
                          { v: isBn ? '০০' : '00', l: isBn ? 'দিন' : 'Days' },
                          { v: isBn ? '০০' : '00', l: isBn ? 'ঘণ্টা' : 'Hours' },
                          { v: isBn ? '০০' : '00', l: isBn ? 'মিনিট' : 'Mins' },
                          { v: isBn ? '০০' : '00', l: isBn ? 'সেকেন্ড' : 'Secs' },
                        ].map((box) => (
                          <div
                            key={box.l}
                            className="rounded-xl bg-black/25 border border-white/10 py-2"
                          >
                            <div className="text-lg font-black tabular-nums">{box.v}</div>
                            <div className="text-[10px] text-[#D9F275]">{box.l}</div>
                          </div>
                        ))}
                      </div>
                    </motion.div>

                    {/* Purity Achievements Preview */}
                    <motion.div
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.16, duration: 0.35 }}
                      className="rounded-[24px] bg-white/95 text-[#141517] p-4 shadow-xl space-y-2.5"
                    >
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="inline-flex items-center gap-1.5 text-[#084B32]">
                          <Award className="w-4 h-4" />
                          <span>{isBn ? 'পবিত্রতা অর্জন ও মাইলফলক' : 'Purity Achievements'}</span>
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {isBn ? '৮টি ধাপ' : '8 Milestones'}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        {[
                          { title: isBn ? '২৪ ঘণ্টা' : '24 Hours', badge: isBn ? '১ দিন' : '1 Day' },
                          { title: isBn ? 'সাপ্তাহিক ঢাল' : '7-Day Shield', badge: isBn ? '৭ দিন' : '7 Days' },
                          { title: isBn ? 'তাযকিয়াহ' : 'Tazkiyah', badge: isBn ? '৩০ দিন' : '30 Days' },
                        ].map((m) => (
                          <div
                            key={m.title}
                            className="rounded-2xl bg-emerald-50/80 border border-emerald-200/80 py-2.5 px-2"
                          >
                            <div className="text-xs font-extrabold text-[#084B32]">{m.badge}</div>
                            <div className="text-[10px] font-semibold text-slate-600 truncate mt-0.5">
                              {m.title}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </div>
                )}

                {step === 3 && (
                  <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08, duration: 0.35 }}
                    className="rounded-[28px] bg-white/15 backdrop-blur-md border border-white/25 p-5 text-white space-y-4 shadow-xl"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-white text-[#141517] flex items-center justify-center shadow-sm">
                        <Lock className="w-6 h-6 text-[#4F5BD5]" />
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-[11px] font-bold">
                        <HardDriveDownload className="w-3.5 h-3.5" />
                        <span>{isBn ? 'অফলাইন ও নিরাপদ' : 'Offline & Private'}</span>
                      </span>
                    </div>
                    <div className="space-y-2.5">
                      {(isBn
                        ? [
                            'আপনার সব আমল ও নামাজের তথ্য ডিভাইসেই স্বয়ংক্রিয়ভাবে সেভ থাকে',
                            'ইন্টারনেট ছাড়াও কুরআন, তাসবিহ ও নামাজের সময় কাজ করে',
                            'যেকোনো সময় পূর্ণ JSON ব্যাকআপ ডাউনলোড ও রিস্টোর করা যায়',
                            'কোনো বিজ্ঞাপন বা তৃতীয় পক্ষের ডেটা সংগ্রহ নেই',
                          ]
                        : [
                            'Automatic on-device persistence',
                            'Works offline for Prayer Times, Quran & Tasbih',
                            'Export & restore full JSON backups anytime',
                            'Zero cloud tracking or third-party ads',
                          ]
                      ).map((item, idx) => (
                        <motion.div
                          key={item}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.14 + idx * 0.06, duration: 0.28 }}
                          className="flex items-center gap-2.5 text-xs font-semibold leading-relaxed"
                        >
                          <span className="w-5 h-5 rounded-full bg-[#A3F01C] text-[#141517] flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </span>
                          <span>{item}</span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Subtle swipe hint on mobile */}
            <div className="text-center mt-3">
              <span className="text-[10px] font-medium text-white/55">
                {isBn ? '← সোয়াইপ করে অথবা বাটনে ট্যাপ করে এগিয়ে যান →' : '← Swipe or tap buttons to navigate →'}
              </span>
            </div>
          </div>

          {/* Crisp White Rounded Bottom Sheet */}
          <div className="bg-white text-[#141517] rounded-t-[34px] px-6 pt-6 pb-8 space-y-5 shadow-[0_-12px_40px_rgba(0,0,0,0.14)] z-20">
            <AnimatePresence mode="wait" custom={direction} initial={false}>
              <motion.div
                key={step}
                custom={direction}
                variants={bottomTextVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="space-y-2"
              >
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold ${slideTheme.pill}`}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>{slideTheme.pillLabel}</span>
                </span>
                <h1 className="text-2xl font-extrabold tracking-tight leading-snug text-balance">
                  {slideTheme.title}
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {slideTheme.body}
                </p>
              </motion.div>
            </AnimatePresence>

            <div className="flex items-center gap-2.5">
              {step > 0 && (
                <button
                  type="button"
                  onClick={() => goToStep(step - 1)}
                  aria-label={isBn ? 'পূর্ববর্তী ধাপ' : 'Previous slide'}
                  className="w-13 h-13 rounded-full bg-slate-100 hover:bg-slate-200 text-[#141517] flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (step < totalSlides - 1) {
                    goToStep(step + 1);
                  } else {
                    completeOnboarding();
                    navigate('/auth');
                  }
                }}
                className="flex-1 h-13 rounded-full bg-[#141517] hover:bg-black text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-transform active:scale-[0.98] cursor-pointer"
              >
                <span>
                  {step < totalSlides - 1
                    ? isBn
                      ? 'পরবর্তী ধাপ'
                      : 'Continue'
                    : isBn
                    ? 'শুরু করতে প্রস্তুত'
                    : 'Finish Setup'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        <LocationPickerModal
          open={locationPickerOpen}
          onClose={() => setLocationPickerOpen(false)}
        />
      </div>
    </MotionConfig>
  );
};

export const AuthPage: React.FC = () => {
  const {
    signInLocal,
    signUpLocal,
    resetPasswordLocal,
    restoreFromBackupState,
    state,
    t,
  } = useApp();
  const { restoreStudyData } = useStudy();
  const navigate = useNavigate();
  const isBn = state.preferences.language === 'bn';

  const [mode, setMode] = useState<'landing' | 'signin' | 'signup' | 'reset'>('landing');
  const [name, setName] = useState('');
  const [email, setEmail] = useState(state.auth.account.email || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [restorePreview, setRestorePreview] = useState<BackupValidationResult | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = await signInLocal(email, password);
    if (res.ok) {
      navigate('/home');
    } else {
      setError(res.error || (isBn ? 'সাইন ইন করা যায়নি।' : 'Unable to sign in.'));
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = await signUpLocal(name, email, password);
    if (res.ok) {
      navigate('/home');
    } else {
      setError(res.error || (isBn ? 'অ্যাকাউন্ট তৈরি করা যায়নি।' : 'Unable to create local account.'));
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    const res = await resetPasswordLocal(email, password);
    if (res.ok) {
      setInfo(isBn ? 'পাসওয়ার্ড আপডেট হয়েছে। এখন লগইন করতে পারেন।' : 'Password updated. You can now sign in.');
      setPassword('');
      setMode('signin');
    } else {
      setError(res.error || (isBn ? 'পাসওয়ার্ড রিসেট করা যায়নি।' : 'Could not reset password.'));
    }
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
          ? 'নির্বাচিত JSON ফাইলটি পড়া যায়নি।'
          : 'Could not read the selected JSON file.',
      });
    }
  };

  const confirmJsonRestoreAndEnter = async () => {
    if (!restorePreview?.valid || !restorePreview.envelope) return;
    restoreFromBackupState(restorePreview.envelope.data);
    if (restorePreview.envelope.studyData) {
      await restoreStudyData(restorePreview.envelope.studyData);
    }
    setRestorePreview(null);
    navigate('/home');
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-[100dvh] bg-white flex flex-col justify-between px-6 sm:px-8 py-8 max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="pt-4 space-y-4"
        >
          <div className="inline-block">
            <img
              src={BRAND_LOGO_DARK}
              alt="Safar"
              loading="eager"
              decoding="sync"
              fetchPriority="high"
              className="h-12 sm:h-14 w-auto object-contain select-none"
            />
          </div>
          <div className="font-arabic text-3xl font-bold text-[#141517] leading-relaxed" dir="rtl">
            رتب عباداتك بحرفية.
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#141517] leading-tight text-balance">
            {isBn ? 'শৃঙ্খলা ও প্রশান্তির সাথে সাজান প্রতিদিনের ইবাদত।' : 'Organize your worship with clarity.'}
          </h1>

          {/* Clear local-only device storage explanation */}
          <div className="rounded-2xl bg-emerald-50/90 border border-emerald-200/80 p-3.5 text-xs text-[#084B32] leading-relaxed flex items-start gap-2.5">
            <Lock className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <div className="font-extrabold">
                {isBn ? '১০০% লোকাল ডিভাইস অ্যাকাউন্ট' : '100% Local On-Device Account'}
              </div>
              <p className="mt-0.5 text-emerald-900/85">
                {isBn
                  ? 'এই অ্যাপের অ্যাকাউন্ট ও সব ডেটা সম্পূর্ণ লোকাল—শুধুমাত্র আপনার এই ডিভাইসেই সংরক্ষিত থাকে, কোনো অনলাইন সার্ভারে নয়। অন্য ডিভাইস বা ব্রাউজারে আগের অ্যাকাউন্ট আনতে লগইনের ভেতর থেকে JSON ফাইল আপলোড করুন।'
                  : 'All accounts and data stay strictly local on this device—never uploaded to any server. To restore an existing profile, upload your JSON backup inside Sign In.'}
              </p>
            </div>
          </div>
        </motion.div>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleBackupFileSelected}
          className="hidden"
        />

        {mode === 'landing' && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.35 }}
            className="space-y-3 pb-4 pt-4"
          >
            <button
              type="button"
              onClick={() => {
                setError('');
                setMode('signup');
              }}
              className="w-full h-14 rounded-full bg-[#084B32] hover:bg-[#063a26] text-white font-bold text-sm shadow-lg shadow-[#084B32]/20 transition-transform active:scale-[0.98] cursor-pointer"
            >
              {isBn ? 'লোকাল অ্যাকাউন্ট তৈরি করুন' : 'Create Local Account'}
            </button>

            <button
              type="button"
              onClick={() => {
                setError('');
                setMode('signin');
              }}
              className="w-full h-13 rounded-full bg-[#141517] hover:bg-black text-white font-bold text-sm transition-transform active:scale-[0.98] cursor-pointer"
            >
              {isBn ? 'লগইন করুন' : 'Sign In'}
            </button>
          </motion.div>
        )}

        {mode !== 'landing' && (
          <form
            onSubmit={
              mode === 'signin' ? handleSignIn : mode === 'signup' ? handleSignUp : handleReset
            }
            className="space-y-3.5 pb-4 pt-4"
          >
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-bold text-[#141517]">
                {mode === 'signin' && (isBn ? 'লগইন করুন (লোকাল ভল্ট)' : 'Sign In (Local Vault)')}
                {mode === 'signup' && (isBn ? 'লোকাল অ্যাকাউন্ট তৈরি করুন' : 'Create Local Account')}
                {mode === 'reset' && (isBn ? 'পাসওয়ার্ড রিসেট' : 'Reset Local Password')}
              </h2>
              <button
                type="button"
                onClick={() => setMode('landing')}
                className="text-xs font-bold text-slate-500 hover:text-[#141517] cursor-pointer px-2 py-1"
              >
                {isBn ? 'ফিরে যান' : 'Back'}
              </button>
            </div>

            {error && (
              <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-2xl px-3.5 py-2.5">
                {error}
              </div>
            )}
            {info && (
              <div className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-2xl px-3.5 py-2.5">
                {info}
              </div>
            )}

            {mode === 'signup' && (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={isBn ? 'আপনার পূর্ণ নাম' : 'Your Full Name'}
                required
                className="w-full h-12 px-4 rounded-2xl bg-[#F6F7FA] border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#141517]/20"
              />
            )}

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={isBn ? 'ইমেইল ঠিকানা' : 'Email address'}
              required
              className="w-full h-12 px-4 rounded-2xl bg-[#F6F7FA] border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#141517]/20"
            />

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={
                mode === 'reset'
                  ? isBn
                    ? 'নতুন পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)'
                    : 'New Password (min 6 chars)'
                  : isBn
                  ? 'পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)'
                  : 'Password (min 6 chars)'
              }
              required
              className="w-full h-12 px-4 rounded-2xl bg-[#F6F7FA] border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#141517]/20"
            />

            <button
              type="submit"
              className="w-full h-13 rounded-full bg-[#084B32] hover:bg-[#063a26] text-white font-bold text-sm cursor-pointer shadow-md"
            >
              {mode === 'signin' && (isBn ? 'লগইন করুন' : 'Sign In')}
              {mode === 'signup' && (isBn ? 'লোকাল অ্যাকাউন্ট তৈরি করুন' : 'Create Local Account')}
              {mode === 'reset' && (isBn ? 'পাসওয়ার্ড আপডেট করুন' : 'Update Password')}
            </button>

            {mode === 'signin' && (
              <>
                <div className="relative py-1 flex items-center justify-center">
                  <span className="border-t border-slate-200 w-full" />
                  <span className="px-3 bg-white text-[11px] font-semibold text-slate-400 shrink-0">
                    {isBn ? 'অথবা ব্যাকআপ থেকে ফিরুন' : 'Or restore from backup'}
                  </span>
                  <span className="border-t border-slate-200 w-full" />
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-12 rounded-full bg-[#F6F8F5] hover:bg-emerald-50 border border-emerald-200 text-[#084B32] font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>{isBn ? 'JSON ফাইল আপলোড করুন' : 'Upload JSON Backup File'}</span>
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setError('');
                      setMode('reset');
                    }}
                    className="text-xs font-semibold text-slate-500 hover:text-[#141517] cursor-pointer py-1"
                  >
                    {t.forgotPassword}
                  </button>
                </div>
              </>
            )}
          </form>
        )}

        {/* Restore Preview Modal inside Auth */}
        {restorePreview && (
          <div
            className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
          >
            <div className="bg-white rounded-[28px] max-w-sm w-full p-6 space-y-4 shadow-2xl">
              {restorePreview.valid && restorePreview.summary ? (
                <>
                  <div className="flex items-center gap-2.5 text-[#084B32]">
                    <CheckCircle2 className="w-6 h-6 shrink-0" />
                    <h3 className="text-base font-extrabold">
                      {isBn ? 'সঠিক JSON ব্যাকআপ পাওয়া গেছে' : 'Valid Backup Found'}
                    </h3>
                  </div>
                  <div className="rounded-2xl bg-[#F6F8F5] p-3.5 text-xs text-slate-700 space-y-1">
                    <div>
                      <span className="font-bold">{isBn ? 'অ্যাকাউন্ট:' : 'Account:'}</span>{' '}
                      {restorePreview.summary.accountName}
                    </div>
                    <div>
                      <span className="font-bold">{isBn ? 'আমল:' : 'Tasks:'}</span>{' '}
                      {toBanglaDigits(restorePreview.summary.tasksCount)}
                    </div>
                    <div>
                      <span className="font-bold">{isBn ? 'নামাজ:' : 'Prayers:'}</span>{' '}
                      {toBanglaDigits(restorePreview.summary.prayersCheckedCount)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setRestorePreview(null)}
                      className="flex-1 h-11 rounded-full bg-slate-100 text-xs font-bold cursor-pointer"
                    >
                      {t.cancel}
                    </button>
                    <button
                      type="button"
                      onClick={confirmJsonRestoreAndEnter}
                      className="flex-1 h-11 rounded-full bg-[#084B32] text-white text-xs font-bold cursor-pointer"
                    >
                      {isBn ? 'রিস্টোর ও লগইন' : 'Restore & Enter'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2.5 text-rose-700">
                    <AlertTriangle className="w-6 h-6 shrink-0" />
                    <h3 className="text-base font-extrabold">
                      {isBn ? 'অবৈধ JSON ফাইল' : 'Invalid JSON Backup'}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600">{restorePreview.error}</p>
                  <button
                    type="button"
                    onClick={() => setRestorePreview(null)}
                    className="w-full h-11 rounded-full bg-[#141517] text-white text-xs font-bold cursor-pointer"
                  >
                    {isBn ? 'বন্ধ করুন' : 'Close'}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </MotionConfig>
  );
};
