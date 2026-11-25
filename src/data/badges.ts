import type { AppState } from '../types/app';

export type BadgeVisualType =
  | 'combo-circle'
  | 'hexagon'
  | 'starburst'
  | 'ribbon-medal'
  | 'crown-shield'
  | 'approved-seal'
  | 'purity-shield';

export interface BadgeDefinition {
  id: string;
  title: string;
  titleBn: string;
  description: string;
  descriptionBn: string;
  conditionLabel: string;
  conditionLabelBn: string;
  visualType: BadgeVisualType;
  labelTop?: string;
  labelMain: string;
  labelSub?: string;
  palette: 'blue' | 'crimson' | 'gold' | 'magenta' | 'mint' | 'cobalt' | 'orange' | 'charcoal' | 'bronze' | 'silver' | 'emerald';
  ribbonTag?: string;
  targetValue: number;
  evaluateProgress: (state: AppState, metrics: ComputedMetrics) => number;
}

export interface ComputedMetrics {
  totalTasksCompleted: number;
  totalCustomTasksCreated: number;
  totalPrayersChecked: number;
  totalFullPrayerDays: number;
  totalFastingDays: number;
  totalQuranAyahs: number;
  totalQuranMinutes: number;
  totalSurahsCompleted: number;
  totalBookmarks: number;
  currentStreakDays: number;
  longestStreakDays: number;
  totalActiveDays: number;
  totalActionsCombo: number;
  hasBackupExported: boolean;
  purityStarted: boolean;
  purityCurrentDays: number;
  purityBestDays: number;
}

