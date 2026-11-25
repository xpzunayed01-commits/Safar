import React from 'react';
import { Clock, Droplets, Flame, Heart, Star } from 'lucide-react';
import type { BadgeDefinition } from '../data/badges';

const PALETTE_GRADIENTS: Record<BadgeDefinition['palette'], [string, string, string]> = {
  blue: ['#38BDF8', '#0284C7', '#0369A1'],
  crimson: ['#FB7185', '#E11D48', '#BE123C'],
  gold: ['#FDE047', '#EAB308', '#CA8A04'],
  magenta: ['#F472B6', '#DB2777', '#9D174D'],
  mint: ['#6EE7B7', '#10B981', '#047857'],
  cobalt: ['#818CF8', '#4F46E5', '#3730A3'],
  orange: ['#FDBA74', '#F97316', '#C2410C'],
  charcoal: ['#475569', '#1E293B', '#0F172A'],
  bronze: ['#FDBA74', '#D97706', '#92400E'],
  silver: ['#F1F5F9', '#94A3B8', '#475569'],
  emerald: ['#86EFAC', '#22C55E', '#15803D'],
};

const BN_BADGE_LABEL_MAP: Record<string, string> = {
  COMBO: 'কম্বো',
  AYAH: 'আয়াত',
  BRONZE: 'ব্রোঞ্জ',
  SILVER: 'সিলভার',
  GOLD: 'স্বর্ণ',
  VERIFIED: 'নিশ্চিত',
  SAVED: 'সংরক্ষিত',
  PLANNED: 'পরিকল্পিত',
  SECURED: 'সুরক্ষিত',
  TAWBAH: 'তাওবাহ',
};

function toBnBadgeText(text: string | undefined, isBn: boolean): string {
  if (!text) return '';
  if (!isBn) return text;
  if (BN_BADGE_LABEL_MAP[text]) return BN_BADGE_LABEL_MAP[text];
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return text.replace(/\d/g, (d) => bnDigits[Number(d)] ?? d);
}

interface Props {
  badge: BadgeDefinition;
  unlocked: boolean;
  size?: number;
  isBn?: boolean;
}

