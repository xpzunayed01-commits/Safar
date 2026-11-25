import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useStudy } from '../../../context/StudyContext';
import type { SSCStudyPlan } from '../../../types/ssc';

interface Props {
  open: boolean;
  defaultDate?: string;
  editingPlan?: SSCStudyPlan | null;
  onClose: () => void;
}

export const SSCPlanModal: React.FC<Props> = ({ open, defaultDate, editingPlan, onClose }) => {
  const { studyData, addStudyPlan, updateStudyPlan } = useStudy();

  const [date, setDate] = useState(defaultDate || new Date().toISOString().split('T')[0]);
  const [subjectId, setSubjectId] = useState('');
  const [chapterId, setChapterId] = useState('');
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('09:30');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    if (editingPlan) {
      setDate(editingPlan.date);
      setSubjectId(editingPlan.subjectId);
      setChapterId(editingPlan.chapterId ?? '');
      setTitle(editingPlan.title);
      setStartTime(editingPlan.startTime);
      setEndTime(editingPlan.endTime);
      setNotes(editingPlan.notes ?? '');
    } else {
      const initSub = studyData.subjects[0]?.id || '';
      setDate(defaultDate || new Date().toISOString().split('T')[0]);
      setSubjectId(initSub);
      setChapterId('');
      setTitle('');
      setStartTime('08:30');
      setEndTime('10:00');
      setNotes('');
    }
  }, [open, editingPlan, defaultDate, studyData.subjects]);

  if (!open) return null;

  const chaptersForSubject = studyData.chapters.filter((c) => c.subjectId === subjectId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('অনুগ্রহ করে পড়ার পরিকল্পনা বা কাজের শিরোনাম লিখুন।');
      return;
    }
    if (!subjectId) {
      setError('অনুগ্রহ করে একটি বিষয় নির্বাচন করুন।');
      return;
    }

    const payload = {
      date,
      subjectId,
      chapterId: chapterId || undefined,
      title: title.trim(),
      startTime,
      endTime,
      isCompleted: editingPlan ? editingPlan.isCompleted : false,
      notes: notes.trim() || undefined,
    };

    if (editingPlan) {
      updateStudyPlan(editingPlan.id, payload);
    } else {
      addStudyPlan(payload);
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-[28px] max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200"
      >
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h2 className="text-base font-extrabold text-[#141517]">
            {editingPlan ? 'স্টাডি প্ল্যান সম্পাদনা' : 'নতুন পড়ার রুটিন যোগ'}
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
          <div className="p-3 text-xs rounded-xl bg-rose-50 text-rose-700 font-semibold border border-rose-200">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              পরিকল্পনার শিরোনাম *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="যেমন: ৩য় অধ্যায়ের ৫টি CQ সমাধান ও সূত্র রিভিশন"
              required
              className="w-full h-11 px-3.5 rounded-xl bg-slate-100 text-xs font-semibold text-[#141517] focus:outline-none focus:ring-2 focus:ring-[#084B32]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">বিষয়</label>
              <select
                value={subjectId}
                onChange={(e) => {
                  setSubjectId(e.target.value);
                  setChapterId('');
                }}
                className="w-full h-11 px-3 rounded-xl bg-slate-100 text-xs font-semibold text-[#141517] focus:outline-none"
              >
                {studyData.subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.nameBn}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">অধ্যায় (ঐচ্ছিক)</label>
              <select
                value={chapterId}
                onChange={(e) => setChapterId(e.target.value)}
                className="w-full h-11 px-3 rounded-xl bg-slate-100 text-xs font-semibold text-[#141517] focus:outline-none"
              >
                <option value="">সকল / নির্দিষ্ট নয়</option>
                {chaptersForSubject.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    {ch.nameBn}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">তারিখ</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-11 px-2.5 rounded-xl bg-slate-100 text-xs font-semibold text-[#141517] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">শুরু</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full h-11 px-2.5 rounded-xl bg-slate-100 text-xs font-semibold text-[#141517] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">শেষ</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full h-11 px-2.5 rounded-xl bg-slate-100 text-xs font-semibold text-[#141517] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              নোট বা লক্ষ্য (ঐচ্ছিক)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="যেমন: টেস্ট পেপার ২০২৪ থেকে সমাধান"
              className="w-full h-11 px-3.5 rounded-xl bg-slate-100 text-xs text-[#141517] focus:outline-none"
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
            {editingPlan ? 'সংরক্ষণ করুন' : 'রুটিনে যোগ করুন'}
          </button>
        </div>
      </form>
    </div>
  );
};
