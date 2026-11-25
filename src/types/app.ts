import type { SupportedLanguage } from '../config/app';

export type PrayerName = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export type CalculationMethodKey =
  | 'MuslimWorldLeague'
  | 'NorthAmerica'
  | 'Egyptian'
  | 'UmmAlQura'
  | 'Karachi'
  | 'Dubai'
  | 'Singapore'
  | 'Turkey';

export type TaskCategory = 'worship' | 'quran' | 'charity' | 'learning' | 'personal';
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskRepeat = 'none' | 'daily' | 'weekly';
export type TaskColorTheme = 'periwinkle' | 'charcoal' | 'lime' | 'lavender';

export interface UserLocation {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
  source: 'manual' | 'geolocation';
}

export interface LocalAccount {
  name: string;
  email: string;
  passwordHash?: string;
  memberSince: string; // ISO date
  avatarId: string; // preset key or 'custom'
  customAvatarDataUrl?: string;
}

export interface AuthState {
  mode: 'guest' | 'local_account';
  isOnboarded: boolean;
  isAuthenticated: boolean;
  account: LocalAccount;
}

export type AdhanSoundKey = 'makkah' | 'madina' | 'alaqsa' | 'mishary' | 'chime';

export interface PrayerSettings {
  method: CalculationMethodKey;
  madhab: 'shafi' | 'hanafi';
  reminders: Record<PrayerName, boolean>;
  customTimes?: Partial<Record<PrayerName, string>>; // HH:mm 24h override per prayer
  adhanEnabled?: boolean;
  adhanSound?: AdhanSoundKey;
}

export interface TaskItem {
  id: string;
  title: string;
  note?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm (24h)
  endTime?: string; // HH:mm
  category: TaskCategory;
  priority: TaskPriority;
  repeat: TaskRepeat;
  colorTheme: TaskColorTheme;
  completedDates: string[]; // YYYY-MM-DD strings when completed
  createdAt: string;
}

export interface CalendarNote {
  id: string;
  date: string; // YYYY-MM-DD
  text: string;
  createdAt: string;
}

export interface QuranBookmark {
  surahNumber: number;
  surahName: string;
  ayahNumber: number;
  createdAt: string;
}

export interface QuranReadingSession {
  id: string;
  surahNumber: number;
  ayahsRead: number;
  durationSeconds: number;
  date: string; // YYYY-MM-DD
  timestamp: string;
}

export interface QuranProgressState {
  lastRead: {
    surahNumber: number;
    surahName: string;
    ayahNumber: number;
    timestamp: string;
  };
  bookmarks: QuranBookmark[];
  completedSurahs: number[];
  memorizedAyahs: Record<string, boolean>; // key: `${surah}:${ayah}`
  sessions: QuranReadingSession[];
  fontSize: number;
  showTranslation: boolean;
  translationLang: 'en' | 'bn';
}

export interface DailyActivityStats {
  tasksCompleted: number;
  prayersChecked: number;
  quranMinutes: number;
  quranAyahs: number;
}

export interface NotificationSettings {
  prayers: boolean;
  tasks: boolean;
  quranReminder: boolean;
  quranReminderTime: string;
}

export interface UserPreferences {
  language: SupportedLanguage;
  dailyTaskGoal: number;
  tasbihCount: number;
  tasbihTarget: number;
  tasbihPhraseIndex: number;
  lastBackupExportedAt?: string;
  bottomNavOffset?: number; // extra px offset above home/back buttons (0-48)
  hasCompletedTour?: boolean;
  timeFormat?: '12h' | '24h';
}

export interface EarnedBadgeRecord {
  badgeId: string;
  earnedAt: string;
}

export interface PurityResetEntry {
  id: string;
  date: string; // YYYY-MM-DD
  timestamp: string;
  trigger?: string;
}

export interface PurityTrackerState {
  isActive: boolean;
  streakStartedAt: string | null; // ISO timestamp
  cleanDays: Record<string, boolean>; // YYYY-MM-DD -> true
  bestStreakDays: number;
  resetHistory: PurityResetEntry[];
}

export interface AppState {
  schemaVersion: number;
  auth: AuthState;
  location: UserLocation;
  prayerSettings: PrayerSettings;
  prayerCheckIns: Record<string, Record<PrayerName, boolean>>;
  fastingDays: Record<string, boolean>;
  purityTracker: PurityTrackerState;
  tasks: TaskItem[];
  notes: CalendarNote[];
  quranProgress: QuranProgressState;
  activityLog: Record<string, DailyActivityStats>;
  earnedBadges: Record<string, EarnedBadgeRecord>;
  notifications: NotificationSettings;
  preferences: UserPreferences;
}

export interface PrayerDaySchedule {
  date: string; // YYYY-MM-DD
  city: string;
  country: string;
  hijriDateFormatted: string;
  hijriMonthNumber: number;
  hijriMonthName: string;
  hijriYear: string;
  isRamadan: boolean;
  qiblaDegrees: number;
  times: {
    fajr: Date;
    sunrise: Date;
    dhuhr: Date;
    asr: Date;
    maghrib: Date;
    isha: Date;
  };
  source: 'aladhan-api' | 'aladhan-cache' | 'offline-calculation';
  lastUpdated: string;
}

export interface SurahMeta {
  number: number;
  nameArabic: string;
  transliteration: string;
  englishMeaning: string;
  ayahCount: number;
  revelationType: 'Meccan' | 'Medinan';
  juzStart: number;
  pageStart: number;
}

export interface AyahContent {
  numberInSurah: number;
  globalNumber: number;
  arabic: string;
  translationEn: string;
  translationBn?: string;
}

export interface SurahDetail {
  meta: SurahMeta;
  ayahs: AyahContent[];
  translationSourceEn: string;
  translationSourceBn?: string;
  source: 'bundled' | 'cache' | 'api';
}
