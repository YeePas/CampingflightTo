'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
  label: string;
  onUndo: () => void;
  onDismiss: () => void;
  duration?: number;
}

export default function UndoToast({ label, onUndo, onDismiss, duration = 4000 }: Props) {
  const [progress, setProgress] = useState(100);
  const startRef = useRef(Date.now());
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const tick = () => {
      const elapsed = Date.now() - startRef.current;
      const pct = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(pct);
      if (pct > 0) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        onDismiss();
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [duration, onDismiss]);

  const handleUndo = () => {
    cancelAnimationFrame(rafRef.current);
    onUndo();
  };

  return (
    <div
      className="fixed inset-x-4 z-50 flex justify-center pointer-events-none"
      style={{ bottom: `calc(5.5rem + env(safe-area-inset-bottom))` }}
    >
      <div className="w-full max-w-lg pointer-events-auto">
        <div className="bg-stone-800 text-white rounded-2xl shadow-xl overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3">
            <span className="flex-1 text-sm">{label}</span>
            <button
              onClick={handleUndo}
              className="text-green-400 font-semibold text-sm hover:text-green-300 transition-colors flex-shrink-0"
            >
              Ongedaan maken
            </button>
          </div>
          {/* Progress bar */}
          <div className="h-0.5 bg-stone-700">
            <div
              className="h-full bg-green-500 transition-none"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
