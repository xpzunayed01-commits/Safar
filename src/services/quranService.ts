import { ALL_SURAHS_META } from '../data/surahMeta';
import { BUNDLED_SURAHS } from '../data/bundledQuran';
import type { AyahContent, SurahDetail, SurahMeta } from '../types/app';

const SURAH_CACHE_PREFIX = 'noor_quran_surah_v1_';

export function getSurahMeta(surahNumber: number): SurahMeta {
  return ALL_SURAHS_META.find((s) => s.number === surahNumber) ?? ALL_SURAHS_META[0];
}

export function isSurahCachedLocally(surahNumber: number): boolean {
  if (BUNDLED_SURAHS[surahNumber]) return true;
  try {
    return Boolean(localStorage.getItem(`${SURAH_CACHE_PREFIX}${surahNumber}`));
  } catch {
    return false;
  }
}

export function getAyahAudioUrl(globalAyahNumber: number): string {
  return `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${globalAyahNumber}.mp3`;
}

export async function fetchSurahDetail(surahNumber: number): Promise<SurahDetail> {
  const meta = getSurahMeta(surahNumber);

  // 1. Check localStorage cache first
  try {
    const cached = localStorage.getItem(`${SURAH_CACHE_PREFIX}${surahNumber}`);
    if (cached) {
      const parsed = JSON.parse(cached) as SurahDetail;
      if (parsed && Array.isArray(parsed.ayahs) && parsed.ayahs.length > 0) {
        return { ...parsed, meta, source: 'cache' };
      }
    }
  } catch {
    // Ignore parse error
  }

  // 2. If online, fetch authentic editions from AlQuran Cloud API
  if (navigator.onLine) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 7000);
      const url = `https://api.alquran.cloud/v1/surah/${surahNumber}/editions/quran-uthmani,en.sahih,bn.bengali`;
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (res.ok) {
        const json = await res.json();
        if (json?.code === 200 && Array.isArray(json.data) && json.data.length >= 2) {
          const arabicEdition = json.data[0];
          const enEdition = json.data[1];
          const bnEdition = json.data[2];

          const ayahs: AyahContent[] = arabicEdition.ayahs.map((a: any, idx: number) => ({
            numberInSurah: a.numberInSurah,
            globalNumber: a.number,
            arabic: a.text,
            translationEn: enEdition?.ayahs?.[idx]?.text ?? '',
            translationBn: bnEdition?.ayahs?.[idx]?.text ?? '',
          }));

          const detail: SurahDetail = {
            meta,
            ayahs,
            translationSourceEn: 'Saheeh International (AlQuran Cloud)',
            translationSourceBn: 'Muhiuddin Khan (AlQuran Cloud)',
            source: 'api',
          };

          try {
            localStorage.setItem(`${SURAH_CACHE_PREFIX}${surahNumber}`, JSON.stringify(detail));
          } catch {
            // Storage quota full — skip caching silently
          }

          return detail;
        }
      }
    } catch {
      // Fall through to bundled offline check
    }
  }

  // 3. Check bundled authentic offline Surahs
  const bundled = BUNDLED_SURAHS[surahNumber];
  if (bundled) {
    return {
      meta,
      ayahs: bundled,
      translationSourceEn: 'Saheeh International (Offline Bundle)',
      translationSourceBn: 'Muhiuddin Khan (Offline Bundle)',
      source: 'bundled',
    };
  }

  throw new Error(
    `Surah ${meta.transliteration} is not cached on this device yet. Connect to the internet once to download and cache it for offline reading.`
  );
}
