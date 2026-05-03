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
