import { createInitialSSCStudyData } from '../data/sscPreloadedData';
import type { SSCStudyData } from '../types/ssc';

const DB_NAME = 'NoorSSCStudyDB';
const DB_VERSION = 1;
const LOCAL_STORAGE_FALLBACK_KEY = 'noor_ssc_study_vault_v1';

function getIndexedDB(): IDBFactory | undefined {
  if (typeof window !== 'undefined' && 'indexedDB' in window) {
    return window.indexedDB;
  }
  return undefined;
}

export function openStudyDB(): Promise<IDBDatabase | null> {
  const idb = getIndexedDB();
  if (!idb) return Promise.resolve(null);

  return new Promise((resolve) => {
    try {
      const request = idb.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('ssc_bundle')) {
          db.createObjectStore('ssc_bundle');
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.warn('IndexedDB open error, falling back to localStorage');
        resolve(null);
      };
    } catch (err) {
      console.warn('IndexedDB not supported or permission denied', err);
      resolve(null);
    }
  });
}

export async function loadStudyDataFromDB(): Promise<SSCStudyData> {
  const fallback = createInitialSSCStudyData();

  // One-time migration: wipe legacy preloaded subjects & chapters for fresh user-controlled experience
  if (typeof window !== 'undefined' && window.localStorage) {
    if (localStorage.getItem('safar_ssc_cleaned_v2') !== '1') {
      localStorage.setItem('safar_ssc_cleaned_v2', '1');
      await saveStudyDataToDB(fallback);
      return fallback;
    }
  }

  // 1. Try IndexedDB
  const db = await openStudyDB();
  if (db) {
    try {
      const result = await new Promise<SSCStudyData | null>((resolve) => {
        const tx = db.transaction('ssc_bundle', 'readonly');
        const store = tx.objectStore('ssc_bundle');
        const req = store.get('root');

        req.onsuccess = () => {
          resolve(req.result as SSCStudyData | null);
        };
        req.onerror = () => {
          resolve(null);
        };
      });

      if (result && typeof result === 'object' && result.subjects && result.chapters) {
        return {
          ...fallback,
          ...result,
          config: { ...fallback.config, ...(result.config || {}) },
          subjects: Array.isArray(result.subjects) ? result.subjects : fallback.subjects,
          chapters: Array.isArray(result.chapters) ? result.chapters : fallback.chapters,
          studyPlans: Array.isArray(result.studyPlans) ? result.studyPlans : fallback.studyPlans,
          modelTests: Array.isArray(result.modelTests) ? result.modelTests : fallback.modelTests,
          studySessions: Array.isArray(result.studySessions) ? result.studySessions : fallback.studySessions,
          studyNotes: Array.isArray(result.studyNotes) ? result.studyNotes : fallback.studyNotes,
        };
      }
    } catch (e) {
      console.warn('Failed to read from IndexedDB', e);
    }
  }

  // 2. Try localStorage fallback
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_FALLBACK_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<SSCStudyData>;
        if (parsed && typeof parsed === 'object') {
          return {
            ...fallback,
            ...parsed,
            config: { ...fallback.config, ...(parsed.config || {}) },
            subjects: Array.isArray(parsed.subjects) ? parsed.subjects : fallback.subjects,
            chapters: Array.isArray(parsed.chapters) ? parsed.chapters : fallback.chapters,
            studyPlans: Array.isArray(parsed.studyPlans) ? parsed.studyPlans : fallback.studyPlans,
            modelTests: Array.isArray(parsed.modelTests) ? parsed.modelTests : fallback.modelTests,
            studySessions: Array.isArray(parsed.studySessions) ? parsed.studySessions : fallback.studySessions,
            studyNotes: Array.isArray(parsed.studyNotes) ? parsed.studyNotes : fallback.studyNotes,
          };
        }
      }
    } catch (e) {
      console.warn('Failed to read from localStorage', e);
    }
  }

  // 3. First time launch: save pre-populated data into IndexedDB and localStorage
  void saveStudyDataToDB(fallback);
  return fallback;
}

export async function saveStudyDataToDB(data: SSCStudyData): Promise<void> {
  // Always mirror to localStorage as immediate backup
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(LOCAL_STORAGE_FALLBACK_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('localStorage save warning', e);
    }
  }

  // Save to IndexedDB
  const db = await openStudyDB();
  if (!db) return;

  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('ssc_bundle', 'readwrite');
      const store = tx.objectStore('ssc_bundle');
      const req = store.put(data, 'root');

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn('IndexedDB write warning', e);
  }
}

export async function resetStudyDataDB(): Promise<SSCStudyData> {
  const fresh = createInitialSSCStudyData();
  await saveStudyDataToDB(fresh);
  return fresh;
}
