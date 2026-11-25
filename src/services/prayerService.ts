import {
  CalculationMethod,
  Coordinates,
  Madhab,
  PrayerTimes,
  Qibla,
} from 'adhan';
import type {
  CalculationMethodKey,
  PrayerDaySchedule,
  PrayerName,
  PrayerSettings,
  UserLocation,
} from '../types/app';

const PRAYER_CACHE_KEY = 'noor_prayer_cache_v1';

const ALADHAN_METHOD_MAP: Record<CalculationMethodKey, number> = {
  MuslimWorldLeague: 3,
  NorthAmerica: 2,
  Egyptian: 5,
  UmmAlQura: 4,
  Karachi: 1,
  Dubai: 16,
  Singapore: 11,
  Turkey: 13,
};

export const CALCULATION_METHOD_LABELS: Record<CalculationMethodKey, string> = {
  MuslimWorldLeague: 'Muslim World League (MWL)',
  Karachi: 'Univ. of Islamic Sciences, Karachi',
  NorthAmerica: 'ISNA (North America)',
  Egyptian: 'Egyptian General Authority',
  UmmAlQura: 'Umm Al-Qura University, Makkah',
  Dubai: 'Dubai (UAE)',
  Singapore: 'MUIS (Singapore)',
  Turkey: 'Diyanet (Turkey)',
};

export const CALCULATION_METHOD_LABELS_BN: Record<CalculationMethodKey, string> = {
  MuslimWorldLeague: 'মুসলিম ওয়ার্ল্ড লিগ (MWL)',
  Karachi: 'ইসলামিক সায়েন্সেস বিশ্ববিদ্যালয়, করাচি',
  NorthAmerica: 'ইসনা (ISNA - উত্তর আমেরিকা)',
  Egyptian: 'মিশরীয় জেনারেল অথরিটি',
  UmmAlQura: 'উম্মুল কুরা বিশ্ববিদ্যালয়, মক্কা',
  Dubai: 'দুবাই (সংযুক্ত আরব আমিরাত)',
  Singapore: 'মুইস (সিঙ্গাপুর)',
  Turkey: 'দিয়ানেত (তুরস্ক)',
};

export const PRAYER_NAME_BN: Record<PrayerName, string> = {
  fajr: 'ফজর',
  dhuhr: 'যোহর',
  asr: 'আসর',
  maghrib: 'মাগরিব',
  isha: 'এশা',
};

const HIJRI_MONTHS_BN: Record<number, string> = {
  1: 'মুহররম',
  2: 'সফর',
  3: 'রবিউল আউয়াল',
  4: 'রবিউস সানি',
  5: 'জুমাদাল উলা',
  6: 'জুমাদাল আখিরাহ',
  7: 'রজব',
  8: 'শাবান',
  9: 'রমজান',
  10: 'শাওয়াল',
  11: 'জিলকদ',
  12: 'জিলহজ',
};

export function toBanglaDigits(input: string | number): string {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(input).replace(/\d/g, (d) => bnDigits[Number(d)] ?? d);
}

export function formatHijriDateLocalized(
  schedule: Pick<PrayerDaySchedule, 'hijriDateFormatted' | 'hijriMonthNumber' | 'hijriYear'>,
  isBn: boolean
): string {
  if (!isBn) return schedule.hijriDateFormatted;
  const dayMatch = schedule.hijriDateFormatted.match(/\b(\d{1,2})\b/);
  const yearMatch = schedule.hijriYear || schedule.hijriDateFormatted.match(/\b(\d{4})\b/)?.[1] || '';
  const monthBn = HIJRI_MONTHS_BN[schedule.hijriMonthNumber] ?? '';
  if (dayMatch && monthBn && yearMatch) {
    return `${toBanglaDigits(dayMatch[1])} ${monthBn} ${toBanglaDigits(yearMatch)} হিজরি`;
  }
  return toBanglaDigits(schedule.hijriDateFormatted);
}

