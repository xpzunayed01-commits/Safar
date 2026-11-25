import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, BookOpen, CheckCircle2, Search } from 'lucide-react';
import {
  ALL_SURAHS_META,
  getSurahDisplayName,
  getSurahMeaning,
  SURAH_MEANING_BN,
  SURAH_NAME_BN,
} from '../data/surahMeta';
import { toBanglaDigits } from '../services/prayerService';
import { isSurahCachedLocally } from '../services/quranService';
import { useApp } from '../context/AppContext';
import { MosqueSilhouette } from '../components/MosqueArtwork';

export const QuranLibraryPage: React.FC = () => {
  const { state, t } = useApp();
  const navigate = useNavigate();
  const isBn = state.preferences.language === 'bn';

  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'surah' | 'juz' | 'bookmarks'>('surah');

  const filteredSurahs = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ALL_SURAHS_META;
    return ALL_SURAHS_META.filter((s) => {
      const bnName = (SURAH_NAME_BN[s.number] ?? '').toLowerCase();
      const bnMeaning = (SURAH_MEANING_BN[s.number] ?? '').toLowerCase();
      const bnNum = toBanglaDigits(s.number);
      return (
        s.transliteration.toLowerCase().includes(q) ||
        s.englishMeaning.toLowerCase().includes(q) ||
        bnName.includes(q) ||
        bnMeaning.includes(q) ||
        s.nameArabic.includes(q) ||
        String(s.number) === q ||
        bnNum === q
      );
    });
  }, [query]);

  const juzGroups = useMemo(() => {
    const groups: Record<number, typeof ALL_SURAHS_META> = {};
    for (const s of ALL_SURAHS_META) {
      if (!groups[s.juzStart]) groups[s.juzStart] = [];
      groups[s.juzStart].push(s);
    }
    return Object.entries(groups).map(([juz, surahs]) => ({
      juz: Number(juz),
      surahs,
    }));
  }, []);

  return (
    /* Warm cream/off-white background matching Reference Image F (Right Screen) */
    <div className="min-h-screen bg-[#FAF8F3] px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-[#141517]">
            {t.quran}
          </h1>
          <p className="text-xs text-slate-500">
            {isBn
              ? '১১৪টি সূরা · অফলাইনে ও অনুবাদসহ তিলাওয়াত'
              : '114 Surahs · Offline-ready & AlQuran Cloud'}
          </p>
        </div>
        <div className="text-xs font-bold text-[#084B32] tabular-nums">
          {isBn
            ? `${toBanglaDigits(state.quranProgress.completedSurahs.length)}/১১৪ সম্পন্ন`
            : `${state.quranProgress.completedSurahs.length}/114 Completed`}
        </div>
      </div>

      {/* Golden "Last Read" Banner with Mosque Silhouette (Reference Image F) */}
      <button
        type="button"
        onClick={() => navigate(`/quran/${state.quranProgress.lastRead.surahNumber}`)}
        className="w-full text-left rounded-[26px] p-5 relative overflow-hidden shadow-sm border border-amber-200/70 cursor-pointer group"
        style={{
          background: 'linear-gradient(125deg, #FCE3B4 0%, #F4B65E 100%)',
        }}
      >
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold text-[#3B2106]/80">{t.lastRead}</div>
            <div className="text-2xl font-extrabold text-[#3B2106] mt-1">
              {getSurahDisplayName(
                state.quranProgress.lastRead.surahNumber,
                state.quranProgress.lastRead.surahName,
                isBn
              )}
            </div>
            <div className="text-xs font-semibold text-[#3B2106]/85 mt-1 tabular-nums">
              {isBn
                ? `আয়াত নং: ${toBanglaDigits(state.quranProgress.lastRead.ayahNumber)}`
                : `Ayah No: ${state.quranProgress.lastRead.ayahNumber}`}
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/40 backdrop-blur-sm flex items-center justify-center text-[#3B2106] group-hover:scale-105 transition-transform">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>
        <MosqueSilhouette className="absolute right-0 bottom-0 w-56 h-24 text-white pointer-events-none opacity-80" />
      </button>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.searchSurah}
          className="w-full h-12 pl-11 pr-4 rounded-2xl bg-white border border-amber-200/60 text-sm text-[#141517] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40 shadow-xs"
        />
      </div>

      {/* Section Header + Tabs ("সূরা | পারা | বুকমার্ক") */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-extrabold text-[#141517]">
          {isBn ? 'আল-কুরআন' : 'Al Quran'}
        </h2>
        <div className="flex items-center gap-1 bg-amber-100/60 p-1 rounded-full">
          {(['surah', 'juz', 'bookmarks'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                activeTab === tab
                  ? 'bg-white text-[#141517] shadow-xs'
                  : 'text-amber-950/70 hover:text-[#141517]'
              }`}
            >
              {tab === 'surah'
                ? isBn
                  ? 'সূরা'
                  : 'Surah'
                : tab === 'juz'
                ? isBn
                  ? 'পারা'
                  : 'Juz'
                : isBn
                ? `বুকমার্ক (${toBanglaDigits(state.quranProgress.bookmarks.length)})`
                : `Bookmarks (${state.quranProgress.bookmarks.length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'surah' && (
        <div className="bg-white rounded-[28px] border border-slate-200/70 shadow-xs divide-y divide-slate-100 overflow-hidden">
          {filteredSurahs.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              {isBn ? `"${query}" নামে কোনো সূরা পাওয়া যায়নি।` : `No Surah matches "${query}".`}
            </div>
          ) : (
            filteredSurahs.map((surah) => {
              const cached = isSurahCachedLocally(surah.number);
              const completed = state.quranProgress.completedSurahs.includes(surah.number);
              return (
                <button
                  key={surah.number}
                  type="button"
                  onClick={() => navigate(`/quran/${surah.number}`)}
                  className="w-full px-5 py-4 flex items-center justify-between gap-4 hover:bg-[#FAF8F3] transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="w-10 h-10 rounded-2xl bg-[#FAF8F3] border border-amber-200/70 text-xs font-extrabold text-[#3B2106] flex items-center justify-center tabular-nums shrink-0">
                      {isBn
                        ? toBanglaDigits(String(surah.number).padStart(2, '0'))
                        : String(surah.number).padStart(2, '0')}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#141517] truncate">
                          {getSurahDisplayName(surah.number, surah.transliteration, isBn)}
                        </span>
                        {completed && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        )}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <span>{getSurahMeaning(surah.number, surah.englishMeaning, isBn)}</span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">
                          {isBn
                            ? `${toBanglaDigits(surah.ayahCount)} আয়াত`
                            : `${surah.ayahCount} Ayahs`}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {isBn
                            ? surah.revelationType === 'Meccan'
                              ? 'মক্কী'
                              : 'মাদানী'
                            : surah.revelationType}
                        </span>
                        {cached && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-[#084B32] font-semibold">
                              {isBn ? 'অফলাইন' : 'Offline'}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="font-arabic text-2xl font-bold text-[#3B2106] shrink-0" dir="rtl">
                    {surah.nameArabic}
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'juz' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {juzGroups.map((group) => (
            <div
              key={group.juz}
              className="bg-white rounded-[24px] p-4 border border-slate-200/70 shadow-xs space-y-2.5"
            >
              <div className="text-xs font-extrabold text-[#084B32] tracking-wider">
                {isBn ? `পারা ${toBanglaDigits(group.juz)}` : `Juz ${group.juz}`}
              </div>
              <div className="space-y-1.5">
                {group.surahs.map((s) => (
                  <button
                    key={s.number}
                    type="button"
                    onClick={() => navigate(`/quran/${s.number}`)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-[#FAF8F3] hover:bg-amber-50 text-xs font-semibold text-[#141517] cursor-pointer"
                  >
                    <span>
                      {isBn ? toBanglaDigits(s.number) : s.number}.{' '}
                      {getSurahDisplayName(s.number, s.transliteration, isBn)}
                    </span>
                    <span className="font-arabic text-base text-[#3B2106]">{s.nameArabic}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'bookmarks' && (
        <div className="bg-white rounded-[28px] border border-slate-200/70 shadow-xs p-5">
          {state.quranProgress.bookmarks.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <Bookmark className="w-8 h-8 text-amber-500 mx-auto" />
              <div className="text-sm font-bold text-[#141517]">
                {isBn ? 'এখনো কোনো বুকমার্ক নেই' : 'No bookmarks yet'}
              </div>
              <p className="text-xs text-slate-500">
                {isBn
                  ? 'যেকোনো সূরা খুলে আয়াতের পাশে থাকা বুকমার্ক আইকনে ট্যাপ করে এখানে সংরক্ষণ করুন।'
                  : 'Open any Surah and tap the bookmark icon on an Ayah to save it here.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {state.quranProgress.bookmarks.map((bm) => (
                <button
                  key={`${bm.surahNumber}-${bm.ayahNumber}`}
                  type="button"
                  onClick={() => navigate(`/quran/${bm.surahNumber}`)}
                  className="w-full py-3.5 flex items-center justify-between text-left hover:bg-[#FAF8F3] px-2 rounded-xl cursor-pointer"
                >
                  <div>
                    <div className="text-sm font-bold text-[#141517]">
                      {getSurahDisplayName(bm.surahNumber, bm.surahName, isBn)} ·{' '}
                      {isBn
                        ? `আয়াত ${toBanglaDigits(bm.ayahNumber)}`
                        : `Ayah ${bm.ayahNumber}`}
                    </div>
                    <div className="text-xs text-slate-500">
                      {isBn ? 'সংরক্ষিত:' : 'Saved'}{' '}
                      {new Date(bm.createdAt).toLocaleDateString(isBn ? 'bn-BD' : undefined)}
                    </div>
                  </div>
                  <Bookmark className="w-4 h-4 text-amber-600 fill-amber-500" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