export function computeUserMetrics(state: AppState): ComputedMetrics {
  const totalTasksCompleted = state.tasks.reduce(
    (sum, t) => sum + t.completedDates.length,
    0
  );
  const totalCustomTasksCreated = state.tasks.length;

  let totalPrayersChecked = 0;
  let totalFullPrayerDays = 0;
  for (const dayRecord of Object.values(state.prayerCheckIns)) {
    const count = Object.values(dayRecord).filter(Boolean).length;
    totalPrayersChecked += count;
    if (count === 5) totalFullPrayerDays += 1;
  }

  const totalFastingDays = Object.values(state.fastingDays).filter(Boolean).length;
  const totalQuranAyahs = state.quranProgress.sessions.reduce((s, r) => s + r.ayahsRead, 0);
  const totalQuranMinutes = Math.round(
    state.quranProgress.sessions.reduce((s, r) => s + r.durationSeconds, 0) / 60
  );
  const totalSurahsCompleted = state.quranProgress.completedSurahs.length;
  const totalBookmarks = state.quranProgress.bookmarks.length;

  // Determine active dates (at least 1 prayer check-in OR 1 task completed OR 1 Quran session)
  const activeDatesSet = new Set<string>();
  for (const [dateKey, rec] of Object.entries(state.prayerCheckIns)) {
    if (Object.values(rec).some(Boolean)) activeDatesSet.add(dateKey);
  }
  for (const task of state.tasks) {
    for (const d of task.completedDates) activeDatesSet.add(d);
  }
  for (const session of state.quranProgress.sessions) {
    activeDatesSet.add(session.date);
  }
  for (const [dateKey, fasting] of Object.entries(state.fastingDays)) {
    if (fasting) activeDatesSet.add(dateKey);
  }

  const sortedDates = Array.from(activeDatesSet).sort();
  let longestStreakDays = 0;
  let running = 0;
  let prevTime: number | null = null;

  for (const dateStr of sortedDates) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const t = new Date(y, m - 1, d).getTime();
    if (prevTime !== null && Math.round((t - prevTime) / (1000 * 60 * 60 * 24)) === 1) {
      running += 1;
    } else {
      running = 1;
    }
    if (running > longestStreakDays) longestStreakDays = running;
    prevTime = t;
  }

  // Current streak ending today or yesterday
  const today = new Date();
  const todayKey = toDateKey(today);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayKey = toDateKey(yesterday);

  let currentStreakDays = 0;
  if (activeDatesSet.has(todayKey) || activeDatesSet.has(yesterdayKey)) {
    const cursor = activeDatesSet.has(todayKey) ? new Date(today) : new Date(yesterday);
    while (activeDatesSet.has(toDateKey(cursor))) {
      currentStreakDays += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
  }

  const totalActionsCombo = totalTasksCompleted + totalPrayersChecked;

  // Purity & Self-Control metrics
  const purityStarted = Boolean(state.purityTracker?.isActive);
  let purityElapsedDays = 0;
  if (purityStarted && state.purityTracker?.streakStartedAt) {
    const startedMs = new Date(state.purityTracker.streakStartedAt).getTime();
    if (!Number.isNaN(startedMs)) {
      purityElapsedDays = Math.max(0, Math.floor((Date.now() - startedMs) / (1000 * 60 * 60 * 24)));
    }
  }
  const cleanCheckedCount = Object.values(state.purityTracker?.cleanDays ?? {}).filter(Boolean).length;
  const purityCurrentDays = purityStarted ? Math.max(purityElapsedDays, cleanCheckedCount) : 0;
  const purityBestDays = Math.max(state.purityTracker?.bestStreakDays ?? 0, purityCurrentDays);

  return {
    totalTasksCompleted,
    totalCustomTasksCreated,
    totalPrayersChecked,
    totalFullPrayerDays,
    totalFastingDays,
    totalQuranAyahs,
    totalQuranMinutes,
    totalSurahsCompleted,
    totalBookmarks,
    currentStreakDays,
    longestStreakDays,
    totalActiveDays: activeDatesSet.size,
    totalActionsCombo,
    hasBackupExported: Boolean(state.preferences.lastBackupExportedAt),
    purityStarted,
    purityCurrentDays,
    purityBestDays,
  };
}

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const BADGE_CATALOG: BadgeDefinition[] = [
  // Row 1: Blue Combo Circles (10, 20, 30, 50, 100) — Reference Image G Row 1
  {
    id: 'combo-10',
    title: 'Combo 10',
    titleBn: 'কম্বো ১০',
    description: 'Complete 10 combined daily worship tasks and prayer check-ins.',
    descriptionBn: 'দৈনিক আমল ও নামাজের চেক-ইন মিলিয়ে মোট ১০টি কাজ সম্পন্ন করুন।',
    conditionLabel: '10 tasks & prayer check-ins',
    conditionLabelBn: '১০টি আমল ও নামাজ চেক-ইন',
    visualType: 'combo-circle',
    labelTop: 'COMBO',
    labelMain: '10',
    palette: 'blue',
    targetValue: 10,
    evaluateProgress: (_, m) => m.totalActionsCombo,
  },
  {
    id: 'combo-20',
    title: 'Combo 20',
    titleBn: 'কম্বো ২০',
    description: 'Complete 20 combined daily worship tasks and prayer check-ins.',
    descriptionBn: 'দৈনিক আমল ও নামাজের চেক-ইন মিলিয়ে মোট ২০টি কাজ সম্পন্ন করুন।',
    conditionLabel: '20 tasks & prayer check-ins',
    conditionLabelBn: '২০টি আমল ও নামাজ চেক-ইন',
    visualType: 'combo-circle',
    labelTop: 'COMBO',
    labelMain: '20',
    palette: 'blue',
    targetValue: 20,
    evaluateProgress: (_, m) => m.totalActionsCombo,
  },
  {
    id: 'combo-30',
    title: 'Combo 30',
    titleBn: 'কম্বো ৩০',
    description: 'Complete 30 combined daily worship tasks and prayer check-ins.',
    descriptionBn: 'দৈনিক আমল ও নামাজের চেক-ইন মিলিয়ে মোট ৩০টি কাজ সম্পন্ন করুন।',
    conditionLabel: '30 tasks & prayer check-ins',
    conditionLabelBn: '৩০টি আমল ও নামাজ চেক-ইন',
    visualType: 'combo-circle',
    labelTop: 'COMBO',
    labelMain: '30',
    palette: 'blue',
    targetValue: 30,
    evaluateProgress: (_, m) => m.totalActionsCombo,
  },
  {
    id: 'combo-50',
    title: 'Combo 50',
    titleBn: 'কম্বো ৫০',
    description: 'Complete 50 combined daily worship tasks and prayer check-ins.',
    descriptionBn: 'দৈনিক আমল ও নামাজের চেক-ইন মিলিয়ে মোট ৫০টি কাজ সম্পন্ন করুন।',
    conditionLabel: '50 tasks & prayer check-ins',
    conditionLabelBn: '৫০টি আমল ও নামাজ চেক-ইন',
    visualType: 'combo-circle',
    labelTop: 'COMBO',
    labelMain: '50',
    palette: 'blue',
    targetValue: 50,
    evaluateProgress: (_, m) => m.totalActionsCombo,
  },
  {
    id: 'combo-100',
    title: 'Combo 100',
    titleBn: 'কম্বো ১০০',
    description: 'Complete 100 combined daily worship tasks and prayer check-ins.',
    descriptionBn: 'দৈনিক আমল ও নামাজের চেক-ইন মিলিয়ে মোট ১০০টি কাজ সম্পন্ন করুন।',
    conditionLabel: '100 tasks & prayer check-ins',
    conditionLabelBn: '১০০টি আমল ও নামাজ চেক-ইন',
    visualType: 'combo-circle',
    labelTop: 'COMBO',
    labelMain: '100',
    palette: 'blue',
    targetValue: 100,
    evaluateProgress: (_, m) => m.totalActionsCombo,
  },

  // Row 2: Colorful Hexagons — Reference Image G Row 2
  {
    id: 'hex-streak-7',
    title: '7-Day Istiqamah',
    titleBn: '৭ দিনের ইস্তিকামাহ',
    description: 'Maintain an active daily worship streak for 7 consecutive days.',
    descriptionBn: 'টানা ৭ দিন নিয়মিত ইবাদত ও দৈনিক আমলের স্ট্রিক ধরে রাখুন।',
    conditionLabel: '7 consecutive active days',
    conditionLabelBn: 'টানা ৭ দিন সক্রিয় আমল',
    visualType: 'hexagon',
    labelMain: 'flame',
    palette: 'crimson',
    targetValue: 7,
    evaluateProgress: (_, m) => m.longestStreakDays,
  },
  {
    id: 'hex-charity',
    title: 'Generous Heart',
    titleBn: 'উদার হৃদয়',
    description: 'Complete 3 charity or kindness tasks in your Daily Planner.',
    descriptionBn: 'দৈনিক প্ল্যানারে দান-সদকা বা কল্যাণমূলক ৩টি কাজ সম্পন্ন করুন।',
    conditionLabel: '3 charity tasks completed',
    conditionLabelBn: '৩টি দান-সদকা আমল সম্পন্ন',
    visualType: 'hexagon',
    labelMain: 'charity',
    palette: 'gold',
    targetValue: 3,
    evaluateProgress: (s) =>
      s.tasks
        .filter((t) => t.category === 'charity')
        .reduce((acc, t) => acc + t.completedDates.length, 0),
  },
  {
    id: 'hex-full-day-x2',
    title: 'Five Daily Pillars',
    titleBn: 'পাঁচ ওয়াক্ত পূর্ণতা',
    description: 'Check in all 5 daily Salah prayers on 2 different days.',
    descriptionBn: 'অন্তত ২টি ভিন্ন দিনে ৫ ওয়াক্ত নামাজই সম্পূর্ণ চেক-ইন করুন।',
    conditionLabel: 'All 5 prayers checked on 2 days',
    conditionLabelBn: '২ দিন পূর্ণ ৫ ওয়াক্ত নামাজ',
    visualType: 'hexagon',
    labelMain: 'star',
    palette: 'magenta',
    ribbonTag: 'X2',
    targetValue: 2,
    evaluateProgress: (_, m) => m.totalFullPrayerDays,
  },
  {
    id: 'hex-fasting',
    title: 'Fasting Devotion',
    titleBn: 'সিয়াম সাধনা',
    description: 'Log 3 fasting days (Ramadan or Sunnah fasting) in the tracker.',
    descriptionBn: 'ট্র্যাকারে অন্তত ৩ দিন রমজান বা সুন্নাহ রোজা সংরক্ষণ করুন।',
    conditionLabel: '3 fasting days logged',
    conditionLabelBn: '৩ দিনের রোজা সংরক্ষিত',
    visualType: 'hexagon',
    labelMain: 'droplet',
    palette: 'mint',
    targetValue: 3,
    evaluateProgress: (_, m) => m.totalFastingDays,
  },
  {
    id: 'hex-quran-timer',
    title: 'Focused Reader',
    titleBn: 'মনোযোগী কুরআন পাঠক',
    description: 'Record 15 real minutes of Quran recitation using the reading timer.',
    descriptionBn: 'কুরআন রিডার টাইমারের মাধ্যমে মোট ১৫ মিনিট তিলাওয়াত সংরক্ষণ করুন।',
    conditionLabel: '15 Quran reading minutes',
    conditionLabelBn: '১৫ মিনিট কুরআন তিলাওয়াত',
    visualType: 'hexagon',
    labelMain: 'timer',
    palette: 'cobalt',
    ribbonTag: 'X5',
    targetValue: 15,
    evaluateProgress: (_, m) => m.totalQuranMinutes,
  },

  // Row 3: Orange Starburst & Dark Ribbon Medals — Reference Image G Row 3
  {
    id: 'star-prayer-10',
    title: '10 Prayers Logged',
    titleBn: '১০ ওয়াক্ত নামাজ',
    description: 'Mark 10 daily prayers as prayed in your Prayer Time tracker.',
    descriptionBn: 'নামাজের সময়সূচিতে মোট ১০ ওয়াক্ত নামাজ পড়া হিসেবে চিহ্নিত করুন।',
    conditionLabel: '10 prayer check-ins',
    conditionLabelBn: '১০ ওয়াক্ত নামাজ চেক-ইন',
    visualType: 'starburst',
    labelMain: '10',
    labelSub: 'COMBO',
    palette: 'orange',
    targetValue: 10,
    evaluateProgress: (_, m) => m.totalPrayersChecked,
  },
  {
    id: 'star-prayer-20',
    title: '20 Prayers Logged',
    titleBn: '২০ ওয়াক্ত নামাজ',
    description: 'Mark 20 daily prayers as prayed in your Prayer Time tracker.',
    descriptionBn: 'নামাজের সময়সূচিতে মোট ২০ ওয়াক্ত নামাজ পড়া হিসেবে চিহ্নিত করুন।',
    conditionLabel: '20 prayer check-ins',
    conditionLabelBn: '২০ ওয়াক্ত নামাজ চেক-ইন',
    visualType: 'starburst',
    labelMain: '20',
    labelSub: 'COMBO',
    palette: 'orange',
    targetValue: 20,
    evaluateProgress: (_, m) => m.totalPrayersChecked,
  },
  {
    id: 'star-prayer-50',
    title: '50 Prayers Logged',
    titleBn: '৫০ ওয়াক্ত নামাজ',
    description: 'Mark 50 daily prayers as prayed in your Prayer Time tracker.',
    descriptionBn: 'নামাজের সময়সূচিতে মোট ৫০ ওয়াক্ত নামাজ পড়া হিসেবে চিহ্নিত করুন।',
    conditionLabel: '50 prayer check-ins',
    conditionLabelBn: '৫০ ওয়াক্ত নামাজ চেক-ইন',
    visualType: 'starburst',
    labelMain: '50',
    labelSub: 'COMBO',
    palette: 'orange',
    targetValue: 50,
    evaluateProgress: (_, m) => m.totalPrayersChecked,
  },
  {
    id: 'ribbon-quran-10',
    title: '10 Ayahs Reflected',
    titleBn: '১০ আয়াত তিলাওয়াত',
    description: 'Read and log 10 Ayahs in the Quran Reader.',
    descriptionBn: 'কুরআন রিডারে ১০টি আয়াত তিলাওয়াত ও সংরক্ষণ করুন।',
    conditionLabel: '10 Quran Ayahs read',
    conditionLabelBn: '১০টি আয়াত পঠিত',
    visualType: 'ribbon-medal',
    labelMain: '10',
    labelSub: 'AYAH',
    palette: 'charcoal',
    targetValue: 10,
    evaluateProgress: (_, m) => m.totalQuranAyahs,
  },
  {
    id: 'ribbon-quran-50',
    title: '50 Ayahs Reflected',
    titleBn: '৫০ আয়াত তিলাওয়াত',
    description: 'Read and log 50 Ayahs in the Quran Reader.',
    descriptionBn: 'কুরআন রিডারে ৫০টি আয়াত তিলাওয়াত ও সংরক্ষণ করুন।',
    conditionLabel: '50 Quran Ayahs read',
    conditionLabelBn: '৫০টি আয়াত পঠিত',
    visualType: 'ribbon-medal',
    labelMain: '50',
    labelSub: 'AYAH',
    palette: 'charcoal',
    targetValue: 50,
    evaluateProgress: (_, m) => m.totalQuranAyahs,
  },

  // Row 4: Crown Shields (Bronze, Silver, Gold) — Reference Image G Row 4
  {
    id: 'shield-bronze',
    title: 'Bronze Steadfastness',
    titleBn: 'ব্রোঞ্জ অবিচলতা',
    description: 'Reach 14 total active days or 25 completed tasks.',
    descriptionBn: 'মোট ১৪ দিন সক্রিয় থাকুন অথবা ২৫টি দৈনিক আমল সম্পন্ন করুন।',
    conditionLabel: '14 active days',
    conditionLabelBn: '১৪ দিন সক্রিয় আমল',
    visualType: 'crown-shield',
    labelMain: 'BRONZE',
    palette: 'bronze',
    targetValue: 14,
    evaluateProgress: (_, m) => Math.max(m.totalActiveDays, Math.floor(m.totalTasksCompleted / 2)),
  },
  {
    id: 'shield-silver',
    title: 'Silver Steadfastness',
    titleBn: 'সিলভার অবিচলতা',
    description: 'Reach 30 total active days of consistent worship.',
    descriptionBn: 'নিয়মিত ইবাদতের মাধ্যমে মোট ৩০টি সক্রিয় দিন পূর্ণ করুন।',
    conditionLabel: '30 active days',
    conditionLabelBn: '৩০ দিন সক্রিয় আমল',
    visualType: 'crown-shield',
    labelMain: 'SILVER',
    palette: 'silver',
    targetValue: 30,
    evaluateProgress: (_, m) => m.totalActiveDays,
  },
  {
    id: 'shield-gold',
    title: 'Gold Steadfastness',
    titleBn: 'স্বর্ণ অবিচলতা',
    description: 'Reach 100 total active days of consistent worship.',
    descriptionBn: 'নিয়মিত ইবাদতের মাধ্যমে মোট ১০০টি সক্রিয় দিন পূর্ণ করুন।',
    conditionLabel: '100 active days',
    conditionLabelBn: '১০০ দিন সক্রিয় আমল',
    visualType: 'crown-shield',
    labelMain: 'GOLD',
    palette: 'gold',
    targetValue: 100,
    evaluateProgress: (_, m) => m.totalActiveDays,
  },

  // Row 5: Approved Ribbon Seals — Reference Image G Row 5
  {
    id: 'approved-first-day',
    title: 'First Step',
    titleBn: 'প্রথম পদক্ষেপ',
    description: 'Complete your first daily task or prayer check-in.',
    descriptionBn: 'আপনার প্রথম দৈনিক আমল বা নামাজের চেক-ইন সম্পন্ন করুন।',
    conditionLabel: '1 completed task or prayer',
    conditionLabelBn: '১টি আমল বা নামাজ সম্পন্ন',
    visualType: 'approved-seal',
    labelMain: 'VERIFIED',
    palette: 'orange',
    targetValue: 1,
    evaluateProgress: (_, m) => m.totalActionsCombo,
  },
  {
    id: 'approved-bookmark',
    title: 'Quran Keeper',
    titleBn: 'কুরআন সংরক্ষক',
    description: 'Save at least 1 Ayah bookmark in your Quran library.',
    descriptionBn: 'আপনার কুরআন লাইব্রেরিতে অন্তত ১টি আয়াত বুকমার্ক করুন।',
    conditionLabel: '1 Quran bookmark saved',
    conditionLabelBn: '১টি কুরআন বুকমার্ক',
    visualType: 'approved-seal',
    labelMain: 'SAVED',
    palette: 'silver',
    targetValue: 1,
    evaluateProgress: (_, m) => m.totalBookmarks,
  },
  {
    id: 'approved-planner',
    title: 'Planner Builder',
    titleBn: 'প্ল্যানার নির্মাতা',
    description: 'Create 5 custom tasks in your Daily Planner.',
    descriptionBn: 'দৈনিক প্ল্যানারে ৫টি নিজস্ব আমল বা কাজ যুক্ত করুন।',
    conditionLabel: '5 planner tasks created',
    conditionLabelBn: '৫টি নতুন আমল যুক্ত',
    visualType: 'approved-seal',
    labelMain: 'PLANNED',
    palette: 'magenta',
    targetValue: 5,
    evaluateProgress: (_, m) => m.totalCustomTasksCreated,
  },
  {
    id: 'approved-backup',
    title: 'Vault Protected',
    titleBn: 'সুরক্ষিত ভল্ট',
    description: 'Export a local JSON backup file to safeguard your worship records.',
    descriptionBn: 'আপনার সব আমলের তথ্য সুরক্ষিত রাখতে একটি JSON ব্যাকআপ এক্সপোর্ট করুন।',
    conditionLabel: '1 JSON backup exported',
    conditionLabelBn: '১টি JSON ব্যাকআপ সংরক্ষণ',
    visualType: 'approved-seal',
    labelMain: 'SECURED',
    palette: 'emerald',
    targetValue: 1,
    evaluateProgress: (_, m) => (m.hasBackupExported ? 1 : 0),
  },

  // Row 6: Purity & Self-Control (NoFap) Achievements
  {
    id: 'purity-covenant',
    title: 'Purity Covenant',
    titleBn: 'পবিত্রতার শপথ',
    description: 'Start your Purity & Self-Control timer with sincere intention for Allah.',
    descriptionBn: 'আল্লাহর সন্তুষ্টির নিয়তে পবিত্রতা ও আত্মসংযম টাইমার শুরু করুন।',
    conditionLabel: 'Start Purity timer',
    conditionLabelBn: 'পবিত্রতা টাইমার শুরু করুন',
    visualType: 'purity-shield',
    labelTop: 'শুরু',
    labelMain: 'শপথ',
    labelSub: 'TAWBAH',
    palette: 'mint',
    targetValue: 1,
    evaluateProgress: (_, m) => (m.purityStarted ? 1 : 0),
  },
  {
    id: 'purity-1d',
    title: 'First 24 Hours',
    titleBn: 'প্রথম ২৪ ঘণ্টা',
    description: 'Complete your first 24 hours (1 full clean day) on the Purity timer.',
    descriptionBn: 'পবিত্রতা টাইমারে প্রথম ২৪ ঘণ্টা (১ পূর্ণ দিন) সফলভাবে পার করুন।',
    conditionLabel: '1 clean day (24h)',
    conditionLabelBn: '১ দিন (২৪ ঘণ্টা) পবিত্রতা',
    visualType: 'purity-shield',
    labelMain: '১',
    labelSub: 'দিন',
    palette: 'emerald',
    targetValue: 1,
    evaluateProgress: (_, m) => m.purityBestDays,
  },
  {
    id: 'purity-3d',
    title: '3-Day Resolve',
    titleBn: '৩ দিনের দৃঢ়তা',
    description: 'Maintain purity and lower your gaze for 3 consecutive days.',
    descriptionBn: 'টানা ৩ দিন দৃষ্টি সংযম ও চারিত্রিক পবিত্রতা বজায় রাখুন।',
    conditionLabel: '3 clean days',
    conditionLabelBn: 'টানা ৩ দিন পবিত্রতা',
    visualType: 'purity-shield',
    labelMain: '৩',
    labelSub: 'দিন',
    palette: 'blue',
    targetValue: 3,
    evaluateProgress: (_, m) => m.purityBestDays,
  },
  {
    id: 'purity-7d',
    title: '7-Day Shield',
    titleBn: '৭ দিনের ঢাল',
    description: 'Complete a full week of self-control and spiritual discipline.',
    descriptionBn: 'একটি পূর্ণ সপ্তাহ (৭ দিন) আত্মনিয়ন্ত্রণ ও পবিত্র জীবনযাপন সম্পন্ন করুন।',
    conditionLabel: '7 clean days',
    conditionLabelBn: 'টানা ৭ দিন পবিত্রতা',
    visualType: 'purity-shield',
    labelMain: '৭',
    labelSub: 'দিন',
    palette: 'cobalt',
    targetValue: 7,
    evaluateProgress: (_, m) => m.purityBestDays,
  },
  {
    id: 'purity-14d',
    title: '14-Day Clarity',
    titleBn: '১৪ দিনের প্রশান্তি',
    description: 'Stay steadfast for 2 full weeks and strengthen heart clarity.',
    descriptionBn: 'টানা ২ সপ্তাহ (১৪ দিন) অবিচল থেকে অন্তরের প্রশান্তি অর্জন করুন।',
    conditionLabel: '14 clean days',
    conditionLabelBn: 'টানা ১৪ দিন পবিত্রতা',
    visualType: 'purity-shield',
    labelMain: '১৪',
    labelSub: 'দিন',
    palette: 'orange',
    targetValue: 14,
    evaluateProgress: (_, m) => m.purityBestDays,
  },
  {
    id: 'purity-30d',
    title: '30-Day Tazkiyah',
    titleBn: '৩০ দিনের তাযকিয়াহ',
    description: 'Complete an entire 30-day cycle of self-purification.',
    descriptionBn: 'একটি পূর্ণ মাস (৩০ দিন) আত্মশুদ্ধি ও তাযকিয়াহর সফর সম্পন্ন করুন।',
    conditionLabel: '30 clean days',
    conditionLabelBn: 'টানা ৩০ দিন পবিত্রতা',
    visualType: 'purity-shield',
    labelMain: '৩০',
    labelSub: 'দিন',
    palette: 'silver',
    targetValue: 30,
    evaluateProgress: (_, m) => m.purityBestDays,
  },
  {
    id: 'purity-60d',
    title: '60-Day Steadfast',
    titleBn: '৬০ দিনের অবিচলতা',
    description: 'Reach 60 days of unbroken purity and mastery over impulses.',
    descriptionBn: '৬০ দিন অবিচ্ছিন্ন পবিত্রতা ও প্রবৃত্তির ওপর পূর্ণ নিয়ন্ত্রণ অর্জন করুন।',
    conditionLabel: '60 clean days',
    conditionLabelBn: 'টানা ৬০ দিন পবিত্রতা',
    visualType: 'purity-shield',
    labelMain: '৬০',
    labelSub: 'দিন',
    palette: 'magenta',
    targetValue: 60,
    evaluateProgress: (_, m) => m.purityBestDays,
  },
  {
    id: 'purity-90d',
    title: '90-Day Renewal',
    titleBn: '৯০ দিনের নবজীবন',
    description: 'Achieve the 90-day milestone of total mental and spiritual renewal.',
    descriptionBn: '৯০ দিন পবিত্রতার মাইলফলক স্পর্শ করে মানসিক ও আত্মিক নবজীবন লাভ করুন।',
    conditionLabel: '90 clean days',
    conditionLabelBn: 'টানা ৯০ দিন পবিত্রতা',
    visualType: 'purity-shield',
    labelMain: '৯০',
    labelSub: 'দিন',
    palette: 'gold',
    targetValue: 90,
    evaluateProgress: (_, m) => m.purityBestDays,
  },
];