function getAdhanParams(method: CalculationMethodKey, madhab: 'shafi' | 'hanafi') {
  let params;
  switch (method) {
    case 'Karachi':
      params = CalculationMethod.Karachi();
      break;
    case 'NorthAmerica':
      params = CalculationMethod.NorthAmerica();
      break;
    case 'Egyptian':
      params = CalculationMethod.Egyptian();
      break;
    case 'UmmAlQura':
      params = CalculationMethod.UmmAlQura();
      break;
    case 'Dubai':
      params = CalculationMethod.Dubai();
      break;
    case 'Singapore':
      params = CalculationMethod.Singapore();
      break;
    case 'Turkey':
      params = CalculationMethod.Turkey();
      break;
    default:
      params = CalculationMethod.MuslimWorldLeague();
      break;
  }
  params.madhab = madhab === 'hanafi' ? Madhab.Hanafi : Madhab.Shafi;
  return params;
}

export function getHijriInfo(date: Date): {
  formatted: string;
  monthNumber: number;
  monthName: string;
  year: string;
  isRamadan: boolean;
} {
  try {
    const partsFormatter = new Intl.DateTimeFormat('en-TN-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const numFormatter = new Intl.DateTimeFormat('en-TN-u-ca-islamic-umalqura', {
      month: 'numeric',
      year: 'numeric',
    });
    const formatted = partsFormatter.format(date);
    const parts = numFormatter.formatToParts(date);
    const monthPart = parts.find((p) => p.type === 'month')?.value ?? '1';
    const yearPart = parts.find((p) => p.type === 'year')?.value ?? '';
    const monthNumber = parseInt(monthPart, 10) || 1;
    const monthName =
      new Intl.DateTimeFormat('en-TN-u-ca-islamic-umalqura', { month: 'long' }).format(date);
    return {
      formatted,
      monthNumber,
      monthName,
      year: yearPart,
      isRamadan: monthNumber === 9,
    };
  } catch {
    return {
      formatted: date.toDateString(),
      monthNumber: 1,
      monthName: 'Islamic Calendar',
      year: '',
      isRamadan: false,
    };
  }
}

export function calculateLocalPrayerSchedule(
  location: UserLocation,
  settings: PrayerSettings,
  targetDate: Date = new Date()
): PrayerDaySchedule {
  const coords = new Coordinates(location.latitude, location.longitude);
  const params = getAdhanParams(settings.method, settings.madhab);
  const pt = new PrayerTimes(coords, targetDate, params);
  const hijri = getHijriInfo(targetDate);
  const qiblaDegrees = Math.round(Qibla(coords));
  const dateKey = formatDateKey(targetDate);

  return {
    date: dateKey,
    city: location.city,
    country: location.country,
    hijriDateFormatted: hijri.formatted,
    hijriMonthNumber: hijri.monthNumber,
    hijriMonthName: hijri.monthName,
    hijriYear: hijri.year,
    isRamadan: hijri.isRamadan,
    qiblaDegrees,
    times: {
      fajr: pt.fajr,
      sunrise: pt.sunrise,
      dhuhr: pt.dhuhr,
      asr: pt.asr,
      maghrib: pt.maghrib,
      isha: pt.isha,
    },
    source: 'offline-calculation',
    lastUpdated: new Date().toISOString(),
  };
}

interface CachedPrayerEntry {
  cacheKey: string;
  date: string;
  city: string;
  country: string;
  hijriDateFormatted: string;
  hijriMonthNumber: number;
  hijriMonthName: string;
  hijriYear: string;
  isRamadan: boolean;
  qiblaDegrees: number;
  timesIso: Record<'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha', string>;
  lastUpdated: string;
}

function getCacheKey(
  dateKey: string,
  location: UserLocation,
  settings: PrayerSettings
): string {
  return `${dateKey}_${location.latitude.toFixed(2)}_${location.longitude.toFixed(2)}_${settings.method}_${settings.madhab}`;
}

function parseTimeOnDate(dateKey: string, timeStr: string): Date {
  // Aladhan returns "HH:mm" or "HH:mm (TZ)"
  const clean = timeStr.split(' ')[0];
  const [h, m] = clean.split(':').map((n) => parseInt(n, 10));
  const [year, month, day] = dateKey.split('-').map((n) => parseInt(n, 10));
  return new Date(year, month - 1, day, h || 0, m || 0, 0, 0);
}

