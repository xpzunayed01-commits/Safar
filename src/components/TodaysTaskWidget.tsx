import React from 'react';
import { Check, Plus } from 'lucide-react';
import type { TaskItem } from '../types/app';
import { formatDateKey, toBanglaDigits } from '../services/prayerService';

interface Props {
  tasks: TaskItem[];
  heading: string;
  progressLabel: string;
  emptyLabel?: string;
  isBn?: boolean;
  onQuickAdd: () => void;
  onToggleTask: (taskId: string) => void;
  onOpenPlanner: () => void;
}

export const TodaysTaskWidget: React.FC<Props> = ({
  tasks,
  heading,
  progressLabel,
  emptyLabel = 'আপনার প্রথম আমল যোগ করুন',
  isBn = true,
  onQuickAdd,
  onToggleTask,
  onOpenPlanner,
}) => {
  const todayKey = formatDateKey(new Date());

  const totalCount = tasks.length;
  const completedCount = tasks.filter((t) => t.completedDates.includes(todayKey)).length;
  const percentage = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
  const totalSegments = 36;
  const filledSegments = Math.round((percentage / 100) * totalSegments);

  const previewChips = tasks.slice(0, 3);

  return (
    <div
      className="relative rounded-[28px] overflow-hidden shadow-[0_12px_32px_rgba(245,158,11,0.22)] select-none"
      style={{
        background: 'linear-gradient(155deg, #FDE047 0%, #FBBF24 38%, #F59E0B 72%, #FB923C 100%)',
      }}
    >
      {/* Subtle geometric grid lines matching Reference Image A */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '46px 46px',
        }}
      />

      {/* Top stacked translucent task chips poking out */}
      <div className="relative pt-4 px-5 pb-2 flex flex-col items-center gap-1.5 min-h-[108px] justify-end">
        {previewChips.length === 0 ? (
          <button
            type="button"
            onClick={onQuickAdd}
            className="w-[84%] rounded-full bg-white/55 backdrop-blur-sm px-4 py-2 text-xs font-medium text-[#78350F] flex items-center justify-center gap-2 hover:bg-white/75 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{emptyLabel}</span>
          </button>
        ) : (
          previewChips.map((task, idx) => {
            const done = task.completedDates.includes(todayKey);
            const widthClasses = ['w-[80%]', 'w-[92%]', 'w-[74%]'];
            return (
              <button
                key={task.id}
                type="button"
                onClick={() => onToggleTask(task.id)}
                className={`${widthClasses[idx] ?? 'w-[86%]'} rounded-full bg-gradient-to-r from-white/75 to-white/55 backdrop-blur-md px-3.5 py-2 flex items-center gap-2.5 shadow-sm border border-white/50 text-left transition-transform active:scale-[0.98] cursor-pointer`}
              >
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                    done ? 'bg-[#141517] text-white' : 'bg-[#141517]/15 text-[#141517]'
                  }`}
                >
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </span>
                <span
                  className={`text-xs font-semibold truncate ${
                    done ? 'line-through text-[#141517]/55' : 'text-[#141517]'
                  }`}
                >
                  {task.title}
                </span>
              </button>
            );
          })
        )}
      </div>

      {/* Bottom frosted translucent panel */}
      <div className="relative mx-1.5 mb-1.5 rounded-[24px] bg-gradient-to-b from-white/55 to-white/75 backdrop-blur-xl p-5 border border-white/60 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]">
        <div className="flex items-center justify-between gap-3 mb-4">
          <button
            type="button"
            onClick={onOpenPlanner}
            className="text-left group cursor-pointer"
          >
            <h3 className="text-[22px] sm:text-[24px] font-bold tracking-tight text-[#141517] group-hover:opacity-80 transition-opacity">
              {heading}
            </h3>
          </button>

          <button
            type="button"
            onClick={onQuickAdd}
            aria-label={isBn ? 'দ্রুত আমল যোগ করুন' : 'Quick add task'}
            className="w-11 h-11 rounded-full bg-white/70 hover:bg-white text-[#141517] flex items-center justify-center shadow-sm border border-white/70 transition-transform active:scale-95 cursor-pointer shrink-0"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center justify-between text-xs font-semibold text-[#141517]/80 mb-2">
          <span>{progressLabel}</span>
          <span className="tabular-nums font-bold text-[#141517]">
            {isBn ? toBanglaDigits(percentage) : percentage}%
          </span>
        </div>

        {/* Segmented vertical bar progress indicator matching Reference Image A */}
        <div
          className="segmented-bar-track h-7 items-stretch"
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          {Array.from({ length: totalSegments }).map((_, i) => {
            const isFilled = i < filledSegments;
            return (
              <span
                key={i}
                className={`rounded-full transition-colors duration-200 ${
                  isFilled ? 'bg-white shadow-[0_1px_2px_rgba(0,0,0,0.06)]' : 'bg-[#78350F]/15'
                }`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
