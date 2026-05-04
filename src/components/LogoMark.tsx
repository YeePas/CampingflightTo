// Inline SVG version of the app icon — original outdoor scene:
// two pine trees, sun disc, tipi tent, water waves on cream background.

const CREAM = '#f5e8c8';
const DARKGREEN = '#14532d';
const SUN = '#dc4127';
const WATER = '#2d6daf';

export default function LogoMark({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={className} aria-hidden="true">
      <rect width="512" height="512" rx="92" fill={CREAM} />

      {/* Sun disc */}
      <circle cx="256" cy="240" r="86" fill={SUN} />

      {/* Tipi */}
      <g fill={DARKGREEN}>
        <path d="M 244 168 L 268 218 L 264 220 L 240 170 Z" />
        <path d="M 268 168 L 244 218 L 248 220 L 272 170 Z" />
        <path d="M 256 188 L 214 350 L 298 350 Z" />
        <path d="M 252 350 L 245 322 Q 256 318 267 322 L 260 350 Z" fill={CREAM} />
      </g>

      {/* Left pine */}
      <g fill={DARKGREEN}>
        <polygon points="92,150 60,212 124,212" />
        <polygon points="92,196 50,278 134,278" />
        <polygon points="92,256 40,348 144,348" />
        <rect x="83" y="348" width="18" height="28" />
      </g>

      {/* Right pine */}
      <g fill={DARKGREEN}>
        <polygon points="420,150 388,212 452,212" />
        <polygon points="420,196 378,278 462,278" />
        <polygon points="420,256 368,348 472,348" />
        <rect x="411" y="348" width="18" height="28" />
      </g>

      {/* Waves */}
      <g fill="none" stroke={WATER} strokeWidth="9" strokeLinecap="round">
        <path d="M 50 400 Q 110 388 170 400 T 290 400 T 410 400 T 470 400" />
        <path d="M 60 432 Q 120 420 180 432 T 300 432 T 420 432 T 470 432" />
      </g>
    </svg>
  );
}
