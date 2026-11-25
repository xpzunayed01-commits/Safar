import React, { useEffect, useMemo, useState } from 'react';
import { Globe, Loader2, LocateFixed, MapPin, Search, X } from 'lucide-react';
import { CITY_BN, COUNTRY_BN, localizeLocation, PRESET_CITIES } from '../data/cities';
import { searchWorldwideCities, type WorldwideCityResult } from '../services/prayerService';
import { useApp } from '../context/AppContext';

interface Props {
  open: boolean;
  onClose: () => void;
}

export const LocationPickerModal: React.FC<Props> = ({ open, onClose }) => {
  const { state, isOnline, setManualLocation, detectGeolocation } = useApp();
  const isBn = state.preferences.language === 'bn';
  const [query, setQuery] = useState('');
  const [geoStatus, setGeoStatus] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [globalResults, setGlobalResults] = useState<WorldwideCityResult[]>([]);
  const [searchingGlobal, setSearchingGlobal] = useState(false);

  const currentLocalized = localizeLocation(state.location.city, state.location.country, isBn);

  const localFiltered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PRESET_CITIES;
    return PRESET_CITIES.filter((c) => {
      const cityBn = (CITY_BN[c.city] ?? '').toLowerCase();
      const countryBn = (COUNTRY_BN[c.country] ?? '').toLowerCase();
      return (
        c.city.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q) ||
        cityBn.includes(q) ||
        countryBn.includes(q)
      );
    });
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length < 2 || !isOnline) {
      setGlobalResults([]);
      setSearchingGlobal(false);
      return;
    }

    let cancelled = false;
    setSearchingGlobal(true);
    const timer = setTimeout(async () => {
      const results = await searchWorldwideCities(q);
      if (!cancelled) {
        setGlobalResults(results);
        setSearchingGlobal(false);
      }
    }, 320);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, open, isOnline]);

  if (!open) return null;

  const handleDetect = async () => {
    setDetecting(true);
    setGeoStatus(null);
    const res = await detectGeolocation();
    setDetecting(false);
    setGeoStatus(res.message);
    if (res.ok) {
      setTimeout(onClose, 550);
    }
  };

  // Deduplicate global results against local preset hits
  const mergedGlobal = globalResults.filter(
    (g) =>
      !localFiltered.some(
        (l) =>
          l.city.toLowerCase() === g.city.toLowerCase() &&
          l.country.toLowerCase() === g.country.toLowerCase()
      )
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={isBn ? 'অবস্থান নির্বাচন করুন' : 'Select City Location'}
    >
      <div className="bg-white w-full sm:max-w-md rounded-t-[28px] sm:rounded-[28px] max-h-[88vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="px-6 pt-5 pb-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#141517]">
              {isBn ? 'অবস্থান নির্বাচন করুন' : 'Select Location'}
            </h2>
            <p className="text-xs text-slate-500">
              {isBn ? 'বর্তমান:' : 'Current:'} {currentLocalized.city}, {currentLocalized.country}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
            aria-label={isBn ? 'বন্ধ করুন' : 'Close'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <button
            type="button"
            onClick={handleDetect}
            disabled={detecting}
            className="w-full min-h-[44px] rounded-2xl bg-[#084B32] text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#0A5E3F] transition-colors disabled:opacity-60 cursor-pointer"
          >
            {detecting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LocateFixed className="w-4 h-4" />
            )}
            <span>
              {detecting
                ? isBn
                  ? 'GPS অবস্থান খোঁজা হচ্ছে...'
                  : 'Detecting GPS location...'
                : isBn
                ? 'বর্তমান GPS অবস্থান ব্যবহার করুন'
                : 'Use Current GPS Location'}
            </span>
          </button>

          {geoStatus && (
            <div className="text-xs rounded-xl bg-amber-50 text-amber-900 border border-amber-200 px-3 py-2">
              {geoStatus}
            </div>
          )}

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                isBn
                  ? 'বিশ্বের যেকোনো শহর, জেলা বা দেশ খুঁজুন (ইংরেজি/বাংলা)...'
                  : 'Search any city, town, or country worldwide...'
              }
              className="w-full h-11 pl-10 pr-9 rounded-2xl bg-slate-100 text-sm text-[#141517] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#084B32]/30"
            />
            {searchingGlobal && (
              <Loader2 className="w-4 h-4 text-[#084B32] animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 px-1">
            <Globe className="w-3.5 h-3.5 text-[#084B32]" />
            <span>
              {isOnline
                ? isBn
                  ? 'সারা বিশ্বের যেকোনো শহর ও গ্রাম সার্চ করা যাবে'
                  : 'Global search enabled for all cities & towns worldwide'
                : isBn
                ? 'অফলাইন মোড: সংরক্ষিত জনপ্রিয় শহরের তালিকা দেখানো হচ্ছে'
                : 'Offline mode: showing built-in cities'}
            </span>
          </div>
        </div>

        <div className="overflow-y-auto px-5 pb-6 space-y-1.5">
          {localFiltered.map((city) => {
            const isSelected =
              city.city === state.location.city && city.country === state.location.country;
            const loc = localizeLocation(city.city, city.country, isBn);
            return (
              <button
                key={`local-${city.city}-${city.country}`}
                type="button"
                onClick={() => {
                  setManualLocation(city);
                  onClose();
                }}
                className={`w-full min-h-[48px] px-4 py-2.5 rounded-2xl flex items-center justify-between text-left transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#084B32]/10 text-[#084B32] font-semibold'
                    : 'hover:bg-slate-50 text-[#141517]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <MapPin className="w-4 h-4 shrink-0 text-[#084B32]" />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">{loc.city}</div>
                    <div className="text-xs text-slate-500 truncate">{loc.country}</div>
                  </div>
                </div>
                {isSelected && (
                  <span className="text-xs font-bold text-[#084B32] shrink-0">
                    {isBn ? 'সক্রিয়' : 'Active'}
                  </span>
                )}
              </button>
            );
          })}

          {mergedGlobal.length > 0 && (
            <div className="pt-2 pb-1 px-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {isBn ? 'বিশ্বব্যাপী ফলাফল' : 'Worldwide Results'}
            </div>
          )}

          {mergedGlobal.map((city, idx) => (
            <button
              key={`global-${city.city}-${city.latitude}-${city.longitude}-${idx}`}
              type="button"
              onClick={() => {
                setManualLocation({
                  city: city.city,
                  country: city.country,
                  latitude: city.latitude,
                  longitude: city.longitude,
                  timezone: city.timezone,
                  source: 'manual',
                });
                onClose();
              }}
              className="w-full min-h-[48px] px-4 py-2.5 rounded-2xl flex items-center justify-between text-left hover:bg-emerald-50/70 text-[#141517] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Globe className="w-4 h-4 shrink-0 text-[#084B32]" />
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{city.city}</div>
                  <div className="text-xs text-slate-500 truncate">
                    {city.region ? `${city.region}, ` : ''}
                    {city.country}
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-mono text-slate-400 shrink-0">
                {city.latitude.toFixed(2)}°, {city.longitude.toFixed(2)}°
              </span>
            </button>
          ))}

          {localFiltered.length === 0 && mergedGlobal.length === 0 && !searchingGlobal && (
            <div className="text-center py-8 text-sm text-slate-500">
              {isBn
                ? 'কোনো স্থান পাওয়া যায়নি। ইংরেজিতে শহরের নাম লিখে চেষ্টা করুন (যেমন: Rajshahi, Cox\'s Bazar, Sylhet, London)।'
                : 'No matching location found. Try another city or town name.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
