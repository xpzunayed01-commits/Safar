import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowUp,
  BookmarkCheck,
  Check,
  RotateCcw,
  Search,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  CURATED_DUAS,
  getInfiniteDhikrItem,
  TOTAL_INFINITE_DHIKR_STREAM,
  type DuaCategory,
} from '../data/duasDhikr';
import { toBanglaDigits } from '../services/prayerService';

const DUAS_SCROLL_STORAGE_KEY = 'safar_duas_scroll_state_v1';
const CHUNK_SIZE = 40;

type FilterTab = 'all' | 'infinite' | DuaCategory;

interface SavedDuasScrollState {
  scrollY: number;
  loadedCount: number;
  activeTab: FilterTab;
  searchQuery: string;
  tappedCounts: Record<string, number>;
  lastReadLabel?: string;
}

function loadSavedScrollState(): SavedDuasScrollState {
  try {
    const raw = localStorage.getItem(DUAS_SCROLL_STORAGE_KEY);
    if (!raw) {
      return {
        scrollY: 0,
        loadedCount: 40,
        activeTab: 'all',
        searchQuery: '',
        tappedCounts: {},
      };
    }
    const parsed = JSON.parse(raw) as Partial<SavedDuasScrollState>;
    return {
      scrollY: typeof parsed.scrollY === 'number' && parsed.scrollY >= 0 ? parsed.scrollY : 0,
      loadedCount:
        typeof parsed.loadedCount === 'number' && parsed.loadedCount >= 40
          ? parsed.loadedCount
          : 40,
      activeTab: parsed.activeTab ?? 'all',
      searchQuery: typeof parsed.searchQuery === 'string' ? parsed.searchQuery : '',
      tappedCounts:
        parsed.tappedCounts && typeof parsed.tappedCounts === 'object'
          ? parsed.tappedCounts
          : {},
      lastReadLabel: parsed.lastReadLabel,
    };
  } catch {
    return {
      scrollY: 0,
      loadedCount: 40,
      activeTab: 'all',
      searchQuery: '',
      tappedCounts: {},
    };
  }
}

