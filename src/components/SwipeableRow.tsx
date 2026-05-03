'use client';

import { useState, useRef, ReactNode, TouchEvent } from 'react';

interface Props {
  onDelete: () => void;
  children: ReactNode;
  className?: string;
  threshold?: number;
}

const REVEAL = 76;
const COMMIT = 140;

export default function SwipeableRow({ onDelete, children, className = '', threshold = 40 }: Props) {
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
    <div className={`relative overflow-hidden ${className}`}>
      {/* Delete action area — plain background, centered circle button */}
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

      {/* Foreground content */}
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
      </div>
    </div>
  );
}

function TrashIcon() {
  return (
    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}
