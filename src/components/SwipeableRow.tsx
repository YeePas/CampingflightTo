'use client';

import { useState, useRef, ReactNode, TouchEvent } from 'react';

interface Props {
  onDelete: () => void;
  onEdit?: () => void;
  children: ReactNode;
  className?: string;
  threshold?: number;
}

const REVEAL = 76;
const COMMIT = 140;

export default function SwipeableRow({ onDelete, onEdit, children, className = '', threshold = 40 }: Props) {
  const [offset, setOffset] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const startXRef = useRef<number | null>(null);
  const startOffsetRef = useRef(0);

  const onTouchStart = (e: TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    startOffsetRef.current = offset;
  };

  const onTouchMove = (e: TouchEvent) => {
    if (startXRef.current === null) return;
    const dx = e.touches[0].clientX - startXRef.current;
    const next = Math.min(0, Math.max(-COMMIT - 20, startOffsetRef.current + dx));
    setOffset(next);
  };

  const onTouchEnd = () => {
    if (startXRef.current === null) return;
    startXRef.current = null;

    if (offset <= -COMMIT) {
      setOffset(-400);
      setTimeout(onDelete, 150);
      return;
    }
    if (offset <= -threshold) {
      setOffset(-REVEAL);
      setRevealed(true);
    } else {
      setOffset(0);
      setRevealed(false);
    }
  };

  const close = () => {
    setOffset(0);
    setRevealed(false);
  };

  const handleDelete = () => {
    setOffset(-400);
    setTimeout(onDelete, 180);
  };

  return (
    <div className={`relative overflow-hidden group/row ${className}`}>
      {/* Swipe-to-delete action (mobile) */}
      <div
        className="absolute inset-y-0 right-0 flex items-center justify-center"
        style={{ width: REVEAL }}
      >
        <button
          onClick={handleDelete}
          aria-label="Verwijder"
          className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center shadow-sm active:bg-red-600 transition-colors"
        >
          <TrashIcon />
        </button>
      </div>

      {/* Foreground content (slides on swipe) */}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={revealed ? close : undefined}
        style={{
          transform: `translateX(${offset}px)`,
          transition: startXRef.current === null ? 'transform 200ms ease' : 'none',
        }}
        className="relative bg-inherit"
      >
        {children}

        {/* Desktop hover actions — only visible with a real pointer (hover-capable device) */}
        <div className="absolute inset-y-0 right-0 items-center gap-1 pr-2 hidden [@media(hover:hover)]:flex opacity-0 group-hover/row:opacity-100 transition-opacity duration-150 pointer-events-none group-hover/row:pointer-events-auto">
          {onEdit && (
            <button
              onClick={e => { e.stopPropagation(); onEdit(); }}
              aria-label="Bewerken"
              className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center transition-colors shadow-sm"
            >
              <PencilIcon />
            </button>
          )}
          <button
            onClick={e => { e.stopPropagation(); handleDelete(); }}
            aria-label="Verwijder"
            className="w-8 h-8 rounded-full bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors shadow-sm"
          >
            <TrashIcon className="text-red-500" small />
          </button>
        </div>
      </div>
    </div>
  );
}

function TrashIcon({ className = 'text-white', small = false }: { className?: string; small?: boolean }) {
  const size = small ? 'w-4 h-4' : 'w-5 h-5';
  return (
    <svg className={`${size} ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg className="w-4 h-4 text-stone-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}
