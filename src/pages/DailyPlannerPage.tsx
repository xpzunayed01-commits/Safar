import React, { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Calendar as CalendarIcon,
  Check,
  Pencil,
  Plus,
  Repeat,
  Trash2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatDateKey, formatHHmmDisplay, toBanglaDigits } from '../services/prayerService';
import { UserAvatar } from '../components/MosqueArtwork';
import { TaskFormModal } from '../components/TaskFormModal';
import type { TaskCategory, TaskItem, TaskPriority, TaskRepeat } from '../types/app';

export const DailyPlannerPage: React.FC = () => {
  const {
    state,
    t,
    toggleTaskCompletion,
    deleteTask,
    clearAllTasks,
    addCalendarNote,
    deleteCalendarNote,
  } = useApp();
  const isBn = state.preferences.language === 'bn';

  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [calendarMode, setCalendarMode] = useState<'week' | 'month'>('week');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | TaskCategory>('all');
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [noteInput, setNoteInput] = useState('');
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  const selectedDateKey = formatDateKey(selectedDate);

  const categoryLabelsBn: Record<TaskCategory, string> = {
    worship: 'ইবাদত ও যিকির',
    quran: 'কুরআন অধ্যয়ন',
    charity: 'দান ও কল্যাণ',
    learning: 'ইসলামিক শিক্ষা',
    personal: 'ব্যক্তিগত',
  };

  const repeatLabelsBn: Record<TaskRepeat, string> = {
    none: 'একবার',
    daily: 'প্রতিদিন',
    weekly: 'সাপ্তাহিক',
  };

  const priorityLabelsBn: Record<TaskPriority, string> = {
    low: 'সাধারণ অগ্রাধিকার',
    medium: 'মাঝারি অগ্রাধিকার',
    high: 'জরুরি অগ্রাধিকার',
  };

  const weekDays = useMemo(() => {
    const start = new Date(selectedDate);
    start.setDate(selectedDate.getDate() - 3);
    return Array.from({ length: 7 }).map((_, idx) => {
      const d = new Date(start);
      d.setDate(start.getDate() + idx);
      return d;
    });
  }, [selectedDate]);

  const monthGrid = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const totalDays = new Date(year, month + 1, 0).getDate();
    const startOffset = firstDay.getDay();
    const cells: Array<Date | null> = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let day = 1; day <= totalDays; day++) {
      cells.push(new Date(year, month, day));
    }
    return cells;
  }, [selectedDate]);

  const tasksForDay = useMemo(() => {
    return state.tasks
      .filter((task) => {
        if (task.date === selectedDateKey) return true;
        if (task.repeat === 'daily') return true;
        if (task.repeat === 'weekly') {
          const [ty, tm, td] = task.date.split('-').map(Number);
          const taskWeekday = new Date(ty, tm - 1, td).getDay();
          return taskWeekday === selectedDate.getDay();
        }
        return false;
      })
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [state.tasks, selectedDateKey, selectedDate]);

  const filteredTasks = useMemo(() => {
    return tasksForDay.filter((task) => {
      const isDone = task.completedDates.includes(selectedDateKey);
      if (statusFilter === 'pending' && isDone) return false;
      if (statusFilter === 'completed' && !isDone) return false;
      if (categoryFilter !== 'all' && task.category !== categoryFilter) return false;
      return true;
    });
  }, [tasksForDay, statusFilter, categoryFilter, selectedDateKey]);

  const totalDayCount = tasksForDay.length;
  const completedDayCount = tasksForDay.filter((tk) =>
    tk.completedDates.includes(selectedDateKey)
  ).length;
  const pendingDayCount = totalDayCount - completedDayCount;
  const completionPct =
    totalDayCount === 0 ? 0 : Math.round((completedDayCount / totalDayCount) * 100);

  const dayNotes = state.notes.filter((n) => n.date === selectedDateKey);

  const cardThemeClass: Record<TaskItem['colorTheme'], string> = {
    periwinkle: 'bg-[#8B98F8] text-white',
    charcoal: 'bg-[#141517] text-white',
    lime: 'bg-[#B4D353] text-[#141517]',
    lavender: 'bg-[#A29EE8] text-white',
  };

  return (
    <div className="min-h-screen bg-[#F7F8FC] pb-10">
      {/* Top gradient header matching Reference Image 12 */}
      <div
        className="px-5 pt-6 pb-5 rounded-b-[32px]"
        style={{
          background: 'linear-gradient(155deg, #EDE3F8 0%, #FBEAE0 60%, #FFFFFF 100%)',
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <UserAvatar
              avatarId={state.auth.account.avatarId}
              customAvatarDataUrl={state.auth.account.customAvatarDataUrl}
              name={state.auth.account.name}
              sizeClass="w-11 h-11"
            />
            <div>
              <div className="text-xs text-slate-500 font-medium">{t.planner}</div>
              <h1 className="text-xl font-extrabold text-[#141517] tracking-tight">
                {selectedDate.toLocaleDateString(isBn ? 'bn-BD' : undefined, {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCalendarMode(calendarMode === 'week' ? 'month' : 'week')}
              className="h-10 px-3.5 rounded-full bg-white text-[#141517] text-xs font-bold shadow-sm border border-slate-200/70 flex items-center gap-1.5 cursor-pointer"
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>
                {calendarMode === 'week'
                  ? isBn
                    ? 'মাসিক'
                    : 'Monthly'
                  : isBn
                  ? 'সাপ্তাহিক'
                  : 'Weekly'}
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingTask(null);
                setTaskModalOpen(true);
              }}
              aria-label={t.addTask}
              className="w-11 h-11 rounded-full bg-[#141517] text-white flex items-center justify-center shadow-md hover:bg-black cursor-pointer"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Reference Image 12: Dark Charcoal "Today's Progress" Card with Lime Ring */}
        <div className="mt-5 rounded-[26px] bg-[#141517] text-white p-5 flex items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                <circle
                  cx="40"
                  cy="40"
                  r="33"
                  fill="none"
                  stroke="rgba(255,255,255,0.14)"
                  strokeWidth="8"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="33"
                  fill="none"
                  stroke="#B4D353"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={207.35}
                  strokeDashoffset={207.35 - (207.35 * completionPct) / 100}
                />
              </svg>
              <span className="absolute text-base font-extrabold tabular-nums">
                {isBn ? toBanglaDigits(completionPct) : completionPct}%
              </span>
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">
                {isBn ? 'দৈনিক অগ্রগতি' : 'Daily Progress'}
              </div>
              <div className="text-lg font-bold mt-0.5">{t.todayTask}</div>
              <div className="text-xs text-[#B4D353] mt-0.5">
                {isBn
                  ? `${toBanglaDigits(totalDayCount)}টির মধ্যে ${toBanglaDigits(completedDayCount)}টি সম্পন্ন`
                  : `${completedDayCount} of ${totalDayCount} completed`}
              </div>
            </div>
          </div>

          <div className="space-y-1.5 text-right tabular-nums text-xs shrink-0">
            <div>
              <span className="font-extrabold text-white">
                {isBn ? toBanglaDigits(totalDayCount) : totalDayCount}
              </span>{' '}
              <span className="text-slate-400">{isBn ? 'মোট' : 'Total'}</span>
            </div>
            <div>
              <span className="font-extrabold text-[#B4D353]">
                {isBn ? toBanglaDigits(completedDayCount) : completedDayCount}
              </span>{' '}
              <span className="text-slate-400">{isBn ? 'সম্পন্ন' : 'Done'}</span>
            </div>
            <div>
              <span className="font-extrabold text-[#8B98F8]">
                {isBn ? toBanglaDigits(pendingDayCount) : pendingDayCount}
              </span>{' '}
              <span className="text-slate-400">{isBn ? 'বাকি' : 'Left'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 mt-5 space-y-5">
        {/* Horizontal Day Selector OR Monthly Grid */}
        {calendarMode === 'week' ? (
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day) => {
              const key = formatDateKey(day);
              const isSelected = key === selectedDateKey;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedDate(day)}
                  className={`rounded-2xl py-2.5 px-1 flex flex-col items-center gap-1 border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#8B98F8] border-[#8B98F8] text-white shadow-sm'
                      : 'bg-white border-slate-200/80 text-[#141517] hover:border-[#8B98F8]'
                  }`}
                >
                  <span
                    className={`text-[11px] font-medium ${
                      isSelected ? 'text-indigo-50' : 'text-slate-400'
                    }`}
                  >
                    {day.toLocaleDateString(isBn ? 'bn-BD' : undefined, { weekday: 'short' })}
                  </span>
                  <span className="text-sm font-extrabold tabular-nums">
                    {isBn ? toBanglaDigits(day.getDate()) : day.getDate()}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-[28px] p-5 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[#141517]">
                {selectedDate.toLocaleDateString(isBn ? 'bn-BD' : undefined, {
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedDate(
                      new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1)
                    )
                  }
                  className="px-3 py-1 rounded-full bg-slate-100 text-xs font-semibold cursor-pointer"
                >
                  {isBn ? 'আগে' : 'Prev'}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedDate(
                      new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1)
                    )
                  }
                  className="px-3 py-1 rounded-full bg-slate-100 text-xs font-semibold cursor-pointer"
                >
                  {isBn ? 'পরে' : 'Next'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-bold text-slate-400">
              {(isBn
                ? ['র', 'সো', 'ম', 'বু', 'বৃ', 'শু', 'শ']
                : ['S', 'M', 'T', 'W', 'T', 'F', 'S']
              ).map((d, i) => (
                <div key={i}>{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {monthGrid.map((cell, idx) => {
                if (!cell) return <div key={`empty-${idx}`} />;
                const key = formatDateKey(cell);
                const isSelected = key === selectedDateKey;
                const hasTasks = state.tasks.some((tk) => tk.date === key);
                const hasDone = state.tasks.some((tk) => tk.completedDates.includes(key));
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedDate(cell)}
                    className={`h-10 rounded-full text-xs font-bold tabular-nums flex items-center justify-center transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#141517] text-white'
                        : hasDone
                        ? 'bg-[#B4D353] text-[#141517]'
                        : hasTasks
                        ? 'bg-[#8B98F8]/25 text-indigo-950'
                        : 'bg-slate-100/70 text-slate-700 hover:bg-slate-200/70'
                    }`}
                  >
                    {isBn ? toBanglaDigits(cell.getDate()) : cell.getDate()}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-full border border-slate-200/80">
            {(['all', 'pending', 'completed'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                  statusFilter === st
                    ? 'bg-[#141517] text-white'
                    : 'text-slate-600 hover:text-[#141517]'
                }`}
              >
                {t[st]}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as 'all' | TaskCategory)}
              aria-label={isBn ? 'ক্যাটাগরি অনুযায়ী ফিল্টার' : 'Filter by category'}
              className="h-9 px-3 rounded-full bg-white border border-slate-200/80 text-xs font-semibold text-slate-700"
            >
              <option value="all">{isBn ? 'সব ক্যাটাগরি' : 'All Categories'}</option>
              <option value="worship">{isBn ? 'ইবাদত ও যিকির' : 'Worship & Dhikr'}</option>
              <option value="quran">{isBn ? 'কুরআন অধ্যয়ন' : 'Quran Study'}</option>
              <option value="charity">{isBn ? 'দান ও কল্যাণ' : 'Charity & Kindness'}</option>
              <option value="learning">{isBn ? 'ইসলামিক শিক্ষা' : 'Islamic Learning'}</option>
              <option value="personal">{isBn ? 'ব্যক্তিগত' : 'Personal'}</option>
            </select>

            {state.tasks.length > 0 && (
              confirmClearOpen ? (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      clearAllTasks();
                      setConfirmClearOpen(false);
                    }}
                    className="h-9 px-3 rounded-full bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 cursor-pointer"
                  >
                    {isBn ? 'হ্যাঁ, মুছুন' : 'Confirm'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClearOpen(false)}
                    className="h-9 px-2.5 rounded-full bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                  >
                    {isBn ? 'না' : 'Cancel'}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmClearOpen(true)}
                  className="h-9 px-3 rounded-full bg-white border border-slate-200/80 text-rose-600 hover:bg-rose-50 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  title={isBn ? 'সব কাজ মুছে ফেলুন' : 'Clear all tasks'}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isBn ? 'সব মুছুন' : 'Clear All'}</span>
                </button>
              )
            )}
          </div>
        </div>

        {/* Colored Task Cards */}
        <div className="space-y-3">
          {filteredTasks.length === 0 ? (
            <div className="rounded-[26px] bg-white border border-slate-200/80 p-8 text-center space-y-3">
              <div className="text-sm font-bold text-[#141517]">
                {isBn ? 'এই তালিকায় কোনো আমল বা কাজ নেই' : 'No tasks for this view'}
              </div>
              <p className="text-xs text-slate-500">
                {isBn
                  ? 'নতুন ইবাদত, কুরআন পাঠ বা দৈনিক কাজ যুক্ত করতে + বাটনে ট্যাপ করুন।'
                  : 'Tap the + button to schedule a worship habit, Quran goal, or daily task.'}
              </p>
              <button
                type="button"
                onClick={() => {
                  setEditingTask(null);
                  setTaskModalOpen(true);
                }}
                className="px-5 py-2.5 rounded-full bg-[#141517] text-white text-xs font-semibold cursor-pointer"
              >
                + {t.addTask}
              </button>
            </div>
          ) : (
            filteredTasks.map((task) => {
              const isDone = task.completedDates.includes(selectedDateKey);
              const themeCls = cardThemeClass[task.colorTheme] ?? cardThemeClass.periwinkle;
              const isLightCard = task.colorTheme === 'lime';

              return (
                <div
                  key={task.id}
                  className={`rounded-[26px] p-5 shadow-sm transition-all ${themeCls} ${
                    isDone ? 'opacity-75' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-[11px] font-semibold opacity-80">
                        <span className="tabular-nums">
                          {formatHHmmDisplay(task.time, isBn, state.preferences.timeFormat ?? '12h')}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{isBn ? categoryLabelsBn[task.category] : task.category}</span>
                        {task.repeat !== 'none' && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="inline-flex items-center gap-1">
                              <Repeat className="w-3 h-3" />
                              {isBn ? repeatLabelsBn[task.repeat] : task.repeat}
                            </span>
                          </>
                        )}
                      </div>

                      <h3
                        className={`text-base font-bold mt-1 ${
                          isDone ? 'line-through opacity-75' : ''
                        }`}
                      >
                        {task.title}
                      </h3>
                      {task.note && (
                        <p className="text-xs opacity-80 mt-1 leading-relaxed">{task.note}</p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleTaskCompletion(task.id, selectedDateKey)}
                      aria-label={
                        isDone
                          ? isBn
                            ? 'অসম্পন্ন হিসেবে চিহ্নিত করুন'
                            : 'Undo complete'
                          : isBn
                          ? 'সম্পন্ন হিসেবে চিহ্নিত করুন'
                          : 'Mark complete'
                      }
                      className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 cursor-pointer ${
                        isDone
                          ? 'bg-emerald-500 text-white'
                          : isLightCard
                          ? 'bg-[#141517] text-white'
                          : 'bg-white text-[#141517]'
                      }`}
                    >
                      {isDone ? (
                        <Check className="w-5 h-5 stroke-[2.5]" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  <div className="mt-4 pt-3 border-t border-current/15 flex items-center justify-between">
                    <span className="text-[11px] font-bold tracking-wide opacity-80">
                      {isBn ? priorityLabelsBn[task.priority] : `${task.priority} priority`}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTask(task);
                          setTaskModalOpen(true);
                        }}
                        aria-label={`${t.edit} ${task.title}`}
                        className="w-9 h-9 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteTask(task.id)}
                        aria-label={`${t.delete} ${task.title}`}
                        className="w-9 h-9 rounded-full bg-black/10 hover:bg-red-500 hover:text-white flex items-center justify-center cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Daily Reflection Note Card */}
        <div className="rounded-[26px] bg-white border border-slate-200/80 p-5 space-y-3 shadow-sm">
          <div className="text-xs font-bold text-slate-500">
            {isBn ? 'দৈনিক আত্মসমালোচনা ও নোট' : 'Daily Reflections & Notes'}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              placeholder={isBn ? 'আজকের দিন নিয়ে একটি নোট লিখুন...' : 'Add a note for this day...'}
              className="flex-1 h-10 px-4 rounded-full bg-slate-100 text-xs text-[#141517] focus:outline-none"
            />
            <button
              type="button"
              onClick={() => {
                if (!noteInput.trim()) return;
                addCalendarNote(selectedDateKey, noteInput);
                setNoteInput('');
              }}
              className="h-10 px-4 rounded-full bg-[#141517] text-white text-xs font-semibold cursor-pointer"
            >
              {t.save}
            </button>
          </div>
          {dayNotes.length > 0 && (
            <div className="space-y-2 pt-1">
              {dayNotes.map((n) => (
                <div
                  key={n.id}
                  className="flex items-center justify-between gap-2 px-3.5 py-2 rounded-2xl bg-[#F7F8FC] text-xs text-[#141517]"
                >
                  <span>{n.text}</span>
                  <button
                    type="button"
                    onClick={() => deleteCalendarNote(n.id)}
                    className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                    aria-label={t.delete}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <TaskFormModal
        open={taskModalOpen}
        initialDate={selectedDateKey}
        editingTask={editingTask}
        onClose={() => {
          setTaskModalOpen(false);
          setEditingTask(null);
        }}
      />
    </div>
  );
};
