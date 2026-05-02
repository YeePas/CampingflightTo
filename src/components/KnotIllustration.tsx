'use client';

interface Props {
  type?: string;
  className?: string;
}

const STROKE = '#92400e';
const STROKE_LIGHT = '#d4a574';

export default function KnotIllustration({ type, className = '' }: Props) {
  if (!type) return null;

  const common = {
    width: 120,
    height: 90,
    viewBox: '0 0 120 90',
    className: `${className}`,
    fill: 'none',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  switch (type) {
    case 'bowline':
      // Vaste lus — staand deel met loop er doorheen
      return (
        <svg {...common}>
          <path d="M 20 80 L 20 35 Q 20 20 35 20 L 75 20" stroke={STROKE} strokeWidth="3" />
          <path d="M 75 20 Q 95 20 95 40 Q 95 55 80 55 L 35 55" stroke={STROKE} strokeWidth="3" />
          <path d="M 35 55 Q 20 55 20 45" stroke={STROKE_LIGHT} strokeWidth="3" />
          <circle cx="20" cy="35" r="3" fill={STROKE} opacity="0.4" />
        </svg>
      );

    case 'sheetbend':
      // Twee touwen verbonden — dik door dun
      return (
        <svg {...common}>
          <path d="M 10 35 Q 50 35 55 50 Q 60 65 50 70" stroke={STROKE} strokeWidth="4" />
          <path d="M 50 70 Q 35 75 30 60" stroke={STROKE} strokeWidth="4" />
          <path d="M 110 25 Q 75 25 65 40" stroke={STROKE_LIGHT} strokeWidth="2.5" />
          <path d="M 65 40 Q 60 50 70 55 Q 80 60 70 65" stroke={STROKE_LIGHT} strokeWidth="2.5" />
        </svg>
      );

    case 'prusik':
      // Glijdende klauwer — dunner touw 3x rond hoofdtouw
      return (
        <svg {...common}>
          <path d="M 15 10 L 15 80" stroke={STROKE} strokeWidth="4" />
          <path d="M 5 25 Q 25 22 25 35 Q 5 35 5 48 Q 25 45 25 58 Q 5 58 5 70" stroke={STROKE_LIGHT} strokeWidth="2.5" />
          <path d="M 25 65 Q 50 70 70 80" stroke={STROKE_LIGHT} strokeWidth="2.5" />
        </svg>
      );

    case 'farrimond':
      // Friction hitch met snelle release loop
      return (
        <svg {...common}>
          <path d="M 15 10 L 15 80" stroke={STROKE} strokeWidth="4" />
          <path d="M 25 20 Q 50 20 55 35" stroke={STROKE_LIGHT} strokeWidth="2.5" />
          <path d="M 55 35 Q 60 50 30 55" stroke={STROKE_LIGHT} strokeWidth="2.5" />
          <path d="M 30 55 Q 5 55 25 65" stroke={STROKE_LIGHT} strokeWidth="2.5" />
          <ellipse cx="80" cy="50" rx="20" ry="12" stroke={STROKE_LIGHT} strokeWidth="2.5" />
          <path d="M 25 65 L 60 50" stroke={STROKE_LIGHT} strokeWidth="2.5" />
        </svg>
      );

    case 'clove':
      // Mastworp — twee kruisende slagen om paal
      return (
        <svg {...common}>
          <rect x="50" y="5" width="14" height="80" rx="2" fill="#8b6f47" opacity="0.3" />
          <path d="M 10 30 Q 35 30 50 35" stroke={STROKE} strokeWidth="3" />
          <path d="M 64 35 Q 80 30 80 50 Q 65 55 50 50" stroke={STROKE} strokeWidth="3" />
          <path d="M 64 50 Q 75 55 75 65 Q 60 70 50 65" stroke={STROKE} strokeWidth="3" />
          <path d="M 64 65 L 110 65" stroke={STROKE} strokeWidth="3" />
        </svg>
      );

    default:
      // Generic rope coil
      return (
        <svg {...common}>
          <ellipse cx="60" cy="45" rx="40" ry="20" stroke={STROKE} strokeWidth="3" />
          <ellipse cx="60" cy="45" rx="25" ry="13" stroke={STROKE_LIGHT} strokeWidth="2.5" />
        </svg>
      );
  }
}
