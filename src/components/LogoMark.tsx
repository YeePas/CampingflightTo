// Inline SVG version of the app icon — Land Rover Defender silhouette with
// open roof-top tent on top. Same artwork as /icons/icon-512.png so the brand
// reads identically inline as on the home screen.

const BG = '#15803d';

export default function LogoMark({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={className} aria-hidden="true">
      <rect width="512" height="512" rx="92" fill={BG} />

      {/* Roof-top tent (peaked / open) */}
      <rect x="118" y="220" width="276" height="14" rx="3" fill="white" />
      <path d="M 256 110 L 118 220 L 256 220 Z" fill="white" />
      <path d="M 256 110 L 394 220 L 256 220 Z" fill="rgba(255,255,255,0.72)" />
      <path d="M 256 110 L 256 220" stroke={BG} strokeWidth="2" opacity="0.25" />

      {/* Defender body */}
      <g fill="white">
        <path d="M 95 250 L 110 250 L 122 290 L 388 290 L 400 250 L 395 250 L 395 305 L 95 305 Z" />
        <rect x="78" y="305" width="356" height="58" rx="3" />
        <rect x="74" y="338" width="14" height="22" rx="2" />
        <rect x="424" y="338" width="14" height="22" rx="2" />
      </g>

      {/* Windows (cutouts) */}
      <g fill={BG}>
        <path d="M 122 258 L 134 258 L 142 285 L 122 285 Z" />
        <rect x="148" y="258" width="56" height="27" rx="2" />
        <rect x="210" y="258" width="56" height="27" rx="2" />
        <rect x="272" y="258" width="56" height="27" rx="2" />
        <rect x="334" y="258" width="50" height="27" rx="2" />
      </g>

      {/* Squared wheel arches */}
      <g fill={BG}>
        <path d="M 130 363 L 130 320 L 220 320 L 220 363 Z" />
        <path d="M 290 363 L 290 320 L 380 320 L 380 363 Z" />
      </g>

      {/* Wheels */}
      <g>
        <circle cx="170" cy="358" r="34" fill="white" />
        <circle cx="170" cy="358" r="20" fill={BG} />
        <circle cx="170" cy="358" r="6" fill="white" />
        <circle cx="335" cy="358" r="34" fill="white" />
        <circle cx="335" cy="358" r="20" fill={BG} />
        <circle cx="335" cy="358" r="6" fill="white" />
      </g>

      {/* Spare tire (rear) */}
      <g>
        <circle cx="430" cy="285" r="18" fill="white" />
        <circle cx="430" cy="285" r="10" fill={BG} />
      </g>
    </svg>
  );
}
