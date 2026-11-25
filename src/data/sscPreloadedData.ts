import type { SSCChapter, SSCConfig, SSCStudyData, SSCSubject } from '../types/ssc';

export const INITIAL_SSC_CONFIG: SSCConfig = {
  targetExamDate: '2027-02-01',
  examTitle: 'এসএসসি পরীক্ষা ২০২৭',
  group: 'science',
  targetGpa: 5.0,
  dailyStudyTargetMinutes: 240,
  studentName: 'মেধাবী শিক্ষার্থী',
  boardName: 'ঢাকা শিক্ষা বোর্ড',
};

export const INITIAL_SSC_SUBJECTS: SSCSubject[] = [];
export const INITIAL_SSC_CHAPTERS: SSCChapter[] = [];
export const INITIAL_SSC_STUDY_PLANS: SSCStudyData['studyPlans'] = [];
export const INITIAL_SSC_MODEL_TESTS: SSCStudyData['modelTests'] = [];
export const INITIAL_SSC_SESSIONS: SSCStudyData['studySessions'] = [];
export const INITIAL_SSC_NOTES: SSCStudyData['studyNotes'] = [];

export function createInitialSSCStudyData(): SSCStudyData {
  return {
    schemaVersion: 2,
    config: { ...INITIAL_SSC_CONFIG },
    subjects: [],
    chapters: [],
    studyPlans: [],
    modelTests: [],
    studySessions: [],
    studyNotes: [],
  };
}
