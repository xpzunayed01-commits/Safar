import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Bell,
  Check,
  Compass,
  MapPin,
  Moon,
  Pencil,
  Play,
  RefreshCw,
  RotateCcw,
  Sun,
  Sunrise,
  Sunset,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  CALCULATION_METHOD_LABELS,
  CALCULATION_METHOD_LABELS_BN,
  formatDateKey,
  formatHijriDateLocalized,
  formatTimeDisplay,
  getNextPrayerInfo,
  PRAYER_NAME_BN,
  toBanglaDigits,
} from '../services/prayerService';
import { localizeLocation } from '../data/cities';
import { LocationPickerModal } from '../components/LocationPickerModal';
import type { AdhanSoundKey, CalculationMethodKey, PrayerName } from '../types/app';

export const PrayerTimesPage: React.FC = () => {
  const {
    state,
    t,
    prayerSchedule,
    customTimeFlags,
    prayerLoading,
    togglePrayerCheckIn,
    togglePrayerReminder,
    updatePrayerSettings,
    updateCustomPrayerTime,
    resetAllCustomPrayerTimes,
    refreshPrayerSchedule,
    testAdhanAlarm,
    updateNotifications,
    setTimeFormat,
  } = useApp();
  const navigate = useNavigate();
  const isBn = state.preferences.language === 'bn';
  const timeFmt = state.preferences.timeFormat ?? '12h';

  const [now, setNow] = useState(() => new Date());
  const [viewMode, setViewMode] = useState<'arc' | 'clock'>('arc');
  const [locationOpen, setLocationOpen] = useState(false);
  const [editingPrayer, setEditingPrayer] = useState<PrayerName | null>(null);
  const [editTimeVal, setEditTimeVal] = useState('05:00');
  const [permMessage, setPermMessage] = useState<string | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const todayKey = formatDateKey(now);
  const nextInfo = getNextPrayerInfo(prayerSchedule, now);
  const todayCheckIns = state.prayerCheckIns[todayKey] ?? {
    fajr: false,
    dhuhr: false,
    asr: false,
    maghrib: false,
    isha: false,
  };

  const localizedLoc = localizeLocation(state.location.city, state.location.country, isBn);
  const localizedHijri = formatHijriDateLocalized(prayerSchedule, isBn);

  const rows: Array<{
    key: PrayerName;
    name: string;
    start: Date;
    endLabel: string;
    icon: React.FC<{ className?: string }>;
  }> = [
    {
      key: 'fajr',
      name: t.fajr,
      start: prayerSchedule.times.fajr,
      endLabel: formatTimeDisplay(prayerSchedule.times.sunrise, isBn, timeFmt),
      icon: Sunrise,
    },
    {
      key: 'dhuhr',
      name: t.dhuhr,
      start: prayerSchedule.times.dhuhr,
      endLabel: formatTimeDisplay(prayerSchedule.times.asr, isBn, timeFmt),
      icon: Sun,
    },
    {
      key: 'asr',
      name: t.asr,
      start: prayerSchedule.times.asr,
      endLabel: formatTimeDisplay(prayerSchedule.times.maghrib, isBn, timeFmt),
      icon: Sun,
    },
    {
      key: 'maghrib',
      name: prayerSchedule.isRamadan
        ? `${t.maghrib} (${isBn ? 'ইফতার' : 'Iftar'})`
        : t.maghrib,
      start: prayerSchedule.times.maghrib,
      endLabel: formatTimeDisplay(prayerSchedule.times.isha, isBn, timeFmt),
      icon: Sunset,
    },
    {
      key: 'isha',
      name: t.isha,
      start: prayerSchedule.times.isha,
      endLabel: formatTimeDisplay(prayerSchedule.times.fajr, isBn, timeFmt),
      icon: Moon,
    },
  ];

  const openEditPrayer = (prayer: PrayerName, currentStart: Date) => {
    const hh = String(currentStart.getHours()).padStart(2, '0');
    const mm = String(currentStart.getMinutes()).padStart(2, '0');
    setEditTimeVal(`${hh}:${mm}`);
    setEditingPrayer(prayer);
  };

  const saveEditPrayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPrayer || !editTimeVal) return;
    updateCustomPrayerTime(editingPrayer, editTimeVal);
    setEditingPrayer(null);
  };

  const requestNotificationAccess = async () => {
    if (typeof Notification === 'undefined') {
      setPermMessage(
        isBn
          ? 'এই ব্রাউজারে সিস্টেম নোটিফিকেশন নেই, তবে অ্যাপ খোলা থাকলে আযান ও অ্যালার্ম বাজবে।'
          : 'System notifications unavailable; in-app Adhan & alarms remain active.'
      );
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        updateNotifications({ prayers: true });
        setPermMessage(null);
      } else {
        setPermMessage(
          isBn
            ? 'অনুমতি দেওয়া হয়নি — তবে ইন-অ্যাপ আযান ও অ্যালার্ম সচল থাকবে।'
            : 'Permission not granted — in-app Adhan & alarms remain active.'
        );
      }
    } catch {
      // ignore
    }
  };

  const hasAnyCustom = Object.values(customTimeFlags).some(Boolean);

  // Semicircle arc math
  const arcRadius = 96;
  const arcLength = Math.PI * arcRadius;
  const filledArc = (nextInfo.dayProgressPercent / 100) * arcLength;

  // Analog clock angles
  const secDeg = now.getSeconds() * 6;
  const minDeg = now.getMinutes() * 6 + now.getSeconds() * 0.1;
  const hrDeg = ((now.getHours() % 12) + now.getMinutes() / 60) * 30;

  const nextPrayerDisplay = isBn
    ? PRAYER_NAME_BN[nextInfo.nextPrayer]
    : nextInfo.nextPrayer.toUpperCase();

  const methodLabels = isBn ? CALCULATION_METHOD_LABELS_BN : CALCULATION_METHOD_LABELS;

  return (
    <div className="min-h-screen bg-[#F6F8F5]">
      <div className="bg-[#084B32] text-white px-5 pt-5 pb-10 rounded-b-[36px] shadow-md">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/home')}
            className="w-10 h-10 rounded-full bg-white text-[#084B32] flex items-center justify-center shadow-sm cursor-pointer"
            aria-label={isBn ? 'হোমে ফিরে যান' : 'Back to Home'}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-lg font-bold tracking-tight">{t.prayerTimes}</h1>
          <div className="flex items-center gap-1 bg-white/15 rounded-full p-1">
            <button
              type="button"
              onClick={() => setViewMode('arc')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                viewMode === 'arc' ? 'bg-white text-[#084B32]' : 'text-white/80'
              }`}
            >
              {isBn ? 'আর্ক' : 'Arc'}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('clock')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                viewMode === 'clock' ? 'bg-white text-[#084B32]' : 'text-white/80'
              }`}
            >
              {isBn ? 'ঘড়ি' : 'Clock'}
            </button>
          </div>
        </div>

        {viewMode === 'arc' ? (
          <div className="mt-5 flex flex-col items-center">
            <div className="relative w-[240px] h-[132px] flex items-end justify-center">
              <svg viewBox="0 0 240 130" className="w-full h-full overflow-visible">
                <path
                  d="M 24 120 A 96 96 0 0 1 216 120"
                  fill="none"
                  stroke="rgba(255,255,255,0.18)"
                  strokeWidth="12"
                  strokeLinecap="round"
                />
                <path
                  d="M 24 120 A 96 96 0 0 1 216 120"
                  fill="none"
                  stroke="#F4B41A"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={arcLength}
                  strokeDashoffset={arcLength - filledArc}
                />
                <path d="M 42 120 A 78 78 0 0 1 198 120 Z" fill="#19B266" />
              </svg>
              <div className="absolute bottom-3 text-center">
                <button
                  type="button"
                  onClick={() => setLocationOpen(true)}
                  className="text-[11px] font-medium text-emerald-50/90 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <MapPin className="w-3 h-3" />
                  <span>
                    {localizedLoc.city}, {localizedLoc.country}
                  </span>
                </button>
                <div className="text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight text-white mt-0.5">
                  {formatTimeDisplay(now, isBn, timeFmt)}
                </div>
                <div className="text-[11px] font-semibold text-[#D9F275] tabular-nums">
                  {t.nextPrayer}: {nextPrayerDisplay} (-
                  {isBn ? toBanglaDigits(nextInfo.remainingFormatted) : nextInfo.remainingFormatted})
                </div>
              </div>
            </div>

            <div className="w-full max-w-sm flex items-center justify-between mt-4 px-2">
              <div className="flex items-center gap-2">
                <Sunrise className="w-5 h-5 text-[#F4B41A]" />
                <div>
                  <div className="text-[11px] text-emerald-100/80">{t.fajr}</div>
                  <div className="text-xs font-bold tabular-nums">
                    {formatTimeDisplay(prayerSchedule.times.fajr, isBn, timeFmt)}
                  </div>
                </div>
              </div>
              <div className="text-center">
                <div className="text-[11px] text-emerald-100/80">
                  {isBn ? 'হিজরি' : 'Hijri'}
                </div>
                <div className="text-xs font-semibold text-[#D9F275]">{localizedHijri}</div>
              </div>
              <div className="flex items-center gap-2 text-right">
                <div>
                  <div className="text-[11px] text-emerald-100/80">
                    {prayerSchedule.isRamadan ? (isBn ? 'ইফতার' : 'Iftar') : t.maghrib}
                  </div>
                  <div className="text-xs font-bold tabular-nums">
                    {formatTimeDisplay(prayerSchedule.times.maghrib, isBn, timeFmt)}
                  </div>
                </div>
                <Sunset className="w-5 h-5 text-[#F4B41A]" />
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-5 flex flex-col items-center">
            <div className="w-52 h-52 rounded-full bg-[#141517] border-4 border-white/15 shadow-2xl relative flex items-center justify-center">
              <span className="absolute top-2 text-3xl font-black text-white/95 select-none">
                {isBn ? '১২' : '12'}
              </span>
              <span className="absolute right-3.5 text-3xl font-black text-white/95 select-none">
                {isBn ? '৩' : '3'}
              </span>
              <span className="absolute bottom-2 text-3xl font-black text-white/95 select-none">
                {isBn ? '৬' : '6'}
              </span>
              <span className="absolute left-3.5 text-3xl font-black text-white/95 select-none">
                {isBn ? '৯' : '9'}
              </span>

              <span className="bg-white text-[#141517] text-[10px] font-bold px-2.5 py-0.5 rounded-full translate-y-6">
                {now.toLocaleDateString(isBn ? 'bn-BD' : undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>

              <div
                className="absolute w-2 h-14 bg-white rounded-full origin-bottom bottom-1/2"
                style={{ transform: `rotate(${hrDeg}deg)` }}
              />
              <div
                className="absolute w-1.5 h-20 bg-white/90 rounded-full origin-bottom bottom-1/2"
                style={{ transform: `rotate(${minDeg}deg)` }}
              />
              <div
                className="absolute w-0.5 h-22 bg-red-500 rounded-full origin-bottom bottom-1/2"
                style={{ transform: `rotate(${secDeg}deg)` }}
              />
              <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-white z-10" />
            </div>
            <div className="mt-3 text-xs font-semibold text-[#D9F275] tabular-nums">
              {t.nextPrayer}: {nextPrayerDisplay} (
              {isBn
                ? `বাকি ${toBanglaDigits(nextInfo.remainingFormatted)}`
                : `in ${nextInfo.remainingFormatted}`}
              )
            </div>
          </div>
        )}
      </div>

      <div className="px-4 sm:px-6 -mt-4 pb-10 max-w-4xl mx-auto space-y-5">
        {/* 5 Waqt Prayer Timeline with Edit Time & Adhan Toggle */}
        <div className="bg-white rounded-[28px] p-4 sm:p-5 shadow-sm border border-slate-200/70 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
            <div>
              <h2 className="text-sm font-bold text-[#141517]">
                {isBn ? '৫ ওয়াক্ত নামাজ ও সময় এডিট' : '5 Daily Prayers & Custom Times'}
              </h2>
              <p className="text-[11px] text-slate-500">
                {isBn
                  ? 'যেকোনো ওয়াক্তের সময় এডিট করতে পেন্সিল ও আযান চালু/বন্ধ করতে মাইক বাটনে ট্যাপ করুন'
                  : 'Tap pencil to edit time or speaker to toggle 5-waqt Adhan alert'}
              </p>
            </div>
            {hasAnyCustom && (
              <button
                type="button"
                onClick={resetAllCustomPrayerTimes}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-900 text-[11px] font-bold cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{isBn ? 'সব স্বয়ংক্রিয় করুন' : 'Reset Auto'}</span>
              </button>
            )}
          </div>

          {rows.map((row, idx) => {
            const Icon = row.icon;
            const prayed = todayCheckIns[row.key];
            const reminderOn = state.prayerSettings.reminders[row.key];
            const isNext = nextInfo.nextPrayer === row.key;
            const isEdited = customTimeFlags[row.key];

            return (
              <div key={row.key} className="flex items-center gap-2 sm:gap-3">
                <div className="flex flex-col items-center self-stretch justify-center w-4 shrink-0">
                  <span
                    className={`w-3 h-3 rounded-full border-2 ${
                      prayed
                        ? 'bg-[#22C55E] border-[#22C55E]'
                        : isNext
                        ? 'bg-[#F4B41A] border-amber-200 ring-4 ring-amber-100'
                        : 'bg-amber-300/60 border-amber-100'
                    }`}
                  />
                  {idx < rows.length - 1 && <span className="w-0.5 flex-1 bg-slate-100 my-1" />}
                </div>

                <div
                  className={`flex-1 min-w-0 rounded-2xl p-3 sm:p-3.5 border transition-colors flex flex-wrap items-center justify-between gap-2 sm:gap-3 ${
                    isNext ? 'bg-emerald-50/70 border-emerald-200' : 'bg-[#FAFBF9] border-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-100/80 text-amber-700 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs sm:text-sm font-bold text-[#141517] truncate">
                          {row.name}
                        </span>
                        {isNext && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#084B32]/10 text-[#084B32] shrink-0">
                            {isBn ? 'পরবর্তী' : 'Next'}
                          </span>
                        )}
                        {isEdited && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 shrink-0">
                            {isBn ? 'কাস্টম' : 'Edited'}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] sm:text-xs text-slate-600 tabular-nums truncate">
                        {formatTimeDisplay(row.start, isBn, timeFmt)} – {row.endLabel}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                    <button
                      type="button"
                      onClick={() => openEditPrayer(row.key, row.start)}
                      aria-label={`${row.name} সময় এডিট করুন`}
                      title={isBn ? 'ওয়াক্তের সময় এডিট করুন' : 'Edit prayer time'}
                      className="w-9 h-9 rounded-full bg-white border border-slate-200 hover:border-[#084B32] text-slate-600 hover:text-[#084B32] flex items-center justify-center transition-colors cursor-pointer shrink-0"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => togglePrayerCheckIn(todayKey, row.key)}
                      className={`min-h-[36px] px-2.5 sm:px-3 rounded-full text-[11px] sm:text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap ${
                        prayed
                          ? 'bg-[#084B32] text-white'
                          : 'bg-white border border-slate-200 text-slate-700 hover:border-[#084B32]'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      <span>{prayed ? t.prayed : t.markPrayed}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => togglePrayerReminder(row.key)}
                      aria-label={`${row.name} আযান ও রিমাইন্ডার`}
                      title={reminderOn ? (isBn ? 'আযান চালু আছে' : 'Adhan On') : (isBn ? 'আযান বন্ধ' : 'Adhan Off')}
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                        reminderOn
                          ? 'bg-emerald-100 text-[#084B32]'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {reminderOn ? (
                        <Volume2 className="w-4 h-4" />
                      ) : (
                        <VolumeX className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 5-Waqt Automatic Adhan & Alarm Configuration Card */}
        <div className="bg-white rounded-[26px] p-5 border border-slate-200/70 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-[#141517]">
                {isBn ? '৫ ওয়াক্ত আযান ও অ্যালার্ম সেটিংস' : '5-Waqt Adhan & Alarm Settings'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isBn
                  ? 'প্রতিদিন নির্ধারিত ৫ ওয়াক্তের সময় হলেই স্বয়ংক্রিয়ভাবে আযান ও নোটিফিকেশন বাজবে।'
                  : 'Plays Adhan & triggers notifications automatically at each of the 5 daily prayers.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void testAdhanAlarm(nextInfo.nextPrayer)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#084B32] hover:bg-[#063a26] text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isBn ? 'আযান টেস্ট করুন' : 'Test Adhan Now'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-[#F6F8F5] flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-[#141517]">
                  {isBn ? '৫ ওয়াক্তে আযান অডিও' : '5-Waqt Adhan Audio'}
                </div>
                <div className="text-[11px] text-slate-500">
                  {state.prayerSettings.adhanEnabled !== false
                    ? isBn
                      ? 'চালু (আযান + নোটিফিকেশন)'
                      : 'Enabled (Adhan + Notification)'
                    : isBn
                    ? 'শুধু নম্র রিমাইন্ডার সাউন্ড'
                    : 'Gentle chime only'}
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={state.prayerSettings.adhanEnabled !== false}
                onClick={() =>
                  updatePrayerSettings({
                    adhanEnabled: state.prayerSettings.adhanEnabled === false,
                  })
                }
                className={`w-12 h-7 rounded-full transition-colors p-1 cursor-pointer shrink-0 ${
                  state.prayerSettings.adhanEnabled !== false ? 'bg-[#084B32]' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    state.prayerSettings.adhanEnabled !== false ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                {isBn ? 'আযানের সুর নির্বাচন করুন' : 'Adhan Sound'}
              </label>
              <select
                value={state.prayerSettings.adhanSound ?? 'makkah'}
                onChange={(e) =>
                  updatePrayerSettings({ adhanSound: e.target.value as AdhanSoundKey })
                }
                className="w-full h-11 px-3 rounded-2xl bg-[#F6F8F5] border border-slate-200 text-xs font-bold text-[#141517]"
              >
                <option value="makkah">{isBn ? 'মক্কা মুকাররমার আযান (মানব কণ্ঠ)' : 'Makkah Adhan (Human Voice)'}</option>
                <option value="madina">{isBn ? 'মদিনা মুনাওয়ারার আযান (মানব কণ্ঠ)' : 'Madinah Adhan (Human Voice)'}</option>
                <option value="alaqsa">{isBn ? 'মসজিদুল আকসার আযান (মানব কণ্ঠ)' : 'Al-Aqsa Adhan (Human Voice)'}</option>
                <option value="mishary">{isBn ? 'মিশারি রশিদ আল-আফাসি (মানব কণ্ঠ)' : 'Mishary Rashid Alafasy (Human Voice)'}</option>
                <option value="chime">{isBn ? 'ডিফল্ট মক্কার আযান (মানব কণ্ঠ)' : 'Default Makkah Adhan (Human Voice)'}</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
            <div className="text-xs text-slate-600 flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-[#084B32]" />
              <span>
                {isBn ? 'সিস্টেম নোটিফিকেশন:' : 'System Notifications:'}{' '}
                <strong className="text-[#141517]">
                  {typeof Notification !== 'undefined'
                    ? Notification.permission === 'granted'
                      ? isBn
                        ? 'চালু আছে ✓'
                        : 'Granted ✓'
                      : Notification.permission === 'denied'
                      ? isBn
                        ? 'ব্লক করা'
                        : 'Blocked'
                      : isBn
                      ? 'অনুমতি প্রয়োজন'
                      : 'Permission Needed'
                    : isBn
                    ? 'ইন-অ্যাপ মোড'
                    : 'In-app Mode'}
                </strong>
              </span>
            </div>
            {typeof Notification !== 'undefined' && Notification.permission !== 'granted' && (
              <button
                type="button"
                onClick={requestNotificationAccess}
                className="px-3.5 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-[#084B32] text-xs font-bold cursor-pointer"
              >
                {isBn ? 'নোটিফিকেশন চালু করুন' : 'Enable Notifications'}
              </button>
            )}
          </div>
          {permMessage && (
            <div className="text-[11px] text-amber-800 bg-amber-50 rounded-xl px-3 py-2">
              {permMessage}
            </div>
          )}
        </div>

        {/* Calculation Method, Asr Madhab, Qibla & Source Verification Card */}
        <div className="bg-white rounded-[26px] p-5 border border-slate-200/70 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#084B32]">
              <Compass className="w-4 h-4" />
              <span>
                {isBn
                  ? `কিবলা দিক: উত্তর থেকে ${toBanglaDigits(prayerSchedule.qiblaDegrees)}°`
                  : `Qibla Direction: ${prayerSchedule.qiblaDegrees}° from North`}
              </span>
            </div>
            <button
              type="button"
              onClick={() => refreshPrayerSchedule()}
              disabled={prayerLoading}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#141517] cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${prayerLoading ? 'animate-spin' : ''}`} />
              <span>{isBn ? 'রিফ্রেশ' : 'Refresh'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                {isBn ? 'হিসাবের পদ্ধতি' : 'Calculation Method'}
              </label>
              <select
                value={state.prayerSettings.method}
                onChange={(e) =>
                  updatePrayerSettings({ method: e.target.value as CalculationMethodKey })
                }
                className="w-full h-11 px-3 rounded-2xl bg-slate-100 text-xs font-semibold text-[#141517]"
              >
                {Object.entries(methodLabels).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                {isBn ? 'আসর ওয়াক্তের মাযহাব' : 'Asr Juristic Method'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['shafi', 'hanafi'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => updatePrayerSettings({ madhab: m })}
                    className={`h-11 rounded-2xl text-xs font-bold cursor-pointer ${
                      state.prayerSettings.madhab === m
                        ? 'bg-[#084B32] text-white'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {m === 'shafi'
                      ? isBn
                        ? 'শাফেয়ী / সাধারণ'
                        : 'Shafi / Standard'
                      : isBn
                      ? 'হানাফী'
                      : 'Hanafi'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                {isBn ? 'সময়ের ধরন (১২ / ২৪ ঘণ্টা)' : 'Time Format (12h / 24h)'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['12h', '24h'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setTimeFormat(fmt)}
                    className={`h-11 rounded-2xl text-xs font-bold cursor-pointer ${
                      timeFmt === fmt
                        ? 'bg-[#084B32] text-white'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {fmt === '12h'
                      ? isBn
                        ? '১২ ঘণ্টা (বাংলাদেশি)'
                        : '12-Hour (AM/PM)'
                      : isBn
                      ? '২৪ ঘণ্টা (24h)'
                      : '24-Hour (Intl)'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
            <span>
              {isBn ? 'উৎস:' : 'Source:'}{' '}
              {prayerSchedule.source === 'aladhan-api'
                ? isBn
                  ? 'আলাযান লাইভ API'
                  : 'Aladhan Live API'
                : prayerSchedule.source === 'aladhan-cache'
                ? isBn
                  ? 'সংরক্ষিত আলাযান তথ্য'
                  : 'Aladhan Cached Data'
                : isBn
                ? 'অফলাইন গাণিতিক হিসাব (Adhan)'
                : 'Offline Astronomical Calculation (Adhan)'}
            </span>
            <span className="tabular-nums">
              {isBn ? 'সর্বশেষ আপডেট:' : 'Last updated:'}{' '}
              {formatTimeDisplay(new Date(prayerSchedule.lastUpdated), isBn, timeFmt)}
            </span>
          </div>
        </div>
      </div>

      {/* Edit Single Prayer Time Modal */}
      {editingPrayer && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={saveEditPrayer}
            className="bg-white rounded-[28px] max-w-xs w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#141517]">
                {isBn
                  ? `${PRAYER_NAME_BN[editingPrayer]} ওয়াক্তের সময় এডিট`
                  : `Edit ${editingPrayer.toUpperCase()} Time`}
              </h2>
              <button
                type="button"
                onClick={() => setEditingPrayer(null)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center cursor-pointer"
                aria-label="বন্ধ করুন"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                {isBn ? 'নামাজ / আযানের সময় নির্বাচন করুন' : 'Select Prayer / Adhan Time'}
              </label>
              <input
                type="time"
                value={editTimeVal}
                onChange={(e) => setEditTimeVal(e.target.value)}
                required
                className="w-full h-12 px-4 rounded-2xl bg-slate-100 text-base font-bold text-[#141517] tabular-nums"
              />
            </div>

            <div className="flex items-center gap-2">
              {customTimeFlags[editingPrayer] && (
                <button
                  type="button"
                  onClick={() => {
                    updateCustomPrayerTime(editingPrayer, null);
                    setEditingPrayer(null);
                  }}
                  className="px-3.5 h-11 rounded-full bg-amber-50 text-amber-800 text-xs font-bold cursor-pointer"
                >
                  {isBn ? 'অটো রিসেট' : 'Reset Auto'}
                </button>
              )}
              <button
                type="submit"
                className="flex-1 h-11 rounded-full bg-[#084B32] text-white text-xs font-bold cursor-pointer"
              >
                {isBn ? 'সংরক্ষণ করুন' : 'Save Time'}
              </button>
            </div>
          </form>
        </div>
      )}

      <LocationPickerModal open={locationOpen} onClose={() => setLocationOpen(false)} />
    </div>
  );
};
