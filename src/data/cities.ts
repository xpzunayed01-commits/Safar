import type { UserLocation } from '../types/app';

export const PRESET_CITIES: UserLocation[] = [
  { city: 'Dhaka', country: 'Bangladesh', latitude: 23.8103, longitude: 90.4125, timezone: 'Asia/Dhaka', source: 'manual' },
  { city: 'Sylhet', country: 'Bangladesh', latitude: 24.8949, longitude: 91.8687, timezone: 'Asia/Dhaka', source: 'manual' },
  { city: 'Chattogram', country: 'Bangladesh', latitude: 22.3569, longitude: 91.7832, timezone: 'Asia/Dhaka', source: 'manual' },
  { city: 'Makkah', country: 'Saudi Arabia', latitude: 21.3891, longitude: 39.8579, timezone: 'Asia/Riyadh', source: 'manual' },
  { city: 'Madinah', country: 'Saudi Arabia', latitude: 24.5247, longitude: 39.5692, timezone: 'Asia/Riyadh', source: 'manual' },
  { city: 'Riyadh', country: 'Saudi Arabia', latitude: 24.7136, longitude: 46.6753, timezone: 'Asia/Riyadh', source: 'manual' },
  { city: 'Dubai', country: 'UAE', latitude: 25.2048, longitude: 55.2708, timezone: 'Asia/Dubai', source: 'manual' },
  { city: 'Doha', country: 'Qatar', latitude: 25.2854, longitude: 51.531, timezone: 'Asia/Qatar', source: 'manual' },
  { city: 'Cairo', country: 'Egypt', latitude: 30.0444, longitude: 31.2357, timezone: 'Africa/Cairo', source: 'manual' },
  { city: 'Istanbul', country: 'Turkey', latitude: 41.0082, longitude: 28.9784, timezone: 'Europe/Istanbul', source: 'manual' },
  { city: 'Kuala Lumpur', country: 'Malaysia', latitude: 3.139, longitude: 101.6869, timezone: 'Asia/Kuala_Lumpur', source: 'manual' },
  { city: 'Jakarta', country: 'Indonesia', latitude: -6.2088, longitude: 106.8456, timezone: 'Asia/Jakarta', source: 'manual' },
  { city: 'Singapore', country: 'Singapore', latitude: 1.3521, longitude: 103.8198, timezone: 'Asia/Singapore', source: 'manual' },
  { city: 'Karachi', country: 'Pakistan', latitude: 24.8607, longitude: 67.0011, timezone: 'Asia/Karachi', source: 'manual' },
  { city: 'Lahore', country: 'Pakistan', latitude: 31.5204, longitude: 74.3587, timezone: 'Asia/Karachi', source: 'manual' },
  { city: 'New Delhi', country: 'India', latitude: 28.6139, longitude: 77.209, timezone: 'Asia/Kolkata', source: 'manual' },
  { city: 'London', country: 'United Kingdom', latitude: 51.5072, longitude: -0.1276, timezone: 'Europe/London', source: 'manual' },
  { city: 'Paris', country: 'France', latitude: 48.8566, longitude: 2.3522, timezone: 'Europe/Paris', source: 'manual' },
  { city: 'New York', country: 'United States', latitude: 40.7128, longitude: -74.006, timezone: 'America/New_York', source: 'manual' },
  { city: 'Los Angeles', country: 'United States', latitude: 34.0522, longitude: -118.2437, timezone: 'America/Los_Angeles', source: 'manual' },
  { city: 'Toronto', country: 'Canada', latitude: 43.6532, longitude: -79.3832, timezone: 'America/Toronto', source: 'manual' },
  { city: 'Sydney', country: 'Australia', latitude: -33.8688, longitude: 151.2093, timezone: 'Australia/Sydney', source: 'manual' },
  { city: 'Tokyo', country: 'Japan', latitude: 35.6762, longitude: 139.6503, timezone: 'Asia/Tokyo', source: 'manual' },
];

export const CITY_BN: Record<string, string> = {
  Dhaka: 'ঢাকা',
  Sylhet: 'সিলেট',
  Chattogram: 'চট্টগ্রাম',
  Makkah: 'মক্কা',
  Madinah: 'মদিনা',
  Riyadh: 'রিয়াদ',
  Dubai: 'দুবাই',
  Doha: 'দোহা',
  Cairo: 'কায়রো',
  Istanbul: 'ইস্তাম্বুল',
  'Kuala Lumpur': 'কুয়ালালামপুর',
  Jakarta: 'জাকার্তা',
  Singapore: 'সিঙ্গাপুর',
  Karachi: 'করাচি',
  Lahore: 'লাহোর',
  'New Delhi': 'নয়াদিল্লি',
  London: 'লন্ডন',
  Paris: 'প্যারিস',
  'New York': 'নিউ ইয়র্ক',
  'Los Angeles': 'লস অ্যাঞ্জেলেস',
  Toronto: 'টরন্টো',
  Sydney: 'সিডনি',
  Tokyo: 'টোকিও',
};

export const COUNTRY_BN: Record<string, string> = {
  Bangladesh: 'বাংলাদেশ',
  'Saudi Arabia': 'সৌদি আরব',
  UAE: 'সংযুক্ত আরব আমিরাত',
  Qatar: 'কাতার',
  Egypt: 'মিশর',
  Turkey: 'তুরস্ক',
  Malaysia: 'মালয়েশিয়া',
  Indonesia: 'ইন্দোনেশিয়া',
  Singapore: 'সিঙ্গাপুর',
  Pakistan: 'পাকিস্তান',
  India: 'ভারত',
  'United Kingdom': 'যুক্তরাজ্য',
  France: 'ফ্রান্স',
  'United States': 'যুক্তরাষ্ট্র',
  Canada: 'কানাডা',
  Australia: 'অস্ট্রেলিয়া',
  Japan: 'জাপান',
  'Current Location': 'বর্তমান অবস্থান',
};

export function localizeLocation(
  city: string,
  country: string,
  isBn: boolean
): { city: string; country: string } {
  if (!isBn) return { city, country };
  return {
    city: CITY_BN[city] ?? city,
    country: COUNTRY_BN[country] ?? country,
  };
}
