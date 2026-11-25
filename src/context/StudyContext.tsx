import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { createInitialSSCStudyData } from '../data/sscPreloadedData';
import { loadStudyDataFromDB, resetStudyDataDB, saveStudyDataToDB } from '../storage/studyIndexedDB';
import type {
  ChapterStatus,
  SSCChapter,
  SSCConfig,
  SSCModelTest,
  SSCStudyData,
  SSCStudyNote,
  SSCStudyPlan,
  SSCStudySession,
  SSCSubject,
} from '../types/ssc';

export interface ActiveStudyTimer {
  isRunning: boolean;
  mode: 'stopwatch' | 'pomodoro';
  subjectId: string;
  chapterId?: string;
  topicCovered: string;
  elapsedSeconds: number;
  pomodoroTargetSeconds: number;
  startedAt?: string;
}

export interface ComputedStudyMetrics {
  totalChapters: number;
  completedChapters: number;
  inProgressChapters: number;
  notStartedChapters: number;
  revisedChapters: number;
  overallCompletionPct: number;
  weakChaptersCount: number;
  totalCqSolved: number;
  totalCqTarget: number;
  totalMcqSolved: number;
  totalMcqTarget: number;
  totalStudyMinutes: number;
  todayStudyMinutes: number;
  daysRemaining: number;
  hoursRemaining: number;
  minsRemaining: number;
  secsRemaining: number;
  mockExamAverage: number;
  mockExamCount: number;
  subjectMetrics: Record<
    string,
    {
      subject: SSCSubject;
      total: number;
      completed: number;
      inProgress: number;
      pct: number;
      weakCount: number;
      cqSolved: number;
      mcqSolved: number;
    }
  >;
}

interface StudyContextValue {
  studyData: SSCStudyData;
  isLoading: boolean;
  metrics: ComputedStudyMetrics;
  activeTimer: ActiveStudyTimer;
  updateConfig: (updates: Partial<SSCConfig>) => void;
  // Subjects CRUD
  addSubject: (subject: Omit<SSCSubject, 'id'>) => string;
  updateSubject: (id: string, updates: Partial<SSCSubject>) => void;
  deleteSubject: (id: string) => void;
  // Chapters CRUD
  addChapter: (chapter: Omit<SSCChapter, 'id' | 'updatedAt'>) => string;
  updateChapter: (id: string, updates: Partial<SSCChapter>) => void;
  deleteChapter: (id: string) => void;
  toggleChapterStatus: (id: string) => void;
  toggleWeakChapter: (id: string) => void;
  updateCqCount: (id: string, delta: number) => void;
  updateMcqCount: (id: string, delta: number) => void;
  toggleRevisionStage: (id: string, stage: 1 | 2 | 3) => void;
  // Plans CRUD
  addStudyPlan: (plan: Omit<SSCStudyPlan, 'id' | 'createdAt'>) => string;
  updateStudyPlan: (id: string, updates: Partial<SSCStudyPlan>) => void;
  deleteStudyPlan: (id: string) => void;
  togglePlanCompleted: (id: string) => void;
  // Mock Tests CRUD
  addModelTest: (test: Omit<SSCModelTest, 'id' | 'createdAt'>) => string;
  updateModelTest: (id: string, updates: Partial<SSCModelTest>) => void;
  deleteModelTest: (id: string) => void;
  // Study Sessions CRUD
  addStudySession: (session: Omit<SSCStudySession, 'id'>) => string;
  deleteStudySession: (id: string) => void;
  // Study Notes CRUD
  addStudyNote: (note: Omit<SSCStudyNote, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateStudyNote: (id: string, updates: Partial<SSCStudyNote>) => void;
  deleteStudyNote: (id: string) => void;
  // Study Timer
  setTimerConfig: (config: {
    subjectId?: string;
    chapterId?: string;
    topicCovered?: string;
    mode?: 'stopwatch' | 'pomodoro';
    targetMinutes?: number;
  }) => void;
  startTimer: (
    subjectId?: string,
    chapterId?: string,
    topicCovered?: string,
    mode?: 'stopwatch' | 'pomodoro',
    targetMinutes?: number
  ) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopAndLogTimer: () => Promise<void>;
  resetTimer: () => void;
  // Reset & Restore
  resetAllStudyData: () => Promise<void>;
  restoreStudyData: (restored: SSCStudyData) => Promise<void>;
}

const StudyContext = createContext<StudyContextValue | null>(null);

export const StudyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [studyData, setStudyData] = useState<SSCStudyData>(() => createInitialSSCStudyData());
  const [isLoading, setIsLoading] = useState(true);
  const [now, setNow] = useState(() => new Date());

