export type SSCGroup = 'science' | 'commerce' | 'humanities' | 'general';

export type ChapterStatus = 'not_started' | 'in_progress' | 'completed' | 'revised';

export interface SSCConfig {
  targetExamDate: string; // YYYY-MM-DD
  examTitle: string; // e.g., 'এসএসসি পরীক্ষা ২০২৭'
  group: SSCGroup;
  targetGpa: number; // e.g., 5.00
  dailyStudyTargetMinutes: number; // e.g., 240
  studentName?: string;
  boardName?: string;
}

export interface SSCSubject {
  id: string;
  name: string;
  nameBn: string;
  code: string;
  group: SSCGroup;
  colorTheme: 'emerald' | 'amber' | 'indigo' | 'rose' | 'sky' | 'teal' | 'violet';
  totalChapters?: number;
  isCustom?: boolean;
}

export interface SSCChapter {
  id: string;
  subjectId: string;
  chapterNo: number;
  name: string;
  nameBn: string;
  status: ChapterStatus;
  cqTarget: number;
  cqSolved: number;
  mcqTarget: number;
  mcqSolved: number;
  shortQSolved: boolean;
  shortQCount?: number;
  isWeak: boolean;
  revision1: boolean;
  revision1Date?: string;
  revision2: boolean;
  revision2Date?: string;
  revision3: boolean;
  revision3Date?: string;
  importance: 'high' | 'medium' | 'low';
  notes?: string;
  updatedAt: string;
}

export interface SSCStudyPlan {
  id: string;
  date: string; // YYYY-MM-DD
  subjectId: string;
  chapterId?: string;
  title: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  isCompleted: boolean;
  notes?: string;
  createdAt: string;
}

export interface SSCModelTest {
  id: string;
  date: string; // YYYY-MM-DD
  subjectId: string;
  testTitle: string;
  paperType: '1st' | '2nd' | 'combined';
  cqMarks: number;
  mcqMarks: number;
  practicalMarks?: number;
  totalMarks: number;
  obtainedMarks: number;
  grade: 'A+' | 'A' | 'A-' | 'B' | 'C' | 'D' | 'F';
  weakAreas?: string;
  mistakesToReview?: string;
  createdAt: string;
}

export interface SSCStudySession {
  id: string;
  date: string; // YYYY-MM-DD
  timestamp: string; // ISO string
  subjectId: string;
  chapterId?: string;
  durationMinutes: number;
  topicCovered?: string;
  sessionType: 'reading' | 'cq_practice' | 'mcq_solve' | 'revision';
}

export interface SSCStudyNote {
  id: string;
  subjectId: string;
  chapterId?: string;
  title: string;
  content: string;
  tags: string[];
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SSCStudyData {
  schemaVersion: number;
  config: SSCConfig;
  subjects: SSCSubject[];
  chapters: SSCChapter[];
  studyPlans: SSCStudyPlan[];
  modelTests: SSCModelTest[];
  studySessions: SSCStudySession[];
  studyNotes: SSCStudyNote[];
}
