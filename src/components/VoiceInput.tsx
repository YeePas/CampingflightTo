'use client';

import { useState, useRef } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type VoiceResult = Record<string, any>;

interface Props {
  mode: 'grocery' | 'item';
  onResult: (data: VoiceResult) => void;
  label?: string;
  className?: string;
}

export default function VoiceInput({ mode, onResult, label, className = '' }: Props) {
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const mrRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const toggle = async () => {
    if (loading) return;

    if (recording) {
      // Stop recording
      mrRef.current?.stop();
      setRecording(false);
      setLoading(true);
      return;
    }

    // Start recording
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Pick best supported mime type (webm on Chrome/Android, mp4 on Safari/iOS)
      const mimeType =
        ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus']
          .find(t => MediaRecorder.isTypeSupported(t)) ?? '';

      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || 'audio/webm' });
        await send(blob, mr.mimeType || 'audio/webm');
      };

      mr.start(200);
      mrRef.current = mr;
      setRecording(true);
    } catch {
      setError('Microfoon niet beschikbaar');
    }
  };

  const send = async (blob: Blob, mimeType: string) => {
    const ext = mimeType.includes('mp4') ? 'm4a' : mimeType.includes('ogg') ? 'ogg' : 'webm';
    const file = new File([blob], `rec.${ext}`, { type: blob.type || mimeType });
    const form = new FormData();
    form.append('audio', file);
    form.append('mode', mode);

    try {
      const res = await fetch('/api/voice', { method: 'POST', body: form });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Fout');
      }
      const data: VoiceResult = await res.json();
      onResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Fout bij verwerken');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {label && <span className="text-xs text-stone-500">{label}</span>}

      <button
        type="button"
        onClick={toggle}
        disabled={loading}
        className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
          recording
            ? 'bg-red-500 text-white shadow-md animate-pulse'
            : loading
            ? 'bg-stone-200 text-stone-400'
            : 'bg-stone-100 text-stone-500 hover:bg-green-100 hover:text-green-700'
        }`}
        title={recording ? 'Tik om te stoppen' : 'Tik om in te spreken'}
        aria-label="Spraakherkenning"
      >
        {loading ? (
          <span className="text-sm animate-spin inline-block">↻</span>
        ) : (
          <MicIcon />
        )}
      </button>

      {recording && (
        <span className="text-xs text-red-500 font-medium animate-pulse">● luistert…</span>
      )}
      {!recording && !loading && error && (
        <span className="text-xs text-red-500">{error}</span>
      )}
    </div>
  );
}

function MicIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zm-1 3a1 1 0 0 1 2 0v7a1 1 0 0 1-2 0V5z"/>
      <path d="M18.364 11.05A1 1 0 0 0 16.95 12.5 5 5 0 0 1 7.05 12.5a1 1 0 0 0-1.414-1.414A7 7 0 0 0 11 18.917V21H9a1 1 0 0 0 0 2h6a1 1 0 0 0 0-2h-2v-2.083a7 7 0 0 0 5.364-7.867z"/>
    </svg>
  );
}
