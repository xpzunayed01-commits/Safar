import React from 'react';
import { BellRing, Check, Volume2, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatDateKey, PRAYER_NAME_BN } from '../services/prayerService';

export const ActiveAlarmBanner: React.FC = () => {
  const { state, activeAlarm, stopActiveAlarm, togglePrayerCheckIn } = useApp();
  if (!activeAlarm) return null;

  const isBn = state.preferences.language === 'bn';
  const todayKey = formatDateKey(new Date());

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/65 backdrop-blur-md flex items-center justify-center p-4"
      role="alertdialog"
      aria-modal="true"
      aria-label={activeAlarm.title}
    >
      <div className="bg-[#084B32] text-white w-full max-w-sm rounded-[32px] p-6 shadow-2xl border border-[#D9F275]/40 text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="mx-auto w-20 h-20 rounded-full bg-[#D9F275] text-[#084B32] flex items-center justify-center shadow-lg relative">
          <span className="absolute inset-0 rounded-full bg-[#D9F275] animate-ping opacity-35" />
          {activeAlarm.kind === 'prayer' ? (
            <Volume2 className="w-9 h-9 relative z-10" />
          ) : (
            <BellRing className="w-9 h-9 relative z-10" />
          )}
        </div>

        <div className="space-y-1.5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#D9F275]">
            {activeAlarm.kind === 'prayer'
              ? isBn
                ? 'আযান ও নামাজের সময় হয়েছে'
                : 'Time for Salah · Adhan'
              : activeAlarm.kind === 'quran'
              ? isBn
                ? 'কুরআন তিলাওয়াতের রিমাইন্ডার'
                : 'Quran Recitation Reminder'
              : isBn
              ? 'দৈনিক আমল অ্যালার্ম'
              : 'Daily Planner Alarm'}
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">{activeAlarm.title}</h2>
          <p className="text-xs text-emerald-100/90 leading-relaxed">{activeAlarm.subtitle}</p>
        </div>

        <div className="space-y-2.5 pt-1">
          {activeAlarm.kind === 'prayer' && activeAlarm.prayerName && (
            <button
              type="button"
              onClick={() => {
                togglePrayerCheckIn(todayKey, activeAlarm.prayerName!);
                stopActiveAlarm();
              }}
              className="w-full h-12 rounded-full bg-[#D9F275] hover:bg-[#e7fa9d] text-[#084B32] font-extrabold text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>
                {isBn
                  ? `${PRAYER_NAME_BN[activeAlarm.prayerName]} আদায় করেছি`
                  : `Mark ${activeAlarm.prayerName} Prayed`}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={stopActiveAlarm}
            className="w-full h-12 rounded-full bg-white/15 hover:bg-white/25 text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>{isBn ? 'আযান / অ্যালার্ম বন্ধ করুন' : 'Dismiss Alarm'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