export async function fetchPrayerScheduleWithCache(
  location: UserLocation,
  settings: PrayerSettings,
  targetDate: Date = new Date()
): Promise<PrayerDaySchedule> {
  const dateKey = formatDateKey(targetDate);
  const cacheKey = getCacheKey(dateKey, location, settings);
  const localCalculated = calculateLocalPrayerSchedule(location, settings, targetDate);

  // Check local cache first
  try {
    const rawCache = localStorage.getItem(PRAYER_CACHE_KEY);
    if (rawCache) {
      const parsed: CachedPrayerEntry = JSON.parse(rawCache);
      if (parsed.cacheKey === cacheKey) {
        const ageMs = Date.now() - new Date(parsed.lastUpdated).getTime();
        if (ageMs < 1000 * 60 * 60 * 12 || !navigator.onLine) {
          return {
            date: parsed.date,
            city: parsed.city,
            country: parsed.country,
            hijriDateFormatted: parsed.hijriDateFormatted,
            hijriMonthNumber: parsed.hijriMonthNumber,
            hijriMonthName: parsed.hijriMonthName,
            hijriYear: parsed.hijriYear,
            isRamadan: parsed.isRamadan,
            qiblaDegrees: parsed.qiblaDegrees,
            times: {
              fajr: new Date(parsed.timesIso.fajr),
              sunrise: new Date(parsed.timesIso.sunrise),
              dhuhr: new Date(parsed.timesIso.dhuhr),
              asr: new Date(parsed.timesIso.asr),
              maghrib: new Date(parsed.timesIso.maghrib),
              isha: new Date(parsed.timesIso.isha),
            },
            source: 'aladhan-cache',
            lastUpdated: parsed.lastUpdated,
          };
        }
      }
    }
  } catch {
    // Ignore malformed cache
  }

  if (!navigator.onLine) {
    return localCalculated;
  }

  try {
    const [year, month, day] = dateKey.split('-');
    const aladhanDate = `${day}-${month}-${year}`;
    const methodNum = ALADHAN_METHOD_MAP[settings.method] ?? 3;
    const school = settings.madhab === 'hanafi' ? 1 : 0;
    const url = `https://api.aladhan.com/v1/timings/${aladhanDate}?latitude=${location.latitude}&longitude=${location.longitude}&method=${methodNum}&school=${school}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) {
      return localCalculated;
    }

    const json = await res.json();
    if (json?.code !== 200 || !json?.data?.timings) {
      return localCalculated;
    }

    const t = json.data.timings;
    const hijriData = json.data.date?.hijri;
    const hijriMonthNumber = parseInt(String(hijriData?.month?.number ?? localCalculated.hijriMonthNumber), 10);
    const hijriMonthName = hijriData?.month?.en ?? localCalculated.hijriMonthName;
    const hijriYear = hijriData?.year ?? localCalculated.hijriYear;
    const hijriDay = hijriData?.day ?? '';
    const hijriFormatted = hijriDay
      ? `${hijriDay} ${hijriMonthName} ${hijriYear} AH`
      : localCalculated.hijriDateFormatted;

    const times = {
      fajr: parseTimeOnDate(dateKey, t.Fajr),
      sunrise: parseTimeOnDate(dateKey, t.Sunrise),
      dhuhr: parseTimeOnDate(dateKey, t.Dhuhr),
      asr: parseTimeOnDate(dateKey, t.Asr),
      maghrib: parseTimeOnDate(dateKey, t.Maghrib),
      isha: parseTimeOnDate(dateKey, t.Isha),
    };

    const nowIso = new Date().toISOString();
    const cachePayload: CachedPrayerEntry = {
      cacheKey,
      date: dateKey,
      city: location.city,
      country: location.country,
      hijriDateFormatted: hijriFormatted,
      hijriMonthNumber,
      hijriMonthName,
      hijriYear,
      isRamadan: hijriMonthNumber === 9,
      qiblaDegrees: localCalculated.qiblaDegrees,
      timesIso: {
        fajr: times.fajr.toISOString(),
        sunrise: times.sunrise.toISOString(),
        dhuhr: times.dhuhr.toISOString(),
        asr: times.asr.toISOString(),
        maghrib: times.maghrib.toISOString(),
        isha: times.isha.toISOString(),
      },
      lastUpdated: nowIso,
    };

    try {
      localStorage.setItem(PRAYER_CACHE_KEY, JSON.stringify(cachePayload));
    } catch {
      // Ignore storage quota errors
    }

    return {
      date: dateKey,
      city: location.city,
      country: location.country,
      hijriDateFormatted: hijriFormatted,
      hijriMonthNumber,
      hijriMonthName,
      hijriYear,
      isRamadan: hijriMonthNumber === 9,
      qiblaDegrees: localCalculated.qiblaDegrees,
      times,
      source: 'aladhan-api',
      lastUpdated: nowIso,
    };
  } catch {
    return localCalculated;
  }
}

export function getNextPrayerInfo(
  schedule: PrayerDaySchedule,
  now: Date = new Date()
): {
  currentPrayer: PrayerName | 'isha';
  nextPrayer: PrayerName;
  nextPrayerTime: Date;
  remainingMs: number;
  remainingFormatted: string;
  dayProgressPercent: number;
} {
  const ordered: Array<{ name: PrayerName; time: Date }> = [
    { name: 'fajr', time: schedule.times.fajr },
    { name: 'dhuhr', time: schedule.times.dhuhr },
    { name: 'asr', time: schedule.times.asr },
    { name: 'maghrib', time: schedule.times.maghrib },
    { name: 'isha', time: schedule.times.isha },
  ];

  let next = ordered.find((p) => p.time.getTime() > now.getTime());
  let currentPrayer: PrayerName = 'isha';

  if (!next) {
    // Next is tomorrow's Fajr
    const tomorrowFajr = new Date(schedule.times.fajr.getTime() + 24 * 60 * 60 * 1000);
    next = { name: 'fajr', time: tomorrowFajr };
    currentPrayer = 'isha';
  } else {
    const idx = ordered.findIndex((p) => p.name === next!.name);
    currentPrayer = idx > 0 ? ordered[idx - 1].name : 'isha';
  }

  const remainingMs = Math.max(0, next.time.getTime() - now.getTime());
  const totalSec = Math.floor(remainingMs / 1000);
  const hours = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  const remainingFormatted = `${hours}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  // Daylight/prayer arc progress between Fajr and Isha
  const fajrMs = schedule.times.fajr.getTime();
  const ishaMs = schedule.times.isha.getTime();
  const rawPct = ((now.getTime() - fajrMs) / Math.max(1, ishaMs - fajrMs)) * 100;
  const dayProgressPercent = Math.min(100, Math.max(4, Math.round(rawPct)));

  return {
    currentPrayer,
    nextPrayer: next.name,
    nextPrayerTime: next.time,
    remainingMs,
    remainingFormatted,
    dayProgressPercent,
  };
}

function getBanglaDayPeriod(h24: number): string {
  if (h24 >= 4 && h24 < 6) return 'ভোর';
  if (h24 >= 6 && h24 < 12) return 'সকাল';
  if (h24 >= 12 && h24 < 16) return 'দুপুর';
  if (h24 >= 16 && h24 < 18) return 'বিকাল';
  if (h24 >= 18 && h24 < 20) return 'সন্ধ্যা';
  return 'রাত';
}

export function formatTime12h(date: Date, isBn: boolean = false): string {
  if (!isBn) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  }
  const h24 = date.getHours();
  const h12 = h24 % 12 || 12;
  const mins = String(date.getMinutes()).padStart(2, '0');
  const period = getBanglaDayPeriod(h24);
  return `${period} ${toBanglaDigits(String(h12).padStart(2, '0'))}:${toBanglaDigits(mins)}`;
}

