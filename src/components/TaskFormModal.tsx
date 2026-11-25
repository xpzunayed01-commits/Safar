import React, { useEffect, useState } from 'react';
import { Check, Repeat, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatDateKey } from '../services/prayerService';
import type {
  TaskCategory,
  TaskColorTheme,
  TaskItem,
  TaskPriority,
  TaskRepeat,
} from '../types/app';

interface Props {
  open: boolean;
  initialDate?: string;
  editingTask?: TaskItem | null;
  onClose: () => void;
}

export const TaskFormModal: React.FC<Props> = ({
  open,
  initialDate,
  editingTask,
  onClose,
}) => {
  const { state, addTask, updateTask } = useApp();
  const isBn = state.preferences.language === 'bn';

  const categories: Array<{ value: TaskCategory; label: string }> = [
    { value: 'worship', label: isBn ? 'ইবাদত ও যিকির' : 'Worship & Dhikr' },
    { value: 'quran', label: isBn ? 'কুরআন অধ্যয়ন' : 'Quran Study' },
    { value: 'charity', label: isBn ? 'দান ও কল্যাণ' : 'Charity & Kindness' },
    { value: 'learning', label: isBn ? 'ইসলামিক শিক্ষা' : 'Islamic Learning' },
    { value: 'personal', label: isBn ? 'ব্যক্তিগত কাজ' : 'Daily Personal' },
  ];

  const colorThemes: Array<{ value: TaskColorTheme; label: string; bg: string; dot: string }> = [
    { value: 'periwinkle', label: isBn ? 'নীলচে' : 'Periwinkle', bg: 'bg-[#8B98F8]', dot: '#8B98F8' },
    { value: 'charcoal', label: isBn ? 'গ্রাফাইট' : 'Graphite', bg: 'bg-[#141517]', dot: '#141517' },
    { value: 'lime', label: isBn ? 'অলিভ' : 'Olive Lime', bg: 'bg-[#B4D353]', dot: '#B4D353' },
    { value: 'lavender', label: isBn ? 'ল্যাভেন্ডার' : 'Lavender', bg: 'bg-[#A29EE8]', dot: '#A29EE8' },
  ];

  const priorityLabels: Record<TaskPriority, string> = {
    low: isBn ? 'সাধারণ' : 'low',
    medium: isBn ? 'মাঝারি' : 'medium',
    high: isBn ? 'জরুরি' : 'high',
  };

  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(initialDate || formatDateKey(new Date()));
  const [time, setTime] = useState('09:00');
  const [endTime, setEndTime] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [category, setCategory] = useState<TaskCategory>('worship');
  const [repeat, setRepeat] = useState<TaskRepeat>('none');
  const [colorTheme, setColorTheme] = useState<TaskColorTheme>('periwinkle');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    if (editingTask) {
      setTitle(editingTask.title);
      setNote(editingTask.note ?? '');
      setDate(editingTask.date);
      setTime(editingTask.time);
      setEndTime(editingTask.endTime ?? '');
      setPriority(editingTask.priority);
      setCategory(editingTask.category);
      setRepeat(editingTask.repeat);
      setColorTheme(editingTask.colorTheme);
    } else {
      setTitle('');
      setNote('');
      setDate(initialDate || formatDateKey(new Date()));
      setTime('08:30');
      setEndTime('');
      setPriority('medium');
      setCategory('worship');
      setRepeat('none');
      setColorTheme('periwinkle');
    }
  }, [open, editingTask, initialDate]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError(isBn ? 'অনুগ্রহ করে আমল বা কাজের শিরোনাম লিখুন।' : 'Please enter a task title.');
      return;
    }

    const payload = {
      title: title.trim(),
      note: note.trim() || undefined,
      date,
      time,
      endTime: endTime.trim() || undefined,
      priority,
      category,
      repeat,
      colorTheme,
    };

    if (editingTask) {
      updateTask(editingTask.id, payload);
    } else {
      addTask(payload);
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={editingTask ? (isBn ? 'আমল সম্পাদনা' : 'Edit Task') : isBn ? 'নতুন আমল যোগ' : 'Add New Task'}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full sm:max-w-md rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl bg-white max-h-[92vh] flex flex-col"
      >
        <div
          className="px-5 pt-5 pb-4 flex items-center justify-between"
          style={{
            background: 'linear-gradient(135deg, #EDE3F8 0%, #FBEAE0 100%)',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white text-[#141517] flex items-center justify-center shadow-sm hover:bg-slate-50 cursor-pointer"
            aria-label={isBn ? 'বাতিল' : 'Cancel'}
          >
            <X className="w-4 h-4" />
          </button>
          <h2 className="text-base font-bold text-[#141517]">
            {editingTask
              ? isBn
                ? 'আমল সম্পাদনা করুন'
                : 'Edit Task'
              : isBn
              ? 'নতুন আমল যোগ করুন'
              : 'Add New Task'}
          </h2>
          <button
            type="submit"
            className="w-10 h-10 rounded-full bg-white text-[#141517] flex items-center justify-center shadow-sm hover:bg-slate-50 cursor-pointer"
            aria-label={isBn ? 'সংরক্ষণ করুন' : 'Save Task'}
          >
            <Check className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          {error && (
            <div className="text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              {isBn ? 'আমল বা কাজের শিরোনাম' : 'Task Title'}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                isBn ? 'যেমন: ঘুমানোর আগে সূরা মুলক পাঠ করা' : 'e.g., Recite Surah Al-Mulk before sleep'
              }
              className="w-full h-11 px-4 rounded-2xl bg-[#F6F7FA] border border-slate-200/70 text-sm text-[#141517] focus:outline-none focus:ring-2 focus:ring-[#8B98F8]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              {isBn ? 'বিবরণ বা নোট (ঐচ্ছিক)' : 'Description / Note (optional)'}
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={isBn ? 'নিয়ত বা সংক্ষিপ্ত নোট লিখুন...' : 'Add intention, location, or gentle reminder...'}
              className="w-full px-4 py-2.5 rounded-2xl bg-[#F6F7FA] border border-slate-200/70 text-sm text-[#141517] resize-none focus:outline-none focus:ring-2 focus:ring-[#8B98F8]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                {isBn ? 'তারিখ' : 'Date'}
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-11 px-3.5 rounded-2xl bg-[#F6F7FA] border border-slate-200/70 text-sm text-[#141517] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                {isBn ? 'সময়' : 'Time'}
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full h-11 px-3.5 rounded-2xl bg-[#F6F7FA] border border-slate-200/70 text-sm text-[#141517] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              {isBn ? 'অগ্রাধিকার' : 'Priority'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['low', 'medium', 'high'] as TaskPriority[]).map((p) => {
                const active = priority === p;
                const styles: Record<TaskPriority, string> = {
                  low: active
                    ? 'bg-emerald-100 border-emerald-500 text-emerald-900'
                    : 'bg-emerald-50/60 border-emerald-200 text-emerald-700',
                  medium: active
                    ? 'bg-amber-100 border-amber-500 text-amber-900'
                    : 'bg-amber-50/60 border-amber-200 text-amber-700',
                  high: active
                    ? 'bg-rose-100 border-rose-500 text-rose-900'
                    : 'bg-rose-50/60 border-rose-200 text-rose-700',
                };
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`h-10 rounded-full border text-xs font-bold capitalize transition-all cursor-pointer ${styles[p]}`}
                  >
                    {priorityLabels[p]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                {isBn ? 'ক্যাটাগরি' : 'Category'}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TaskCategory)}
                className="w-full h-11 px-3 rounded-2xl bg-[#F6F7FA] border border-slate-200/70 text-sm text-[#141517] focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                {isBn ? 'পুনরাবৃত্তি' : 'Repeat'}
              </label>
              <div className="relative">
                <Repeat className="w-3.5 h-3.5 text-indigo-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={repeat}
                  onChange={(e) => setRepeat(e.target.value as TaskRepeat)}
                  className="w-full h-11 pl-8 pr-3 rounded-2xl bg-[#8B98F8]/15 border border-[#8B98F8]/40 text-sm font-semibold text-indigo-950 focus:outline-none"
                >
                  <option value="none">{isBn ? 'একবার' : 'Once'}</option>
                  <option value="daily">{isBn ? 'প্রতিদিন' : 'Every Day'}</option>
                  <option value="weekly">{isBn ? 'সাপ্তাহিক' : 'Weekly'}</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              {isBn ? 'কার্ডের রঙ' : 'Card Color'}
            </label>
            <div className="flex items-center gap-2.5">
              {colorThemes.map((ct) => (
                <button
                  key={ct.value}
                  type="button"
                  onClick={() => setColorTheme(ct.value)}
                  className={`flex-1 h-10 rounded-full flex items-center justify-center gap-1.5 text-xs font-semibold border transition-all cursor-pointer ${
                    colorTheme === ct.value
                      ? 'border-[#141517] bg-slate-100 text-[#141517]'
                      : 'border-slate-200 bg-white text-slate-500'
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: ct.dot }}
                  />
                  <span className="hidden sm:inline">{ct.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-5 pt-2 border-t border-slate-100 bg-white">
          <button
            type="submit"
            className="w-full h-12 rounded-full bg-[#141517] hover:bg-black text-white font-semibold text-sm shadow-md transition-transform active:scale-[0.98] cursor-pointer"
          >
            {editingTask
              ? isBn
                ? 'পরিবর্তন সংরক্ষণ করুন'
                : 'Save Changes'
              : isBn
              ? 'আমল তৈরি করুন'
              : 'Create Task'}
          </button>
        </div>
      </form>
    </div>
  );
};
