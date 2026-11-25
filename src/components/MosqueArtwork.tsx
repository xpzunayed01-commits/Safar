import React from 'react';

export const MosqueSilhouette: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 360 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Left Minaret */}
    <rect x="28" y="36" width="8" height="84" fill="currentColor" fillOpacity="0.22" />
    <path d="M26 36 L32 22 L38 36 Z" fill="currentColor" fillOpacity="0.28" />
    <circle cx="32" cy="18" r="2.2" fill="currentColor" fillOpacity="0.35" />

    {/* Secondary Left Dome */}
    <path d="M52 120 V82 C52 66 76 58 76 58 C76 58 100 66 100 82 V120 H52 Z" fill="currentColor" fillOpacity="0.22" />

    {/* Center Grand Mosque Dome */}
    <path d="M126 120 V74 C126 42 180 26 180 26 C180 26 234 42 234 74 V120 H126 Z" fill="currentColor" fillOpacity="0.32" />
    {/* Crescent atop grand dome */}
    <path
      d="M180 10 C176 12 175 18 179 21 C182 23 186 21 187 18 C184 20 180 19 179 16 C178 13 179 11 180 10 Z"
      fill="currentColor"
      fillOpacity="0.55"
    />

    {/* Right Tall Minaret */}
    <rect x="256" y="28" width="10" height="92" fill="currentColor" fillOpacity="0.25" />
    <path d="M253 28 L261 12 L269 28 Z" fill="currentColor" fillOpacity="0.32" />

    {/* Far Right Dome */}
    <path d="M284 120 V84 C284 70 308 62 308 62 C308 62 332 70 332 84 V120 H284 Z" fill="currentColor" fillOpacity="0.2" />
  </svg>
);

export const RamadanDomeIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 120 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Minaret */}
    <rect x="20" y="34" width="14" height="58" rx="3" fill="#E5E7EB" />
    <rect x="17" y="46" width="20" height="5" rx="2" fill="#FFFFFF" />
    <path d="M20 34 L27 18 L34 34 Z" fill="#FFFFFF" />
    <circle cx="27" cy="14" r="3" fill="#FACC15" />

    {/* Mosque body */}
    <rect x="38" y="64" width="68" height="28" rx="4" fill="#FFFFFF" />
    {/* Green Dome */}
    <path d="M44 64 C44 40 72 28 72 28 C72 28 100 40 100 64 Z" fill="#22C55E" />
    <path d="M72 16 V28" stroke="#FACC15" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="72" cy="14" r="3" fill="#FACC15" />
    {/* Arch Door */}
    <path d="M64 92 V76 C64 71 72 68 72 68 C72 68 80 71 80 76 V92 Z" fill="#084B32" />
  </svg>
);

export const AVATAR_PRESETS: Array<{
  id: string;
  label: string;
  bg: string;
  accent: string;
}> = [
  { id: 'emerald-crescent', label: 'Emerald Crescent', bg: '#084B32', accent: '#A3F01C' },
  { id: 'amber-lantern', label: 'Golden Lantern', bg: '#D97706', accent: '#FEF3C7' },
  { id: 'periwinkle-star', label: 'Dawn Star', bg: '#4F46E5', accent: '#E0E7FF' },
  { id: 'charcoal-arch', label: 'Graphite Mihrab', bg: '#141517', accent: '#B4D353' },
];

export const UserAvatar: React.FC<{
  avatarId: string;
  customAvatarDataUrl?: string;
  name: string;
  sizeClass?: string;
}> = ({ avatarId, customAvatarDataUrl, name, sizeClass = 'w-12 h-12' }) => {
  if (customAvatarDataUrl) {
    return (
      <img
        src={customAvatarDataUrl}
        alt={name}
        className={`${sizeClass} rounded-full object-cover border-2 border-white shadow-sm shrink-0`}
      />
    );
  }
  const preset = AVATAR_PRESETS.find((p) => p.id === avatarId) ?? AVATAR_PRESETS[0];
  const initial = (name.trim()[0] || 'N').toUpperCase();

  return (
    <div
      style={{ backgroundColor: preset.bg, color: preset.accent }}
      className={`${sizeClass} rounded-full flex items-center justify-center font-bold text-lg border-2 border-white shadow-sm shrink-0 select-none`}
      aria-label={name}
    >
      {initial}
    </div>
  );
};
