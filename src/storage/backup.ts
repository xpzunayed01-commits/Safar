import { APP_CONFIG } from '../config/app';
import { formatDateKey } from '../services/prayerService';
import type { AppState } from '../types/app';
import type { SSCStudyData } from '../types/ssc';

export interface BackupEnvelope {
  app: string;
  schemaVersion: number;
  exportedAt: string;
  data: AppState;
  studyData?: SSCStudyData;
}

export interface BackupValidationResult {
  valid: boolean;
  error?: string;
  envelope?: BackupEnvelope;
  summary?: {
    tasksCount: number;
    prayersCheckedCount: number;
    bookmarksCount: number;
    badgesCount: number;
    studyChaptersCount?: number;
    exportedAt: string;
    accountName: string;
  };
}

export function buildBackupJson(state: AppState, studyData?: SSCStudyData): string {
  const envelope: BackupEnvelope = {
    app: 'noor-islamic-companion',
    schemaVersion: APP_CONFIG.backupSchemaVersion,
    exportedAt: new Date().toISOString(),
    data: state,
    ...(studyData ? { studyData } : {}),
  };
  return JSON.stringify(envelope, null, 2);
}

export function triggerBackupDownload(state: AppState, studyData?: SSCStudyData): string {
  const exportedAt = new Date().toISOString();
  const updatedState: AppState = {
    ...state,
    preferences: {
      ...state.preferences,
      lastBackupExportedAt: exportedAt,
    },
  };
  const json = buildBackupJson(updatedState, studyData);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `safar-backup-${formatDateKey(new Date())}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return exportedAt;
}

export function validateBackupJson(rawText: string): BackupValidationResult {
  if (!rawText || typeof rawText !== 'string') {
    return { valid: false, error: 'নির্বাচিত ফাইলটি খালি রয়েছে।' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return { valid: false, error: 'ভুল JSON ফরম্যাট। আপনার আগের কোনো তথ্য পরিবর্তন করা হয়নি।' };
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { valid: false, error: 'ব্যাকআপ ফাইলটি একটি বৈধ JSON অবজেক্ট হতে হবে।' };
  }

  const obj = parsed as Record<string, unknown>;
  if (obj.app !== 'noor-islamic-companion' && obj.app !== 'safar-islamic-companion') {
    return {
      valid: false,
      error: 'এই JSON ফাইলটি Safar অ্যাপের বৈধ ব্যাকআপ নয়।',
    };
  }

  if (typeof obj.schemaVersion !== 'number' || obj.schemaVersion > APP_CONFIG.backupSchemaVersion) {
    return {
      valid: false,
      error: 'এই ব্যাকআপ স্কিমা সংস্করণটি সমর্থিত নয়। আগের তথ্য নিরাপদ রাখা হয়েছে।',
    };
  }

  const data = obj.data as Record<string, unknown> | undefined;
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { valid: false, error: 'ব্যাকআপ ফাইলে মূল ডেটা অংশ পাওয়া যায়নি।' };
  }

  // Structural validation of required top-level keys
  const requiredObjectKeys = ['auth', 'location', 'prayerSettings', 'prayerCheckIns', 'quranProgress', 'preferences'];
  for (const key of requiredObjectKeys) {
    if (!data[key] || typeof data[key] !== 'object' || Array.isArray(data[key])) {
      return {
        valid: false,
        error: `ব্যাকআপ ফাইলের "${key}" অংশটি ত্রুটিপূর্ণ বা অনুপস্থিত। আগের তথ্য অপরিবর্তিত আছে।`,
      };
    }
  }

  if (!Array.isArray(data.tasks)) {
    return {
      valid: false,
      error: 'ব্যাকআপ ফাইলের আমলের তালিকা সঠিক নয়। আগের তথ্য অপরিবর্তিত আছে।',
    };
  }

  // Validate each task has minimal required fields
  for (const t of data.tasks) {
    if (!t || typeof t !== 'object' || typeof (t as any).id !== 'string' || typeof (t as any).title !== 'string') {
      return {
        valid: false,
        error: 'ব্যাকআপ ফাইলের এক বা একাধিক আমলের তথ্য ত্রুটিপূর্ণ। রিস্টোর বাতিল করা হয়েছে।',
      };
    }
  }

  const typedData = data as unknown as AppState;
  const prayersCheckedCount = Object.values(typedData.prayerCheckIns).reduce(
    (sum, rec) => sum + Object.values(rec || {}).filter(Boolean).length,
    0
  );

  const rawStudy = obj.studyData as Record<string, unknown> | undefined;
  let validatedStudyData: SSCStudyData | undefined = undefined;
  if (rawStudy && typeof rawStudy === 'object' && Array.isArray(rawStudy.chapters)) {
    validatedStudyData = rawStudy as unknown as SSCStudyData;
  }

  return {
    valid: true,
    envelope: {
      app: 'noor-islamic-companion',
      schemaVersion: obj.schemaVersion as number,
      exportedAt: typeof obj.exportedAt === 'string' ? obj.exportedAt : new Date().toISOString(),
      data: typedData,
      studyData: validatedStudyData,
    },
    summary: {
      tasksCount: typedData.tasks.length,
      prayersCheckedCount,
      bookmarksCount: Array.isArray(typedData.quranProgress?.bookmarks)
        ? typedData.quranProgress.bookmarks.length
        : 0,
      badgesCount: Object.keys(typedData.earnedBadges || {}).length,
      studyChaptersCount: validatedStudyData ? validatedStudyData.chapters.length : undefined,
      exportedAt: typeof obj.exportedAt === 'string' ? obj.exportedAt : 'অজানা',
      accountName: typedData.auth?.account?.name || 'অতিথি মুমিন',
    },
  };
}
