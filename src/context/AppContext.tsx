import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { computeUserMetrics, type ComputedMetrics } from '../data/badges';
import { localizeLocation, PRESET_CITIES } from '../data/cities';
import { TRANSLATIONS, type TranslationDict } from '../i18n/translations';
import {
  applyCustomPrayerTimes,
  calculateLocalPrayerSchedule,
  fetchPrayerScheduleWithCache,
  formatDateKey,
  formatHHmmDisplay,
  formatTimeDisplay,
  PRAYER_NAME_BN,
  reverseGeocodeWorldwide,
} from '../services/prayerService';
import { alarmEngine } from '../services/alarmService';
import {
  createInitialAppState,
  evaluateAndAwardBadges,
  hashPasswordLocal,
  loadAppStateFromStorage,
  saveAppStateToStorage,
} from '../storage/localVault';
import { triggerBackupDownload } from '../storage/backup';
import { loadStudyDataFromDB } from '../storage/studyIndexedDB';
import type {
  AdhanSoundKey,
  AppState,
  CalculationMethodKey,
  NotificationSettings,
  PrayerDaySchedule,
  PrayerName,
  TaskItem,
  UserLocation,
} from '../types/app';
import type { SupportedLanguage } from '../config/app';

interface ToastMessage {
  id: string;
  title: string;
  subtitle?: string;
  tone: 'success' | 'info' | 'warning' | 'error';
}

export interface ActiveAlarmInfo {
  id: string;
  kind: 'prayer' | 'task' | 'quran';
  title: string;
  subtitle: string;
  prayerName?: PrayerName;
}

interface AppContextValue {
  state: AppState;
  t: TranslationDict;
  metrics: ComputedMetrics;
  isOnline: boolean;
  prayerSchedule: PrayerDaySchedule;
  rawPrayerSchedule: PrayerDaySchedule;
  customTimeFlags: Record<PrayerName, boolean>;
  prayerLoading: boolean;
  toasts: ToastMessage[];
  dismissToast: (id: string) => void;
  pushToast: (title: string, subtitle?: string, tone?: ToastMessage['tone']) => void;

  // Alarms & Adhan
  activeAlarm: ActiveAlarmInfo | null;
  audioUnlocked: boolean;
  unlockAudio: () => void;
  stopActiveAlarm: () => void;
  testAdhanAlarm: (prayer?: PrayerName) => Promise<void>;

  // Navigation / Auth / Onboarding
  completeOnboarding: () => void;
  continueAsGuest: () => void;
  signUpLocal: (name: string, email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signInLocal: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  resetPasswordLocal: (email: string, newPassword: string) => Promise<{ ok: boolean; error?: string }>;
  signOutLocal: () => void;
  updateProfile: (updates: { name?: string; avatarId?: string; customAvatarDataUrl?: string }) => void;

  // Location & Prayer Settings
  setManualLocation: (loc: UserLocation) => void;
  detectGeolocation: () => Promise<{ ok: boolean; message: string }>;
  updatePrayerSettings: (updates: {
    method?: CalculationMethodKey;
    madhab?: 'shafi' | 'hanafi';
    adhanEnabled?: boolean;
    adhanSound?: AdhanSoundKey;
  }) => void;
  updateCustomPrayerTime: (prayer: PrayerName, timeHHmm: string | null) => void;
  resetAllCustomPrayerTimes: () => void;
  togglePrayerReminder: (prayer: PrayerName) => void;
  togglePrayerCheckIn: (dateKey: string, prayer: PrayerName) => void;
  toggleFastingDay: (dateKey: string) => void;
  refreshPrayerSchedule: () => Promise<void>;

  // Purity & Self-Control (NoFap / Guarding Chastity)
  purityStreakDays: number;
  startPurityStreak: () => void;
  stopPurityStreak: () => void;
  checkInPurityDay: (dateKey: string) => void;
  resetPurityStreak: (trigger?: string) => void;

  // Tasks & Notes
  addTask: (task: Omit<TaskItem, 'id' | 'completedDates' | 'createdAt'>) => void;
  updateTask: (id: string, updates: Partial<Omit<TaskItem, 'id' | 'createdAt'>>) => void;
  deleteTask: (id: string) => void;
  clearAllTasks: () => void;
  toggleTaskCompletion: (id: string, dateKey: string) => void;
  addCalendarNote: (dateKey: string, text: string) => void;
  deleteCalendarNote: (id: string) => void;

  // Quran
  setLastRead: (surahNumber: number, surahName: string, ayahNumber: number) => void;
  toggleBookmark: (surahNumber: number, surahName: string, ayahNumber: number) => void;
  toggleMemorizedAyah: (surahNumber: number, ayahNumber: number) => void;
  logQuranSession: (surahNumber: number, ayahsRead: number, durationSeconds: number) => void;
  toggleSurahCompleted: (surahNumber: number) => void;
  updateQuranSettings: (updates: Partial<AppState['quranProgress']>) => void;

  // Tasbih & Preferences & Notifications & Tour
  incrementTasbih: () => void;
  resetTasbih: () => void;
  setTasbihPhrase: (index: number) => void;
  setTasbihTarget: (target: number) => void;
  setLanguage: (lang: SupportedLanguage) => void;
  setTimeFormat: (fmt: '12h' | '24h') => void;
  setDailyTaskGoal: (goal: number) => void;
  setBottomNavOffset: (offsetPx: number) => void;
  completeTour: () => void;
  resetTour: () => void;
  updateNotifications: (updates: Partial<NotificationSettings>) => void;

  // Backup & Restore
  exportJsonBackup: () => void;
  restoreFromBackupState: (restored: AppState) => void;
  resetAllLocalData: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadAppStateFromStorage());
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [rawPrayerSchedule, setRawPrayerSchedule] = useState<PrayerDaySchedule>(() =>
    calculateLocalPrayerSchedule(state.location, state.prayerSettings, new Date())
  );
  const [prayerLoading, setPrayerLoading] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [activeAlarm, setActiveAlarm] = useState<ActiveAlarmInfo | null>(null);
  const [audioUnlocked, setAudioUnlocked] = useState<boolean>(false);
  const triggeredAlarmsRef = useRef<Set<string>>(new Set());