export const BadgeArtwork: React.FC<Props> = ({ badge, unlocked, size = 84, isBn = true }) => {
  const [c1, c2, c3] = PALETTE_GRADIENTS[badge.palette];
  const uid = `b-${badge.id}-${size}`;
  const filterClass = unlocked ? 'drop-shadow-md' : 'opacity-40 grayscale contrast-75';

  const labelTopText = toBnBadgeText(badge.labelTop, isBn);
  const labelMainText = toBnBadgeText(badge.labelMain, isBn);
  const labelSubText = toBnBadgeText(badge.labelSub, isBn);
  const ribbonTagText = toBnBadgeText(badge.ribbonTag, isBn);

  if (badge.visualType === 'combo-circle') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" className={filterClass} aria-hidden="true">
        <defs>
          <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={c1} />
            <stop offset="100%" stopColor={c2} />
          </linearGradient>
          <clipPath id={`${uid}-clip`}>
            <circle cx="50" cy="50" r="42" />
          </clipPath>
        </defs>
        <circle cx="50" cy="50" r="46" fill="#E0F2FE" stroke={c3} strokeWidth="2.5" />
        <g clipPath={`url(#${uid}-clip)`}>
          <rect x="8" y="8" width="84" height="60" fill={`url(#${uid})`} />
          <rect x="8" y="68" width="84" height="24" fill="#FACC15" />
          {/* Stars on yellow band */}
          <text x="50" y="83" textAnchor="middle" fill="#FFFBEB" fontSize="9" fontWeight="bold">
            ★ ★ ★ ★ ★
          </text>
        </g>
        <circle cx="50" cy="50" r="42" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeOpacity="0.65" />
        <text x="50" y="30" textAnchor="middle" fill="#FFFFFF" fontSize="9.5" fontWeight="800" letterSpacing="0.4">
          {labelTopText}
        </text>
        <text x="50" y="57" textAnchor="middle" fill="#FFFFFF" fontSize="27" fontWeight="900">
          {labelMainText}
        </text>
      </svg>
    );
  }

  if (badge.visualType === 'hexagon') {
    const renderIcon = () => {
      if (badge.labelMain === 'flame') return <Flame className="w-7 h-7 text-white fill-white" />;
      if (badge.labelMain === 'charity') return <Heart className="w-7 h-7 text-white fill-white" />;
      if (badge.labelMain === 'star') return <Star className="w-7 h-7 text-white fill-white" />;
      if (badge.labelMain === 'droplet') return <Droplets className="w-7 h-7 text-white fill-white" />;
      return <Clock className="w-7 h-7 text-white" />;
    };

    return (
      <div
        style={{ width: size, height: size }}
        className={`relative flex items-center justify-center ${filterClass}`}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full" aria-hidden="true">
          <defs>
            <linearGradient id={uid} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={c1} />
              <stop offset="100%" stopColor={c3} />
            </linearGradient>
          </defs>
          <polygon
            points="50,4 91,27 91,73 50,96 9,73 9,27"
            fill={`url(#${uid})`}
            stroke="#FFFFFF"
            strokeWidth="3"
          />
          <polygon
            points="50,11 85,30 85,70 50,89 15,70 15,30"
            fill="none"
            stroke="#FFFFFF"
            strokeOpacity="0.35"
            strokeWidth="2"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          {renderIcon()}
        </div>
        {badge.ribbonTag && (
          <span className="absolute -top-0.5 right-0.5 bg-[#FBBF24] text-[#141517] text-[10px] font-extrabold px-1.5 py-0.5 rounded-md shadow-sm border border-white">
            {ribbonTagText}
          </span>
        )}
      </div>
    );
  }

  if (badge.visualType === 'starburst') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" className={filterClass} aria-hidden="true">
        <defs>
          <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={c1} />
            <stop offset="100%" stopColor={c2} />
          </linearGradient>
        </defs>
        <polygon
          points="50,5 61,15 75,11 79,25 93,29 89,43 97,55 86,65 88,79 74,83 68,95 54,90 42,96 34,84 20,84 19,70 7,62 14,49 8,35 20,28 24,14 38,16"
          fill={`url(#${uid})`}
          stroke="#FFF7ED"
          strokeWidth="2.5"
        />
        <text x="50" y="53" textAnchor="middle" fill="#FFFFFF" fontSize="24" fontWeight="900">
          {labelMainText}
        </text>
        <text x="50" y="67" textAnchor="middle" fill="#FFF7ED" fontSize="8.5" fontWeight="800" letterSpacing="0.4">
          {labelSubText}
        </text>
      </svg>
    );
  }

  if (badge.visualType === 'ribbon-medal') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 108" className={filterClass} aria-hidden="true">
        {/* Ribbons */}
        <polygon points="33,66 49,66 44,102 35,94 27,102" fill="#EF4444" />
        <polygon points="51,66 67,66 73,102 65,94 56,102" fill="#4F46E5" />
        <circle cx="50" cy="44" r="36" fill={c3} stroke="#CBD5E1" strokeWidth="3" />
        <circle cx="50" cy="44" r="29" fill={c2} stroke="#94A3B8" strokeWidth="1.5" strokeOpacity="0.4" />
        <text x="50" y="48" textAnchor="middle" fill="#FFFFFF" fontSize="22" fontWeight="900">
          {labelMainText}
        </text>
        <text x="50" y="61" textAnchor="middle" fill="#CBD5E1" fontSize="8" fontWeight="700" letterSpacing="0.5">
          {labelSubText}
        </text>
      </svg>
    );
  }

  if (badge.visualType === 'crown-shield') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 105" className={filterClass} aria-hidden="true">
        <defs>
          <linearGradient id={uid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={c1} />
            <stop offset="55%" stopColor={c2} />
            <stop offset="100%" stopColor={c3} />
          </linearGradient>
        </defs>
        <path
          d="M50 8 L88 22 V56 C88 76 68 90 50 96 C32 90 12 76 12 56 V22 Z"
          fill={`url(#${uid})`}
          stroke="#FFFFFF"
          strokeWidth="3"
        />
        {/* Crown icon */}
        <path
          d="M28 58 L24 36 L38 46 L50 30 L62 46 L76 36 L72 58 Z"
          fill="#FFFFFF"
          fillOpacity="0.95"
        />
        {/* Ribbon Banner */}
        <rect x="14" y="66" width="72" height="17" rx="4" fill="#2563EB" stroke="#FFFFFF" strokeWidth="1.5" />
        <text x="50" y="78" textAnchor="middle" fill="#FFFFFF" fontSize="9.5" fontWeight="800" letterSpacing="0.4">
          {labelMainText}
        </text>
      </svg>
    );
  }

  if (badge.visualType === 'purity-shield') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 106" className={filterClass} aria-hidden="true">
        <defs>
          <linearGradient id={uid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={c1} />
            <stop offset="55%" stopColor={c2} />
            <stop offset="100%" stopColor={c3} />
          </linearGradient>
        </defs>
        <path
          d="M50 6 L88 20 V54 C88 76 68 92 50 99 C32 92 12 76 12 54 V20 Z"
          fill={`url(#${uid})`}
          stroke="#FFFFFF"
          strokeWidth="3"
        />
        <path
          d="M50 13 L81 25 V54 C81 71 65 84 50 91 C35 84 19 71 19 54 V25 Z"
          fill="none"
          stroke="#FFFFFF"
          strokeOpacity="0.4"
          strokeWidth="1.8"
        />
        <circle cx="50" cy="23" r="4.5" fill="#FEF08A" />
        <text x="50" y="57" textAnchor="middle" fill="#FFFFFF" fontSize={labelMainText.length > 2 ? '18' : '25'} fontWeight="900">
          {labelMainText}
        </text>
        {labelSubText && (
          <text x="50" y="75" textAnchor="middle" fill="#F8FAFC" fontSize="10" fontWeight="800" letterSpacing="0.3">
            {labelSubText}
          </text>
        )}
      </svg>
    );
  }

  // approved-seal
  return (
    <svg width={size} height={size} viewBox="0 0 110 100" className={filterClass} aria-hidden="true">
      <defs>
        <linearGradient id={uid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={c1} />
          <stop offset="100%" stopColor={c2} />
        </linearGradient>
      </defs>
      <circle cx="55" cy="50" r="35" fill={`url(#${uid})`} stroke="#FFFFFF" strokeWidth="3" />
      <circle cx="55" cy="50" r="28" fill="none" stroke="#FFFFFF" strokeOpacity="0.45" strokeWidth="2" />
      <g transform="rotate(-12 55 50)">
        <rect x="10" y="39" width="90" height="22" rx="4" fill="#1D4ED8" stroke="#FFFFFF" strokeWidth="1.5" />
        <text x="55" y="54" textAnchor="middle" fill="#FFFFFF" fontSize="10.5" fontWeight="900" letterSpacing="0.4">
          {labelMainText}
        </text>
      </g>
    </svg>
  );
};