  const [activeTimer, setActiveTimer] = useState<ActiveStudyTimer>({
    isRunning: false,
    mode: 'stopwatch',
    subjectId: '',
    topicCovered: '',
    elapsedSeconds: 0,
    pomodoroTargetSeconds: 25 * 60,
  });

  // Load from IndexedDB on initial mount
  useEffect(() => {
    let isMounted = true;
    void loadStudyDataFromDB().then((data) => {
      if (isMounted) {
        setStudyData(data);
        setIsLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Update real-time clock every second for countdown and timer tick
  useEffect(() => {
    const timerId = setInterval(() => {
      setNow(new Date());
      setActiveTimer((prev) => {
        if (!prev.isRunning) return prev;
        const nextSec = prev.elapsedSeconds + 1;
        if (prev.mode === 'pomodoro' && nextSec >= prev.pomodoroTargetSeconds) {
          try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(587.33, ctx.currentTime);
            osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
            gain.gain.setValueAtTime(0.25, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
            osc.start();
            osc.stop(ctx.currentTime + 0.45);
          } catch {}

          return {
            ...prev,
            isRunning: false,
            elapsedSeconds: prev.pomodoroTargetSeconds,
          };
        }
        return {
          ...prev,
          elapsedSeconds: nextSec,
        };
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, []);

  // State updater that automatically writes through to IndexedDB
  const updateData = useCallback((updater: (prev: SSCStudyData) => SSCStudyData) => {
    setStudyData((prev) => {
      const next = updater(prev);
      void saveStudyDataToDB(next);
      return next;
    });
  }, []);

  // Config Update
  const updateConfig = useCallback(
    (updates: Partial<SSCConfig>) => {
      updateData((prev) => ({
        ...prev,
        config: { ...prev.config, ...updates },
      }));
    },
    [updateData]
  );

  // Subject CRUD
  const addSubject = useCallback(
    (subjectInput: Omit<SSCSubject, 'id'>) => {
      const id = `sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const newSubject: SSCSubject = { ...subjectInput, id, isCustom: true };
      updateData((prev) => ({
        ...prev,
        subjects: [...prev.subjects, newSubject],
      }));
      return id;
    },
    [updateData]
  );

  const updateSubject = useCallback(
    (id: string, updates: Partial<SSCSubject>) => {
      updateData((prev) => ({
        ...prev,
        subjects: prev.subjects.map((s) => (s.id === id ? { ...s, ...updates } : s)),
      }));
    },
    [updateData]
  );

  const deleteSubject = useCallback(
    (id: string) => {
      updateData((prev) => ({
        ...prev,
        subjects: prev.subjects.filter((s) => s.id !== id),
        chapters: prev.chapters.filter((c) => c.subjectId !== id),
      }));
    },
    [updateData]
  );

  // Chapter CRUD
  const addChapter = useCallback(
    (chapterInput: Omit<SSCChapter, 'id' | 'updatedAt'>) => {
      const id = `ch-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const newChapter: SSCChapter = {
        ...chapterInput,
        id,
        updatedAt: new Date().toISOString(),
      };
      updateData((prev) => ({
        ...prev,
        chapters: [...prev.chapters, newChapter],
      }));
      return id;
    },
    [updateData]
  );

  const updateChapter = useCallback(
    (id: string, updates: Partial<SSCChapter>) => {
      updateData((prev) => ({
        ...prev,
        chapters: prev.chapters.map((c) =>
          c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
        ),
      }));
    },
    [updateData]
  );

  const deleteChapter = useCallback(
    (id: string) => {
      updateData((prev) => ({
        ...prev,
        chapters: prev.chapters.filter((c) => c.id !== id),
      }));
    },
    [updateData]
  );

  const toggleChapterStatus = useCallback(
    (id: string) => {
      updateData((prev) => ({
        ...prev,
        chapters: prev.chapters.map((c) => {
          if (c.id !== id) return c;
          const statusOrder: ChapterStatus[] = ['not_started', 'in_progress', 'completed', 'revised'];
          const currentIndex = statusOrder.indexOf(c.status);
          const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];
          return {
            ...c,
            status: nextStatus,
            updatedAt: new Date().toISOString(),
          };
        }),
      }));
    },
    [updateData]
  );

  const toggleWeakChapter = useCallback(
    (id: string) => {
      updateData((prev) => ({
        ...prev,
        chapters: prev.chapters.map((c) =>
          c.id === id ? { ...c, isWeak: !c.isWeak, updatedAt: new Date().toISOString() } : c
        ),
      }));
    },
    [updateData]
  );

  const updateCqCount = useCallback(
    (id: string, delta: number) => {
      updateData((prev) => ({
        ...prev,
        chapters: prev.chapters.map((c) => {
          if (c.id !== id) return c;
          const nextVal = Math.max(0, c.cqSolved + delta);
          return {
            ...c,
            cqSolved: nextVal,
            status: nextVal >= c.cqTarget && c.mcqSolved >= c.mcqTarget ? 'completed' : c.status === 'not_started' ? 'in_progress' : c.status,
            updatedAt: new Date().toISOString(),
          };
        }),
      }));
    },
    [updateData]
  );

  const updateMcqCount = useCallback(
    (id: string, delta: number) => {
      updateData((prev) => ({
        ...prev,
        chapters: prev.chapters.map((c) => {
          if (c.id !== id) return c;
          const nextVal = Math.max(0, c.mcqSolved + delta);
          return {
            ...c,
            mcqSolved: nextVal,
            status: nextVal >= c.mcqTarget && c.cqSolved >= c.cqTarget ? 'completed' : c.status === 'not_started' ? 'in_progress' : c.status,
            updatedAt: new Date().toISOString(),
          };
        }),
      }));
    },
    [updateData]
  );

  const toggleRevisionStage = useCallback(
    (id: string, stage: 1 | 2 | 3) => {
      const nowIsoDate = new Date().toISOString().split('T')[0];
      updateData((prev) => ({
        ...prev,
        chapters: prev.chapters.map((c) => {
          if (c.id !== id) return c;
          if (stage === 1) {
            const nextVal = !c.revision1;
            return {
              ...c,
              revision1: nextVal,
              revision1Date: nextVal ? nowIsoDate : undefined,
              status: nextVal ? 'revised' : c.status,
              updatedAt: new Date().toISOString(),
            };
          }
          if (stage === 2) {
            const nextVal = !c.revision2;
            return {
              ...c,
              revision2: nextVal,
              revision2Date: nextVal ? nowIsoDate : undefined,
              status: nextVal ? 'revised' : c.status,
              updatedAt: new Date().toISOString(),
            };
          }
          const nextVal = !c.revision3;
          return {
            ...c,
            revision3: nextVal,
            revision3Date: nextVal ? nowIsoDate : undefined,
            status: nextVal ? 'revised' : c.status,
            updatedAt: new Date().toISOString(),
          };
        }),
      }));
    },
    [updateData]
  );

  // Study Plans CRUD
  const addStudyPlan = useCallback(
    (planInput: Omit<SSCStudyPlan, 'id' | 'createdAt'>) => {
      const id = `plan-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const newPlan: SSCStudyPlan = {
        ...planInput,
        id,
        createdAt: new Date().toISOString(),
      };
      updateData((prev) => ({
        ...prev,
        studyPlans: [newPlan, ...prev.studyPlans],
      }));
      return id;
    },
    [updateData]
  );

  const updateStudyPlan = useCallback(
    (id: string, updates: Partial<SSCStudyPlan>) => {
      updateData((prev) => ({
        ...prev,
        studyPlans: prev.studyPlans.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      }));
    },
    [updateData]
  );

  const deleteStudyPlan = useCallback(
    (id: string) => {
      updateData((prev) => ({
        ...prev,
        studyPlans: prev.studyPlans.filter((p) => p.id !== id),
      }));
    },
    [updateData]
  );

  const togglePlanCompleted = useCallback(
    (id: string) => {
      updateData((prev) => ({
        ...prev,
        studyPlans: prev.studyPlans.map((p) =>
          p.id === id ? { ...p, isCompleted: !p.isCompleted } : p
        ),
      }));
    },
    [updateData]
  );

  // Model Tests CRUD
  const addModelTest = useCallback(
    (testInput: Omit<SSCModelTest, 'id' | 'createdAt'>) => {
      const id = `mt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const newTest: SSCModelTest = {
        ...testInput,
        id,
        createdAt: new Date().toISOString(),
      };
      updateData((prev) => ({
        ...prev,
        modelTests: [newTest, ...prev.modelTests],
      }));
      return id;
    },
    [updateData]
  );

  const updateModelTest = useCallback(
    (id: string, updates: Partial<SSCModelTest>) => {
      updateData((prev) => ({
        ...prev,
        modelTests: prev.modelTests.map((t) => (t.id === id ? { ...t, ...updates } : t)),
      }));
    },
    [updateData]
  );

  const deleteModelTest = useCallback(
    (id: string) => {
      updateData((prev) => ({
        ...prev,
        modelTests: prev.modelTests.filter((t) => t.id !== id),
      }));
    },
    [updateData]
  );

  // Study Sessions CRUD
  const addStudySession = useCallback(
    (sessionInput: Omit<SSCStudySession, 'id'>) => {
      const id = `sess-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const newSession: SSCStudySession = { ...sessionInput, id };
      updateData((prev) => ({
        ...prev,
        studySessions: [newSession, ...prev.studySessions],
      }));
      return id;
    },
    [updateData]
  );

  const deleteStudySession = useCallback(
    (id: string) => {
      updateData((prev) => ({
        ...prev,
        studySessions: prev.studySessions.filter((s) => s.id !== id),
      }));
    },
    [updateData]
  );

  // Study Notes CRUD
  const addStudyNote = useCallback(
    (noteInput: Omit<SSCStudyNote, 'id' | 'createdAt' | 'updatedAt'>) => {
      const id = `note-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const nowIso = new Date().toISOString();
      const newNote: SSCStudyNote = {
        ...noteInput,
        id,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      updateData((prev) => ({
        ...prev,
        studyNotes: [newNote, ...prev.studyNotes],
      }));
      return id;
    },
    [updateData]
  );

  const updateStudyNote = useCallback(
    (id: string, updates: Partial<SSCStudyNote>) => {
      updateData((prev) => ({
        ...prev,
        studyNotes: prev.studyNotes.map((n) =>
          n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n
        ),
      }));
    },
    [updateData]
  );

  const deleteStudyNote = useCallback(
    (id: string) => {
      updateData((prev) => ({
        ...prev,
        studyNotes: prev.studyNotes.filter((n) => n.id !== id),
      }));
    },
    [updateData]
  );

  // Timer Management
  const setTimerConfig = useCallback(
    (cfg: {
      subjectId?: string;
      chapterId?: string;
      topicCovered?: string;
      mode?: 'stopwatch' | 'pomodoro';
      targetMinutes?: number;
    }) => {
      setActiveTimer((prev) => ({
        ...prev,
        subjectId: cfg.subjectId !== undefined ? cfg.subjectId : prev.subjectId,
        chapterId: cfg.chapterId !== undefined ? cfg.chapterId : prev.chapterId,
        topicCovered: cfg.topicCovered !== undefined ? cfg.topicCovered : prev.topicCovered,
        mode: cfg.mode !== undefined ? cfg.mode : prev.mode,
        pomodoroTargetSeconds:
          cfg.targetMinutes !== undefined ? cfg.targetMinutes * 60 : prev.pomodoroTargetSeconds,
      }));
    },
    []
  );

  const startTimer = useCallback(
    (
      subjectId?: string,
      chapterId?: string,
      topicCovered?: string,
      mode?: 'stopwatch' | 'pomodoro',
      targetMinutes?: number
    ) => {
      setActiveTimer((prev) => {
        const resolvedSubId = subjectId || prev.subjectId || studyData.subjects[0]?.id || '';
        const resolvedMode = mode ?? prev.mode;
        const resolvedTargetSecs = targetMinutes ? targetMinutes * 60 : prev.pomodoroTargetSeconds;
        return {
          isRunning: true,
          mode: resolvedMode,
          subjectId: resolvedSubId,
          chapterId: chapterId !== undefined ? chapterId : prev.chapterId,
          topicCovered: topicCovered !== undefined ? topicCovered : prev.topicCovered,
          elapsedSeconds: prev.isRunning
            ? prev.elapsedSeconds
            : prev.elapsedSeconds > 0
            ? prev.elapsedSeconds
            : 0,
          pomodoroTargetSeconds: resolvedTargetSecs,
          startedAt: prev.startedAt || new Date().toISOString(),
        };
      });
    },
    [studyData.subjects]
  );

  const pauseTimer = useCallback(() => {
    setActiveTimer((prev) => ({ ...prev, isRunning: false }));
  }, []);

  const resumeTimer = useCallback(() => {
    setActiveTimer((prev) => ({ ...prev, isRunning: true }));
  }, []);

  const resetTimer = useCallback(() => {
    setActiveTimer((prev) => ({
      ...prev,
      isRunning: false,
      elapsedSeconds: 0,
      startedAt: undefined,
    }));
  }, []);

  const stopAndLogTimer = useCallback(async () => {
    const elapsed = activeTimer.elapsedSeconds;
    const subId = activeTimer.subjectId || studyData.subjects[0]?.id || '';
    if (elapsed >= 5 && subId) {
      const durationMins = Math.max(1, Math.round(elapsed / 60));
      addStudySession({
        date: new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString(),
        subjectId: subId,
        chapterId: activeTimer.chapterId,
        durationMinutes: durationMins,
        topicCovered:
          activeTimer.topicCovered ||
          (activeTimer.mode === 'pomodoro' ? 'পোমোডোরো স্টাডি' : 'স্বতন্ত্র স্টাডি সেশন'),
        sessionType: activeTimer.mode === 'pomodoro' ? 'revision' : 'reading',
      });
    }
    setActiveTimer((prev) => ({
      ...prev,
      isRunning: false,
      elapsedSeconds: 0,
      startedAt: undefined,
    }));
  }, [activeTimer, addStudySession, studyData.subjects]);

  const resetAllStudyData = useCallback(async () => {
    const fresh = await resetStudyDataDB();
    setStudyData(fresh);
  }, []);

  const restoreStudyData = useCallback(async (restored: SSCStudyData) => {
    setStudyData(restored);
    await saveStudyDataToDB(restored);
  }, []);

  // Heavy database metrics memoized on studyData changes
  const baseMetrics = useMemo(() => {
    const chapters = studyData.chapters;
    const totalChapters = chapters.length;
    const completedChapters = chapters.filter(
      (c) => c.status === 'completed' || c.status === 'revised'
    ).length;
    const revisedChapters = chapters.filter((c) => c.status === 'revised').length;
    const inProgressChapters = chapters.filter((c) => c.status === 'in_progress').length;
    const notStartedChapters = chapters.filter((c) => c.status === 'not_started').length;
    const weakChaptersCount = chapters.filter((c) => c.isWeak).length;

    const overallCompletionPct =
      totalChapters === 0 ? 0 : Math.round((completedChapters / totalChapters) * 100);

    const totalCqSolved = chapters.reduce((sum, c) => sum + (c.cqSolved || 0), 0);
    const totalCqTarget = chapters.reduce((sum, c) => sum + (c.cqTarget || 0), 0);
    const totalMcqSolved = chapters.reduce((sum, c) => sum + (c.mcqSolved || 0), 0);
    const totalMcqTarget = chapters.reduce((sum, c) => sum + (c.mcqTarget || 0), 0);

    const totalStudyMinutes = studyData.studySessions.reduce(
      (sum, s) => sum + (s.durationMinutes || 0),
      0
    );

    // Mock Exams Average
    const mockTests = studyData.modelTests;
    const mockExamCount = mockTests.length;
    let mockExamAverage = 0;
    if (mockExamCount > 0) {
      const sumPct = mockTests.reduce((acc, mt) => {
        const pct = mt.totalMarks > 0 ? (mt.obtainedMarks / mt.totalMarks) * 100 : 0;
        return acc + pct;
      }, 0);
      mockExamAverage = Math.round(sumPct / mockExamCount);
    }

    // Subject Breakdown
    const subjectMetrics: ComputedStudyMetrics['subjectMetrics'] = {};
    for (const sub of studyData.subjects) {
      const subChapters = chapters.filter((c) => c.subjectId === sub.id);
      const subTotal = subChapters.length;
      const subDone = subChapters.filter(
        (c) => c.status === 'completed' || c.status === 'revised'
      ).length;
      const subInProg = subChapters.filter((c) => c.status === 'in_progress').length;
      const subWeak = subChapters.filter((c) => c.isWeak).length;
      const subCq = subChapters.reduce((sum, c) => sum + c.cqSolved, 0);
      const subMcq = subChapters.reduce((sum, c) => sum + c.mcqSolved, 0);

      subjectMetrics[sub.id] = {
        subject: sub,
        total: subTotal,
        completed: subDone,
        inProgress: subInProg,
        pct: subTotal > 0 ? Math.round((subDone / subTotal) * 100) : 0,
        weakCount: subWeak,
        cqSolved: subCq,
        mcqSolved: subMcq,
      };
    }

    return {
      totalChapters,
      completedChapters,
      inProgressChapters,
      notStartedChapters,
      revisedChapters,
      overallCompletionPct,
      weakChaptersCount,
      totalCqSolved,
      totalCqTarget,
      totalMcqSolved,
      totalMcqTarget,
      totalStudyMinutes,
      mockExamAverage,
      mockExamCount,
      subjectMetrics,
    };
  }, [studyData]);

  // Live Exam Countdown & Today Study Minutes
  const metrics = useMemo<ComputedStudyMetrics>(() => {
    const todayDateKey = now.toISOString().split('T')[0];
    const todayStudyMinutes = studyData.studySessions
      .filter((s) => s.date === todayDateKey)
      .reduce((sum, s) => sum + (s.durationMinutes || 0), 0);

    // Live Exam Countdown (exact calculation)
    const targetDateStr = studyData.config.targetExamDate || '2027-02-01';
    const targetTimeMs = new Date(`${targetDateStr}T09:00:00`).getTime();
    const safeTarget = Number.isNaN(targetTimeMs)
      ? new Date('2027-02-01T09:00:00').getTime()
      : targetTimeMs;
    const diffMs = Math.max(0, safeTarget - now.getTime());
    const totalSecs = Math.floor(diffMs / 1000);
    const daysRemaining = Math.floor(totalSecs / 86400);
    const hoursRemaining = Math.floor((totalSecs % 86400) / 3600);
    const minsRemaining = Math.floor((totalSecs % 3600) / 60);
    const secsRemaining = totalSecs % 60;

    return {
      ...baseMetrics,
      todayStudyMinutes,
      daysRemaining,
      hoursRemaining,
      minsRemaining,
      secsRemaining,
    };
  }, [baseMetrics, now, studyData.studySessions, studyData.config.targetExamDate]);

  const value: StudyContextValue = {
    studyData,
    isLoading,
    metrics,
    activeTimer,
    updateConfig,
    addSubject,
    updateSubject,
    deleteSubject,
    addChapter,
    updateChapter,
    deleteChapter,
    toggleChapterStatus,
    toggleWeakChapter,
    updateCqCount,
    updateMcqCount,
    toggleRevisionStage,
    addStudyPlan,
    updateStudyPlan,
    deleteStudyPlan,
    togglePlanCompleted,
    addModelTest,
    updateModelTest,
    deleteModelTest,
    addStudySession,
    deleteStudySession,
    addStudyNote,
    updateStudyNote,
    deleteStudyNote,
    setTimerConfig,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopAndLogTimer,
    resetTimer,
    resetAllStudyData,
    restoreStudyData,
  };

  return <StudyContext.Provider value={value}>{children}</StudyContext.Provider>;
};

export function useStudy(): StudyContextValue {
  const ctx = useContext(StudyContext);
  if (!ctx) throw new Error('useStudy must be used within StudyProvider');
  return ctx;
}
