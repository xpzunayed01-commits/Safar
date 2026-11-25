import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, ChevronDown, ChevronUp, Flame, ShieldCheck, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatDateKey, toBanglaDigits } from '../services/prayerService';

export const StreakStatsPage: React.FC = () => {
  const { state, t, metrics, purityStreakDays } = useApp();
  const navigate = useNavigate();
  const isBn = state.preferences.language === 'bn';
  const [showInsights, setShowInsights] = useState(false);
  const [chartRange, setChartRange] = useState<'week' | 'month'>('week');

  const weekDays = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);

    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const key = formatDateKey(d);
      const prayers = Object.values(state.prayerCheckIns[key] ?? {}).filter(Boolean).length;
      const tasks = state.tasks.filter((tk) => tk.completedDates.includes(key)).length;
      const quran = state.quranProgress.sessions.filter((s) => s.date === key).length;
      const fasting = Boolean(state.fastingDays[key]);
      const active = prayers > 0 || tasks > 0 || quran > 0 || fasting;

      return {
        label: d.toLocaleDateString(isBn ? 'bn-BD' : undefined, { weekday: 'narrow' }),
        dayNum: d.getDate(),
        key,
        active,
        prayers,
        tasks,
        quran,
      };
    });
  }, [state.prayerCheckIns, state.tasks, state.quranProgress.sessions, state.fastingDays, isBn]);

  const insights = useMemo(() => {
    const list: string[] = [];
    if (metrics.currentStreakDays > 0) {
      list.push(
        isBn
          ? `আপনি টানা ${toBanglaDigits(metrics.currentStreakDays)} দিন আমল ও ইবাদতে সক্রিয় আছেন (সর্বোচ্চ স্ট্রিক: ${toBanglaDigits(metrics.longestStreakDays)} দিন)।`
          : `You have maintained ${metrics.currentStreakDays} consecutive active day${
              metrics.currentStreakDays > 1 ? 's' : ''
            } (best streak: ${metrics.longestStreakDays} days).`
      );
    } else {
      list.push(
        isBn
          ? 'আজকের স্ট্রিক শুরু করতে একটি দৈনিক আমল, নামাজের চেক-ইন বা কুরআন সেশন সম্পন্ন করুন।'
          : 'Complete a daily task, prayer check-in, or Quran session today to start your streak.'
      );
    }
    if (metrics.totalPrayersChecked > 0) {
      list.push(
        isBn
          ? `মোট ${toBanglaDigits(metrics.totalActiveDays)} সক্রিয় দিনে আপনি ${toBanglaDigits(metrics.totalPrayersChecked)} ওয়াক্ত নামাজ সম্পন্ন করেছেন।`
          : `You have logged ${metrics.totalPrayersChecked} prayers across ${metrics.totalActiveDays} active days.`
      );
    }
    if (metrics.totalQuranMinutes > 0 || metrics.totalQuranAyahs > 0) {
      list.push(
        isBn
          ? `আপনি এ পর্যন্ত ${toBanglaDigits(metrics.totalQuranAyahs)}টি আয়াত এবং ${toBanglaDigits(metrics.totalQuranMinutes)} মিনিট কুরআন তিলাওয়াত করেছেন।`
          : `You have logged ${metrics.totalQuranAyahs} Ayahs and ${metrics.totalQuranMinutes} reading minutes.`
      );
    }
    return list;
  }, [metrics, isBn]);

  const maxStackedTotal = useMemo(() => {
    const vals = weekDays.map((w) => w.tasks + w.prayers + w.quran);
    return Math.max(5, ...vals);
  }, [weekDays]);

  return (
    /* Reference Image B: Clean white streak & stats canvas */
    <div className="min-h-screen bg-white px-4 sm:px-6 py-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
          aria-label={isBn ? 'ফিরে যান' : 'Go back'}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-base font-bold text-[#141517]">
          {isBn ? 'সক্রিয়তা ও পরিসংখ্যান' : 'Activity & Statistics'}
        </h1>
        <button
          type="button"
          onClick={() => navigate('/badges')}
          className="px-3.5 py-1.5 rounded-full bg-orange-50 text-orange-700 text-xs font-bold cursor-pointer"
        >
          {isBn ? 'ব্যাজসমূহ' : 'Badges'}
        </button>
      </div>

      {/* Reference Image B Hero: Flame halo + Big Streak Number */}
      <div className="pt-2 pb-4 text-center space-y-3">
        <div className="w-28 h-28 rounded-full bg-gradient-to-b from-orange-50 to-white border border-orange-100 shadow-inner mx-auto flex items-center justify-center">
          <Flame className="w-14 h-14 text-orange-500 fill-orange-500" />
        </div>

        <div className="text-6xl font-black text-[#141517] tabular-nums tracking-tight leading-none">
          {isBn ? toBanglaDigits(metrics.currentStreakDays) : metrics.currentStreakDays}
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-extrabold text-[#141517]">{t.dayStreak}</h2>
          <p className="text-xs text-slate-500">
            {metrics.currentStreakDays > 0
              ? isBn
                ? `মাশাআল্লাহ, ধারাবাহিকতা বজায় রাখুন ${state.auth.account.name}!`
                : `Keep going, ${state.auth.account.name}!`
              : isBn
              ? `${state.auth.account.name}, আজ থেকেই আপনার নিয়মিত আমলের ধারা শুরু করুন।`
              : `Begin your consistent daily routine, ${state.auth.account.name}.`}
          </p>
        </div>

        {/* 7-day Monday-Sunday activity circles */}
        <div className="max-w-sm mx-auto pt-4 grid grid-cols-7 gap-2">
          {weekDays.map((day) => (
            <div key={day.key} className="flex flex-col items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400">{day.label}</span>
              {day.active ? (
                <span className="w-9 h-9 rounded-full bg-gradient-to-b from-orange-400 to-orange-500 text-white flex items-center justify-center shadow-sm">
                  <Check className="w-4 h-4 stroke-[3]" />
                </span>
              ) : (
                <span className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-[#141517] tabular-nums">
                  {isBn ? toBanglaDigits(day.dayNum) : day.dayNum}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Reference Image B: "Your Stats" Card */}
      <div className="rounded-[28px] bg-[#FAFBFB] border border-slate-200/70 p-5 space-y-4">
        <div className="text-center text-xs font-semibold text-slate-400">{t.yourStats}</div>
        <div className="grid grid-cols-4 gap-2 text-center">
          <div>
            <div className="text-[11px] text-slate-500">{t.tasks}</div>
            <div className="text-xl font-extrabold text-[#141517] tabular-nums mt-0.5">
              {isBn ? toBanglaDigits(metrics.totalTasksCompleted) : metrics.totalTasksCompleted}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-500">{t.prayers}</div>
            <div className="text-xl font-extrabold text-[#141517] tabular-nums mt-0.5">
              {isBn ? toBanglaDigits(metrics.totalPrayersChecked) : metrics.totalPrayersChecked}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-500">{t.ayahs}</div>
            <div className="text-xl font-extrabold text-[#141517] tabular-nums mt-0.5">
              {isBn ? toBanglaDigits(metrics.totalQuranAyahs) : metrics.totalQuranAyahs}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-500">{t.minutes}</div>
            <div className="text-xl font-extrabold text-[#141517] tabular-nums mt-0.5">
              {isBn ? toBanglaDigits(metrics.totalQuranMinutes) : metrics.totalQuranMinutes}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowInsights((v) => !v)}
          className="mx-auto flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-slate-200 text-xs font-bold text-[#141517] shadow-xs hover:bg-slate-50 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-600" />
          <span>
            {isBn
              ? `${toBanglaDigits(insights.length)}টি পর্যবেক্ষণ দেখুন`
              : `${insights.length} Insights Available`}
          </span>
          {showInsights ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showInsights && (
          <div className="rounded-2xl bg-white border border-slate-200/80 p-4 space-y-2">
            {insights.map((line, i) => (
              <p key={i} className="text-xs text-slate-700 leading-relaxed">
                • {line}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Purity & Self-Control (NoFap) Summary Strip */}
      <button
        type="button"
        onClick={() => navigate('/purity')}
        className="w-full text-left rounded-[24px] bg-[#142018] text-white p-4 sm:p-5 flex items-center justify-between gap-3 shadow-xs hover:bg-[#19281e] transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-10 h-10 rounded-xl bg-[#A3F01C] text-[#141517] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <div className="text-xs font-bold text-[#A3F01C]">{t.purityTitle}</div>
            <div className="text-sm font-extrabold tabular-nums">
              {isBn
                ? `${toBanglaDigits(purityStreakDays)} দিন পবিত্র · সর্বোচ্চ ${toBanglaDigits(state.purityTracker.bestStreakDays)} দিন`
                : `${purityStreakDays} Clean Days · Best ${state.purityTracker.bestStreakDays}d`}
            </div>
          </div>
        </div>
        <span className="text-xs font-bold text-[#A3F01C] shrink-0">
          {isBn ? 'খুলুন →' : 'Open →'}
        </span>
      </button>

      {/* Stacked Vertical Activity Bar Chart */}
      <div className="rounded-[28px] bg-[#FAFBFB] border border-slate-200/70 p-5 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-extrabold text-[#141517]">
              {isBn ? 'সাপ্তাহিক ইবাদতের বিশ্লেষণ' : 'Weekly Activity Breakdown'}
            </h3>
            <p className="text-xs text-slate-500">
              {isBn ? 'আমল · নামাজ · কুরআন সেশন' : 'Tasks · Prayers · Quran Sessions'}
            </p>
          </div>
          <div className="flex items-center gap-1 bg-white p-1 rounded-full border border-slate-200">
            {(['week', 'month'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setChartRange(r)}
                className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer ${
                  chartRange === r ? 'bg-[#B4D353] text-[#141517]' : 'text-slate-500'
                }`}
              >
                {r === 'week' ? (isBn ? 'সপ্তাহ' : 'Week') : isBn ? 'মাস' : 'Month'}
              </button>
            ))}
          </div>
        </div>

        {chartRange === 'week' ? (
          <div className="grid grid-cols-7 gap-2.5 pt-2 items-end h-48">
            {weekDays.map((day) => {
              const taskPct = Math.round((day.tasks / maxStackedTotal) * 100);
              const prayerPct = Math.round((day.prayers / maxStackedTotal) * 100);
              const quranPct = Math.round((day.quran / maxStackedTotal) * 100);
              return (
                <div key={day.key} className="h-full flex flex-col items-center gap-2">
                  <div className="flex-1 w-full max-w-[34px] rounded-2xl bg-slate-200/60 p-1 flex flex-col justify-end gap-1 overflow-hidden">
                    {quranPct > 0 && (
                      <div
                        className="w-full rounded-lg bg-[#B4D353]"
                        style={{ height: `${Math.max(10, quranPct)}%` }}
                        title={
                          isBn
                            ? `কুরআন সেশন: ${toBanglaDigits(day.quran)}`
                            : `Quran sessions: ${day.quran}`
                        }
                      />
                    )}
                    {prayerPct > 0 && (
                      <div
                        className="w-full rounded-lg bg-[#A29EE8]"
                        style={{ height: `${Math.max(12, prayerPct)}%` }}
                        title={
                          isBn
                            ? `সালাত: ${toBanglaDigits(day.prayers)}`
                            : `Prayers: ${day.prayers}`
                        }
                      />
                    )}
                    {taskPct > 0 && (
                      <div
                        className="w-full rounded-lg bg-[#141517]"
                        style={{ height: `${Math.max(12, taskPct)}%` }}
                        title={
                          isBn ? `আমল: ${toBanglaDigits(day.tasks)}` : `Tasks: ${day.tasks}`
                        }
                      />
                    )}
                  </div>
                  <span className="text-[11px] font-bold text-slate-500">{day.label}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 text-center py-4">
            <div className="rounded-2xl bg-white p-4 border border-slate-200/70">
              <div className="text-xs text-slate-500">
                {isBn ? 'সক্রিয় দিন' : 'Active Days'}
              </div>
              <div className="text-2xl font-extrabold text-[#141517] tabular-nums mt-1">
                {isBn ? toBanglaDigits(metrics.totalActiveDays) : metrics.totalActiveDays}
              </div>
            </div>
            <div className="rounded-2xl bg-white p-4 border border-slate-200/70">
              <div className="text-xs text-slate-500">
                {isBn ? 'পূর্ণ ৫ ওয়াক্ত' : 'Full 5-Prayer Days'}
              </div>
              <div className="text-2xl font-extrabold text-[#084B32] tabular-nums mt-1">
                {isBn ? toBanglaDigits(metrics.totalFullPrayerDays) : metrics.totalFullPrayerDays}
              </div>
            </div>
            <div className="rounded-2xl bg-white p-4 border border-slate-200/70">
              <div className="text-xs text-slate-500">
                {isBn ? 'সর্বোচ্চ স্ট্রিক' : 'Best Streak'}
              </div>
              <div className="text-2xl font-extrabold text-orange-600 tabular-nums mt-1">
                {isBn
                  ? `${toBanglaDigits(metrics.longestStreakDays)} দিন`
                  : `${metrics.longestStreakDays} d`}
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-center gap-5 text-[11px] font-semibold text-slate-600 pt-1">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#141517]" /> {t.tasks}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#A29EE8]" /> {t.prayers}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#B4D353]" /> {t.quran}
          </span>
        </div>
      </div>
    </div>
  );
};