  const pushToast = useCallback(
    (title: string, subtitle?: string, tone: ToastMessage['tone'] = 'info') => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-3), { id, title, subtitle, tone }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((item) => item.id !== id));
      }, 4500);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // Unlock Web Audio cleanly on first user interaction anywhere in app
  const unlockAudio = useCallback(() => {
    const ok = alarmEngine.unlockAudio();
    if (ok) setAudioUnlocked(true);
  }, []);

  useEffect(() => {
    const onFirstGesture = () => {
      if (alarmEngine.unlockAudio()) {
        setAudioUnlocked(true);
      }
    };
    window.addEventListener('pointerdown', onFirstGesture, { passive: true, once: true });
    window.addEventListener('keydown', onFirstGesture, { passive: true, once: true });
    return () => {
      window.removeEventListener('pointerdown', onFirstGesture);
      window.removeEventListener('keydown', onFirstGesture);
    };
  }, []);

  const stopActiveAlarm = useCallback(() => {
    alarmEngine.stopAll();
    setActiveAlarm(null);
  }, []);

  // Effective prayer schedule after applying user's custom time edits
  const { schedule: prayerSchedule, isCustom: customTimeFlags } = useMemo(
    () => applyCustomPrayerTimes(rawPrayerSchedule, state.prayerSettings.customTimes),
    [rawPrayerSchedule, state.prayerSettings.customTimes]
  );

  // Persist to localStorage & evaluate badges silently whenever state changes
  const updateState = useCallback(
    (updater: (prev: AppState) => AppState) => {
      setState((prev) => {
        const draft = updater(prev);
        const { nextEarnedBadges } = evaluateAndAwardBadges(draft);
        const finalized: AppState = {
          ...draft,
          earnedBadges: nextEarnedBadges,
        };
        saveAppStateToStorage(finalized);
        return finalized;
      });
    },
    []
  );

  // Sync document RTL direction for Arabic language
  useEffect(() => {
    document.documentElement.dir = state.preferences.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = state.preferences.language;
  }, [state.preferences.language]);

  // Listen to browser online/offline status
  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  // Load prayer schedule when location, settings, or connectivity changes
  const refreshPrayerSchedule = useCallback(async () => {
    setPrayerLoading(true);
    try {
      const schedule = await fetchPrayerScheduleWithCache(
        state.location,
        state.prayerSettings,
        new Date()
      );
      setRawPrayerSchedule(schedule);
    } finally {
      setPrayerLoading(false);
    }
  }, [state.location, state.prayerSettings.method, state.prayerSettings.madhab]);

  useEffect(() => {
    void refreshPrayerSchedule();
  }, [refreshPrayerSchedule, isOnline]);

  // Test Adhan & Notification immediately
  const testAdhanAlarm = useCallback(
    async (prayer: PrayerName = 'fajr') => {
      const isBn = state.preferences.language === 'bn';
      unlockAudio();
      const sound = state.prayerSettings.adhanSound ?? 'makkah';
      const title = isBn
        ? `${PRAYER_NAME_BN[prayer]} নামাজের আযান (টেস্ট)`
        : `${prayer.toUpperCase()} Adhan (Test)`;
      const subtitle = isBn
        ? 'সালাত ঘুমের চেয়ে উত্তম · আপনার নির্ধারিত আযান ও নোটিফিকেশন সচল রয়েছে।'
        : 'Prayer & Adhan notification system is active.';
      setActiveAlarm({
        id: `test-${Date.now()}`,
        kind: 'prayer',
        title,
        subtitle,
        prayerName: prayer,
      });
      await alarmEngine.playAdhan(sound);
      await alarmEngine.sendSystemNotification(title, subtitle, `safar-test-${Date.now()}`);
    },
    [state.preferences.language, state.prayerSettings.adhanSound, unlockAudio]
  );

  // Real-time 1-second Adhan, Task Alarm & Quran Reminder Scheduler
  useEffect(() => {
    const checkAlarms = () => {
      const now = new Date();
      const dateKey = formatDateKey(now);
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const currentHHmm = `${hh}:${mm}`;
      const isBn = state.preferences.language === 'bn';
      const timeFmt = state.preferences.timeFormat ?? '12h';

      // Refresh schedule automatically right after midnight
      if (prayerSchedule.date !== dateKey) {
        void refreshPrayerSchedule();
      }

      // 1. Check 5-Waqt Prayers & Adhan
      if (state.notifications.prayers) {
        const prayers: PrayerName[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
        for (const p of prayers) {
          if (!state.prayerSettings.reminders[p]) continue;
          const pDate = prayerSchedule.times[p];
          const pHHmm = `${String(pDate.getHours()).padStart(2, '0')}:${String(
            pDate.getMinutes()
          ).padStart(2, '0')}`;
          if (pHHmm === currentHHmm) {
            const alarmKey = `${dateKey}_${currentHHmm}_prayer_${p}`;
            if (!triggeredAlarmsRef.current.has(alarmKey) && !sessionStorage.getItem(alarmKey)) {
              triggeredAlarmsRef.current.add(alarmKey);
              try {
                sessionStorage.setItem(alarmKey, '1');
              } catch {
                // ignore
              }
              const title = isBn
                ? `${PRAYER_NAME_BN[p]} ওয়াক্তের সময় হয়েছে`
                : `Time for ${p.toUpperCase()} Prayer`;
              const subtitle = isBn
                ? `${formatTimeDisplay(pDate, true, timeFmt)} · নামাজের জন্য প্রস্তুতি নিন।`
                : `${formatTimeDisplay(pDate, false, timeFmt)} · Stand for Salah.`;
              setActiveAlarm({
                id: alarmKey,
                kind: 'prayer',
                title,
                subtitle,
                prayerName: p,
              });
              if (state.prayerSettings.adhanEnabled !== false) {
                void alarmEngine.playAdhan(state.prayerSettings.adhanSound ?? 'makkah');
              } else {
                alarmEngine.playTaskAlarm();
              }
              void alarmEngine.sendSystemNotification(title, subtitle, alarmKey);
            }
          }
        }
      }

      // 2. Check Daily Planner Tasks
      if (state.notifications.tasks) {
        for (const task of state.tasks) {
          if (task.completedDates.includes(dateKey)) continue;
          const appliesToday =
            task.date === dateKey ||
            task.repeat === 'daily' ||
            (task.repeat === 'weekly' &&
              new Date(
                Number(task.date.split('-')[0]),
                Number(task.date.split('-')[1]) - 1,
                Number(task.date.split('-')[2])
              ).getDay() === now.getDay());
          if (!appliesToday) continue;
          if (task.time === currentHHmm) {
            const alarmKey = `${dateKey}_${currentHHmm}_task_${task.id}`;
            if (!triggeredAlarmsRef.current.has(alarmKey) && !sessionStorage.getItem(alarmKey)) {
              triggeredAlarmsRef.current.add(alarmKey);
              try {
                sessionStorage.setItem(alarmKey, '1');
              } catch {
                // ignore
              }
              const title = task.title;
              const formattedTaskTime = formatHHmmDisplay(task.time, isBn, timeFmt);
              const subtitle = isBn
                ? `নির্ধারিত সময়: ${formattedTaskTime}${task.note ? ` · ${task.note}` : ''}`
                : `Scheduled at ${formattedTaskTime}${task.note ? ` · ${task.note}` : ''}`;
              setActiveAlarm({
                id: alarmKey,
                kind: 'task',
                title,
                subtitle,
              });
              alarmEngine.playTaskAlarm();
              void alarmEngine.sendSystemNotification(
                isBn ? `আমল রিমাইন্ডার: ${title}` : `Task Reminder: ${title}`,
                subtitle,
                alarmKey
              );
            }
          }
        }
      }

      // 3. Check Daily Quran Reminder
      if (state.notifications.quranReminder && state.notifications.quranReminderTime === currentHHmm) {
        const alarmKey = `${dateKey}_${currentHHmm}_quran`;
        if (!triggeredAlarmsRef.current.has(alarmKey) && !sessionStorage.getItem(alarmKey)) {
          triggeredAlarmsRef.current.add(alarmKey);
          try {
            sessionStorage.setItem(alarmKey, '1');
          } catch {
            // ignore
          }
          const title = isBn ? 'পবিত্র কুরআন তিলাওয়াতের সময়' : 'Daily Quran Reading Time';
          const subtitle = isBn
            ? 'প্রতিদিন অন্তত কয়েকটি আয়াত অর্থসহ তিলাওয়াত করুন।'
            : 'Take a peaceful moment to read & reflect on the Quran.';
          setActiveAlarm({
            id: alarmKey,
            kind: 'quran',
            title,
            subtitle,
          });
          alarmEngine.playTaskAlarm();
          void alarmEngine.sendSystemNotification(title, subtitle, alarmKey);
        }
      }
    };

    checkAlarms();
    const id = setInterval(checkAlarms, 1000);
    return () => clearInterval(id);
  }, [
    prayerSchedule,
    state.notifications,
    state.prayerSettings,
    state.tasks,
    state.preferences.language,
    state.preferences.timeFormat,
    refreshPrayerSchedule,
  ]);

  // Auth & Onboarding
  const completeOnboarding = useCallback(() => {
    updateState((prev) => ({
      ...prev,
      auth: { ...prev.auth, isOnboarded: true },
    }));
  }, [updateState]);

  const continueAsGuest = useCallback(() => {
    updateState((prev) => ({
      ...prev,
      auth: {
        ...prev.auth,
        mode: 'guest',
        isOnboarded: true,
        isAuthenticated: true,
      },
    }));
  }, [updateState]);

  const signUpLocal = useCallback(
    async (name: string, email: string, password: string) => {
      const isBn = state.preferences.language === 'bn';
      const trimmedName = name.trim();
      const trimmedEmail = email.trim().toLowerCase();
      if (!trimmedName || !trimmedEmail || password.length < 6) {
        return {
          ok: false,
          error: isBn
            ? 'অনুগ্রহ করে আপনার নাম, সঠিক ইমেইল এবং কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড দিন।'
            : 'Please enter your name, a valid email, and a 6+ character password.',
        };
      }
      const passwordHash = await hashPasswordLocal(password);
      updateState((prev) => ({
        ...prev,
        auth: {
          mode: 'local_account',
          isOnboarded: true,
          isAuthenticated: true,
          account: {
            ...prev.auth.account,
            name: trimmedName,
            email: trimmedEmail,
            passwordHash,
            memberSince: prev.auth.account.memberSince || new Date().toISOString(),
          },
        },
      }));
      return { ok: true };
    },
    [state.preferences.language, updateState]
  );

  const signInLocal = useCallback(
    async (email: string, password: string) => {
      const isBn = state.preferences.language === 'bn';
      const trimmedEmail = email.trim().toLowerCase();
      if (!trimmedEmail || !password) {
        return {
          ok: false,
          error: isBn ? 'আপনার ইমেইল ও পাসওয়ার্ড দিন।' : 'Enter your email and password.',
        };
      }
      const existing = state.auth.account;
      if (!existing.email || !existing.passwordHash) {
        return {
          ok: false,
          error: isBn
            ? 'এই ডিভাইসে এখনো কোনো লোকাল অ্যাকাউন্ট নেই। অনুগ্রহ করে "লোকাল অ্যাকাউন্ট তৈরি করুন" অথবা আপনার সংরক্ষিত "JSON ফাইল আপলোড করুন"। '
            : 'No local account found on this device yet. Create a local account or upload your JSON backup.',
        };
      }
      const inputHash = await hashPasswordLocal(password);
      if (existing.email.toLowerCase() !== trimmedEmail || existing.passwordHash !== inputHash) {
        return {
          ok: false,
          error: isBn
            ? 'এই ডিভাইসের জন্য ইমেইল বা পাসওয়ার্ড সঠিক নয়।'
            : 'Incorrect email or password for this device.',
        };
      }
      updateState((prev) => ({
        ...prev,
        auth: {
          ...prev.auth,
          mode: 'local_account',
          isOnboarded: true,
          isAuthenticated: true,
        },
      }));
      return { ok: true };
    },
    [state.auth.account, state.preferences.language, updateState]
  );

  const resetPasswordLocal = useCallback(
    async (email: string, newPassword: string) => {
      const isBn = state.preferences.language === 'bn';
      const trimmedEmail = email.trim().toLowerCase();
      if (!state.auth.account.email || state.auth.account.email.toLowerCase() !== trimmedEmail) {
        return {
          ok: false,
          error: isBn
            ? 'এই ইমেইলটি ডিভাইসে সংরক্ষিত অ্যাকাউন্টের সাথে মিলছে না।'
            : 'Email does not match the local account stored on this device.',
        };
      }
      if (newPassword.length < 6) {
        return {
          ok: false,
          error: isBn
            ? 'নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।'
            : 'New password must be at least 6 characters.',
        };
      }
      const newHash = await hashPasswordLocal(newPassword);
      updateState((prev) => ({
        ...prev,
        auth: {
          ...prev.auth,
          account: {
            ...prev.auth.account,
            passwordHash: newHash,
          },
        },
      }));
      return { ok: true };
    },
    [state.auth.account.email, state.preferences.language, updateState]
  );

  const signOutLocal = useCallback(() => {
    updateState((prev) => ({
      ...prev,
      auth: {
        ...prev.auth,
        isAuthenticated: false,
      },
    }));
  }, [updateState]);

  const updateProfile = useCallback(
    (updates: { name?: string; avatarId?: string; customAvatarDataUrl?: string }) => {
      updateState((prev) => ({
        ...prev,
        auth: {
          ...prev.auth,
          account: {
            ...prev.auth.account,
            ...updates,
          },
        },
      }));
    },
    [updateState]
  );

  // Location & Prayers
  const setManualLocation = useCallback(
    (loc: UserLocation) => {
      updateState((prev) => ({
        ...prev,
        location: { ...loc, source: 'manual' },
      }));
    },
    [updateState]
  );

  const detectGeolocation = useCallback(async () => {
    const isBn = state.preferences.language === 'bn';
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      return {
        ok: false,
        message: isBn
          ? 'আপনার ব্রাউজারে লোকেশন সেবা সমর্থিত নয়। অনুগ্রহ করে সার্চ করে শহর বেছে নিন।'
          : 'Geolocation is not supported by your browser. Please search for a city manually.',
      };
    }
    return new Promise<{ ok: boolean; message: string }>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const resolved = await reverseGeocodeWorldwide(
            pos.coords.latitude,
            pos.coords.longitude,
            PRESET_CITIES
          );
          updateState((prev) => ({
            ...prev,
            location: resolved,
          }));
          const localized = localizeLocation(resolved.city, resolved.country, isBn);
          resolve({
            ok: true,
            message: isBn
              ? `অবস্থান আপডেট হয়েছে: ${localized.city}, ${localized.country}`
              : `Location updated to ${resolved.city}, ${resolved.country}`,
          });
        },
        (err) => {
          const msg =
            err.code === err.PERMISSION_DENIED
              ? isBn
                ? 'লোকেশন অনুমতি বন্ধ রয়েছে। ব্রাউজার সেটিংস থেকে লোকেশন চালু করুন অথবা নিচে সার্চ করে যেকোনো শহর বেছে নিন।'
                : 'Location permission denied. Enable location access or search any city below.'
              : isBn
              ? 'GPS সিগন্যাল পাওয়া যায়নি। নিচে সার্চ করে আপনার শহর বা এলাকা নির্বাচন করুন।'
              : 'Unable to determine GPS position. Please search and select your city below.';
          resolve({ ok: false, message: msg });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  }, [state.preferences.language, updateState]);

  const updatePrayerSettings = useCallback(
    (updates: {
      method?: CalculationMethodKey;
      madhab?: 'shafi' | 'hanafi';
      adhanEnabled?: boolean;
      adhanSound?: AdhanSoundKey;
    }) => {
      updateState((prev) => ({
        ...prev,
        prayerSettings: {
          ...prev.prayerSettings,
          ...updates,
        },
      }));
    },
    [updateState]
  );

  const updateCustomPrayerTime = useCallback(
    (prayer: PrayerName, timeHHmm: string | null) => {
      updateState((prev) => {
        const nextCustom = { ...(prev.prayerSettings.customTimes ?? {}) };
        if (!timeHHmm) {
          delete nextCustom[prayer];
        } else {
          nextCustom[prayer] = timeHHmm;
        }
        return {
          ...prev,
          prayerSettings: {
            ...prev.prayerSettings,
            customTimes: nextCustom,
          },
        };
      });
    },
    [updateState]
  );

  const resetAllCustomPrayerTimes = useCallback(() => {
    updateState((prev) => ({
      ...prev,
      prayerSettings: {
        ...prev.prayerSettings,
        customTimes: {},
      },
    }));
  }, [updateState]);

  const togglePrayerReminder = useCallback(
    (prayer: PrayerName) => {
      unlockAudio();
      updateState((prev) => ({
        ...prev,
        prayerSettings: {
          ...prev.prayerSettings,
          reminders: {
            ...prev.prayerSettings.reminders,
            [prayer]: !prev.prayerSettings.reminders[prayer],
          },
        },
      }));
    },
    [updateState, unlockAudio]
  );

  const togglePrayerCheckIn = useCallback(
    (dateKey: string, prayer: PrayerName) => {
      updateState((prev) => {
        const currentDay = prev.prayerCheckIns[dateKey] ?? {
          fajr: false,
          dhuhr: false,
          asr: false,
          maghrib: false,
          isha: false,
        };
        return {
          ...prev,
          prayerCheckIns: {
            ...prev.prayerCheckIns,
            [dateKey]: {
              ...currentDay,
              [prayer]: !currentDay[prayer],
            },
          },
        };
      });
    },
    [updateState]
  );

  const toggleFastingDay = useCallback(
    (dateKey: string) => {
      updateState((prev) => ({
        ...prev,
        fastingDays: {
          ...prev.fastingDays,
          [dateKey]: !prev.fastingDays[dateKey],
        },
      }));
    },
    [updateState]
  );

  // Tasks & Notes
  const addTask = useCallback(
    (taskInput: Omit<TaskItem, 'id' | 'completedDates' | 'createdAt'>) => {
      const newTask: TaskItem = {
        ...taskInput,
        id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        completedDates: [],
        createdAt: new Date().toISOString(),
      };
      updateState((prev) => ({
        ...prev,
        tasks: [newTask, ...prev.tasks],
      }));
    },
    [updateState]
  );

  const updateTask = useCallback(
    (id: string, updates: Partial<Omit<TaskItem, 'id' | 'createdAt'>>) => {
      updateState((prev) => ({
        ...prev,
        tasks: prev.tasks.map((task) => (task.id === id ? { ...task, ...updates } : task)),
      }));
    },
    [updateState]
  );

  const deleteTask = useCallback(
    (id: string) => {
      updateState((prev) => ({
        ...prev,
        tasks: prev.tasks.filter((task) => task.id !== id),
      }));
    },
    [updateState]
  );

  const clearAllTasks = useCallback(() => {
    updateState((prev) => ({
      ...prev,
      tasks: [],
    }));
  }, [updateState]);

  const toggleTaskCompletion = useCallback(
    (id: string, dateKey: string) => {
      updateState((prev) => ({
        ...prev,
        tasks: prev.tasks.map((task) => {
          if (task.id !== id) return task;
          const exists = task.completedDates.includes(dateKey);
          return {
            ...task,
            completedDates: exists
              ? task.completedDates.filter((d) => d !== dateKey)
              : [...task.completedDates, dateKey],
          };
        }),
      }));
    },
    [updateState]
  );

  const addCalendarNote = useCallback(
    (dateKey: string, text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      updateState((prev) => ({
        ...prev,
        notes: [
          {
            id: `note-${Date.now()}`,
            date: dateKey,
            text: trimmed,
            createdAt: new Date().toISOString(),
          },
          ...prev.notes,
        ],
      }));
    },
    [updateState]
  );

  const deleteCalendarNote = useCallback(
    (id: string) => {
      updateState((prev) => ({
        ...prev,
        notes: prev.notes.filter((n) => n.id !== id),
      }));
    },
    [updateState]
  );

  // Quran
  const setLastRead = useCallback(
    (surahNumber: number, surahName: string, ayahNumber: number) => {
      updateState((prev) => ({
        ...prev,
        quranProgress: {
          ...prev.quranProgress,
          lastRead: {
            surahNumber,
            surahName,
            ayahNumber,
            timestamp: new Date().toISOString(),
          },
        },
      }));
    },
    [updateState]
  );

  const toggleBookmark = useCallback(
    (surahNumber: number, surahName: string, ayahNumber: number) => {
      updateState((prev) => {
        const exists = prev.quranProgress.bookmarks.some(
          (b) => b.surahNumber === surahNumber && b.ayahNumber === ayahNumber
        );
        const nextBookmarks = exists
          ? prev.quranProgress.bookmarks.filter(
              (b) => !(b.surahNumber === surahNumber && b.ayahNumber === ayahNumber)
            )
          : [
              {
                surahNumber,
                surahName,
                ayahNumber,
                createdAt: new Date().toISOString(),
              },
              ...prev.quranProgress.bookmarks,
            ];
        return {
          ...prev,
          quranProgress: {
            ...prev.quranProgress,
            bookmarks: nextBookmarks,
          },
        };
      });
    },
    [updateState]
  );

  const toggleMemorizedAyah = useCallback(
    (surahNumber: number, ayahNumber: number) => {
      const key = `${surahNumber}:${ayahNumber}`;
      updateState((prev) => ({
        ...prev,
        quranProgress: {
          ...prev.quranProgress,
          memorizedAyahs: {
            ...prev.quranProgress.memorizedAyahs,
            [key]: !prev.quranProgress.memorizedAyahs[key],
          },
        },
      }));
    },
    [updateState]
  );

  const logQuranSession = useCallback(
    (surahNumber: number, ayahsRead: number, durationSeconds: number) => {
      if (ayahsRead <= 0 && durationSeconds < 5) return;
      const dateKey = formatDateKey(new Date());
      updateState((prev) => ({
        ...prev,
        quranProgress: {
          ...prev.quranProgress,
          sessions: [
            {
              id: `qs-${Date.now()}`,
              surahNumber,
              ayahsRead,
              durationSeconds,
              date: dateKey,
              timestamp: new Date().toISOString(),
            },
            ...prev.quranProgress.sessions,
          ],
        },
      }));
    },
    [updateState]
  );

  const toggleSurahCompleted = useCallback(
    (surahNumber: number) => {
      updateState((prev) => {
        const exists = prev.quranProgress.completedSurahs.includes(surahNumber);
        return {
          ...prev,
          quranProgress: {
            ...prev.quranProgress,
            completedSurahs: exists
              ? prev.quranProgress.completedSurahs.filter((n) => n !== surahNumber)
              : [...prev.quranProgress.completedSurahs, surahNumber],
          },
        };
      });
    },
    [updateState]
  );

  const updateQuranSettings = useCallback(
    (updates: Partial<AppState['quranProgress']>) => {
      updateState((prev) => ({
        ...prev,
        quranProgress: {
          ...prev.quranProgress,
          ...updates,
        },
      }));
    },
    [updateState]
  );

  // Tasbih & Preferences & Tour
  const incrementTasbih = useCallback(() => {
    updateState((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        tasbihCount: prev.preferences.tasbihCount + 1,
      },
    }));
  }, [updateState]);

  const resetTasbih = useCallback(() => {
    updateState((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        tasbihCount: 0,
      },
    }));
  }, [updateState]);

  const setTasbihPhrase = useCallback(
    (index: number) => {
      updateState((prev) => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          tasbihPhraseIndex: index,
          tasbihCount: 0,
        },
      }));
    },
    [updateState]
  );

  const setTasbihTarget = useCallback(
    (target: number) => {
      updateState((prev) => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          tasbihTarget: target,
        },
      }));
    },
    [updateState]
  );

  const setLanguage = useCallback(
    (lang: SupportedLanguage) => {
      updateState((prev) => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          language: lang,
        },
      }));
    },
    [updateState]
  );

  const setTimeFormat = useCallback(
    (fmt: '12h' | '24h') => {
      updateState((prev) => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          timeFormat: fmt,
        },
      }));
    },
    [updateState]
  );

  const setDailyTaskGoal = useCallback(
    (goal: number) => {
      updateState((prev) => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          dailyTaskGoal: Math.max(1, Math.min(25, goal)),
        },
      }));
    },
    [updateState]
  );

  const setBottomNavOffset = useCallback(
    (offsetPx: number) => {
      const clamped = Math.max(0, Math.min(48, Math.round(offsetPx)));
      updateState((prev) => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          bottomNavOffset: clamped,
        },
      }));
    },
    [updateState]
  );

  const completeTour = useCallback(() => {
    updateState((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        hasCompletedTour: true,
      },
    }));
  }, [updateState]);

  const resetTour = useCallback(() => {
    updateState((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        hasCompletedTour: false,
      },
    }));
  }, [updateState]);

  const updateNotifications = useCallback(
    (updates: Partial<NotificationSettings>) => {
      unlockAudio();
      updateState((prev) => ({
        ...prev,
        notifications: {
          ...prev.notifications,
          ...updates,
        },
      }));
    },
    [updateState, unlockAudio]
  );

  // Purity & Self-Control (NoFap)
  const purityStreakDays = useMemo(() => {
    if (!state.purityTracker.isActive || !state.purityTracker.streakStartedAt) return 0;
    const startedMs = new Date(state.purityTracker.streakStartedAt).getTime();
    if (Number.isNaN(startedMs)) return 0;
    const elapsedDays = Math.max(0, Math.floor((Date.now() - startedMs) / (1000 * 60 * 60 * 24)));
    const checkedCount = Object.values(state.purityTracker.cleanDays).filter(Boolean).length;
    return Math.max(elapsedDays, checkedCount);
  }, [state.purityTracker]);

  useEffect(() => {
    if (!state.purityTracker.isActive) return;
    const runCheck = () => {
      updateState((prev) => ({ ...prev }));
    };
    runCheck();
    const id = setInterval(runCheck, 30000);
    return () => clearInterval(id);
  }, [state.purityTracker.isActive, updateState]);

  const startPurityStreak = useCallback(() => {
    const nowIso = new Date().toISOString();
    updateState((prev) => ({
      ...prev,
      purityTracker: {
        ...prev.purityTracker,
        isActive: true,
        streakStartedAt: prev.purityTracker.isActive && prev.purityTracker.streakStartedAt
          ? prev.purityTracker.streakStartedAt
          : nowIso,
      },
    }));
  }, [updateState]);

  const stopPurityStreak = useCallback(() => {
    updateState((prev) => {
      const startedMs = prev.purityTracker.streakStartedAt
        ? new Date(prev.purityTracker.streakStartedAt).getTime()
        : Date.now();
      const elapsedDays = prev.purityTracker.isActive && prev.purityTracker.streakStartedAt
        ? Math.max(0, Math.floor((Date.now() - startedMs) / (1000 * 60 * 60 * 24)))
        : 0;
      return {
        ...prev,
        purityTracker: {
          ...prev.purityTracker,
          isActive: false,
          streakStartedAt: null,
          bestStreakDays: Math.max(prev.purityTracker.bestStreakDays, elapsedDays),
        },
      };
    });
  }, [updateState]);

  const checkInPurityDay = useCallback(
    (dateKey: string) => {
      updateState((prev) => {
        const nextClean = !prev.purityTracker.cleanDays[dateKey];
        const nextCleanDays = {
          ...prev.purityTracker.cleanDays,
          [dateKey]: nextClean,
        };
        const cleanCount = Object.values(nextCleanDays).filter(Boolean).length;
        const startedAt =
          prev.purityTracker.streakStartedAt || (nextClean ? new Date().toISOString() : null);
        return {
          ...prev,
          purityTracker: {
            ...prev.purityTracker,
            isActive: prev.purityTracker.isActive || nextClean,
            streakStartedAt: startedAt,
            cleanDays: nextCleanDays,
            bestStreakDays: Math.max(prev.purityTracker.bestStreakDays, cleanCount),
          },
        };
      });
    },
    [updateState]
  );

  const resetPurityStreak = useCallback(
    (trigger?: string) => {
      const nowIso = new Date().toISOString();
      const todayKey = formatDateKey(new Date());
      updateState((prev) => {
        const startedMs = prev.purityTracker.streakStartedAt
          ? new Date(prev.purityTracker.streakStartedAt).getTime()
          : Date.now();
        const elapsedDays = Math.max(
          0,
          Math.floor((Date.now() - startedMs) / (1000 * 60 * 60 * 24))
        );
        return {
          ...prev,
          purityTracker: {
            isActive: true,
            streakStartedAt: nowIso,
            cleanDays: {},
            bestStreakDays: Math.max(prev.purityTracker.bestStreakDays, elapsedDays),
            resetHistory: [
              {
                id: `pr-${Date.now()}`,
                date: todayKey,
                timestamp: nowIso,
                trigger: trigger?.trim() || undefined,
              },
              ...prev.purityTracker.resetHistory,
            ],
          },
        };
      });
    },
    [updateState]
  );

  // Backup & Restore
  const exportJsonBackup = useCallback(async () => {
    let studyData;
    try {
      studyData = await loadStudyDataFromDB();
    } catch (e) {
      console.warn('Failed to bundle studyData', e);
    }
    const exportedAt = triggerBackupDownload(state, studyData);
    updateState((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        lastBackupExportedAt: exportedAt,
      },
    }));
  }, [state, updateState]);

  const restoreFromBackupState = useCallback(
    (restored: AppState) => {
      updateState(() => ({
        ...restored,
        purityTracker: restored.purityTracker ?? {
          isActive: false,
          streakStartedAt: null,
          cleanDays: {},
          bestStreakDays: 0,
          resetHistory: [],
        },
        prayerSettings: {
          ...restored.prayerSettings,
          customTimes: restored.prayerSettings?.customTimes ?? {},
          adhanEnabled: restored.prayerSettings?.adhanEnabled ?? true,
          adhanSound: restored.prayerSettings?.adhanSound ?? 'makkah',
        },
        preferences: {
          ...restored.preferences,
          bottomNavOffset: restored.preferences?.bottomNavOffset ?? 14,
          hasCompletedTour: restored.preferences?.hasCompletedTour ?? true,
          timeFormat: restored.preferences?.timeFormat ?? '12h',
        },
        auth: {
          ...restored.auth,
          isOnboarded: true,
          isAuthenticated: true,
        },
      }));
    },
    [updateState]
  );

  const resetAllLocalData = useCallback(() => {
    const fresh = createInitialAppState();
    fresh.auth.isOnboarded = true;
    fresh.auth.isAuthenticated = true;
    saveAppStateToStorage(fresh);
    setState(fresh);
  }, []);

  const metrics = useMemo(() => computeUserMetrics(state), [state]);
  const t = TRANSLATIONS[state.preferences.language] ?? TRANSLATIONS.bn;

  const value: AppContextValue = {
    state,
    t,
    metrics,
    isOnline,
    prayerSchedule,
    rawPrayerSchedule,
    customTimeFlags,
    prayerLoading,
    toasts,
    dismissToast,
    pushToast,
    activeAlarm,
    audioUnlocked,
    unlockAudio,
    stopActiveAlarm,
    testAdhanAlarm,
    completeOnboarding,
    continueAsGuest,
    signUpLocal,
    signInLocal,
    resetPasswordLocal,
    signOutLocal,
    updateProfile,
    setManualLocation,
    detectGeolocation,
    updatePrayerSettings,
    updateCustomPrayerTime,
    resetAllCustomPrayerTimes,
    togglePrayerReminder,
    togglePrayerCheckIn,
    toggleFastingDay,
    refreshPrayerSchedule,
    purityStreakDays,
    startPurityStreak,
    stopPurityStreak,
    checkInPurityDay,
    resetPurityStreak,
    addTask,
    updateTask,
    deleteTask,
    clearAllTasks,
    toggleTaskCompletion,
    addCalendarNote,
    deleteCalendarNote,
    setLastRead,
    toggleBookmark,
    toggleMemorizedAyah,
    logQuranSession,
    toggleSurahCompleted,
    updateQuranSettings,
    incrementTasbih,
    resetTasbih,
    setTasbihPhrase,
    setTasbihTarget,
    setLanguage,
    setTimeFormat,
    setDailyTaskGoal,
    setBottomNavOffset,
    completeTour,
    resetTour,
    updateNotifications,
    exportJsonBackup,
    restoreFromBackupState,
    resetAllLocalData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}

