import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Award,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Edit2,
  FileText,
  Filter,
  GraduationCap,
  Pause,
  Pin,
  Play,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Timer,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { toBanglaDigits } from '../../services/prayerService';
import { SSCChapterModal } from './modals/SSCChapterModal';
import { SSCConfigModal } from './modals/SSCConfigModal';
import { SSCModelTestModal } from './modals/SSCModelTestModal';
import { SSCNoteModal } from './modals/SSCNoteModal';
import { SSCPlanModal } from './modals/SSCPlanModal';
import { SSCSubjectModal } from './modals/SSCSubjectModal';
import type { ChapterStatus, SSCChapter, SSCModelTest, SSCStudyNote, SSCStudyPlan, SSCSubject } from '../../types/ssc';

type SubTab = 'dashboard' | 'subjects' | 'planner' | 'revision' | 'mocktests' | 'timer' | 'notes';

export const SSCMainPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    studyData,
    metrics,
    activeTimer,
    toggleChapterStatus,
    toggleWeakChapter,
    updateCqCount,
    updateMcqCount,
    toggleRevisionStage,
    deleteChapter,
    deleteSubject,
    togglePlanCompleted,
    deleteStudyPlan,
    deleteModelTest,
    deleteStudySession,
    deleteStudyNote,
    setTimerConfig,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopAndLogTimer,
    resetTimer,
  } = useStudy();

  const [activeTab, setActiveTab] = useState<SubTab>('dashboard');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | ChapterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [subjectModalOpen, setSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SSCSubject | null>(null);
  const [chapterModalOpen, setChapterModalOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<SSCChapter | null>(null);
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SSCStudyPlan | null>(null);
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<SSCModelTest | null>(null);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<SSCStudyNote | null>(null);

  // Filtered chapters for Subjects tab
  const filteredChapters = useMemo(() => {
    return studyData.chapters.filter((ch) => {
      if (selectedSubjectId !== 'all' && ch.subjectId !== selectedSubjectId) return false;
      if (statusFilter !== 'all' && ch.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = ch.nameBn.toLowerCase().includes(q) || ch.name.toLowerCase().includes(q);
        const matchesNote = (ch.notes || '').toLowerCase().includes(q);
        return matchesName || matchesNote;
      }
      return true;
    });
  }, [studyData.chapters, selectedSubjectId, statusFilter, searchQuery]);

  // Weak chapters list for dedicated tracker
  const weakChapters = useMemo(() => {
    return studyData.chapters.filter((c) => c.isWeak);
  }, [studyData.chapters]);

  // Subject lookup helper
  const subjectMap = useMemo(() => {
    const map = new Map<string, SSCSubject>();
    for (const sub of studyData.subjects) {
      map.set(sub.id, sub);
    }
    return map;
  }, [studyData.subjects]);

  const pad2 = (n: number) => String(Math.max(0, n)).padStart(2, '0');

  // Format timer seconds to MM:SS
  const formatTimerDuration = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${pad2(m)}:${pad2(s)}`;
  };

  const getSubjectColorBg = (color?: SSCSubject['colorTheme']) => {
    switch (color) {
      case 'rose':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'indigo':
        return 'bg-indigo-50 text-indigo-800 border-indigo-200';
      case 'amber':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'violet':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'sky':
        return 'bg-sky-50 text-sky-800 border-sky-200';
      case 'teal':
        return 'bg-teal-50 text-teal-800 border-teal-200';
      default:
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    }
  };

  const statusLabelBn: Record<ChapterStatus, string> = {
    not_started: 'শুরু হয়নি',
    in_progress: 'পড়া চলছে',
    completed: 'সম্পন্ন',
    revised: 'রিভাইজড',
  };

  const statusBadgeColor: Record<ChapterStatus, string> = {
    not_started: 'bg-slate-100 text-slate-600',
    in_progress: 'bg-amber-100 text-amber-900',
    completed: 'bg-emerald-100 text-[#084B32]',
    revised: 'bg-purple-100 text-purple-900',
  };

  return (
    <div className="min-h-screen bg-[#F6F8F5] pb-16">
      {/* Top Emerald Header with Live SSC Countdown Banner */}
      <div className="bg-gradient-to-b from-[#07432D] to-[#084B32] text-white px-4 sm:px-6 pt-5 pb-8 rounded-b-[34px] shadow-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate('/home')}
            className="w-10 h-10 rounded-full bg-white text-[#084B32] flex items-center justify-center shadow-xs cursor-pointer shrink-0"
            aria-label="হোমে ফিরে যান"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="text-center min-w-0">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/10 text-[10px] font-bold text-[#D9F275] mb-1">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>{studyData.config.examTitle}</span>
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold tracking-tight truncate">
              এসএসসি স্টাডি ম্যানেজমেন্ট হাব
            </h1>
          </div>

          <button
            type="button"
            onClick={() => setConfigModalOpen(true)}
            className="w-10 h-10 rounded-full bg-white/12 hover:bg-white/20 flex items-center justify-center shrink-0 cursor-pointer text-[#D9F275]"
            title="টার্গেট তারিখ ও সেটিংস পরিবর্তন"
            aria-label="পরীক্ষার সেটিংস"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        </div>

        {/* Live Examination Countdown Bento */}
        <div className="max-w-2xl mx-auto mt-5">
          <div className="rounded-[28px] bg-black/25 backdrop-blur-md border border-white/15 p-4 sm:p-5 text-white space-y-3.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-emerald-100/90 font-medium flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#A3F01C]" />
                <span>
                  টার্গেট পরীক্ষা: {studyData.config.targetExamDate} ({studyData.config.boardName || 'ঢাকা বোর্ড'})
                </span>
              </span>
              <button
                type="button"
                onClick={() => setConfigModalOpen(true)}
                className="text-[11px] font-bold text-[#D9F275] hover:underline cursor-pointer"
              >
                তারিখ পরিবর্তন
              </button>
            </div>

            {/* 4 Countdown Boxes (Days : Hours : Mins : Secs) */}
            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                { v: toBanglaDigits(metrics.daysRemaining), l: 'দিন' },
                { v: toBanglaDigits(pad2(metrics.hoursRemaining)), l: 'ঘণ্টা' },
                { v: toBanglaDigits(pad2(metrics.minsRemaining)), l: 'মিনিট' },
                { v: toBanglaDigits(pad2(metrics.secsRemaining)), l: 'সেকেন্ড' },
              ].map((box) => (
                <div
                  key={box.l}
                  className="rounded-2xl bg-white/10 border border-white/10 py-2.5 px-1 shadow-inner"
                >
                  <div className="text-2xl sm:text-3xl font-black tabular-nums leading-none text-white">
                    {box.v}
                  </div>
                  <div className="text-[10px] font-bold text-[#D9F275] mt-1">{box.l}</div>
                </div>
              ))}
            </div>

            {/* Overall Syllabus Progress Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-emerald-100">সিলেবাস সম্পন্নতা</span>
                <span className="text-[#A3F01C] tabular-nums">
                  {toBanglaDigits(metrics.overallCompletionPct)}% ({toBanglaDigits(metrics.completedChapters)}/{toBanglaDigits(metrics.totalChapters)} অধ্যায়)
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-white/15 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#A3F01C] to-[#22C55E] rounded-full transition-all duration-500"
                  style={{ width: `${metrics.overallCompletionPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Live Active / Paused Study Timer Floating Strip */}
        {(activeTimer.isRunning || activeTimer.elapsedSeconds > 0) && (
          <div
            className={`max-w-2xl mx-auto mt-3 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-lg transition-all ${
              activeTimer.isRunning
                ? 'bg-[#A3F01C] text-[#141517]'
                : 'bg-white text-[#141517] border-2 border-amber-300'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  activeTimer.isRunning
                    ? 'bg-black text-[#A3F01C]'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                <Timer className={`w-4 h-4 ${activeTimer.isRunning ? 'animate-spin' : ''}`} />
              </span>
              <div className="min-w-0">
                <div className="text-xs font-extrabold truncate">
                  {activeTimer.isRunning ? 'স্টাডি টাইমার চলছে' : 'টাইমার পজ করা রয়েছে (Paused)'}:{' '}
                  {subjectMap.get(activeTimer.subjectId)?.nameBn || 'পড়ালেখা'}
                </div>
                <div className="text-[11px] font-semibold opacity-80 truncate">
                  {activeTimer.mode === 'pomodoro' ? 'পোমোডোরো' : 'স্টপওয়াচ'} ·{' '}
                  {activeTimer.topicCovered || 'মনোযোগ দিয়ে পড়ুন'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-base font-black tabular-nums">
                {toBanglaDigits(
                  formatTimerDuration(
                    activeTimer.mode === 'pomodoro'
                      ? Math.max(0, activeTimer.pomodoroTargetSeconds - activeTimer.elapsedSeconds)
                      : activeTimer.elapsedSeconds
                  )
                )}
              </span>
              {activeTimer.isRunning ? (
                <button
                  type="button"
                  onClick={pauseTimer}
                  className="w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center cursor-pointer"
                  title="পজ করুন"
                >
                  <Pause className="w-4 h-4 text-black" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={resumeTimer}
                  className="w-8 h-8 rounded-full bg-[#084B32] text-white flex items-center justify-center cursor-pointer hover:bg-black"
                  title="চালু রাখুন"
                >
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => void stopAndLogTimer()}
                className="px-3 py-1.5 rounded-full bg-black text-white text-[11px] font-bold cursor-pointer hover:bg-slate-800"
              >
                লগ ও শেষ
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Container */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-4 space-y-6">
        {/* Navigation Sub-Tabs Scrollable Bar */}
        <div className="bg-white rounded-full p-1.5 shadow-sm border border-slate-200/80 flex items-center gap-1 overflow-x-auto no-scrollbar">
          {[
            { id: 'dashboard', label: 'ওভারভিউ', icon: TrendingUp },
            { id: 'subjects', label: 'বিষয় ও অধ্যায়', icon: BookOpen },
            { id: 'planner', label: 'স্টাডি প্ল্যানার', icon: Calendar },
            { id: 'revision', label: 'রিভিশন ও দুর্বল অধ্যায়', icon: AlertTriangle, badge: metrics.weakChaptersCount },
            { id: 'mocktests', label: 'মডেল টেস্ট ও ফলাফল', icon: Award },
            { id: 'timer', label: 'স্টাডি টাইমার', icon: Timer },
            { id: 'notes', label: 'নোটস ও সূত্র', icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as SubTab)}
                className={`px-3.5 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#142018] text-white shadow-xs'
                    : 'text-slate-600 hover:text-[#141517] hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{tab.label}</span>
                {Boolean(tab.badge && tab.badge > 0) && (
                  <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-extrabold flex items-center justify-center">
                    {toBanglaDigits(tab.badge ?? 0)}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW & DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-5">
            {/* Quick 4 Metrics Bento */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-white rounded-[24px] p-4 border border-slate-200/70 shadow-xs text-center">
                <div className="text-xs text-slate-500 font-semibold">সৃজনশীল (CQ)</div>
                <div className="text-xl sm:text-2xl font-black text-[#141517] tabular-nums mt-0.5">
                  {toBanglaDigits(metrics.totalCqSolved)} <span className="text-xs font-normal text-slate-400">টি</span>
                </div>
                <div className="text-[10px] text-emerald-700 font-bold mt-0.5">
                  টার্গেট: {toBanglaDigits(metrics.totalCqTarget)}টি
                </div>
              </div>

              <div className="bg-white rounded-[24px] p-4 border border-slate-200/70 shadow-xs text-center">
                <div className="text-xs text-slate-500 font-semibold">বহুনির্বাচনী (MCQ)</div>
                <div className="text-xl sm:text-2xl font-black text-[#141517] tabular-nums mt-0.5">
                  {toBanglaDigits(metrics.totalMcqSolved)} <span className="text-xs font-normal text-slate-400">টি</span>
                </div>
                <div className="text-[10px] text-emerald-700 font-bold mt-0.5">
                  টার্গেট: {toBanglaDigits(metrics.totalMcqTarget)}টি
                </div>
              </div>

              <div className="bg-white rounded-[24px] p-4 border border-slate-200/70 shadow-xs text-center">
                <div className="text-xs text-slate-500 font-semibold">মোট পড়াশোনা</div>
                <div className="text-xl sm:text-2xl font-black text-[#084B32] tabular-nums mt-0.5">
                  {toBanglaDigits(Math.round(metrics.totalStudyMinutes / 60))} <span className="text-xs font-normal text-slate-400">ঘণ্টা</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  আজকে: {toBanglaDigits(metrics.todayStudyMinutes)} মি.
                </div>
              </div>

              <div className="bg-white rounded-[24px] p-4 border border-slate-200/70 shadow-xs text-center">
                <div className="text-xs text-slate-500 font-semibold">মডেল টেস্ট গড়</div>
                <div className="text-xl sm:text-2xl font-black text-amber-600 tabular-nums mt-0.5">
                  {toBanglaDigits(metrics.mockExamAverage)}%
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {toBanglaDigits(metrics.mockExamCount)}টি টেস্ট সম্পন্ন
                </div>
              </div>
            </div>

            {/* Weak Chapters Banner Alert (if any) */}
            {metrics.weakChaptersCount > 0 && (
              <div className="rounded-[26px] bg-rose-50 border border-rose-200 p-4 sm:p-5 flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-10 h-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-rose-800">
                      {toBanglaDigits(metrics.weakChaptersCount)}টি দুর্বল অধ্যায় চিহ্নিত রয়েছে
                    </div>
                    <div className="text-[11px] text-rose-600 mt-0.5 truncate">
                      পরীক্ষায় ভালো নম্বরের জন্য এই অধ্যায়গুলোতে অতিরিক্ত সময় ও রিভিশন দিন।
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('revision')}
                  className="px-4 py-2 rounded-full bg-rose-600 text-white text-xs font-bold shrink-0 cursor-pointer hover:bg-rose-700"
                >
                  অধ্যায়গুলো দেখুন →
                </button>
              </div>
            )}

            {/* Subject-Wise Progress Cards Grid */}
            <div className="bg-white rounded-[28px] p-5 border border-slate-200/70 shadow-xs space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-extrabold text-[#141517]">বিষয়ভিত্তিক সিলেবাস অগ্রগতি</h2>
                  <p className="text-xs text-slate-500">প্রতিটি বিষয়ের অধ্যায় সম্পন্নতা ও CQ/MCQ অগ্রগতি</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSubjectModalOpen(true)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#141517] text-white text-xs font-bold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>বিষয় যোগ</span>
                </button>
              </div>

              {studyData.subjects.length === 0 ? (
                <div className="rounded-[24px] bg-slate-50 border border-dashed border-slate-300 p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-[#084B32] mx-auto flex items-center justify-center">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-bold text-[#141517]">
                    কোনো বিষয় এখনও যোগ করা হয়নি
                  </div>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    আপনার এসএসসি পরীক্ষার সিলেবাস অনুযায়ী বিষয় ও অধ্যায় যুক্ত করে প্রস্তুতি শুরু করুন।
                  </p>
                  <button
                    type="button"
                    onClick={() => setSubjectModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#141517] text-white text-xs font-bold hover:bg-black cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>প্রথম বিষয় যোগ করুন</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {studyData.subjects.map((sub) => {
                    const m = metrics.subjectMetrics[sub.id] || {
                      total: 0,
                      completed: 0,
                      inProgress: 0,
                      pct: 0,
                      weakCount: 0,
                      cqSolved: 0,
                      mcqSolved: 0,
                    };
                    return (
                      <div
                        key={sub.id}
                        className="rounded-2xl p-4 border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              কোড: {toBanglaDigits(sub.code)}
                            </span>
                            <h3 className="text-sm font-extrabold text-[#141517] truncate">{sub.nameBn}</h3>
                          </div>
                          <span className="text-xs font-black text-[#084B32] bg-emerald-100 px-2.5 py-0.5 rounded-full tabular-nums">
                            {toBanglaDigits(m.pct)}%
                          </span>
                        </div>

                        <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className="h-full bg-[#084B32] rounded-full transition-all"
                            style={{ width: `${m.pct}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>
                            {toBanglaDigits(m.completed)}/{toBanglaDigits(m.total)} অধ্যায় সম্পন্ন
                          </span>
                          {m.weakCount > 0 ? (
                            <span className="text-rose-600 font-bold">
                              {toBanglaDigits(m.weakCount)}টি দুর্বল
                            </span>
                          ) : (
                            <span className="text-emerald-700 font-semibold">নিয়মিত ধারায়</span>
                          )}
                        </div>

                        <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSubjectId(sub.id);
                              setActiveTab('subjects');
                            }}
                            className="text-xs font-bold text-[#084B32] hover:underline cursor-pointer"
                          >
                            অধ্যায় তালিকা →
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              startTimer(sub.id);
                              setActiveTab('timer');
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 hover:text-black cursor-pointer"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>পড়া শুরু</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Islamic Wisdom on Striving for Knowledge */}
            <div className="rounded-[26px] bg-[#FAF8F3] border border-amber-200/70 p-5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>হাদিসের দিকনির্দেশনা · জ্ঞান অন্বেষণ</span>
              </div>
              <p className="font-arabic text-xl text-right text-[#3B2106] leading-relaxed" dir="rtl">
                طَلَبُ الْعِلْمِ فَرِيضَةٌ عَلَىٰ كُلِّ مُسْلِمٍ
              </p>
              <p className="text-xs text-slate-700 leading-relaxed">
                “জ্ঞান অন্বেষণ করা প্রত্যেক মুসলমানের জন্য ফরজ দায়িত্ব।” — (সুনান ইবনে মাজাহ: ২২৪)। নিষ্ঠা, সততা এবং নিয়মিত মেহনতের মাধ্যমে পড়ালেখাকে ইবাদতের নিয়তে পরিণত করুন।
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: SUBJECTS & CHAPTERS SYLLABUS */}
        {activeTab === 'subjects' && (
          <div className="space-y-4">
            {/* Filter and Subject Selector Pills */}
            <div className="bg-white rounded-[26px] p-4 border border-slate-200/70 shadow-xs space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 max-w-sm bg-slate-100 rounded-full px-3.5 py-1.5">
                  <Search className="w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="অধ্যায় খুঁজুন..."
                    className="w-full text-xs bg-transparent focus:outline-none text-[#141517]"
                  />
                  {searchQuery && (
                    <button type="button" onClick={() => setSearchQuery('')} className="cursor-pointer">
                      <Trash2 className="w-3 h-3 text-slate-400" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSubjectModalOpen(true)}
                    className="h-9 px-3.5 rounded-full bg-slate-100 hover:bg-slate-200 text-[#141517] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>বিষয় যোগ</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingChapter(null);
                      setChapterModalOpen(true);
                    }}
                    className="h-9 px-3.5 rounded-full bg-[#141517] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer hover:bg-black"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>অধ্যায় যোগ</span>
                  </button>
                </div>
              </div>

              {/* Subject horizontal pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
                <button
                  type="button"
                  onClick={() => setSelectedSubjectId('all')}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                    selectedSubjectId === 'all'
                      ? 'bg-[#084B32] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  সকল বিষয় ({toBanglaDigits(studyData.chapters.length)})
                </button>
                {studyData.subjects.map((sub) => {
                  const isSel = selectedSubjectId === sub.id;
                  const count = studyData.chapters.filter((c) => c.subjectId === sub.id).length;
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => setSelectedSubjectId(sub.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                        isSel
                          ? 'bg-[#084B32] text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {sub.nameBn} ({toBanglaDigits(count)})
                    </button>
                  );
                })}
              </div>

              {/* Status filter bar */}
              <div className="flex items-center gap-1 pt-1 overflow-x-auto no-scrollbar">
                {[
                  { id: 'all', label: 'সব অবস্থা' },
                  { id: 'not_started', label: 'শুরু হয়নি' },
                  { id: 'in_progress', label: 'পড়া চলছে' },
                  { id: 'completed', label: 'সম্পন্ন' },
                  { id: 'revised', label: 'রিভাইজড' },
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setStatusFilter(st.id as any)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold cursor-pointer ${
                      statusFilter === st.id
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Chapters List */}
            {studyData.subjects.length === 0 ? (
              <div className="bg-white rounded-[26px] p-8 text-center border border-slate-200/80 space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-[#084B32] mx-auto flex items-center justify-center">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div className="text-sm font-bold text-[#141517]">এখনো কোনো বিষয় যোগ করা হয়নি</div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  অধ্যায় তৈরি করার আগে প্রথমে আপনার পরীক্ষার বিষয়গুলো (যেমন: বাংলা, ইংরেজি, গণিত ইত্যাদি) যোগ করুন।
                </p>
                <button
                  type="button"
                  onClick={() => setSubjectModalOpen(true)}
                  className="px-4 py-2 rounded-full bg-[#084B32] text-white text-xs font-bold cursor-pointer hover:bg-black"
                >
                  + প্রথম বিষয় যোগ করুন
                </button>
              </div>
            ) : filteredChapters.length === 0 ? (
              <div className="bg-white rounded-[26px] p-8 text-center border border-slate-200/80 space-y-3">
                <div className="text-sm font-bold text-[#141517]">কোনো অধ্যায় পাওয়া যায়নি</div>
                <p className="text-xs text-slate-500">
                  নতুন অধ্যায় যুক্ত করতে ওপরের "+ অধ্যায় যোগ" বাটনে ট্যাপ করুন।
                </p>
                <button
                  type="button"
                  onClick={() => setChapterModalOpen(true)}
                  className="px-4 py-2 rounded-full bg-[#141517] text-white text-xs font-bold cursor-pointer"
                >
                  + প্রথম অধ্যায় যোগ করুন
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredChapters.map((ch) => {
                  const sub = subjectMap.get(ch.subjectId);
                  const cqPct = ch.cqTarget > 0 ? Math.min(100, Math.round((ch.cqSolved / ch.cqTarget) * 100)) : 100;
                  const mcqPct = ch.mcqTarget > 0 ? Math.min(100, Math.round((ch.mcqSolved / ch.mcqTarget) * 100)) : 100;

                  return (
                    <div
                      key={ch.id}
                      className={`bg-white rounded-[26px] p-4 sm:p-5 border shadow-xs space-y-3.5 transition-all ${
                        ch.isWeak ? 'border-rose-300 ring-1 ring-rose-200 bg-rose-50/20' : 'border-slate-200/80'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                              {sub?.nameBn || 'সাধারণ বিষয়'}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleChapterStatus(ch.id)}
                              className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full cursor-pointer transition-transform active:scale-95 ${
                                statusBadgeColor[ch.status]
                              }`}
                              title="ট্যাপ করে অবস্থা পরিবর্তন করুন"
                            >
                              {statusLabelBn[ch.status]} ⟳
                            </button>
                            {ch.isWeak && (
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                                ⚠ দুর্বল অধ্যায়
                              </span>
                            )}
                            <span className="text-[10px] font-semibold text-slate-400">
                              {ch.importance === 'high' ? 'উচ্চ গুরুত্ব' : ch.importance === 'medium' ? 'মাঝারি' : 'সাধারণ'}
                            </span>
                          </div>

                          <h3 className="text-base font-extrabold text-[#141517] leading-snug">
                            {ch.nameBn}
                          </h3>
                          {ch.notes && (
                            <p className="text-xs text-slate-600 mt-1 leading-relaxed">{ch.notes}</p>
                          )}
                        </div>

                        {/* Quick action buttons */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => toggleWeakChapter(ch.id)}
                            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                              ch.isWeak
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-slate-100 text-slate-400 hover:text-rose-600'
                            }`}
                            title={ch.isWeak ? 'দুর্বল তালিকা থেকে সরান' : 'দুর্বল অধ্যায় হিসেবে চিহ্নিত করুন'}
                          >
                            <AlertTriangle className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setEditingChapter(ch);
                              setChapterModalOpen(true);
                            }}
                            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
                            title="সম্পাদনা"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => deleteChapter(ch.id)}
                            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-rose-100 hover:text-rose-600 text-slate-400 flex items-center justify-center cursor-pointer"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* CQ & MCQ Interactive Progress Bars with Stepper */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        {/* CQ Stepper */}
                        <div className="rounded-2xl bg-slate-50 p-3 border border-slate-200/70 space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-[#141517]">সৃজনশীল (CQ)</span>
                            <span className="font-extrabold text-[#084B32] tabular-nums">
                              {toBanglaDigits(ch.cqSolved)} / {toBanglaDigits(ch.cqTarget)}
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                            <div className="h-full bg-[#084B32] rounded-full" style={{ width: `${cqPct}%` }} />
                          </div>
                          <div className="flex items-center justify-between pt-1 text-xs">
                            <span className="text-[10px] text-slate-400 font-medium">সমাধান কাউন্টার</span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => updateCqCount(ch.id, -1)}
                                className="w-6 h-6 rounded-lg bg-white border border-slate-200 font-bold text-xs flex items-center justify-center cursor-pointer hover:bg-slate-100"
                              >
                                -
                              </button>
                              <button
                                type="button"
                                onClick={() => updateCqCount(ch.id, 1)}
                                className="w-6 h-6 rounded-lg bg-[#084B32] text-white font-bold text-xs flex items-center justify-center cursor-pointer hover:bg-black"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* MCQ Stepper */}
                        <div className="rounded-2xl bg-slate-50 p-3 border border-slate-200/70 space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-[#141517]">বহুনির্বাচনী (MCQ)</span>
                            <span className="font-extrabold text-blue-700 tabular-nums">
                              {toBanglaDigits(ch.mcqSolved)} / {toBanglaDigits(ch.mcqTarget)}
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                            <div className="h-full bg-blue-600 rounded-full" style={{ width: `${mcqPct}%` }} />
                          </div>
                          <div className="flex items-center justify-between pt-1 text-xs">
                            <span className="text-[10px] text-slate-400 font-medium">সমাধান কাউন্টার</span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => updateMcqCount(ch.id, -5)}
                                className="w-6 h-6 rounded-lg bg-white border border-slate-200 font-bold text-xs flex items-center justify-center cursor-pointer hover:bg-slate-100"
                              >
                                -
                              </button>
                              <button
                                type="button"
                                onClick={() => updateMcqCount(ch.id, 5)}
                                className="w-6 h-6 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center cursor-pointer hover:bg-blue-700"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 3-Stage Revision Badges Strip */}
                      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="text-slate-500 font-semibold text-[11px]">৩-ধাপ রিভিশন শিডিউল:</span>
                        <div className="flex items-center gap-2">
                          {[
                            { stage: 1 as const, done: ch.revision1, date: ch.revision1Date, label: '১ম রিভিশন' },
                            { stage: 2 as const, done: ch.revision2, date: ch.revision2Date, label: '২য় রিভিশন' },
                            { stage: 3 as const, done: ch.revision3, date: ch.revision3Date, label: 'ফাইনাল' },
                          ].map((rev) => (
                            <button
                              key={rev.stage}
                              type="button"
                              onClick={() => toggleRevisionStage(ch.id, rev.stage)}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 border transition-all cursor-pointer ${
                                rev.done
                                  ? 'bg-[#A3F01C] border-[#A3F01C] text-[#141517]'
                                  : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                              }`}
                              title={rev.date ? `সম্পন্ন: ${rev.date}` : 'ট্যাপ করে সম্পন্ন করুন'}
                            >
                              {rev.done && <Check className="w-3 h-3 stroke-[3]" />}
                              <span>{rev.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: DAILY & WEEKLY STUDY PLANNER */}
        {activeTab === 'planner' && (
          <div className="space-y-4">
            <div className="bg-white rounded-[26px] p-5 border border-slate-200/70 shadow-xs flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-extrabold text-[#141517]">দৈনিক ও সাপ্তাহিক স্টাডি রুটিন</h2>
                <p className="text-xs text-slate-500">প্রতিদিনের পড়ার বিষয় ও সময়সূচি পরিকল্পনা করুন</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingPlan(null);
                  setPlanModalOpen(true);
                }}
                className="h-10 px-4 rounded-full bg-[#141517] hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>রুটিন যোগ</span>
              </button>
            </div>

            {studyData.studyPlans.length === 0 ? (
              <div className="bg-white rounded-[26px] p-8 text-center border border-slate-200/80 space-y-3">
                <div className="text-sm font-bold text-[#141517]">আজকের কোনো পড়ার রুটিন নেই</div>
                <p className="text-xs text-slate-500">
                  সঠিক সময়ে পড়ার প্রস্তুতি নিতে রুটিন তৈরি করুন।
                </p>
                <button
                  type="button"
                  onClick={() => setPlanModalOpen(true)}
                  className="px-5 py-2.5 rounded-full bg-[#141517] text-white text-xs font-bold cursor-pointer"
                >
                  + প্রথম রুটিন তৈরি করুন
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {studyData.studyPlans.map((plan) => {
                  const sub = subjectMap.get(plan.subjectId);
                  return (
                    <div
                      key={plan.id}
                      className={`rounded-[24px] p-4 sm:p-5 border flex items-center justify-between gap-3 transition-all ${
                        plan.isCompleted
                          ? 'bg-slate-50 border-slate-200/80 opacity-75'
                          : 'bg-white border-slate-200/80 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <button
                          type="button"
                          onClick={() => togglePlanCompleted(plan.id)}
                          className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border transition-colors cursor-pointer ${
                            plan.isCompleted
                              ? 'bg-[#084B32] border-[#084B32] text-white'
                              : 'bg-white border-slate-300 hover:border-[#084B32]'
                          }`}
                        >
                          {plan.isCompleted && <Check className="w-4 h-4 stroke-[3]" />}
                        </button>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                            <span className="font-bold text-[#084B32]">{sub?.nameBn}</span>
                            <span>·</span>
                            <span className="tabular-nums">
                              {toBanglaDigits(plan.startTime)} - {toBanglaDigits(plan.endTime)}
                            </span>
                            <span>·</span>
                            <span>{toBanglaDigits(plan.date)}</span>
                          </div>
                          <h3
                            className={`text-sm sm:text-base font-extrabold mt-0.5 ${
                              plan.isCompleted ? 'line-through text-slate-500' : 'text-[#141517]'
                            }`}
                          >
                            {plan.title}
                          </h3>
                          {plan.notes && (
                            <p className="text-xs text-slate-500 mt-0.5">{plan.notes}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPlan(plan);
                            setPlanModalOpen(true);
                          }}
                          className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteStudyPlan(plan.id)}
                          className="w-8 h-8 rounded-full bg-slate-100 hover:bg-rose-100 hover:text-rose-600 flex items-center justify-center cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: REVISION & WEAK CHAPTERS TRACKER */}
        {activeTab === 'revision' && (
          <div className="space-y-4">
            <div className="bg-white rounded-[26px] p-5 border border-slate-200/70 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                  <h2 className="text-base font-extrabold text-[#141517]">
                    দুর্বল অধ্যায় ট্র্যাকার ({toBanglaDigits(weakChapters.length)}টি অধ্যায়)
                  </h2>
                </div>
                <span className="text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                  অগ্রাধিকার ভিত্তিক রিভিশন
                </span>
              </div>
              <p className="text-xs text-slate-600">
                যেসব অধ্যায়ে টেস্ট পেপার সলভ করার সময় বা মডেল টেস্টে ভুল বেশি হচ্ছে সেগুলো এখানে চিহ্নিত থাকবে। সমাধান হলে টগল করে স্বাভাবিক অবস্থায় ফিরিয়ে আনতে পারবেন।
              </p>
            </div>

            {weakChapters.length === 0 ? (
              <div className="bg-white rounded-[26px] p-8 text-center border border-slate-200/80 space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-[#084B32] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-extrabold text-[#141517]">মাশাআল্লাহ! কোনো দুর্বল অধ্যায় চিহ্নিত নেই</h3>
                <p className="text-xs text-slate-500">
                  কোনো অধ্যায়ে দ্বিধা বা ঘাটতি মনে হলে অধ্যায় লিস্ট থেকে "দুর্বল অধ্যায়" বাটনে চাপ দিন।
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {weakChapters.map((ch) => {
                  const sub = subjectMap.get(ch.subjectId);
                  return (
                    <div
                      key={ch.id}
                      className="bg-white rounded-[26px] p-5 border border-rose-300 shadow-xs space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 text-xs font-bold text-rose-700 mb-1">
                            <span>{sub?.nameBn}</span>
                            <span>·</span>
                            <span>CQ সমাধান: {toBanglaDigits(ch.cqSolved)}/{toBanglaDigits(ch.cqTarget)}</span>
                            <span>·</span>
                            <span>MCQ: {toBanglaDigits(ch.mcqSolved)}/{toBanglaDigits(ch.mcqTarget)}</span>
                          </div>
                          <h4 className="text-base font-extrabold text-[#141517]">{ch.nameBn}</h4>
                          {ch.notes && (
                            <p className="text-xs text-slate-600 mt-1 leading-relaxed bg-rose-50 p-2.5 rounded-xl border border-rose-100">
                              {ch.notes}
                            </p>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleWeakChapter(ch.id)}
                          className="px-3 py-1.5 rounded-full bg-emerald-100 text-[#084B32] text-xs font-bold hover:bg-emerald-200 cursor-pointer shrink-0"
                        >
                          ঘাটতি দূর হয়েছে ✓
                        </button>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => {
                            startTimer(ch.subjectId, ch.id, `${ch.nameBn} রিভিশন`);
                            setActiveTab('timer');
                          }}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#141517] text-white text-xs font-bold hover:bg-black cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>এখনই রিভিশন শুরু করুন</span>
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleRevisionStage(ch.id, 1)}
                            className={`px-3 py-1 rounded-full text-[11px] font-bold border cursor-pointer ${
                              ch.revision1 ? 'bg-[#A3F01C] text-black border-[#A3F01C]' : 'bg-slate-50 text-slate-600'
                            }`}
                          >
                            রিভিশন ১ {ch.revision1 ? '✓' : ''}
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleRevisionStage(ch.id, 2)}
                            className={`px-3 py-1 rounded-full text-[11px] font-bold border cursor-pointer ${
                              ch.revision2 ? 'bg-[#A3F01C] text-black border-[#A3F01C]' : 'bg-slate-50 text-slate-600'
                            }`}
                          >
                            রিভিশন ২ {ch.revision2 ? '✓' : ''}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: MOCK TESTS & PERFORMANCE ANALYTICS */}
        {activeTab === 'mocktests' && (
          <div className="space-y-4">
            <div className="bg-white rounded-[26px] p-5 border border-slate-200/70 shadow-xs flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-extrabold text-[#141517]">মডেল টেস্ট ও পরীক্ষার অ্যানালিটিক্স</h2>
                <p className="text-xs text-slate-500">মক টেস্টের প্রাপ্ত নম্বর, গ্রেড এবং ভুলের পর্যালোচনার হিসাব</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingTest(null);
                  setTestModalOpen(true);
                }}
                className="h-10 px-4 rounded-full bg-[#141517] hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>টেস্ট স্কোর যোগ</span>
              </button>
            </div>

            {studyData.modelTests.length === 0 ? (
              <div className="bg-white rounded-[26px] p-8 text-center border border-slate-200/80 space-y-3">
                <div className="text-sm font-bold text-[#141517]">কোনো মডেল টেস্টের তথ্য যোগ করা হয়নি</div>
                <p className="text-xs text-slate-500">
                  নিজের প্রস্তুতি যাচাই করতে মডেল টেস্ট দিয়ে এখানে নম্বর সংরক্ষণ করুন।
                </p>
                <button
                  type="button"
                  onClick={() => setTestModalOpen(true)}
                  className="px-5 py-2.5 rounded-full bg-[#141517] text-white text-xs font-bold cursor-pointer"
                >
                  + প্রথম মডেল টেস্ট যোগ করুন
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {studyData.modelTests.map((t) => {
                  const sub = subjectMap.get(t.subjectId);
                  const pct = t.totalMarks > 0 ? Math.round((t.obtainedMarks / t.totalMarks) * 100) : 0;
                  return (
                    <div
                      key={t.id}
                      className="bg-white rounded-[26px] p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
                            <span className="font-bold text-[#084B32]">{sub?.nameBn}</span>
                            <span>·</span>
                            <span>{t.date}</span>
                          </div>
                          <h4 className="text-base font-extrabold text-[#141517]">{t.testTitle}</h4>
                        </div>

                        <div className="text-right shrink-0">
                          <span
                            className={`text-sm font-black px-3 py-1 rounded-full ${
                              t.grade === 'A+'
                                ? 'bg-emerald-100 text-[#084B32]'
                                : t.grade === 'A' || t.grade === 'A-'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            গ্রেড: {t.grade} ({toBanglaDigits(pct)}%)
                          </span>
                          <div className="text-xs font-extrabold text-[#141517] mt-1 tabular-nums">
                            {toBanglaDigits(t.obtainedMarks)} / {toBanglaDigits(t.totalMarks)}
                          </div>
                        </div>
                      </div>

                      {/* Marks breakdown row */}
                      <div className="grid grid-cols-3 gap-2 text-center text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                        <div>
                          <div className="text-[10px] text-slate-500 font-semibold">CQ নম্বর</div>
                          <div className="font-black text-[#141517] tabular-nums mt-0.5">
                            {toBanglaDigits(t.cqMarks)}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-500 font-semibold">MCQ নম্বর</div>
                          <div className="font-black text-[#141517] tabular-nums mt-0.5">
                            {toBanglaDigits(t.mcqMarks)}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-500 font-semibold">ব্যবহারিক</div>
                          <div className="font-black text-[#141517] tabular-nums mt-0.5">
                            {t.practicalMarks ? toBanglaDigits(t.practicalMarks) : '-'}
                          </div>
                        </div>
                      </div>

                      {(t.weakAreas || t.mistakesToReview) && (
                        <div className="space-y-1.5 text-xs bg-amber-50/60 p-3 rounded-xl border border-amber-200/60">
                          {t.weakAreas && (
                            <div>
                              <span className="font-bold text-amber-900">ভুল হওয়ার ক্ষেত্র: </span>
                              <span className="text-slate-700">{t.weakAreas}</span>
                            </div>
                          )}
                          {t.mistakesToReview && (
                            <div>
                              <span className="font-bold text-amber-900">ভবিষ্যতে করণীয়: </span>
                              <span className="text-slate-700">{t.mistakesToReview}</span>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTest(t);
                            setTestModalOpen(true);
                          }}
                          className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer text-slate-600"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteModelTest(t.id)}
                          className="w-8 h-8 rounded-full bg-slate-100 hover:bg-rose-100 hover:text-rose-600 flex items-center justify-center cursor-pointer text-slate-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 6: STUDY SESSION TIMER & HISTORY */}
        {activeTab === 'timer' && (
          <div className="space-y-5">
            {/* Live Dedicated Study Timer Card */}
            <div className="bg-[#142018] text-white rounded-[32px] p-6 sm:p-8 border border-emerald-950 text-center space-y-5 shadow-lg">
              {/* Header Mode Pill Switcher */}
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setTimerConfig({ mode: 'pomodoro' })}
                  disabled={activeTimer.isRunning}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    activeTimer.mode === 'pomodoro'
                      ? 'bg-[#A3F01C] text-black shadow-sm'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  পোমোডোরো (Pomodoro)
                </button>
                <button
                  type="button"
                  onClick={() => setTimerConfig({ mode: 'stopwatch' })}
                  disabled={activeTimer.isRunning}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    activeTimer.mode === 'stopwatch'
                      ? 'bg-[#A3F01C] text-black shadow-sm'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  স্টপওয়াচ (Stopwatch)
                </button>
              </div>

              {/* Pomodoro Preset Minutes Buttons (Only in Pomodoro mode and when not running) */}
              {activeTimer.mode === 'pomodoro' && (
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  {[15, 25, 45, 60].map((mins) => {
                    const isSelected = activeTimer.pomodoroTargetSeconds === mins * 60;
                    return (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setTimerConfig({ targetMinutes: mins })}
                        disabled={activeTimer.isRunning}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-white text-[#084B32] shadow-sm'
                            : 'bg-white/10 text-slate-300 hover:bg-white/15'
                        }`}
                      >
                        {toBanglaDigits(mins)} মিনিট
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Subject, Chapter & Topic Selectors */}
              <div className="max-w-md mx-auto grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">
                    পড়ার বিষয়
                  </label>
                  <select
                    value={activeTimer.subjectId || studyData.subjects[0]?.id || ''}
                    onChange={(e) =>
                      setTimerConfig({ subjectId: e.target.value, chapterId: '' })
                    }
                    disabled={activeTimer.isRunning}
                    className="w-full h-10 px-3 rounded-xl bg-white/10 border border-white/20 text-xs font-bold text-white focus:outline-none"
                  >
                    {studyData.subjects.map((sub) => (
                      <option key={sub.id} value={sub.id} className="text-black">
                        {sub.nameBn}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">
                    নির্দিষ্ট অধ্যায় (ঐচ্ছিক)
                  </label>
                  <select
                    value={activeTimer.chapterId || ''}
                    onChange={(e) => setTimerConfig({ chapterId: e.target.value })}
                    disabled={activeTimer.isRunning}
                    className="w-full h-10 px-3 rounded-xl bg-white/10 border border-white/20 text-xs font-bold text-white focus:outline-none"
                  >
                    <option value="" className="text-black">
                      সকল / সাধারণ অধ্যায়
                    </option>
                    {studyData.chapters
                      .filter(
                        (c) =>
                          c.subjectId ===
                          (activeTimer.subjectId || studyData.subjects[0]?.id)
                      )
                      .map((ch) => (
                        <option key={ch.id} value={ch.id} className="text-black">
                          {ch.nameBn}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <input
                    type="text"
                    value={activeTimer.topicCovered}
                    onChange={(e) => setTimerConfig({ topicCovered: e.target.value })}
                    placeholder="পড়ার টপিক লিখুন (যেমন: সমীকরণ সমাধান ও বিগত বছরের বোর্ড প্রশ্ন)..."
                    className="w-full h-10 px-3.5 rounded-xl bg-white/10 border border-white/20 text-xs text-white placeholder:text-white/40 focus:outline-none"
                  />
                </div>
              </div>

              {/* Large Digital Clock Dial */}
              <div className="py-2 space-y-2">
                <div className="text-6xl sm:text-7xl font-black text-white tabular-nums tracking-tight">
                  {toBanglaDigits(
                    formatTimerDuration(
                      activeTimer.mode === 'pomodoro'
                        ? Math.max(
                            0,
                            activeTimer.pomodoroTargetSeconds - activeTimer.elapsedSeconds
                          )
                        : activeTimer.elapsedSeconds
                    )
                  )}
                </div>
                <div className="text-xs font-bold text-[#A3F01C]">
                  {activeTimer.isRunning
                    ? activeTimer.mode === 'pomodoro'
                      ? 'পোমোডোরো মনোযোগ সেশন চলছে...'
                      : 'স্টপওয়াচ সময় গণনা চলছে...'
                    : activeTimer.elapsedSeconds > 0
                    ? 'বিরতি দেওয়া হয়েছে (Paused)'
                    : 'পড়া শুরু করতে নিচের বাটনে চাপ দিন'}
                </div>

                {/* Pomodoro Progress Bar */}
                {activeTimer.mode === 'pomodoro' && (
                  <div className="max-w-xs mx-auto h-2 rounded-full bg-white/15 overflow-hidden mt-3">
                    <div
                      className="h-full bg-gradient-to-r from-[#A3F01C] to-[#22C55E] rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round(
                            (activeTimer.elapsedSeconds /
                              activeTimer.pomodoroTargetSeconds) *
                              100
                          )
                        )}%`,
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Timer Controls */}
              <div className="flex items-center justify-center gap-3 pt-2">
                {!activeTimer.isRunning ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (activeTimer.elapsedSeconds > 0) {
                        resumeTimer();
                      } else {
                        startTimer();
                      }
                    }}
                    className="h-13 px-8 rounded-full bg-[#A3F01C] hover:bg-[#b6f742] text-[#141517] font-black text-sm flex items-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>{activeTimer.elapsedSeconds > 0 ? 'চালু রাখুন' : 'পড়াশোনা শুরু'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={pauseTimer}
                    className="h-13 px-8 rounded-full bg-amber-400 hover:bg-amber-300 text-black font-black text-sm flex items-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer"
                  >
                    <Pause className="w-4 h-4 fill-current" />
                    <span>বিরতি নিন (Pause)</span>
                  </button>
                )}

                {activeTimer.elapsedSeconds > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={() => void stopAndLogTimer()}
                      className="h-13 px-6 rounded-full bg-white text-[#084B32] font-extrabold text-xs cursor-pointer hover:bg-slate-100 shadow-md"
                    >
                      লগ ও সংরক্ষণ
                    </button>
                    <button
                      type="button"
                      onClick={resetTimer}
                      className="w-13 h-13 rounded-full bg-white/12 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
                      title="রিসেট"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Real-time Today's Study Goal Meter */}
            <div className="bg-white rounded-[26px] p-5 border border-slate-200/70 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-[#141517]">আজকের পড়ার লক্ষ্যমাত্রা</h3>
                  <p className="text-xs text-slate-500">
                    দৈনিক টার্গেট: {toBanglaDigits(studyData.config.dailyStudyTargetMinutes)} মিনিট (
                    {toBanglaDigits(
                      Math.round(studyData.config.dailyStudyTargetMinutes / 60)
                    )}{' '}
                    ঘণ্টা)
                  </p>
                </div>
                <span className="text-base font-black text-[#084B32] tabular-nums">
                  {toBanglaDigits(metrics.todayStudyMinutes)} মিনিট
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#084B32] to-[#22C55E] rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round(
                        (metrics.todayStudyMinutes /
                          Math.max(1, studyData.config.dailyStudyTargetMinutes)) *
                          100
                      )
                    )}%`,
                  }}
                />
              </div>
            </div>

            {/* Study Session History Log with Delete control */}
            <div className="bg-white rounded-[28px] p-5 border border-slate-200/70 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-[#141517]">সাম্প্রতিক স্টাডি সেশন হিস্টোরি</h3>
                <span className="text-xs text-slate-400 font-medium">
                  মোট {toBanglaDigits(studyData.studySessions.length)}টি সেশন
                </span>
              </div>
              {studyData.studySessions.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">এখনো কোনো সেশন সম্পন্ন করা হয়নি।</p>
              ) : (
                <div className="space-y-2">
                  {studyData.studySessions.slice(0, 10).map((sess) => {
                    const sub = subjectMap.get(sess.subjectId);
                    return (
                      <div
                        key={sess.id}
                        className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 text-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-8 h-8 rounded-xl bg-[#084B32] text-white flex items-center justify-center font-bold shrink-0">
                            ✓
                          </span>
                          <div className="min-w-0">
                            <div className="font-extrabold text-[#141517] truncate">{sub?.nameBn || 'সাধারণ বিষয়'}</div>
                            <div className="text-[11px] text-slate-500 truncate">
                              {sess.topicCovered || 'স্বতন্ত্র সেশন'} · {sess.date}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5 shrink-0">
                          <span className="font-black text-[#084B32] tabular-nums bg-emerald-100/70 px-2.5 py-0.5 rounded-full">
                            {toBanglaDigits(sess.durationMinutes)} মিনিট
                          </span>
                          <button
                            type="button"
                            onClick={() => deleteStudySession(sess.id)}
                            className="w-7 h-7 rounded-full bg-slate-200/60 hover:bg-rose-100 hover:text-rose-600 text-slate-400 flex items-center justify-center cursor-pointer transition-colors"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 7: STUDY NOTES & FORMULAS */}
        {activeTab === 'notes' && (
          <div className="space-y-4">
            <div className="bg-white rounded-[26px] p-5 border border-slate-200/70 shadow-xs flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-extrabold text-[#141517]">ব্যক্তিগত স্টাডি নোট ও সূত্র শিট</h2>
                <p className="text-xs text-slate-500">অধ্যায়ভিত্তিক শর্টকাট, সূত্র ও রিভিশন সারাংশ</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingNote(null);
                  setNoteModalOpen(true);
                }}
                className="h-10 px-4 rounded-full bg-[#141517] hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>নোট তৈরি</span>
              </button>
            </div>

            {studyData.studyNotes.length === 0 ? (
              <div className="bg-white rounded-[26px] p-8 text-center border border-slate-200/80 space-y-3">
                <div className="text-sm font-bold text-[#141517]">কোনো নোট তৈরি করা নেই</div>
                <p className="text-xs text-slate-500">
                  যেসব সূত্র বা সংজ্ঞা মনে রাখা কঠিন সেগুলো সহজে রিভিশন দিতে এখানে লিখে রাখুন।
                </p>
                <button
                  type="button"
                  onClick={() => setNoteModalOpen(true)}
                  className="px-5 py-2.5 rounded-full bg-[#141517] text-white text-xs font-bold cursor-pointer"
                >
                  + প্রথম নোট লিখুন
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {studyData.studyNotes.map((note) => {
                  const sub = subjectMap.get(note.subjectId);
                  return (
                    <div
                      key={note.id}
                      className={`bg-white rounded-[26px] p-5 border shadow-xs space-y-3 relative ${
                        note.isPinned ? 'border-amber-300 ring-1 ring-amber-200 bg-amber-50/20' : 'border-slate-200/80'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-[#084B32] mb-1">
                            {note.isPinned && <Pin className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                            <span>{sub?.nameBn}</span>
                          </div>
                          <h4 className="text-base font-extrabold text-[#141517]">{note.title}</h4>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingNote(note);
                              setNoteModalOpen(true);
                            }}
                            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer text-slate-600"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteStudyNote(note.id)}
                            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-rose-100 hover:text-rose-600 flex items-center justify-center cursor-pointer text-slate-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="text-xs text-slate-700 font-mono whitespace-pre-wrap leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/70 max-h-48 overflow-y-auto">
                        {note.content}
                      </div>

                      {note.tags.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          {note.tags.map((tg) => (
                            <span
                              key={tg}
                              className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600"
                            >
                              #{tg}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <SSCConfigModal open={configModalOpen} onClose={() => setConfigModalOpen(false)} />
      <SSCSubjectModal
        open={subjectModalOpen}
        editingSubject={editingSubject}
        onClose={() => {
          setSubjectModalOpen(false);
          setEditingSubject(null);
        }}
      />
      <SSCChapterModal
        open={chapterModalOpen}
        defaultSubjectId={selectedSubjectId !== 'all' ? selectedSubjectId : undefined}
        editingChapter={editingChapter}
        onClose={() => {
          setChapterModalOpen(false);
          setEditingChapter(null);
        }}
      />
      <SSCPlanModal
        open={planModalOpen}
        editingPlan={editingPlan}
        onClose={() => {
          setPlanModalOpen(false);
          setEditingPlan(null);
        }}
      />
      <SSCModelTestModal
        open={testModalOpen}
        editingTest={editingTest}
        onClose={() => {
          setTestModalOpen(false);
          setEditingTest(null);
        }}
      />
      <SSCNoteModal
        open={noteModalOpen}
        editingNote={editingNote}
        onClose={() => {
          setNoteModalOpen(false);
          setEditingNote(null);
        }}
      />
    </div>
  );
};
