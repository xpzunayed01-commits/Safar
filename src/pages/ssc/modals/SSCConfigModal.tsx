import React, { useEffect, useState } from 'react';
import { Calendar, X } from 'lucide-react';
import { useStudy } from '../../../context/StudyContext';
import type { SSCGroup } from '../../../types/ssc';

interface Props {
  open: boolean;
  onClose: () => void;
}

export const SSCConfigModal: React.FC<Props> = ({ open, onClose }) => {
  const { studyData, updateConfig } = useStudy();

  const [examTitle, setExamTitle] = useState('');
  const [targetExamDate, setTargetExamDate] = useState('');
  const [group, setGroup] = useState<SSCGroup>('science');
  const [targetGpa, setTargetGpa] = useState(5.0);
  const [dailyTargetHours, setDailyTargetHours] = useState(4);
  const [studentName, setStudentName] = useState('');
  const [boardName, setBoardName] = useState('');

  useEffect(() => {
    if (!open) return;
    const cfg = studyData.config;
    setExamTitle(cfg.examTitle);
    setTargetExamDate(cfg.targetExamDate);
    setGroup(cfg.group);
    setTargetGpa(cfg.targetGpa);
    setDailyTargetHours(Math.round((cfg.dailyStudyTargetMinutes || 240) / 60));
    setStudentName(cfg.studentName ?? '');
    setBoardName(cfg.boardName ?? '');
  }, [open, studyData.config]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfig({
      examTitle: examTitle.trim() || 'এসএসসি পরীক্ষা ২০২৭',
      targetExamDate: targetExamDate || '2027-02-01',
      group,
      targetGpa: Number(targetGpa) || 5.0,
      dailyStudyTargetMinutes: Math.max(1, Number(dailyTargetHours)) * 60,
      studentName: studentName.trim() || undefined,
      boardName: boardName.trim() || undefined,
    });
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
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#084B32]" />
            <h2 className="text-base font-extrabold text-[#141517]">পরীক্ষার লক্ষ্য ও সেটিংস</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4 text-slate-600" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              পরীক্ষার নাম বা টাইটেল
            </label>
            <input
              type="text"
              value={examTitle}
              onChange={(e) => setExamTitle(e.target.value)}
              placeholder="যেমন: এসএসসি পরীক্ষা ২০২৭"
              className="w-full h-11 px-3.5 rounded-xl bg-slate-100 text-xs font-semibold text-[#141517] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              টার্গেট পরীক্ষার শুরুর তারিখ *
            </label>
            <input
              type="date"
              value={targetExamDate}
              onChange={(e) => setTargetExamDate(e.target.value)}
              required
              className="w-full h-11 px-3.5 rounded-xl bg-slate-100 text-xs font-semibold text-[#141517] focus:outline-none focus:ring-2 focus:ring-[#084B32]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">বিভাগ (গ্রুপ)</label>
              <select
                value={group}
                onChange={(e) => setGroup(e.target.value as SSCGroup)}
                className="w-full h-11 px-3 rounded-xl bg-slate-100 text-xs font-semibold text-[#141517] focus:outline-none"
              >
                <option value="science">বিজ্ঞান (Science)</option>
                <option value="commerce">ব্যবসায় শিক্ষা (Commerce)</option>
                <option value="humanities">মানবিক (Humanities)</option>
                <option value="general">সাধারণ</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">টার্গেট GPA</label>
              <input
                type="number"
                step="0.01"
                min="1.0"
                max="5.0"
                value={targetGpa}
                onChange={(e) => setTargetGpa(Number(e.target.value))}
                className="w-full h-11 px-3 rounded-xl bg-slate-100 text-xs font-semibold text-[#141517] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                দৈনিক পড়ার টার্গেট (ঘণ্টা)
              </label>
              <input
                type="number"
                min="1"
                max="18"
                value={dailyTargetHours}
                onChange={(e) => setDailyTargetHours(Number(e.target.value))}
                className="w-full h-11 px-3 rounded-xl bg-slate-100 text-xs font-semibold text-[#141517] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">শিক্ষা বোর্ড</label>
              <input
                type="text"
                value={boardName}
                onChange={(e) => setBoardName(e.target.value)}
                placeholder="ঢাকা বোর্ড"
                className="w-full h-11 px-3 rounded-xl bg-slate-100 text-xs font-semibold text-[#141517] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">শিক্ষার্থীর নাম</label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="আপনার নাম লিখুন"
              className="w-full h-11 px-3.5 rounded-xl bg-slate-100 text-xs font-semibold text-[#141517] focus:outline-none"
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
            সংরক্ষণ করুন
          </button>
        </div>
      </form>
    </div>
  );
};
