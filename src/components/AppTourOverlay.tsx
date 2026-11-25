import React, { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Sparkles, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { toBanglaDigits } from '../services/prayerService';

interface TourStep {
  target: string;
  titleBn: string;
  titleEn: string;
  bodyBn: string;
  bodyEn: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    target: 'prayer-schedule-btn',
    titleBn: 'নামাজের সময়সূচি-তে ক্লিক করুন',
    titleEn: 'Tap Prayer Schedule',
    bodyBn:
      'এখান থেকে ৫ ওয়াক্ত নামাজের সঠিক সময় দেখতে, নিজের মতো সময় এডিট করতে এবং প্রতি ৫ ওয়াক্তে স্বয়ংক্রিয় আযান অ্যালার্ম সেট করতে পারবেন।',
    bodyEn:
      'View 5 daily Salah times, edit any prayer time manually, and enable automatic 5-waqt Adhan alarms.',
  },
  {
    target: 'location-btn',
    titleBn: 'অবস্থান নির্বাচন করুন',
    titleEn: 'Choose Your Location',
    bodyBn:
      'এখানে ট্যাপ করে বিশ্বের যেকোনো শহর, জেলা বা গ্রাম সার্চ করুন অথবা GPS দিয়ে আপনার বর্তমান অবস্থান বের করুন।',
    bodyEn:
      'Search any city worldwide or tap GPS to auto-detect your location for exact prayer times and Qibla.',
  },
  {
    target: 'planner-card',
    titleBn: 'দৈনিক আমল ও প্ল্যানার',
    titleEn: 'Daily Worship Planner',
    bodyBn:
      'নিজের প্রতিদিনের ইবাদত, কাজ ও লক্ষ্য যোগ করুন এবং রিয়েলটাইম প্রগ্রেস ও রিমাইন্ডার পান।',
    bodyEn:
      'Add your own daily worship habits, scheduled tasks, and track real-time completion.',
  },
  {
    target: 'ssc-card',
    titleBn: 'এসএসসি স্টাডি হাব',
    titleEn: 'SSC Study Hub',
    bodyBn:
      'বিষয় ও অধ্যায়ভিত্তিক পড়াশোনা, সৃজনশীল (CQ), MCQ, মডেল টেস্ট, স্টাডি টাইমার এবং দুর্বল অধ্যায় ট্র্যাকার।',
    bodyEn:
      'Track SSC subjects, chapters, CQ/MCQ, model tests, study timer, and weak chapters.',
  },
  {
    target: 'duas-shortcut',
    titleBn: 'দোয়া ও অসীম যিকির (১০০ কোটি+)',
    titleEn: 'Duas & Infinite Dhikr',
    bodyBn:
      'এখান থেকে মাসনুন দোয়া ও অসীম যিকির পড়ুন—আপনি যতদূর স্ক্রল করে পড়বেন, পরের বার ঠিক সেখান থেকেই শুরু হবে!',
    bodyEn:
      'Read curated Duas and an endless Dhikr stream—your exact scroll spot is saved automatically.',
  },
  {
    target: 'quran-shortcut',
    titleBn: 'পবিত্র কুরআন তিলাওয়াত',
    titleEn: 'Holy Quran Reader',
    bodyBn:
      'কুরআন শোনার সময় প্রতিটি চলমান আয়াতের নিচে স্বয়ংক্রিয় আন্ডারলাইন ও অটো-স্ক্রল হবে।',
    bodyEn:
      'Listen to Quran with live auto-underline and smooth auto-scrolling on every recited ayah.',
  },
  {
    target: 'purity-card',
    titleBn: 'পবিত্রতা ও আত্মসংযম',
    titleEn: 'Purity & Self-Control',
    bodyBn:
      'গুনাহমুক্ত থাকার লাইভ টাইমার, জরুরি মুহূর্তের দিকনির্দেশনা এবং মাইলফলক ব্যাজ।',
    bodyEn:
      'Live purity streak timer, emergency grounding tools, and achievement milestones.',
  },
  {
    target: 'profile-nav',
    titleBn: 'অ্যাপ ইনস্টল, বার অ্যাডজাস্ট ও ব্যাকআপ',
    titleEn: 'Install, Nav Offset & Backup',
    bodyBn:
      'প্রোফাইল পেজ থেকে Safar-কে ফোনে নেটিভ অ্যাপ হিসেবে ইনস্টল করুন, ফোনের হোম/ব্যাক বাটন অনুযায়ী নিচের বার উঁচু-নিচু করুন এবং JSON ব্যাকআপ নিন।',
    bodyEn:
      'Install Safar as a native full-screen app, adjust the bottom navigation offset, and export/restore JSON backups.',
  },
];

