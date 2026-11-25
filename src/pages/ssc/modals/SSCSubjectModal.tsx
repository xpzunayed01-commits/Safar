import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useStudy } from '../../../context/StudyContext';
import type { SSCGroup, SSCSubject } from '../../../types/ssc';

interface Props {
  open: boolean;
  editingSubject?: SSCSubject | null;
  onClose: () => void;
}

export const SSCSubjectModal: React.FC<Props> = ({ open, editingSubject, onClose }) => {
  const { addSubject, updateSubject } = useStudy();
  const [name, setName] = useState('');
  const [nameBn, setNameBn] = useState('');
  const [code, setCode] = useState('');
  const [group, setGroup] = useState<SSCGroup>('science');
  const [colorTheme, setColorTheme] = useState<SSCSubject['colorTheme']>('emerald');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    if (editingSubject) {
      setName(editingSubject.name);
      setNameBn(editingSubject.nameBn);
      setCode(editingSubject.code);
      setGroup(editingSubject.group);
      setColorTheme(editingSubject.colorTheme);
    } else {
      setName('');
      setNameBn('');
      setCode('');
      setGroup('science');
      setColorTheme('emerald');
    }
  }, [open, editingSubject]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameBn.trim()) {
      setError('অনুগ্রহ করে বিষয়ের নাম লিখুন।');
      return;
    }

    if (editingSubject) {
      updateSubject(editingSubject.id, {
        name: name.trim() || nameBn.trim(),
        nameBn: nameBn.trim(),
        code: code.trim(),
        group,
        colorTheme,
      });
    } else {
      addSubject({
        name: name.trim() || nameBn.trim(),
        nameBn: nameBn.trim(),
        code: code.trim() || '100',
        group,
        colorTheme,
      });
    }
    onClose();
  };

  const themes: Array<{ value: SSCSubject['colorTheme']; label: string; bg: string }> = [
    { value: 'emerald', label: 'সবুজ', bg: 'bg-emerald-500' },
    { value: 'sky', label: 'আকাশি', bg: 'bg-sky-500' },
    { value: 'amber', label: 'কমলা', bg: 'bg-amber-500' },
    { value: 'rose', label: 'গোলাপি', bg: 'bg-rose-500' },
    { value: 'indigo', label: 'নীল', bg: 'bg-indigo-500' },
    { value: 'violet', label: 'বেগুনি', bg: 'bg-violet-500' },
    { value: 'teal', label: 'টিয়াল', bg: 'bg-teal-500' },
  ];

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
            {editingSubject ? 'বিষয় সম্পাদনা করুন' : 'নতুন বিষয় যোগ করুন'}
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
              বিষয়ের নাম (বাংলায়) *
            </label>
            <input
              type="text"
              value={nameBn}
              onChange={(e) => setNameBn(e.target.value)}
              placeholder="যেমন: হিসাববিজ্ঞান বা পৌরনীতি"
              required
              className="w-full h-11 px-3.5 rounded-xl bg-slate-100 text-xs font-semibold text-[#141517] focus:outline-none focus:ring-2 focus:ring-[#084B32]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                ইংরেজি নাম (ঐচ্ছিক)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Accounting"
                className="w-full h-11 px-3.5 rounded-xl bg-slate-100 text-xs font-semibold text-[#141517] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">বিষয় কোড</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="যেমন: 146"
                className="w-full h-11 px-3.5 rounded-xl bg-slate-100 text-xs font-semibold text-[#141517] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">বিভাগ বা গ্রুপ</label>
            <select
              value={group}
              onChange={(e) => setGroup(e.target.value as SSCGroup)}
              className="w-full h-11 px-3.5 rounded-xl bg-slate-100 text-xs font-semibold text-[#141517] focus:outline-none"
            >
              <option value="science">বিজ্ঞান (Science)</option>
              <option value="commerce">ব্যবসায় শিক্ষা (Commerce)</option>
              <option value="humanities">মানবিক (Humanities)</option>
              <option value="general">আবশ্যিক / সাধারণ (General)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">কার্ডের রঙ থিম</label>
            <div className="flex items-center gap-2">
              {themes.map((th) => (
                <button
                  key={th.value}
                  type="button"
                  onClick={() => setColorTheme(th.value)}
                  className={`w-8 h-8 rounded-full ${th.bg} flex items-center justify-center transition-transform cursor-pointer ${
                    colorTheme === th.value ? 'ring-3 ring-offset-2 ring-slate-800 scale-110' : 'opacity-80'
                  }`}
                  title={th.label}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
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
            {editingSubject ? 'সংরক্ষণ করুন' : 'বিষয় যুক্ত করুন'}
          </button>
        </div>
      </form>
    </div>
  );
};