export function formatTime24h(date: Date, isBn: boolean = false): string {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const raw = `${hh}:${mm}`;
  return isBn ? toBanglaDigits(raw) : raw;
}

export function formatTimeDisplay(
  date: Date,
  isBn: boolean = false,
  timeFormat: '12h' | '24h' = '12h'
): string {
  return timeFormat === '24h' ? formatTime24h(date, isBn) : formatTime12h(date, isBn);
}

export function formatHHmmDisplay(
  hhmm: string,
  isBn: boolean = false,
  timeFormat: '12h' | '24h' = '12h'
): string {
  const match = hhmm.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return isBn ? toBanglaDigits(hhmm) : hhmm;
  const hh = Math.min(23, Math.max(0, parseInt(match[1], 10)));
  const mm = Math.min(59, Math.max(0, parseInt(match[2], 10)));
  const temp = new Date();
  temp.setHours(hh, mm, 0, 0);
  return formatTimeDisplay(temp, isBn, timeFormat);
}

export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function reverseGeocodeApprox(lat: number, lon: number, presetCities: UserLocation[]): UserLocation {
  let closest = presetCities[0];
  let bestDist = Infinity;
  for (const c of presetCities) {
    const d = Math.hypot(c.latitude - lat, c.longitude - lon);
    if (d < bestDist) {
      bestDist = d;
      closest = c;
    }
  }
  if (bestDist < 1.2) {
    return {
      ...closest,
      latitude: lat,
      longitude: lon,
      source: 'geolocation',
    };
  }
  return {
    city: `Lat ${lat.toFixed(2)}°, Lon ${lon.toFixed(2)}°`,
    country: 'Current Location',
    latitude: lat,
    longitude: lon,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    source: 'geolocation',
  };
}

