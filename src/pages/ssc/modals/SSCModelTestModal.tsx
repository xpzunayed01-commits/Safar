import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useStudy } from '../../../context/StudyContext';
import type { SSCModelTest } from '../../../types/ssc';

interface Props {
  open: boolean;
  editingTest?: SSCModelTest | null;
  onClose: () => void;
}

export const SSCModelTestModal: React.FC<Props> = ({ open, editingTest, onClose }) => {
  const { studyData, addModelTest, updateModelTest } = useStudy();

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [subjectId, setSubjectId] = useState('');
  const [testTitle, setTestTitle] = useState('');
  const [paperType, setPaperType] = useState<'1st' | '2nd' | 'combined'>('combined');
  const [cqMarks, setCqMarks] = useState(35);
  const [mcqMarks, setMcqMarks] = useState(25);
  const [practicalMarks, setPracticalMarks] = useState<number | undefined>(undefined);
  const [totalMarks, setTotalMarks] = useState(100);
  const [weakAreas, setWeakAreas] = useState('');
  const [mistakesToReview, setMistakesToReview] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    if (editingTest) {
      setDate(editingTest.date);
      setSubjectId(editingTest.subjectId);
      setTestTitle(editingTest.testTitle);
      setPaperType(editingTest.paperType);
      setCqMarks(editingTest.cqMarks);
      setMcqMarks(editingTest.mcqMarks);
      setPracticalMarks(editingTest.practicalMarks);
      setTotalMarks(editingTest.totalMarks);
      setWeakAreas(editingTest.weakAreas ?? '');
      setMistakesToReview(editingTest.mistakesToReview ?? '');
    } else {
      setDate(new Date().toISOString().split('T')[0]);
      setSubjectId(studyData.subjects[0]?.id || '');
      setTestTitle('');
      setPaperType('combined');
      setCqMarks(35);
      setMcqMarks(25);
      setPracticalMarks(undefined);
      setTotalMarks(100);
      setWeakAreas('');
      setMistakesToReview('');
    }
  }, [open, editingTest, studyData.subjects]);

  if (!open) return null;

  const totalObtained = Number(cqMarks || 0) + Number(mcqMarks || 0) + Number(practicalMarks || 0);
  const pct = totalMarks > 0 ? (totalObtained / totalMarks) * 100 : 0;

  // Grade calculation according to Bangladesh Education Board
  let calculatedGrade: SSCModelTest['grade'] = 'F';
  if (pct >= 80) calculatedGrade = 'A+';
  else if (pct >= 70) calculatedGrade = 'A';
  else if (pct >= 60) calculatedGrade = 'A-';
  else if (pct >= 50) calculatedGrade = 'B';
  else if (pct >= 40) calculatedGrade = 'C';
  else if (pct >= 33) calculatedGrade = 'D';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testTitle.trim()) {
      setError('অনুগ্রহ করে পরীক্ষার নাম লিখুন।');
      return;
    }
    if (!subjectId) {
      setError('অনুগ্রহ করে একটি বিষয় নির্বাচন করুন।');
      return;
    }
    if (totalObtained > totalMarks) {
      setError('প্রাপ্ত নম্বর মোট নম্বরের চেয়ে বেশি হতে পারে না।');
      return;
    }

    const payload = {
      date,
      subjectId,
      testTitle: testTitle.trim(),
      paperType,
      cqMarks: Number(cqMarks) || 0,
      mcqMarks: Number(mcqMarks) || 0,
      practicalMarks: practicalMarks !== undefined ? Number(practicalMarks) : undefined,
      totalMarks: Number(totalMarks) || 100,
      obtainedMarks: totalObtained,
      grade: calculatedGrade,
      weakAreas: weakAreas.trim() || undefined,
      mistakesToReview: mistakesToReview.trim() || undefined,
    };

    if (editingTest) {
      updateModelTest(editingTest.id, payload);
    } else {
      addModelTest(payload);
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
            {editingTest ? 'মডেল টেস্ট ফলাফল সম্পাদনা' : 'নতুন মডেল টেস্ট ফলাফল যোগ'}
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
              পরীক্ষার নাম ও বিবরণ *
            </label>
            <input
              type="text"
              value={testTitle}
              onChange={(e) => setTestTitle(e.target.value)}
              placeholder="যেমন: টেস্ট এক্সাম ১ অথবা প্রি-টেস্ট মডেল টেস্ট"
              required
              className="w-full h-11 px-3.5 rounded-xl bg-slate-100 text-xs font-semibold text-[#141517] focus:outline-none focus:ring-2 focus:ring-[#084B32]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">বিষয় *</label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
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
              <label className="block text-xs font-bold text-slate-600 mb-1">পত্র</label>
              <select
                value={paperType}
                onChange={(e) => setPaperType(e.target.value as '1st' | '2nd' | 'combined')}
                className="w-full h-11 px-3 rounded-xl bg-slate-100 text-xs font-semibold text-[#141517] focus:outline-none"
              >
                <option value="combined">সম্মিলিত (Combined)</option>
                <option value="1st">১ম পত্র (1st Paper)</option>
                <option value="2nd">২য় পত্র (2nd Paper)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">তারিখ</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-11 px-3 rounded-xl bg-slate-100 text-xs font-semibold text-[#141517] focus:outline-none"
              />
            </div>
          </div>

          {/* Marks Breakdown Box */}
          <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#141517]">নম্বর বণ্টন ও ফলাফল</span>
              <span
                className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
                  calculatedGrade === 'A+'
                    ? 'bg-emerald-100 text-[#084B32]'
                    : calculatedGrade === 'A' || calculatedGrade === 'A-'
                    ? 'bg-blue-100 text-blue-800'
                    : calculatedGrade === 'F'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                গ্রেড: {calculatedGrade} ({Math.round(pct)}%)
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  CQ নম্বর
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={cqMarks}
                  onChange={(e) => setCqMarks(Number(e.target.value))}
                  className="w-full h-10 px-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-[#141517] text-center"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  MCQ নম্বর
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={mcqMarks}
                  onChange={(e) => setMcqMarks(Number(e.target.value))}
                  className="w-full h-10 px-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-[#141517] text-center"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  ব্যবহারিক (ঐচ্ছিক)
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={practicalMarks ?? ''}
                  onChange={(e) =>
                    setPracticalMarks(e.target.value ? Number(e.target.value) : undefined)
                  }
                  placeholder="০"
                  className="w-full h-10 px-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-[#141517] text-center"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  মোট নম্বর
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={totalMarks}
                  onChange={(e) => setTotalMarks(Number(e.target.value))}
                  className="w-full h-10 px-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 text-center"
                />
              </div>
            </div>

            <div className="text-right text-xs font-extrabold text-[#141517] pt-1">
              মোট প্রাপ্ত নম্বর: {totalObtained} / {totalMarks}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              যে অধ্যায় বা টপিকে ভুল হয়েছে (দুর্বল বিষয় চিহ্নিত করুন)
            </label>
            <input
              type="text"
              value={weakAreas}
              onChange={(e) => setWeakAreas(e.target.value)}
              placeholder="যেমন: চল তড়িৎ বর্তনী ও ত্রিকোণমিতিক সমীকরণ"
              className="w-full h-11 px-3.5 rounded-xl bg-slate-100 text-xs text-[#141517] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              ভুল সংশোধনের নোট বা করণীয়
            </label>
            <textarea
              rows={2}
              value={mistakesToReview}
              onChange={(e) => setMistakesToReview(e.target.value)}
              placeholder="যেমন: সময় নিয়ন্ত্রণে ঘাটতি ছিল, সূত্রগুলো আবার দেখতে হবে..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-100 text-xs text-[#141517] resize-none focus:outline-none"
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
            {editingTest ? 'সংরক্ষণ করুন' : 'ফলাফল যুক্ত করুন'}
          </button>
        </div>
      </form>
    </div>
  );
};
