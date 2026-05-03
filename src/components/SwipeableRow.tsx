'use client';

import { useState, useRef, ReactNode, TouchEvent } from 'react';

interface Props {
  onDelete: () => void;
  children: ReactNode;
  className?: string;
  /** distance to swipe before delete is "armed" */
  threshold?: number;
}

const REVEAL = 80; // px width of delete reveal area
const COMMIT = 140; // swipe past this and lift = delete instantly

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
      // Swiped far enough to delete instantly
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

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Delete button revealed behind */}
      <button
        onClick={onDelete}
        aria-label="Verwijder"
        className="absolute inset-y-0 right-0 flex items-center justify-center bg-red-500 text-white font-medium text-sm"
        style={{ width: REVEAL }}
      >
        🗑️
      </button>

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
