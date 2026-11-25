import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Lock, X } from 'lucide-react';
import { BADGE_CATALOG, type BadgeDefinition } from '../data/badges';
import { useApp } from '../context/AppContext';
import { BadgeArtwork } from '../components/BadgeArtwork';
import { toBanglaDigits } from '../services/prayerService';

export const BadgesPage: React.FC = () => {
  const { state, t, metrics } = useApp();
  const navigate = useNavigate();
  const isBn = state.preferences.language === 'bn';
  const [selectedBadge, setSelectedBadge] = useState<BadgeDefinition | null>(null);

  const unlockedCount = Object.keys(state.earnedBadges).length;

  const sections: Array<{ title: string; types: BadgeDefinition['visualType'][] }> = [
    {
      title: isBn ? 'পবিত্রতা ও আত্মনিয়ন্ত্রণ' : 'Purity & Self-Control',
      types: ['purity-shield'],
    },
    {
      title: isBn ? 'কম্বো মাইলফলক' : 'Combo Milestones',
      types: ['combo-circle'],
    },
    {
      title: isBn ? 'ধারাবাহিকতা হেক্সাগন' : 'Consistency Hexagons',
      types: ['hexagon'],
    },
    {
      title: isBn ? 'সালাত ও কুরআন পদক' : 'Prayer & Quran Medals',
      types: ['starburst', 'ribbon-medal'],
    },
    {
      title: isBn ? 'অবিচলতা ঢাল' : 'Steadfastness Shields',
      types: ['crown-shield'],
    },
    {
      title: isBn ? 'অনুমোদিত সীলমোহর' : 'Verified Habits',
      types: ['approved-seal'],
    },
  ];

  return (
    <div className="min-h-screen bg-[#1B1D21] text-white px-4 sm:px-6 py-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer"
            aria-label={isBn ? 'ফিরে যান' : 'Go back'}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="text-center">
            <h1 className="text-lg font-extrabold tracking-tight">{t.badges}</h1>
            <p className="text-xs text-slate-400 tabular-nums">
              {isBn
                ? `${toBanglaDigits(BADGE_CATALOG.length)}টির মধ্যে ${toBanglaDigits(unlockedCount)}টি অর্জিত`
                : `${unlockedCount} of ${BADGE_CATALOG.length} earned`}
            </p>
          </div>
          <div className="w-10" />
        </div>

        {/* Badge Gallery matching Reference Image G */}
        <div className="space-y-7 pb-8">
          {sections.map((section) => {
            const items = BADGE_CATALOG.filter((b) => section.types.includes(b.visualType));
            return (
              <section key={section.title} className="space-y-3">
                <h2 className="text-xs font-bold tracking-wider text-slate-400 px-1">
                  {section.title}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                  {items.map((badge) => {
                    const earned = state.earnedBadges[badge.id];
                    const progressVal = badge.evaluateProgress(state, metrics);
                    const pct = Math.min(100, Math.round((progressVal / badge.targetValue) * 100));
                    return (
                      <button
                        key={badge.id}
                        type="button"
                        onClick={() => setSelectedBadge(badge)}
                        className={`rounded-3xl p-3.5 flex flex-col items-center text-center gap-2 border transition-all cursor-pointer ${
                          earned
                            ? 'bg-[#252830] border-white/15 hover:border-white/30 shadow-md'
                            : 'bg-[#202228] border-white/5 hover:border-white/15'
                        }`}
                      >
                        <BadgeArtwork badge={badge} unlocked={Boolean(earned)} size={74} isBn={isBn} />
                        <div className="w-full space-y-1">
                          <div className="text-[11px] font-bold text-white truncate">
                            {isBn ? badge.titleBn : badge.title}
                          </div>
                          {earned ? (
                            <div className="text-[10px] font-semibold text-[#A3F01C]">
                              {isBn ? 'অর্জিত ✓' : 'Earned'}
                            </div>
                          ) : (
                            <div className="w-full space-y-1">
                              <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                                <div
                                  className="h-full bg-sky-400 rounded-full"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <div className="text-[10px] text-slate-400 tabular-nums">
                                {isBn
                                  ? `${toBanglaDigits(Math.min(progressVal, badge.targetValue))}/${toBanglaDigits(badge.targetValue)}`
                                  : `${Math.min(progressVal, badge.targetValue)}/${badge.targetValue}`}
                              </div>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      {/* Badge Detail Modal */}
      {selectedBadge && (
        <div
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#252830] text-white border border-white/15 rounded-[30px] max-w-sm w-full p-6 space-y-5 relative shadow-2xl">
            <button
              type="button"
              onClick={() => setSelectedBadge(null)}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center absolute top-4 right-4 cursor-pointer"
              aria-label={isBn ? 'বন্ধ করুন' : 'Close badge details'}
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col items-center text-center pt-2 space-y-3">
              <BadgeArtwork
                badge={selectedBadge}
                unlocked={Boolean(state.earnedBadges[selectedBadge.id])}
                size={110}
                isBn={isBn}
              />
              <h3 className="text-xl font-extrabold">
                {isBn ? selectedBadge.titleBn : selectedBadge.title}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {isBn ? selectedBadge.descriptionBn : selectedBadge.description}
              </p>
            </div>

            {(() => {
              const earned = state.earnedBadges[selectedBadge.id];
              const progressVal = selectedBadge.evaluateProgress(state, metrics);
              const remaining = Math.max(0, selectedBadge.targetValue - progressVal);
              const pct = Math.min(
                100,
                Math.round((progressVal / selectedBadge.targetValue) * 100)
              );

              return (
                <div className="rounded-2xl bg-[#1B1D21] p-4 space-y-2.5 border border-white/10">
                  <div className="flex items-center justify-between text-xs gap-2">
                    <span className="text-slate-400">{isBn ? 'শর্ত' : 'Condition'}</span>
                    <span className="font-semibold text-white text-right">
                      {isBn ? selectedBadge.conditionLabelBn : selectedBadge.conditionLabel}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">{t.progress}</span>
                    <span className="font-bold tabular-nums text-[#A3F01C]">
                      {isBn
                        ? `${toBanglaDigits(Math.min(progressVal, selectedBadge.targetValue))} / ${toBanglaDigits(selectedBadge.targetValue)}`
                        : `${Math.min(progressVal, selectedBadge.targetValue)} / ${selectedBadge.targetValue}`}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-[#A3F01C] rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  {earned ? (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-[#A3F01C] pt-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {isBn ? 'অর্জনের তারিখ:' : 'Earned on'}{' '}
                        {new Date(earned.earnedAt).toLocaleDateString(isBn ? 'bn-BD' : undefined)}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 pt-1">
                      <Lock className="w-3.5 h-3.5" />
                      <span>
                        {isBn
                          ? `আনলক করতে আরও ${toBanglaDigits(remaining)}টি বাকি`
                          : `${remaining} more remaining to unlock`}
                      </span>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