export function applyCustomPrayerTimes(
  schedule: PrayerDaySchedule,
  customTimes?: Partial<Record<PrayerName, string>>
): { schedule: PrayerDaySchedule; isCustom: Record<PrayerName, boolean> } {
  const isCustom: Record<PrayerName, boolean> = {
    fajr: false,
    dhuhr: false,
    asr: false,
    maghrib: false,
    isha: false,
  };
  if (!customTimes) {
    return { schedule, isCustom };
  }

  const nextTimes = { ...schedule.times };
  const [y, m, d] = schedule.date.split('-').map((n) => parseInt(n, 10));

  (['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as PrayerName[]).forEach((prayer) => {
    const val = customTimes[prayer];
    if (val && /^\d{1,2}:\d{2}$/.test(val)) {
      const [hh, mm] = val.split(':').map((n) => parseInt(n, 10));
      if (!Number.isNaN(hh) && !Number.isNaN(mm) && hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59) {
        nextTimes[prayer] = new Date(y, m - 1, d, hh, mm, 0, 0);
        isCustom[prayer] = true;
      }
    }
  });

  return {
    schedule: {
      ...schedule,
      times: nextTimes,
    },
    isCustom,
  };
}

export interface WorldwideCityResult extends UserLocation {
  region?: string;
}

export async function searchWorldwideCities(query: string): Promise<WorldwideCityResult[]> {
  const q = query.trim();
  if (q.length < 2 || (typeof navigator !== 'undefined' && !navigator.onLine)) {
    return [];
  }
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      q
    )}&count=20&language=en&format=json`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data?.results)) return [];

    return data.results.map(
      (item: {
        name?: string;
        country?: string;
        admin1?: string;
        latitude: number;
        longitude: number;
        timezone?: string;
      }): WorldwideCityResult => ({
        city: item.name || q,
        country: item.country || item.admin1 || 'World',
        region: item.admin1 && item.admin1 !== item.name ? item.admin1 : undefined,
        latitude: Number(item.latitude),
        longitude: Number(item.longitude),
        timezone: item.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        source: 'manual',
      })
    );
  } catch {
    return [];
  }
}

export async function reverseGeocodeWorldwide(
  lat: number,
  lon: number,
  presetCities: UserLocation[]
): Promise<UserLocation> {
  if (typeof navigator !== 'undefined' && navigator.onLine) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4500);
      const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      if (res.ok) {
        const json = await res.json();
        const cityName =
          json?.city ||
          json?.locality ||
          json?.principalSubdivision ||
          'Current Location';
        const countryName = json?.countryName || 'Current Location';
        return {
          city: cityName,
          country: countryName,
          latitude: lat,
          longitude: lon,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
          source: 'geolocation',
        };
      }
    } catch {
      // Fallback to offline preset proximity
    }
  }
  return reverseGeocodeApprox(lat, lon, presetCities);
}

