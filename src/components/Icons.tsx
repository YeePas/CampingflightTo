export function PencilIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11.5 1.5l3 3L4 15l-3.5.5L1 12z" />
      <path d="M10.5 2.5l3 3" />
    </svg>
  );
}

export function TrashIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 4h12M5.5 4V2.5h5V4M3.5 4l1 10h7l1-10M6.5 7v4M9.5 7v4" />
    </svg>
  );
}

// Tab bar icons — clean iOS-style stroke icons, viewBox 24×24

const tabIconProps = {
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  viewBox: '0 0 24 24',
};

export function BackpackIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} {...tabIconProps}>
      <path d="M8 7V5a4 4 0 0 1 8 0v2" />
      <path d="M5 9.5C5 8.1 6.1 7 7.5 7h9C17.9 7 19 8.1 19 9.5V19a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V9.5z" />
      <path d="M9 13h6v5H9z" />
      <path d="M10 11h4" />
    </svg>
  );
}

export function LightbulbIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} {...tabIconProps}>
      <path d="M12 3a6 6 0 0 0-4 10.5c.9.9 1.5 1.6 1.5 2.9V17h5v-.6c0-1.3.6-2 1.5-2.9A6 6 0 0 0 12 3z" />
      <path d="M9.5 20h5" />
      <path d="M10.5 22h3" />
    </svg>
  );
}

export function MapIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} {...tabIconProps}>
      <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" />
      <path d="M9 4v14" />
      <path d="M15 6v14" />
    </svg>
  );
}

export function SlidersIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} {...tabIconProps}>
      <path d="M4 6h10" />
      <path d="M18 6h2" />
      <circle cx="16" cy="6" r="2" />
      <path d="M4 12h2" />
      <path d="M10 12h10" />
      <circle cx="8" cy="12" r="2" />
      <path d="M4 18h8" />
      <path d="M16 18h4" />
      <circle cx="14" cy="18" r="2" />
    </svg>
  );
}
