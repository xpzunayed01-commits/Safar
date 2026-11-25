import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Compass, HeartHandshake, RotateCcw, Sparkles, Volume2, X } from 'lucide-react';
import { AUTHENTIC_DUAS, TASBIH_PHRASES } from '../data/bundledQuran';
import { localizeLocation } from '../data/cities';
import { toBanglaDigits } from '../services/prayerService';
import { useApp } from '../context/AppContext';
import { alarmEngine } from '../services/alarmService';

export type IslamicToolKind = 'tasbih' | 'qibla' | 'duas' | 'zakat' | 'reminders' | null;

interface Props {
  activeTool: IslamicToolKind;
  onClose: () => void;
}

export const IslamicToolsModal: React.FC<Props> = ({ activeTool, onClose }) => {
  const {
    state,
    prayerSchedule,
    incrementTasbih,
    resetTasbih,
    setTasbihPhrase,
    setTasbihTarget,
    updateNotifications,
    updatePrayerSettings,
    testAdhanAlarm,
    unlockAudio,
  } = useApp();
  const navigate = useNavigate();
  const isBn = state.preferences.language === 'bn';
  const localizedLoc = localizeLocation(state.location.city, state.location.country, isBn);

  const [duaCategory, setDuaCategory] = useState<'all' | 'morning' | 'evening' | 'protection' | 'daily'>('all');
  const [cashSavings, setCashSavings] = useState('');
  const [goldSilverValue, setGoldSilverValue] = useState('');
  const [debtsOwed, setDebtsOwed] = useState('');
  const [permStatusMsg, setPermStatusMsg] = useState<string | null>(null);

  if (!activeTool) return null;

  const phrase = TASBIH_PHRASES[state.preferences.tasbihPhraseIndex] ?? TASBIH_PHRASES[0];
  const tasbihPct = Math.min(
    100,
    Math.round((state.preferences.tasbihCount / Math.max(1, state.preferences.tasbihTarget)) * 100)
  );

  const netZakatable = Math.max(
    0,
    (parseFloat(cashSavings) || 0) + (parseFloat(goldSilverValue) || 0) - (parseFloat(debtsOwed) || 0)
  );
  const zakatDue = netZakatable * 0.025;

  const duaCategoryLabel: Record<'all' | 'morning' | 'evening' | 'protection' | 'daily', string> = {
    all: isBn ? 'সব' : 'All',
    morning: isBn ? 'সকাল' : 'Morning',
    evening: isBn ? 'সন্ধ্যা' : 'Evening',
    protection: isBn ? 'সুরক্ষা' : 'Protection',
    daily: isBn ? 'দৈনিক' : 'Daily',
  };

  const requestBrowserPermission = async () => {
    unlockAudio();
    const res = await alarmEngine.requestNotificationPermission();
    if (res === 'granted') {
      await alarmEngine.sendSystemNotification(
        isBn ? 'Safar ইসলামিক সঙ্গী' : 'Safar Islamic Companion',
        isBn
          ? 'নামাজ, ৫ ওয়াক্ত আযান ও দৈনিক আমলের রিমাইন্ডার চালু হয়েছে।'
          : '5-waqt Adhan, prayer, and daily worship reminders are enabled.',
        'safar-perm-test'
      );
      setPermStatusMsg(
        isBn ? 'সিস্টেম নোটিফিকেশন ও আযান অ্যালার্ম সচল হয়েছে।' : 'System notifications & Adhan alerts enabled.'
      );
    } else if (res === 'unsupported') {
      setPermStatusMsg(
        isBn
          ? 'এই ব্রাউজারে সিস্টেম নোটিফিকেশন সীমিত, তবে অ্যাপ খোলা থাকলে অ্যালার্ম ও সাউন্ড ১০০% কাজ করবে।'
          : 'System notifications are limited here, but in-app sound & alarms work 100%.'
      );
    } else {
      setPermStatusMsg(
        isBn
          ? 'অনুমতি দেওয়া হয়নি — তবে ইন-অ্যাপ রিমাইন্ডার ও আযান অ্যালার্ম স্বাভাবিকভাবে কাজ করবে।'
          : 'Permission declined — in-app reminders & Adhan alerts still work normally.'
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white w-full sm:max-w-lg rounded-t-[30px] sm:rounded-[30px] max-h-[88vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {activeTool === 'tasbih' && <Sparkles className="w-5 h-5 text-[#084B32]" />}
            {activeTool === 'qibla' && <Compass className="w-5 h-5 text-[#084B32]" />}
            {activeTool === 'duas' && <Volume2 className="w-5 h-5 text-amber-600" />}
            {activeTool === 'zakat' && <HeartHandshake className="w-5 h-5 text-emerald-700" />}
            {activeTool === 'reminders' && <Bell className="w-5 h-5 text-[#084B32]" />}
            <h2 className="text-lg font-bold text-[#141517]">
              {activeTool === 'tasbih' && (isBn ? 'ডিজিটাল তাসবিহ' : 'Digital Tasbih')}
              {activeTool === 'qibla' && (isBn ? 'কিবলার দিক নির্দেশনা' : 'Qibla Direction')}
              {activeTool === 'duas' && (isBn ? 'সহীহ দোয়া ও যিকির' : 'Authentic Duas & Adhkar')}
              {activeTool === 'zakat' && (isBn ? 'যাকাত ও সদকা ক্যালকুলেটর' : 'Zakat & Charity Calculator')}
              {activeTool === 'reminders' && (isBn ? 'রিমাইন্ডার ও নোটিফিকেশন' : 'Reminders & Notifications')}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
            aria-label={isBn ? 'বন্ধ করুন' : 'Close modal'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5">
          {activeTool === 'tasbih' && (
            <div className="space-y-5 text-center">
              <div className="grid grid-cols-2 gap-2">
                {TASBIH_PHRASES.map((p, idx) => (
                  <button
                    key={p.transliteration}
                    type="button"
                    onClick={() => setTasbihPhrase(idx)}
                    className={`px-3 py-2.5 rounded-2xl text-xs font-semibold border transition-all cursor-pointer ${
                      state.preferences.tasbihPhraseIndex === idx
                        ? 'bg-[#084B32] text-white border-[#084B32]'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {isBn ? p.transliterationBn : p.transliteration}
                  </button>
                ))}
              </div>

              <div className="bg-[#FAF8F3] rounded-3xl p-6 border border-amber-200/60">
                <div className="font-arabic text-3xl text-[#141517] mb-1">{phrase.arabic}</div>
                <div className="text-sm font-bold text-[#084B32]">
                  {isBn ? phrase.transliterationBn : phrase.transliteration}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {isBn ? phrase.meaningBn : phrase.meaning}
                </div>
              </div>

              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={incrementTasbih}
                  className="w-44 h-44 rounded-full bg-[#084B32] hover:bg-[#0A5E3F] active:scale-95 transition-transform text-white shadow-xl flex flex-col items-center justify-center relative cursor-pointer"
                >
                  <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="6" />
                    <circle
                      cx="60"
                      cy="60"
                      r="54"
                      fill="none"
                      stroke="#D9F275"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={339.29}
                      strokeDashoffset={339.29 - (339.29 * tasbihPct) / 100}
                    />
                  </svg>
                  <span className="text-5xl font-extrabold tabular-nums">
                    {isBn ? toBanglaDigits(state.preferences.tasbihCount) : state.preferences.tasbihCount}
                  </span>
                  <span className="text-xs text-[#D9F275] font-semibold mt-1">
                    {isBn
                      ? `ট্যাপ করুন · লক্ষ্য ${toBanglaDigits(state.preferences.tasbihTarget)}`
                      : `Tap · Target ${state.preferences.tasbihTarget}`}
                  </span>
                </button>
              </div>

              <div className="flex items-center justify-center gap-3">
                {[33, 99, 100].map((target) => (
                  <button
                    key={target}
                    type="button"
                    onClick={() => setTasbihTarget(target)}
                    className={`px-3.5 py-2 rounded-full text-xs font-bold border cursor-pointer ${
                      state.preferences.tasbihTarget === target
                        ? 'bg-[#141517] text-white border-[#141517]'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    {isBn ? `${toBanglaDigits(target)}×` : `${target}×`}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={resetTasbih}
                  className="px-3.5 py-2 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  {isBn ? 'রিসেট' : 'Reset'}
                </button>
              </div>
            </div>
          )}

          {activeTool === 'qibla' && (
            <div className="space-y-5 text-center">
              <div className="text-sm text-slate-600">
                {isBn ? (
                  <>
                    <span className="font-semibold text-[#141517]">
                      {localizedLoc.city}, {localizedLoc.country}
                    </span>{' '}
                    থেকে পবিত্র কাবা শরীফ (মক্কা)-এর দিক।
                  </>
                ) : (
                  <>
                    Calculated from{' '}
                    <span className="font-semibold text-[#141517]">
                      {localizedLoc.city}, {localizedLoc.country}
                    </span>{' '}
                    toward Al-Kaaba, Makkah.
                  </>
                )}
              </div>
              <div className="mx-auto w-56 h-56 rounded-full bg-[#F6F8F5] border-4 border-[#084B32]/20 relative flex items-center justify-center shadow-inner">
                <span className="absolute top-2.5 text-xs font-bold text-slate-400">
                  {isBn ? 'উ' : 'N'}
                </span>
                <span className="absolute bottom-2.5 text-xs font-bold text-slate-400">
                  {isBn ? 'দ' : 'S'}
                </span>
                <span className="absolute right-3 text-xs font-bold text-slate-400">
                  {isBn ? 'পূ' : 'E'}
                </span>
                <span className="absolute left-3 text-xs font-bold text-slate-400">
                  {isBn ? 'প' : 'W'}
                </span>

                <div
                  style={{ transform: `rotate(${prayerSchedule.qiblaDegrees}deg)` }}
                  className="w-full h-full flex items-center justify-center transition-transform duration-500"
                >
                  <div className="flex flex-col items-center -mt-12">
                    <div className="w-4 h-4 bg-[#141517] rounded-sm border-2 border-[#D9F275] shadow" />
                    <div className="w-1 h-16 bg-gradient-to-b from-[#084B32] to-transparent rounded-full" />
                  </div>
                </div>
                <div className="absolute w-4 h-4 rounded-full bg-[#084B32] border-2 border-white" />
              </div>

              <div className="bg-[#084B32]/8 rounded-2xl p-4">
                <div className="text-2xl font-extrabold text-[#084B32] tabular-nums">
                  {isBn
                    ? `প্রকৃত উত্তর থেকে ${toBanglaDigits(prayerSchedule.qiblaDegrees)}°`
                    : `${prayerSchedule.qiblaDegrees}° from True North`}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {isBn
                    ? `অক্ষাংশ ${toBanglaDigits(state.location.latitude.toFixed(3))}° · দ্রাঘিমাংশ ${toBanglaDigits(
                        state.location.longitude.toFixed(3)
                      )}°`
                    : `Lat ${state.location.latitude.toFixed(3)}° · Lon ${state.location.longitude.toFixed(3)}°`}
                </div>
              </div>
            </div>
          )}

          {activeTool === 'duas' && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/duas');
                }}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#084B32] hover:bg-[#063a26] text-white text-xs font-extrabold flex items-center justify-between gap-2 shadow-sm cursor-pointer"
              >
                <span>
                  {isBn
                    ? '১০০ কোটি+ দোয়া ও অসীম যিকির লাইব্রেরি খুলুন'
                    : 'Open Full 1B+ Duas & Endless Dhikr Library'}
                </span>
                <span className="text-[#D9F275] shrink-0">→</span>
              </button>

              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                {(['all', 'morning', 'evening', 'protection', 'daily'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setDuaCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer ${
                      duaCategory === cat
                        ? 'bg-[#141517] text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {duaCategoryLabel[cat]}
                  </button>
                ))}
              </div>
              <div className="space-y-3">
                {AUTHENTIC_DUAS.filter((d) => duaCategory === 'all' || d.category === duaCategory).map(
                  (dua) => (
                    <div
                      key={dua.id}
                      className="rounded-2xl bg-[#FAF8F3] border border-amber-200/70 p-4 space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-bold text-[#141517]">
                          {isBn ? dua.titleBn : dua.title}
                        </h3>
                        <span className="text-[11px] font-medium text-amber-800 shrink-0">
                          {duaCategoryLabel[dua.category]}
                        </span>
                      </div>
                      <p className="font-arabic text-2xl text-right text-[#141517] leading-loose" dir="rtl">
                        {dua.arabic}
                      </p>
                      <p className="text-xs italic text-slate-600">{dua.transliteration}</p>
                      <p className="text-xs text-slate-800 leading-relaxed">
                        {isBn ? dua.translationBn : dua.translationEn}
                      </p>
                      <div className="text-[11px] font-semibold text-[#084B32] pt-1">
                        {isBn ? 'সূত্র:' : 'Source:'} {isBn ? dua.sourceBn : dua.source}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {activeTool === 'zakat' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                {isBn
                  ? 'নিসাব পরিমাণ সম্পদ পূর্ণ এক চান্দ্র বছর (হাওল) মালিকানায় থাকলে তার ২.৫% যাকাত হিসাব করুন।'
                  : 'Calculate 2.5% annual Zakat on eligible wealth held for one lunar year (Hawl) above Nisab.'}
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    {isBn ? 'নগদ অর্থ ও ব্যাংক জমা' : 'Cash & Bank Savings'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={cashSavings}
                    onChange={(e) => setCashSavings(e.target.value)}
                    placeholder="0.00"
                    className="w-full h-11 px-4 rounded-2xl bg-slate-100 text-sm tabular-nums focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    {isBn ? 'স্বর্ণ, রুপা ও বিনিয়োগের মূল্য' : 'Gold, Silver & Investments Value'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={goldSilverValue}
                    onChange={(e) => setGoldSilverValue(e.target.value)}
                    placeholder="0.00"
                    className="w-full h-11 px-4 rounded-2xl bg-slate-100 text-sm tabular-nums focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    {isBn ? 'স্বল্পমেয়াদী ঋণ ও দায়' : 'Short-Term Debts Owed'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={debtsOwed}
                    onChange={(e) => setDebtsOwed(e.target.value)}
                    placeholder="0.00"
                    className="w-full h-11 px-4 rounded-2xl bg-slate-100 text-sm tabular-nums focus:outline-none"
                  />
                </div>
              </div>
              <div className="rounded-2xl bg-[#084B32] text-white p-5 flex items-center justify-between">
                <div>
                  <div className="text-xs text-[#D9F275] font-semibold">
                    {isBn ? 'আনুমানিক যাকাত (২.৫%)' : 'Estimated Zakat (2.5%)'}
                  </div>
                  <div className="text-xs text-white/70 mt-0.5 tabular-nums">
                    {isBn ? 'নিট যাকাতযোগ্য সম্পদ:' : 'Net Zakatable:'}{' '}
                    {netZakatable.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="text-3xl font-extrabold tabular-nums">
                  {zakatDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          )}

          {activeTool === 'reminders' && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-4 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-[#141517]">
                    {isBn ? 'ব্রাউজার নোটিফিকেশন অনুমতি' : 'Browser Notification Permission'}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {isBn ? 'অবস্থা:' : 'Status:'}{' '}
                    {typeof Notification !== 'undefined'
                      ? isBn
                        ? Notification.permission === 'granted'
                          ? 'অনুমোদিত'
                          : Notification.permission === 'denied'
                          ? 'বন্ধ রয়েছে'
                          : 'অনুমতি দেওয়া হয়নি'
                        : Notification.permission
                      : isBn
                      ? 'সমর্থিত নয়'
                      : 'Not supported'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={requestBrowserPermission}
                  className="px-4 py-2 rounded-full bg-[#084B32] text-white text-xs font-semibold cursor-pointer whitespace-nowrap"
                >
                  {isBn ? 'সতর্কতা চালু করুন' : 'Enable Alerts'}
                </button>
              </div>
              {permStatusMsg && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-2 text-[11px] font-medium text-[#084B32]">
                  {permStatusMsg}
                </div>
              )}

              <div className="space-y-2.5">
                <ToggleRow
                  label={isBn ? '৫ ওয়াক্ত স্বয়ংক্রিয় আযান অ্যালার্ম' : '5-Waqt Auto Adhan Alarm'}
                  description={
                    isBn
                      ? 'প্রতিটি ওয়াক্ত শুরু হওয়ার সাথে সাথে আযান ও নোটিফিকেশন বাজবে'
                      : 'Plays Adhan audio & alert automatically at each Salah time'
                  }
                  checked={Boolean(state.prayerSettings.adhanEnabled ?? true)}
                  onChange={(v) => {
                    unlockAudio();
                    updatePrayerSettings({ adhanEnabled: v });
                  }}
                />
                <ToggleRow
                  label={isBn ? 'নামাজের সময় রিমাইন্ডার' : 'Prayer Time Reminders'}
                  description={
                    isBn
                      ? 'ফজর, যোহর, আসর, মাগরিব ও এশার সময়ে সতর্কতা'
                      : 'Alert for Fajr, Dhuhr, Asr, Maghrib, and Isha'
                  }
                  checked={state.notifications.prayers}
                  onChange={(v) => updateNotifications({ prayers: v })}
                />
                <ToggleRow
                  label={isBn ? 'দৈনিক প্ল্যানার রিমাইন্ডার' : 'Daily Planner Task Reminders'}
                  description={
                    isBn
                      ? 'নির্ধারিত ইবাদত ও দৈনিক কাজের কথা মনে করিয়ে দেবে'
                      : 'Remind on scheduled worship & routine tasks'
                  }
                  checked={state.notifications.tasks}
                  onChange={(v) => updateNotifications({ tasks: v })}
                />
                <ToggleRow
                  label={isBn ? 'দৈনিক কুরআন তিলাওয়াত রিমাইন্ডার' : 'Daily Quran Reading Reminder'}
                  description={
                    isBn
                      ? 'প্রতিদিন নির্দিষ্ট সময়ে কুরআন পাঠের স্মরণিকা'
                      : 'Evening nudge to read & reflect on Quran'
                  }
                  checked={state.notifications.quranReminder}
                  onChange={(v) => updateNotifications({ quranReminder: v })}
                />
                {state.notifications.quranReminder && (
                  <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-slate-50">
                    <span className="text-xs font-semibold text-slate-700">
                      {isBn ? 'কুরআন রিমাইন্ডারের সময়' : 'Quran Reminder Time'}
                    </span>
                    <input
                      type="time"
                      value={state.notifications.quranReminderTime}
                      onChange={(e) => updateNotifications({ quranReminderTime: e.target.value })}
                      className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold"
                    />
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    unlockAudio();
                    void testAdhanAlarm('fajr');
                  }}
                  className="w-full h-11 rounded-2xl bg-[#084B32] hover:bg-[#063a26] text-white text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Volume2 className="w-4 h-4 text-[#D9F275]" />
                  <span>{isBn ? 'এখনই আযান ও অ্যালার্ম টেস্ট করুন' : 'Test Adhan & Alarm Now'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ToggleRow: React.FC<{
  label: string;
  description: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}> = ({ label, description, checked, onChange }) => (
  <div className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-slate-200/80 bg-white">
    <div>
      <div className="text-sm font-semibold text-[#141517]">{label}</div>
      <div className="text-xs text-slate-500 mt-0.5">{description}</div>
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`w-12 h-7 rounded-full transition-colors p-1 cursor-pointer shrink-0 ${
        checked ? 'bg-[#084B32]' : 'bg-slate-300'
      }`}
    >
      <span
        className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  </div>
);
