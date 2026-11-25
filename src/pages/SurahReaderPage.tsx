import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Bookmark,
  CheckCircle2,
  Minus,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Volume2,
  WifiOff,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getSurahDisplayName, getSurahMeaning } from '../data/surahMeta';
import { toBanglaDigits } from '../services/prayerService';
import { fetchSurahDetail, getAyahAudioUrl, getSurahMeta } from '../services/quranService';
import type { SurahDetail } from '../types/app';

export const SurahReaderPage: React.FC = () => {
  const { surahNumber } = useParams();
  const num = Math.min(114, Math.max(1, Number(surahNumber) || 1));
  const navigate = useNavigate();

  const {
    state,
    setLastRead,
    toggleBookmark,
    toggleMemorizedAyah,
    logQuranSession,
    toggleSurahCompleted,
    updateQuranSettings,
  } = useApp();
  const isBn = state.preferences.language === 'bn';

  const [detail, setDetail] = useState<SurahDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ayahRefs = useRef<Map<number, HTMLElement>>(new Map());
  const [playingAyahGlobal, setPlayingAyahGlobal] = useState<number | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);

  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [ayahsMarkedInSession, setAyahsMarkedInSession] = useState(0);

  const meta = getSurahMeta(num);
  const localizedSurahTitle = getSurahDisplayName(num, meta.transliteration, isBn);
  const localizedSurahMeaning = getSurahMeaning(num, meta.englishMeaning, isBn);

  const loadSurah = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSurahDetail(num);
      setDetail(data);
    } catch (err: any) {
      setError(err?.message || (isBn ? 'সূরাটি লোড করা যায়নি।' : 'Unable to load Surah.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSurah();
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [num]);

  // Auto scroll to playing ayah
  useEffect(() => {
    if (playingAyahGlobal !== null) {
      const el = ayahRefs.current.get(playingAyahGlobal);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [playingAyahGlobal]);

  useEffect(() => {
    if (!timerRunning) return;
    const id = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [timerRunning]);

  const handlePlayAyah = (globalNumber: number, ayahInSurah: number) => {
    setAudioError(null);
    if (playingAyahGlobal === globalNumber && audioRef.current) {
      audioRef.current.pause();
      setPlayingAyahGlobal(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(getAyahAudioUrl(globalNumber));
    audioRef.current = audio;
    setPlayingAyahGlobal(globalNumber);

    audio.onended = () => {
      if (detail) {
        const idx = detail.ayahs.findIndex((a) => a.globalNumber === globalNumber);
        const next = detail.ayahs[idx + 1];
        if (next) {
          handlePlayAyah(next.globalNumber, next.numberInSurah);
          return;
        }
      }
      setPlayingAyahGlobal(null);
    };

    audio.onerror = () => {
      setPlayingAyahGlobal(null);
      setAudioError(
        isBn
          ? 'অডিও তিলাওয়াত শুনতে ইন্টারনেট সংযোগ প্রয়োজন।'
          : 'Audio recitation requires an internet connection.'
      );
    };

    audio.play().catch(() => {
      setPlayingAyahGlobal(null);
      setAudioError(
        isBn ? 'এই মুহূর্তে তিলাওয়াত চালু করা যাচ্ছে না।' : 'Unable to play recitation right now.'
      );
    });

    setLastRead(num, meta.transliteration, ayahInSurah);
  };

  const handleSaveSession = () => {
    setTimerRunning(false);
    const ayahs = Math.max(ayahsMarkedInSession, detail?.ayahs.length ? 1 : 0);
    logQuranSession(num, ayahs, Math.max(elapsedSeconds, 10));
    setElapsedSeconds(0);
    setAyahsMarkedInSession(0);
  };

  const mins = Math.floor(elapsedSeconds / 60);
  const secs = elapsedSeconds % 60;
  const timerProgressPct = Math.min(100, ((elapsedSeconds % 600) / 600) * 100);
  const isCompleted = state.quranProgress.completedSurahs.includes(num);

  return (
    <div className="min-h-[100dvh] bg-[#FAF8F3] pb-12">
      {/* Sticky Top Reader Bar */}
      <div className="sticky top-0 z-30 bg-[#FAF8F3]/95 backdrop-blur-md border-b border-amber-200/60 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => navigate('/quran')}
            className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0 cursor-pointer"
            aria-label={isBn ? 'সূরা তালিকায় ফিরে যান' : 'Back to Quran list'}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h1 className="text-base font-extrabold text-[#141517] truncate">
              {isBn ? toBanglaDigits(num) : num}. {localizedSurahTitle}
            </h1>
            <div className="text-xs text-slate-500">
              {localizedSurahMeaning} ·{' '}
              {isBn ? `${toBanglaDigits(meta.ayahCount)} আয়াত` : `${meta.ayahCount} Ayahs`} ·{' '}
              {isBn ? (meta.revelationType === 'Meccan' ? 'মক্কী' : 'মাদানী') : meta.revelationType}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() =>
              updateQuranSettings({
                fontSize: Math.max(20, state.quranProgress.fontSize - 2),
              })
            }
            className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center cursor-pointer"
            aria-label="Decrease Arabic font size"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() =>
              updateQuranSettings({
                fontSize: Math.min(40, state.quranProgress.fontSize + 2),
              })
            }
            className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center cursor-pointer"
            aria-label="Increase Arabic font size"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <select
            value={
              !state.quranProgress.showTranslation
                ? 'off'
                : state.quranProgress.translationLang
            }
            onChange={(e) => {
              const val = e.target.value;
              if (val === 'off') {
                updateQuranSettings({ showTranslation: false });
              } else {
                updateQuranSettings({
                  showTranslation: true,
                  translationLang: val as 'en' | 'bn',
                });
              }
            }}
            className="h-9 px-2.5 rounded-full bg-white border border-slate-200 text-xs font-semibold"
          >
            <option value="bn">বাংলা</option>
            <option value="en">{isBn ? 'ইংরেজি' : 'EN'}</option>
            <option value="off">{isBn ? 'শুধু আরবি' : 'Arabic Only'}</option>
          </select>
        </div>
      </div>

      <div className="px-4 sm:px-6 pt-5 max-w-4xl mx-auto space-y-5">
        {/* Surah Intro Header Card (Name, Meaning, Ayah Count, Juz, Page, Makki / Madani) */}
        <section className="rounded-[28px] bg-gradient-to-br from-[#07432D] via-[#084B32] to-[#0B5E3F] text-white p-5 sm:p-6 shadow-md border border-emerald-900/40 relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/12 text-[#D9F275] text-xs font-extrabold tabular-nums">
              {isBn ? `সূরা নং ${toBanglaDigits(num)}` : `Surah #${num}`}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-extrabold tracking-wide shadow-xs ${
                meta.revelationType === 'Meccan'
                  ? 'bg-amber-300 text-[#3B2106]'
                  : 'bg-[#A3F01C] text-[#141517]'
              }`}
            >
              <span>
                {meta.revelationType === 'Meccan'
                  ? isBn
                    ? 'মক্কী সূরা'
                    : 'Makki (Meccan)'
                  : isBn
                  ? 'মাদানী সূরা'
                  : 'Madani (Medinan)'}
              </span>
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                {localizedSurahTitle}
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
                <span className="font-bold text-[#D9F275]">
                  {isBn ? 'সূচনা ও অর্থ:' : 'Meaning:'}
                </span>{' '}
                {localizedSurahMeaning}
                {isBn && meta.transliteration ? ` · (${meta.transliteration})` : ''}
              </p>
            </div>
            <div
              className="font-arabic text-4xl sm:text-5xl text-[#FDE7BA] leading-none sm:text-right shrink-0 py-1"
              dir="rtl"
            >
              {meta.nameArabic}
            </div>
          </div>

          <div className="mt-4 pt-3.5 border-t border-white/15 flex flex-wrap items-center gap-2 text-xs font-bold tabular-nums">
            <span className="px-3 py-1 rounded-full bg-white/10 text-white">
              {isBn ? `মোট আয়াত: ${toBanglaDigits(meta.ayahCount)}টি` : `Ayahs: ${meta.ayahCount}`}
            </span>
            <span className="px-3 py-1 rounded-full bg-white/10 text-emerald-100">
              {isBn ? `পারা (জুজ): ${toBanglaDigits(meta.juzStart)}` : `Juz: ${meta.juzStart}`}
            </span>
            <span className="px-3 py-1 rounded-full bg-white/10 text-emerald-100">
              {isBn ? `পৃষ্ঠা: ${toBanglaDigits(meta.pageStart)}` : `Page: ${meta.pageStart}`}
            </span>
          </div>
        </section>

        {/* Reading Session Arc Timer */}
        <div className="bg-white rounded-[28px] p-5 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative w-24 h-16 flex flex-col items-center justify-end">
              <svg viewBox="0 0 120 65" className="w-full h-full overflow-visible">
                <path
                  d="M 12 60 A 48 48 0 0 1 108 60"
                  fill="none"
                  stroke="#E2E8F0"
                  strokeWidth="10"
                  strokeLinecap="round"
                />
                <path
                  d="M 12 60 A 48 48 0 0 1 108 60"
                  fill="none"
                  stroke="#0284C7"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={150.8}
                  strokeDashoffset={150.8 - (150.8 * timerProgressPct) / 100}
                />
              </svg>
              <span className="text-sm font-extrabold tabular-nums text-[#141517] -mt-6">
                {isBn
                  ? `${toBanglaDigits(String(mins).padStart(2, '0'))}:${toBanglaDigits(
                      String(secs).padStart(2, '0')
                    )}`
                  : `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`}
              </span>
            </div>
            <div>
              <div className="text-sm font-bold text-[#141517]">
                {isBn ? 'তিলাওয়াত সেশন টাইমার' : 'Reading Session Timer'}
              </div>
              <div className="text-xs text-slate-500">
                {isBn
                  ? 'পরিসংখ্যান ও ব্যাজের জন্য তিলাওয়াতের সময় হিসাব রাখে'
                  : 'Tracks real reading minutes for your Statistics & Badges'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTimerRunning((r) => !r)}
              className="w-11 h-11 rounded-full bg-[#141517] text-white flex items-center justify-center shadow-sm cursor-pointer"
              aria-label={timerRunning ? 'Pause reading timer' : 'Start reading timer'}
            >
              {timerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>
            {elapsedSeconds > 0 && (
              <button
                type="button"
                onClick={handleSaveSession}
                className="h-10 px-4 rounded-full bg-[#084B32] text-white text-xs font-bold cursor-pointer"
              >
                {isBn ? 'সেশন সেভ করুন' : 'Log Session'}
              </button>
            )}
            <button
              type="button"
              onClick={() => toggleSurahCompleted(num)}
              className={`h-10 px-3.5 rounded-full text-xs font-bold flex items-center gap-1.5 border cursor-pointer ${
                isCompleted
                  ? 'bg-emerald-50 border-emerald-400 text-[#084B32]'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>
                {isCompleted
                  ? isBn
                    ? 'সম্পন্ন'
                    : 'Completed'
                  : isBn
                  ? 'সম্পন্ন চিহ্নিত করুন'
                  : 'Mark Done'}
              </span>
            </button>
          </div>
        </div>

        {audioError && (
          <div className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-900 flex items-center gap-2">
            <WifiOff className="w-4 h-4 shrink-0" />
            <span>{audioError}</span>
          </div>
        )}

        {/* Loading / Error / Ayah List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-3xl p-6 animate-pulse space-y-3">
                <div className="h-6 bg-slate-200 rounded w-3/4 ml-auto" />
                <div className="h-4 bg-slate-100 rounded w-5/6" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-white rounded-[28px] p-8 border border-slate-200 text-center space-y-3">
            <WifiOff className="w-9 h-9 text-amber-600 mx-auto" />
            <div className="text-base font-bold text-[#141517]">
              {isBn ? 'সূরাটি অফলাইনে সংরক্ষিত নেই' : 'Surah Not Cached Offline'}
            </div>
            <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">{error}</p>
            <button
              type="button"
              onClick={() => void loadSurah()}
              className="px-5 py-2.5 rounded-full bg-[#084B32] text-white text-xs font-semibold inline-flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{isBn ? 'পুনরায় ডাউনলোড করুন' : 'Retry Download'}</span>
            </button>
          </div>
        ) : (
          detail && (
            <>
              {num !== 1 && num !== 9 && (
                <div className="text-center py-4 font-arabic text-3xl text-[#3B2106]">
                  بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                </div>
              )}

              <div className="space-y-3.5">
                {detail.ayahs.map((ayah) => {
                  const isBookmarked = state.quranProgress.bookmarks.some(
                    (b) => b.surahNumber === num && b.ayahNumber === ayah.numberInSurah
                  );
                  const isMemorized = Boolean(
                    state.quranProgress.memorizedAyahs[`${num}:${ayah.numberInSurah}`]
                  );
                  const isPlaying = playingAyahGlobal === ayah.globalNumber;
                  const isLastRead =
                    state.quranProgress.lastRead.surahNumber === num &&
                    state.quranProgress.lastRead.ayahNumber === ayah.numberInSurah;

                  return (
                    <article
                      key={ayah.numberInSurah}
                      ref={(node) => {
                        if (node) {
                          ayahRefs.current.set(ayah.globalNumber, node);
                        } else {
                          ayahRefs.current.delete(ayah.globalNumber);
                        }
                      }}
                      className={`rounded-[26px] bg-white p-5 sm:p-6 border transition-all relative overflow-hidden ${
                        isPlaying
                          ? 'border-[#084B32] ring-2 ring-[#084B32]/20 shadow-md bg-emerald-50/10'
                          : isLastRead
                          ? 'border-amber-300'
                          : 'border-slate-200/70'
                      }`}
                    >
                      {isPlaying && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#084B32] via-[#22C55E] to-[#A3F01C] animate-pulse" />
                      )}
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                        <span className="w-8 h-8 rounded-full bg-[#FAF8F3] border border-amber-200 text-xs font-extrabold text-[#3B2106] flex items-center justify-center tabular-nums shrink-0">
                          {isBn ? toBanglaDigits(ayah.numberInSurah) : ayah.numberInSurah}
                        </span>

                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handlePlayAyah(ayah.globalNumber, ayah.numberInSurah)}
                            className={`h-9 px-3 rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                              isPlaying
                                ? 'bg-[#084B32] text-white'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                            <span>
                              {isPlaying ? (isBn ? 'বিরতি' : 'Pause') : isBn ? 'শুনুন' : 'Listen'}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setLastRead(num, meta.transliteration, ayah.numberInSurah);
                              setAyahsMarkedInSession((c) => c + 1);
                            }}
                            className={`h-9 px-3 rounded-full text-xs font-semibold cursor-pointer ${
                              isLastRead
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {isLastRead
                              ? isBn
                                ? 'সর্বশেষ পঠিত'
                                : 'Last Read'
                              : isBn
                              ? 'পঠিত চিহ্ন'
                              : 'Mark Read'}
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleMemorizedAyah(num, ayah.numberInSurah)}
                            aria-label="Toggle memorized"
                            className={`h-9 px-2.5 rounded-full text-xs font-semibold cursor-pointer ${
                              isMemorized
                                ? 'bg-emerald-100 text-[#084B32]'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {isMemorized ? (isBn ? 'হিফয ✓' : 'Hifz ✓') : isBn ? 'হিফয' : 'Hifz'}
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleBookmark(num, meta.transliteration, ayah.numberInSurah)}
                            aria-label="Bookmark ayah"
                            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-amber-50 flex items-center justify-center cursor-pointer"
                          >
                            <Bookmark
                              className={`w-4 h-4 ${
                                isBookmarked ? 'text-amber-600 fill-amber-500' : 'text-slate-400'
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      <p
                        className={`font-arabic text-right text-[#141517] mt-4 pb-2 transition-all ${
                          isPlaying ? 'border-b-2 border-[#084B32]/80 text-[#084B32]' : ''
                        }`}
                        style={{ fontSize: `${state.quranProgress.fontSize}px` }}
                        dir="rtl"
                      >
                        {ayah.arabic}
                      </p>

                      {state.quranProgress.showTranslation && (
                        <p className="mt-4 text-sm text-slate-700 leading-relaxed">
                          {state.quranProgress.translationLang === 'bn'
                            ? ayah.translationBn || ayah.translationEn
                            : ayah.translationEn}
                        </p>
                      )}
                    </article>
                  );
                })}
              </div>

              {/* Explicit Translation Attribution Footer */}
              <div className="rounded-2xl bg-white/80 border border-slate-200/70 p-4 text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-2">
                <span>
                  {isBn ? 'আরবি: উসমানী লিপি · অনুবাদ:' : 'Arabic: Uthmani Script · Translation:'}{' '}
                  {state.quranProgress.translationLang === 'bn'
                    ? detail.translationSourceBn || detail.translationSourceEn
                    : detail.translationSourceEn}
                </span>
                <span>
                  {isBn ? 'তিলাওয়াত: মিশারি রশিদ আল-আফাসি' : 'Recitation: Mishary Rashid Alafasy'}
                </span>
              </div>
            </>
          )
        )}
      </div>
    </div>
  );
};
