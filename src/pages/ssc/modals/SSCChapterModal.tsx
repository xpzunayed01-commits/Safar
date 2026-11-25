import React, { useEffect, useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { useStudy } from '../../../context/StudyContext';
import type { ChapterStatus, SSCChapter } from '../../../types/ssc';

interface Props {
  open: boolean;
  defaultSubjectId?: string;
  editingChapter?: SSCChapter | null;
  onClose: () => void;
}

export const SSCChapterModal: React.FC<Props> = ({
  open,
  defaultSubjectId,
  editingChapter,
  onClose,
}) => {
  const { studyData, addChapter, updateChapter } = useStudy();

  const [subjectId, setSubjectId] = useState('');
  const [chapterNo, setChapterNo] = useState(1);
  const [nameBn, setNameBn] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState<ChapterStatus>('not_started');
  const [cqTarget, setCqTarget] = useState(15);
  const [cqSolved, setCqSolved] = useState(0);
  const [mcqTarget, setMcqTarget] = useState(50);
  const [mcqSolved, setMcqSolved] = useState(0);
  const [shortQSolved, setShortQSolved] = useState(false);
  const [isWeak, setIsWeak] = useState(false);
  const [importance, setImportance] = useState<'high' | 'medium' | 'low'>('high');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    if (editingChapter) {
      setSubjectId(editingChapter.subjectId);
      setChapterNo(editingChapter.chapterNo);
      setNameBn(editingChapter.nameBn);
      setName(editingChapter.name);
      setStatus(editingChapter.status);
      setCqTarget(editingChapter.cqTarget);
      setCqSolved(editingChapter.cqSolved);
      setMcqTarget(editingChapter.mcqTarget);
      setMcqSolved(editingChapter.mcqSolved);
      setShortQSolved(editingChapter.shortQSolved);
      setIsWeak(editingChapter.isWeak);
      setImportance(editingChapter.importance);
      setNotes(editingChapter.notes ?? '');
    } else {
      setSubjectId(defaultSubjectId || studyData.subjects[0]?.id || '');
      // calculate next chapter number
      const existingInSubject = studyData.chapters.filter(
        (c) => c.subjectId === (defaultSubjectId || studyData.subjects[0]?.id)
      );
      setChapterNo(existingInSubject.length + 1);
      setNameBn('');
      setName('');
      setStatus('not_started');
      setCqTarget(15);
      setCqSolved(0);
      setMcqTarget(50);
      setMcqSolved(0);
      setShortQSolved(false);
      setIsWeak(false);
      setImportance('high');
      setNotes('');
    }
  }, [open, editingChapter, defaultSubjectId, studyData.subjects, studyData.chapters]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameBn.trim()) {
      setError('অনুগ্রহ করে অধ্যায়ের নাম লিখুন।');
      return;
    }
    if (!subjectId) {
      setError(
        studyData.subjects.length === 0
          ? 'অনুগ্রহ করে অধ্যায় যোগ করার পূর্বে প্রথমে একটি বিষয় তৈরি করুন।'
          : 'অনুগ্রহ করে একটি বিষয় নির্বাচন করুন।'
      );
      return;
    }

    const payload = {
      subjectId,
      chapterNo: Number(chapterNo) || 1,
      nameBn: nameBn.trim(),
      name: name.trim() || nameBn.trim(),
      status,
      cqTarget: Number(cqTarget) || 0,
      cqSolved: Number(cqSolved) || 0,
      mcqTarget: Number(mcqTarget) || 0,
      mcqSolved: Number(mcqSolved) || 0,
      shortQSolved,
      isWeak,
      revision1: editingChapter ? editingChapter.revision1 : false,
      revision1Date: editingChapter?.revision1Date,
      revision2: editingChapter ? editingChapter.revision2 : false,
      revision2Date: editingChapter?.revision2Date,
      revision3: editingChapter ? editingChapter.revision3 : false,
      revision3Date: editingChapter?.revision3Date,
      importance,
      notes: notes.trim() || undefined,
    };

    if (editingChapter) {
      updateChapter(editingChapter.id, payload);
    } else {
      addChapter(payload);
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-[28px] max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-slate-200 my-auto max-h-[92vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h2 className="text-base font-extrabold text-[#141517]">
            {editingChapter ? 'অধ্যায় সম্পাদনা করুন' : 'নতুন অধ্যায় যোগ করুন'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4 text-slate-600" />
          </button>
        </div>

        {error && (
          <div className="p-3 text-xs rounded-xl bg-rose-50 text-rose-700 font-semibold border border-rose-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {studyData.subjects.length === 0 && (
          <div className="p-3 text-xs rounded-xl bg-amber-50 text-amber-800 font-semibold border border-amber-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>কোনো বিষয় পাওয়া যায়নি। অধ্যায় যুক্ত করার পূর্বে অনুগ্রহ করে প্রথমে একটি বিষয় যোগ করুন।</span>
          </div>
        )}

        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">বিষয় *</label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-slate-100 text-xs font-semibold text-[#141517] focus:outline-none"
              >
                {studyData.subjects.length === 0 ? (
                  <option value="">কোনো বিষয় নেই (আগে বিষয় যোগ করুন)</option>
                ) : (
                  studyData.subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.nameBn} ({sub.code})
                    </option>
                  ))
                )}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">অধ্যায় নম্বর</label>
              <input
                type="number"
                min="1"
                max="99"
                value={chapterNo}
                onChange={(e) => setChapterNo(Number(e.target.value))}
                className="w-full h-11 px-3.5 rounded-xl bg-slate-100 text-xs font-semibold text-[#141517] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              অধ্যায়ের শিরোনাম (বাংলায়) *
            </label>
            <input
              type="text"
              value={nameBn}
              onChange={(e) => setNameBn(e.target.value)}
              placeholder="যেমন: অধ্যায় ৩: পদার্থের গঠন"
              required
              className="w-full h-11 px-3.5 rounded-xl bg-slate-100 text-xs font-semibold text-[#141517] focus:outline-none focus:ring-2 focus:ring-[#084B32]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              ইংরেজি নাম (ঐচ্ছিক)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Structure of Matter"
              className="w-full h-11 px-3.5 rounded-xl bg-slate-100 text-xs font-semibold text-[#141517] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">পড়ার বর্তমান অবস্থা</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ChapterStatus)}
                className="w-full h-11 px-3.5 rounded-xl bg-slate-100 text-xs font-semibold text-[#141517] focus:outline-none"
              >
                <option value="not_started">শুরু হয়নি (Not Started)</option>
                <option value="in_progress">পড়া চলছে (In Progress)</option>
                <option value="completed">সম্পন্ন (Completed)</option>
                <option value="revised">রিভাইজড (Revised)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">গুরুত্ব / অগ্রাধিকার</label>
              <select
                value={importance}
                onChange={(e) => setImportance(e.target.value as 'high' | 'medium' | 'low')}
                className="w-full h-11 px-3.5 rounded-xl bg-slate-100 text-xs font-semibold text-[#141517] focus:outline-none"
              >
                <option value="high">উচ্চ অগ্রাধিকার (High)</option>
                <option value="medium">মাঝারি অগ্রাধিকার (Medium)</option>
                <option value="low">সাধারণ অগ্রাধিকার (Low)</option>
              </select>
            </div>
          </div>

          {/* CQ & MCQ Targets & Solved Counters */}
          <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-200/80 space-y-3">
            <span className="text-xs font-bold text-[#141517]">
              সৃজনশীল (CQ) ও বহুনির্বাচনী (MCQ) ট্র্যাকার
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  সৃজনশীল (CQ) সমাধান
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    value={cqSolved}
                    onChange={(e) => setCqSolved(Number(e.target.value))}
                    className="w-1/2 h-10 px-2 text-center rounded-xl bg-white border border-slate-200 text-xs font-bold text-[#141517]"
                  />
                  <span className="text-xs text-slate-400">/</span>
                  <input
                    type="number"
                    min="1"
                    value={cqTarget}
                    onChange={(e) => setCqTarget(Number(e.target.value))}
                    className="w-1/2 h-10 px-2 text-center rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-600"
                    title="টার্গেট CQ"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  MCQ সমাধান
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    value={mcqSolved}
                    onChange={(e) => setMcqSolved(Number(e.target.value))}
                    className="w-1/2 h-10 px-2 text-center rounded-xl bg-white border border-slate-200 text-xs font-bold text-[#141517]"
                  />
                  <span className="text-xs text-slate-400">/</span>
                  <input
                    type="number"
                    min="1"
                    value={mcqTarget}
                    onChange={(e) => setMcqTarget(Number(e.target.value))}
                    className="w-1/2 h-10 px-2 text-center rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-600"
                    title="টার্গেট MCQ"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={shortQSolved}
                  onChange={(e) => setShortQSolved(e.target.checked)}
                  className="w-4 h-4 rounded text-[#084B32] focus:ring-0"
                />
                <span className="font-semibold text-slate-700">সংক্ষিপ্ত ও জ্ঞানমূলক প্রশ্ন সম্পন্ন</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none text-rose-700">
                <input
                  type="checkbox"
                  checked={isWeak}
                  onChange={(e) => setIsWeak(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-600 focus:ring-0"
                />
                <span className="font-bold">দুর্বল অধ্যায় (Weak Area)</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              গুরুত্বপূর্ণ টপিক বা অধ্যায়ের নোট (ঐচ্ছিক)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="যেমন: সূত্রাবলী রিভিশন ও বোর্ড প্রশ্ন সমাধান দরকার..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 text-xs text-[#141517] resize-none focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-11 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
          >
            বাতিল
          </button>
          <button
            type="submit"
            className="flex-1 h-11 rounded-full bg-[#141517] hover:bg-black text-white text-xs font-bold cursor-pointer"
          >
            {editingChapter ? 'পরিবর্তন সংরক্ষণ করুন' : 'অধ্যায় যুক্ত করুন'}
          </button>
        </div>
      </form>
    </div>
  );
};
