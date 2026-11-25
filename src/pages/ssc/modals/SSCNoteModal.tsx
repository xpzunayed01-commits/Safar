import React, { useEffect, useState } from 'react';
import { Pin, X } from 'lucide-react';
import { useStudy } from '../../../context/StudyContext';
import type { SSCStudyNote } from '../../../types/ssc';

interface Props {
  open: boolean;
  editingNote?: SSCStudyNote | null;
  onClose: () => void;
}

export const SSCNoteModal: React.FC<Props> = ({ open, editingNote, onClose }) => {
  const { studyData, addStudyNote, updateStudyNote } = useStudy();

  const [subjectId, setSubjectId] = useState('');
  const [chapterId, setChapterId] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    if (editingNote) {
      setSubjectId(editingNote.subjectId);
      setChapterId(editingNote.chapterId ?? '');
      setTitle(editingNote.title);
      setContent(editingNote.content);
      setTagsInput(editingNote.tags.join(', '));
      setIsPinned(editingNote.isPinned);
    } else {
      setSubjectId(studyData.subjects[0]?.id || '');
      setChapterId('');
      setTitle('');
      setContent('');
      setTagsInput('সূত্র, রিভিশন');
      setIsPinned(false);
    }
  }, [open, editingNote, studyData.subjects]);

  if (!open) return null;

  const chaptersForSubject = studyData.chapters.filter((c) => c.subjectId === subjectId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('অনুগ্রহ করে নোটের শিরোনাম দিন।');
      return;
    }
    if (!content.trim()) {
      setError('অনুগ্রহ করে নোট বা সূত্রের বিবরণ লিখুন।');
      return;
    }

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const payload = {
      subjectId,
      chapterId: chapterId || undefined,
      title: title.trim(),
      content: content.trim(),
      tags,
      isPinned,
    };

    if (editingNote) {
      updateStudyNote(editingNote.id, payload);
    } else {
      addStudyNote(payload);
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
            {editingNote ? 'নোট সম্পাদনা' : 'নতুন স্টাডি নোট ও সূত্র যোগ'}
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
              নোটের শিরোনাম *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="যেমন: পদার্থবিজ্ঞানের সকল সূত্র তালিকা অথবা রসায়নের ইলেকট্রন বিন্যাস নিয়ম"
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
                <option value="">সাধারণ / যেকোনো অধ্যায়</option>
                {chaptersForSubject.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    {ch.nameBn}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              নোট ও সূত্রাবলীর বিস্তারিত তথ্য *
            </label>
            <textarea
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="এখানে সূত্র, সংজ্ঞা, মনে রাখার টেকনিক বা শর্টকাট বিস্তারিত লিখুন..."
              required
              className="w-full p-3.5 rounded-xl bg-slate-100 text-xs text-[#141517] font-mono leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-[#084B32]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                ট্যাগ (কমা দিয়ে আলাদা করুন)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="যেমন: সূত্র, রিভিশন, শর্টকাট"
                className="w-full h-11 px-3.5 rounded-xl bg-slate-100 text-xs text-[#141517] focus:outline-none"
              />
            </div>
            <div className="pt-4">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-0"
                />
                <Pin className={`w-3.5 h-3.5 ${isPinned ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}`} />
                <span className="text-xs font-bold text-slate-700">উপরে পিন করে রাখুন</span>
              </label>
            </div>
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
            {editingNote ? 'সংরক্ষণ করুন' : 'নোট তৈরি করুন'}
          </button>
        </div>
      </form>
    </div>
  );
};
