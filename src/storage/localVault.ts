import { APP_CONFIG } from '../config/app';
import { PRESET_CITIES } from '../data/cities';
import { BADGE_CATALOG, computeUserMetrics } from '../data/badges';
import type { AppState } from '../types/app';

export function createInitialAppState(): AppState {
  const nowIso = new Date().toISOString();

  return {
    schemaVersion: APP_CONFIG.backupSchemaVersion,
    auth: {
      mode: 'guest',
      isOnboarded: false,
      isAuthenticated: false,
      account: {
        name: 'অতিথি মুমিন',
        email: '',
        memberSince: nowIso,
        avatarId: 'emerald-crescent',
      },
    },
    location: { ...PRESET_CITIES[0] }, // ঢাকা, বাংলাদেশ
    prayerSettings: {
      method: 'MuslimWorldLeague',
      madhab: 'hanafi',
      reminders: {
        fajr: true,
        dhuhr: true,
        asr: true,
        maghrib: true,
        isha: true,
      },
      customTimes: {},
      adhanEnabled: true,
      adhanSound: 'makkah',
    },
    prayerCheckIns: {},
    fastingDays: {},
    purityTracker: {
      isActive: false,
      streakStartedAt: null,
      cleanDays: {},
      bestStreakDays: 0,
      resetHistory: [],
    },
    tasks: [],
    notes: [],
    quranProgress: {
      lastRead: {
        surahNumber: 1,
        surahName: 'Al-Fatihah',
        ayahNumber: 1,
        timestamp: nowIso,
      },
      bookmarks: [],
      completedSurahs: [],
      memorizedAyahs: {},
      sessions: [],
      fontSize: 26,
      showTranslation: true,
      translationLang: 'bn',
    },
    activityLog: {},
    earnedBadges: {},
    notifications: {
      prayers: true,
      tasks: true,
      quranReminder: false,
      quranReminderTime: '20:30',
    },
    preferences: {
      language: 'bn',
      dailyTaskGoal: 5,
      tasbihCount: 0,
      tasbihTarget: 33,
      tasbihPhraseIndex: 0,
      bottomNavOffset: 14,
      hasCompletedTour: false,
      timeFormat: '12h',
    },
  };
}

export function loadAppStateFromStorage(): AppState {
  const fallback = createInitialAppState();
  try {
    const raw = localStorage.getItem(APP_CONFIG.storageKey);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    if (!parsed || typeof parsed !== 'object') return fallback;

    return {
      ...fallback,
      ...parsed,
      auth: {
        ...fallback.auth,
        ...(parsed.auth ?? {}),
        account: {
          ...fallback.auth.account,
          ...(parsed.auth?.account ?? {}),
        },
      },
      location: {
        ...fallback.location,
        ...(parsed.location ?? {}),
      },
      prayerSettings: {
        ...fallback.prayerSettings,
        ...(parsed.prayerSettings ?? {}),
        reminders: {
          ...fallback.prayerSettings.reminders,
          ...(parsed.prayerSettings?.reminders ?? {}),
        },
        customTimes: {
          ...(parsed.prayerSettings?.customTimes ?? {}),
        },
        adhanEnabled: parsed.prayerSettings?.adhanEnabled ?? true,
        adhanSound: parsed.prayerSettings?.adhanSound ?? 'makkah',
      },
      quranProgress: {
        ...fallback.quranProgress,
        ...(parsed.quranProgress ?? {}),
        translationLang:
          localStorage.getItem('noor_bn_migrated_v2') === '1'
            ? (parsed.quranProgress?.translationLang ?? 'bn')
            : 'bn',
        lastRead: {
          ...fallback.quranProgress.lastRead,
          ...(parsed.quranProgress?.lastRead ?? {}),
        },
      },
      notifications: {
        ...fallback.notifications,
        ...(parsed.notifications ?? {}),
      },
      preferences: {
        ...fallback.preferences,
        ...(parsed.preferences ?? {}),
        bottomNavOffset: parsed.preferences?.bottomNavOffset ?? 14,
        hasCompletedTour: parsed.preferences?.hasCompletedTour ?? false,
        timeFormat: parsed.preferences?.timeFormat ?? '12h',
        language: (
          localStorage.getItem('noor_bn_migrated_v2') === '1'
            ? (parsed.preferences?.language ?? 'bn')
            : (() => {
                localStorage.setItem('noor_bn_migrated_v2', '1');
                return 'bn' as const;
              })()
        ),
      },
      prayerCheckIns: parsed.prayerCheckIns ?? {},
      fastingDays: parsed.fastingDays ?? {},
      tasks: (() => {
        if (localStorage.getItem('safar_planner_cleaned_v2') !== '1') {
          localStorage.setItem('safar_planner_cleaned_v2', '1');
          return [];
        }
        return Array.isArray(parsed.tasks) ? parsed.tasks : [];
      })(),
      notes: Array.isArray(parsed.notes) ? parsed.notes : [],
      activityLog: parsed.activityLog ?? {},
      earnedBadges: parsed.earnedBadges ?? {},
    };
  } catch {
    return fallback;
  }
}

export function saveAppStateToStorage(state: AppState): void {
  try {
    localStorage.setItem(APP_CONFIG.storageKey, JSON.stringify(state));
  } catch {
    // Handle storage quota issues safely
  }
}

/**
 * Evaluates all badges against current user metrics and records newly unlocked badges
 * without ever duplicating already-earned badges.
 */
export function evaluateAndAwardBadges(state: AppState): {
  nextEarnedBadges: AppState['earnedBadges'];
  newlyUnlockedIds: string[];
} {
  const metrics = computeUserMetrics(state);
  const nextEarnedBadges = { ...state.earnedBadges };
  const newlyUnlockedIds: string[] = [];
  const nowIso = new Date().toISOString();

  for (const badge of BADGE_CATALOG) {
    if (nextEarnedBadges[badge.id]) continue; // Never duplicate
    const current = badge.evaluateProgress(state, metrics);
    if (current >= badge.targetValue) {
      nextEarnedBadges[badge.id] = {
        badgeId: badge.id,
        earnedAt: nowIso,
      };
      newlyUnlockedIds.push(badge.id);
    }
  }

  return { nextEarnedBadges, newlyUnlockedIds };
}

export async function hashPasswordLocal(password: string): Promise<string> {
  try {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const encoded = new TextEncoder().encode(`noor-local-salt::${password}`);
      const digest = await crypto.subtle.digest('SHA-256', encoded);
      return Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }
  } catch {
    // Fallback if subtle crypto unavailable
  }
  let h = 2166136261;
  for (let i = 0; i < password.length; i++) {
    h ^= password.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `fnv-${(h >>> 0).toString(16)}`;
}
