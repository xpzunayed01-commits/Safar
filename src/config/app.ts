export const APP_CONFIG = {
  // সহজে পরিবর্তনযোগ্য অ্যাপের নাম
  name: 'Safar',
  nameLatin: 'Safar',
  tagline: 'ইসলামিক দৈনিক সঙ্গী ও প্ল্যানার',
  version: '1.0.0',
  storageKey: 'noor_islamic_companion_v1',
  backupSchemaVersion: 1,
} as const;

export type SupportedLanguage = 'en' | 'bn' | 'ar';