export const AppTourOverlay: React.FC = () => {
  const { state, completeTour } = useApp();
  const location = useLocation();
  const isBn = state.preferences.language === 'bn';

  const [stepIdx, setStepIdx] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const active =
    state.auth.isAuthenticated &&
    state.auth.isOnboarded &&
    !state.preferences.hasCompletedTour &&
    location.pathname === '/home';

  const currentStep = TOUR_STEPS[stepIdx] ?? TOUR_STEPS[0];

  const measureTarget = useCallback(() => {
    if (!active) return;
    const elements = Array.from(
      document.querySelectorAll(`[data-tour="${currentStep.target}"]`)
    ) as HTMLElement[];
    const visible = elements.find((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    });
    if (visible) {
      const r = visible.getBoundingClientRect();
      setRect(r);
    } else {
      setRect(null);
    }
  }, [active, currentStep.target]);

  useEffect(() => {
    if (!active) return;
    const elements = Array.from(
      document.querySelectorAll(`[data-tour="${currentStep.target}"]`)
    ) as HTMLElement[];
    const visible = elements.find((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    });
    if (visible) {
      visible.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    const t1 = window.setTimeout(measureTarget, 220);
    const t2 = window.setTimeout(measureTarget, 500);
    window.addEventListener('resize', measureTarget);
    window.addEventListener('scroll', measureTarget, { passive: true });
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.removeEventListener('resize', measureTarget);
      window.removeEventListener('scroll', measureTarget);
    };
  }, [active, stepIdx, currentStep.target, measureTarget]);

  if (!active) return null;

  const isBottomHalf = rect ? rect.top > window.innerHeight * 0.52 : false;

  return (
    <div
      className="fixed inset-0 z-[90] pointer-events-auto"
      role="dialog"
      aria-modal="true"
      aria-label={isBn ? 'অ্যাপ টিউটোরিয়াল' : 'App Feature Tutorial'}
    >
      {/* Backdrop click closes nothing accidentally, user chooses Skip or Next */}
      {!rect && <div className="absolute inset-0 bg-[#071812]/72 backdrop-blur-[1px]" />}

      {/* Spotlight Ring around highlighted UI element */}
      {rect && (
        <div
          className="fixed rounded-[22px] border-2 border-[#D9F275] transition-all duration-300 pointer-events-none"
          style={{
            top: Math.max(4, rect.top - 6),
            left: Math.max(4, rect.left - 6),
            width: Math.min(window.innerWidth - 8, rect.width + 12),
            height: rect.height + 12,
            boxShadow: '0 0 0 9999px rgba(7, 24, 18, 0.75)',
          }}
        />
      )}

      {/* Floating Guide Card */}
      <div
        className={`fixed left-1/2 -translate-x-1/2 w-[calc(100%-24px)] max-w-md z-10 transition-all duration-300 ${
          rect
            ? isBottomHalf
              ? 'top-5 sm:top-8'
              : 'bottom-24 sm:bottom-10'
            : 'top-1/2 -translate-y-1/2'
        }`}
      >
        <div className="bg-white rounded-[28px] p-5 shadow-2xl border border-emerald-200 space-y-3.5">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#084B32]/10 text-[#084B32] text-[11px] font-extrabold tabular-nums">
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {isBn
                  ? `ফিচার গাইড ${toBanglaDigits(stepIdx + 1)} / ${toBanglaDigits(TOUR_STEPS.length)}`
                  : `Feature Guide ${stepIdx + 1} / ${TOUR_STEPS.length}`}
              </span>
            </span>

            <button
              type="button"
              onClick={completeTour}
              className="text-xs font-bold text-slate-400 hover:text-[#141517] inline-flex items-center gap-1 cursor-pointer px-2 py-1"
            >
              <span>{isBn ? 'এড়িয়ে যান' : 'Skip'}</span>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1.5">
            <h3 className="text-base sm:text-lg font-extrabold text-[#141517] leading-snug">
              {isBn ? currentStep.titleBn : currentStep.titleEn}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {isBn ? currentStep.bodyBn : currentStep.bodyEn}
            </p>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            {stepIdx > 0 ? (
              <button
                type="button"
                onClick={() => setStepIdx((i) => Math.max(0, i - 1))}
                className="h-10 px-4 rounded-full bg-slate-100 hover:bg-slate-200 text-[#141517] text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{isBn ? 'পূর্ববর্তী' : 'Prev'}</span>
              </button>
            ) : (
              <span />
            )}

            {stepIdx < TOUR_STEPS.length - 1 ? (
              <button
                type="button"
                onClick={() => setStepIdx((i) => Math.min(TOUR_STEPS.length - 1, i + 1))}
                className="h-10 px-5 rounded-full bg-[#084B32] hover:bg-[#063a26] text-white text-xs font-extrabold inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <span>{isBn ? 'পরবর্তী ফিচার' : 'Next'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={completeTour}
                className="h-10 px-5 rounded-full bg-[#084B32] hover:bg-[#063a26] text-[#D9F275] text-xs font-extrabold inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>{isBn ? 'বুঝেছি, শুরু করুন' : 'Got It, Let’s Start'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