export const DuasDhikrPage: React.FC = () => {
  const { state, incrementTasbih } = useApp();
  const navigate = useNavigate();
  const isBn = state.preferences.language === 'bn';

  const initialSaved = useMemo(() => loadSavedScrollState(), []);
  const [activeTab, setActiveTab] = useState<FilterTab>(initialSaved.activeTab);
  const [searchQuery, setSearchQuery] = useState(initialSaved.searchQuery);
  const [loadedCount, setLoadedCount] = useState(initialSaved.loadedCount);
  const [tappedCounts, setTappedCounts] = useState<Record<string, number>>(
    initialSaved.tappedCounts
  );
  const [lastReadLabel, setLastReadLabel] = useState<string | undefined>(
    initialSaved.lastReadLabel
  );
  const [resumedBanner, setResumedBanner] = useState<boolean>(initialSaved.scrollY > 120);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef<SavedDuasScrollState>(initialSaved);

  useEffect(() => {
    stateRef.current = {
      scrollY: window.scrollY,
      loadedCount,
      activeTab,
      searchQuery,
      tappedCounts,
      lastReadLabel,
    };
    try {
      localStorage.setItem(DUAS_SCROLL_STORAGE_KEY, JSON.stringify(stateRef.current));
    } catch {
      // ignore storage quota
    }
  }, [loadedCount, activeTab, searchQuery, tappedCounts, lastReadLabel]);

  // Restore exact scroll position AFTER ScrollToTop in App.tsx runs
  useEffect(() => {
    if (initialSaved.scrollY <= 0) return;
    const timer = window.setTimeout(() => {
      window.scrollTo({ top: initialSaved.scrollY, left: 0, behavior: 'auto' });
    }, 60);
    return () => window.clearTimeout(timer);
  }, [initialSaved.scrollY]);

  // Continuously save scroll position so exiting at any time preserves exact reading point
  useEffect(() => {
    let rafId: number | null = null;
    const handleScroll = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        stateRef.current = {
          ...stateRef.current,
          scrollY: window.scrollY,
        };
        try {
          localStorage.setItem(DUAS_SCROLL_STORAGE_KEY, JSON.stringify(stateRef.current));
        } catch {
          // ignore
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      try {
        localStorage.setItem(
          DUAS_SCROLL_STORAGE_KEY,
          JSON.stringify({ ...stateRef.current, scrollY: window.scrollY })
        );
      } catch {
        // ignore
      }
    };
  }, []);

  // Infinite scroll observer to append 40 more Dhikr cards seamlessly
  const loadMoreDhikr = useCallback(() => {
    setLoadedCount((prev) => Math.min(TOTAL_INFINITE_DHIKR_STREAM, prev + CHUNK_SIZE));
  }, []);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMoreDhikr();
        }
      },
      { rootMargin: '420px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMoreDhikr, activeTab]);

  const categories: Array<{ id: FilterTab; label: string }> = [
    { id: 'all', label: isBn ? 'সব দোয়া ও যিকির' : 'All Duas & Dhikr' },
    { id: 'infinite', label: isBn ? 'অসীম যিকির ধারা (১০০ কোটি+)' : 'Infinite Dhikr (1B+)' },
    { id: 'study', label: isBn ? 'পড়াশোনা ও পরীক্ষা' : 'Study & Exams' },
    { id: 'morning', label: isBn ? 'সকালের যিকির' : 'Morning' },
    { id: 'evening', label: isBn ? 'সন্ধ্যার যিকির' : 'Evening' },
    { id: 'rabbana', label: isBn ? 'কুরআনিক রাব্বানা' : 'Rabbana' },
    { id: 'salah', label: isBn ? 'নামাজের দোয়া' : 'Salah' },
    { id: 'protection', label: isBn ? 'সুরক্ষা ও আশ্রয়' : 'Protection' },
    { id: 'durood', label: isBn ? 'দরূদ শরীফ' : 'Durood' },
    { id: 'daily', label: isBn ? 'দৈনিক সুন্নাহ' : 'Daily' },
  ];

  const filteredCurated = useMemo(() => {
    if (activeTab === 'infinite') return [];
    const q = searchQuery.trim().toLowerCase();
    return CURATED_DUAS.filter((d) => {
      const catOk = activeTab === 'all' || d.category === activeTab;
      if (!catOk) return false;
      if (!q) return true;
      return (
        d.title.toLowerCase().includes(q) ||
        d.titleBn.toLowerCase().includes(q) ||
        d.arabic.includes(q) ||
        d.transliterationBn.toLowerCase().includes(q) ||
        d.translationBn.toLowerCase().includes(q) ||
        d.translationEn.toLowerCase().includes(q)
      );
    });
  }, [activeTab, searchQuery]);

  const showInfiniteStream = activeTab === 'all' || activeTab === 'infinite';

  const streamItems = useMemo(() => {
    if (!showInfiniteStream) return [];
    const q = searchQuery.trim().toLowerCase();
    const list = [];
    for (let i = 0; i < loadedCount; i++) {
      const item = getInfiniteDhikrItem(i);
      if (
        !q ||
        item.arabic.includes(q) ||
        item.transliterationBn.toLowerCase().includes(q) ||
        item.transliteration.toLowerCase().includes(q) ||
        item.translationBn.toLowerCase().includes(q) ||
        item.translationEn.toLowerCase().includes(q)
      ) {
        list.push(item);
      }
    }
    return list;
  }, [showInfiniteStream, loadedCount, searchQuery]);

  const handleTapItem = (id: string, label: string) => {
    setTappedCounts((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
    setLastReadLabel(label);
    incrementTasbih();
  };

  const scrollToTopAndReset = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setResumedBanner(false);
  };

  const totalUserTaps = useMemo(
    () => Object.values(tappedCounts).reduce((acc, v) => acc + v, 0),
    [tappedCounts]
  );

  return (
    <div className="min-h-[100dvh] bg-[#FAF8F3] px-4 sm:px-6 py-5 pb-28">
      <div className="max-w-3xl mx-auto space-y-5">
        {/* Sticky Top Header */}
        <header className="sticky top-2 z-20 rounded-[26px] bg-[#084B32] text-white p-4 sm:p-5 shadow-lg space-y-3.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => navigate('/home')}
                aria-label={isBn ? 'হোমে ফিরুন' : 'Back to Home'}
                className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center shrink-0 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-extrabold truncate">
                  {isBn ? 'দোয়া ও অসীম যিকির' : 'Duas & Infinite Dhikr'}
                </h1>
                <div className="text-[11px] text-[#D9F275] font-semibold tabular-nums truncate">
                  {isBn
                    ? `১০০,০০,০০,০০০+ (১০০ কোটি+) যিকির ধারা · আপনার পাঠ: ${toBanglaDigits(totalUserTaps)} বার`
                    : `1,000,000,000+ Dhikr Stream · Your taps: ${totalUserTaps.toLocaleString()}`}
                </div>
              </div>
            </div>

            {resumedBanner && (
              <button
                type="button"
                onClick={scrollToTopAndReset}
                className="px-3 py-1.5 rounded-full bg-[#D9F275] text-[#084B32] text-[11px] font-extrabold inline-flex items-center gap-1 cursor-pointer shrink-0"
              >
                <ArrowUp className="w-3 h-3" />
                <span>{isBn ? 'শুরুতে' : 'Top'}</span>
              </button>
            )}
          </div>

          {/* Search input */}
          <div className="relative">
            <Search className="w-4 h-4 text-emerald-200 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isBn
                  ? 'আরবি, উচ্চারণ বা বাংলা অর্থ দিয়ে খুঁজুন...'
                  : 'Search Arabic, transliteration or meaning...'
              }
              className="w-full h-10 pl-10 pr-4 rounded-2xl bg-white/12 border border-white/15 text-xs text-white placeholder:text-emerald-100/65 focus:outline-none focus:ring-2 focus:ring-[#D9F275]/50"
            />
          </div>

          {/* Filter pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setActiveTab(cat.id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap cursor-pointer transition-colors ${
                  activeTab === cat.id
                    ? 'bg-[#D9F275] text-[#084B32]'
                    : 'bg-white/10 text-white/90 hover:bg-white/20'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </header>

        {/* Scroll resume notice */}
        {(resumedBanner || lastReadLabel) && (
          <div className="rounded-2xl bg-emerald-50 border border-emerald-200/80 px-4 py-2.5 flex items-center justify-between gap-3 text-xs text-[#084B32]">
            <div className="flex items-center gap-2 min-w-0">
              <BookmarkCheck className="w-4 h-4 shrink-0" />
              <span className="truncate font-semibold">
                {lastReadLabel
                  ? isBn
                    ? `শেষ পাঠ: ${lastReadLabel} — আপনি ঠিক যেখানে থেমেছিলেন সেখান থেকেই চালু আছে`
                    : `Last read: ${lastReadLabel} — Resumed at your exact scroll spot`
                  : isBn
                  ? 'আপনি আগের পড়া অবস্থানেই ফিরে এসেছেন'
                  : 'Resumed at your saved reading scroll position'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setTappedCounts({});
                setLastReadLabel(undefined);
                setLoadedCount(40);
                scrollToTopAndReset();
              }}
              className="text-[11px] font-bold underline shrink-0 cursor-pointer inline-flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{isBn ? 'রিসেট' : 'Reset'}</span>
            </button>
          </div>
        )}

        {/* Curated Masnoon & Quranic Duas */}
        {filteredCurated.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-extrabold text-[#141517]">
                {isBn ? 'মাসনুন ও কুরআনিক দোয়া সংকলন' : 'Authentic Quranic & Masnoon Duas'}
              </h2>
              <span className="text-[11px] font-semibold text-slate-500 tabular-nums">
                {isBn ? `${toBanglaDigits(filteredCurated.length)}টি` : `${filteredCurated.length} duas`}
              </span>
            </div>

            {filteredCurated.map((dua) => {
              const count = tappedCounts[dua.id] ?? 0;
              const done = count >= dua.targetCount;
              return (
                <article
                  key={dua.id}
                  className={`rounded-[26px] p-5 border transition-colors space-y-3 shadow-xs ${
                    done
                      ? 'bg-emerald-50/75 border-emerald-300'
                      : 'bg-white border-amber-200/70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-sm font-extrabold text-[#141517]">
                        {isBn ? dua.titleBn : dua.title}
                      </h3>
                      <div className="text-[11px] font-semibold text-[#084B32] mt-0.5">
                        {isBn ? dua.sourceBn : dua.source}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleTapItem(dua.id, isBn ? dua.titleBn : dua.title)}
                      className={`px-3 py-1.5 rounded-full text-xs font-extrabold flex items-center gap-1.5 shrink-0 cursor-pointer transition-transform active:scale-95 tabular-nums ${
                        done
                          ? 'bg-[#084B32] text-[#D9F275]'
                          : 'bg-[#FAF8F3] hover:bg-amber-100 text-[#141517] border border-amber-200'
                      }`}
                    >
                      {done && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      <span>
                        {isBn
                          ? `পাঠ: ${toBanglaDigits(count)}/${toBanglaDigits(dua.targetCount)}`
                          : `${count}/${dua.targetCount}`}
                      </span>
                    </button>
                  </div>

                  <p
                    className="font-arabic text-2xl sm:text-[28px] text-right text-[#141517] leading-[2.2]"
                    dir="rtl"
                  >
                    {dua.arabic}
                  </p>

                  <p className="text-xs font-semibold text-amber-900/90 leading-relaxed">
                    {isBn ? dua.transliterationBn : dua.transliteration}
                  </p>

                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    {isBn ? dua.translationBn : dua.translationEn}
                  </p>
                </article>
              );
            })}
          </section>
        )}

        {/* Infinite Billion+ Dhikr Stream */}
        {showInfiniteStream && (
          <section className="space-y-3 pt-2">
            <div className="rounded-[24px] bg-[#142018] text-white p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-9 h-9 rounded-xl bg-[#A3F01C] text-[#141517] flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-extrabold text-[#A3F01C]">
                    {isBn ? 'অসীম যিকির ও তাসবিহ ধারা (১০০ কোটি+)' : 'Endless Dhikr Stream (1,000,000,000+)'}
                  </div>
                  <div className="text-[11px] text-emerald-100/80 truncate">
                    {isBn
                      ? 'নিচে স্ক্রল করলেই স্বয়ংক্রিয়ভাবে নতুন যিকির যুক্ত হবে এবং আপনার অবস্থান সেভ থাকবে'
                      : 'Scroll down to load continuously; your exact scroll position saves automatically'}
                  </div>
                </div>
              </div>
              <span className="text-xs font-bold tabular-nums text-[#D9F275] shrink-0">
                {isBn ? `${toBanglaDigits(loadedCount)} লোডেড` : `${loadedCount} loaded`}
              </span>
            </div>

            {streamItems.map((item) => {
              const count = tappedCounts[item.id] ?? 0;
              return (
                <article
                  key={item.id}
                  onClick={() => handleTapItem(item.id, isBn ? item.roundLabelBn : item.roundLabelEn)}
                  className={`rounded-[24px] p-4 sm:p-5 border transition-all cursor-pointer select-none space-y-2.5 ${
                    count > 0
                      ? 'bg-emerald-50/75 border-[#084B32]/40 shadow-xs'
                      : 'bg-white border-slate-200/80 hover:border-[#084B32]/30 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#084B32]/8 text-[#084B32] tabular-nums">
                      {isBn ? item.roundLabelBn : item.roundLabelEn}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-[11px] font-extrabold tabular-nums ${
                        count > 0
                          ? 'bg-[#084B32] text-[#D9F275]'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {count > 0
                        ? isBn
                          ? `পড়েছেন ${toBanglaDigits(count)}× ✓`
                          : `Recited ${count}× ✓`
                        : isBn
                        ? 'ট্যাপ করে পড়ুন'
                        : 'Tap to count'}
                    </span>
                  </div>

                  <p className="font-arabic text-2xl text-right text-[#141517] leading-loose" dir="rtl">
                    {item.arabic}
                  </p>

                  <div className="text-xs font-bold text-[#084B32]">
                    {isBn ? item.transliterationBn : item.transliteration}
                  </div>
                  <div className="text-xs text-slate-700 leading-relaxed">
                    {isBn ? item.translationBn : item.translationEn}
                  </div>
                  <div className="text-[11px] text-amber-800 font-medium">
                    ✦ {isBn ? item.rewardBn : item.rewardEn}
                  </div>
                </article>
              );
            })}

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="py-4 text-center">
              <button
                type="button"
                onClick={loadMoreDhikr}
                className="px-5 py-2.5 rounded-full bg-[#084B32] hover:bg-[#063a26] text-white text-xs font-bold shadow-sm cursor-pointer"
              >
                {isBn
                  ? `আরও ৪০টি যিকির লোড করুন (${toBanglaDigits(loadedCount)} / ১,০০,০০,০০,০০০+)`
                  : `Load 40 More Dhikr (${loadedCount.toLocaleString()} / 1,000,000,000+)`}
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
