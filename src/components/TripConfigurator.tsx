'use client';

import { TripConfig, TripType } from '@/lib/types';

interface Props {
  config: TripConfig;
  onChange: (config: TripConfig) => void;
  onReset: () => void;
  checkedCount: number;
  totalCount: number;
}

const TRIP_TYPES: { value: TripType; label: string; emoji: string }[] = [
  { value: 'dag', label: 'Dagtrip', emoji: '☀️' },
  { value: 'weekend', label: 'Weekend', emoji: '⛺' },
  { value: 'week', label: 'Week+', emoji: '🗓️' },
];

export default function TripConfigurator({ config, onChange, onReset, checkedCount, totalCount }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-stone-700 text-sm uppercase tracking-wide">Mijn trip</h2>
        {checkedCount > 0 && (
          <button
            onClick={onReset}
            className="text-xs text-red-500 hover:text-red-700 font-medium"
          >
            ↺ Lijst resetten
          </button>
        )}
      </div>

      {/* Trip type */}
      <div className="flex gap-2 mb-3">
        {TRIP_TYPES.map(t => (
          <button
            key={t.value}
            onClick={() => onChange({ ...config, type: t.value })}
            className={`flex-1 py-2 px-1 rounded-xl text-sm font-medium transition-all ${
              config.type === t.value
                ? 'bg-green-600 text-white shadow-sm'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            <div>{t.emoji}</div>
            <div>{t.label}</div>
          </button>
        ))}
      </div>

      {/* Extra opties */}
      <div className="flex gap-2">
        <button
          onClick={() => onChange({ ...config, mountains: !config.mountains })}
          className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
            config.mountains
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          <span>⛰️</span> Bergen
        </button>
        <button
          onClick={() => onChange({ ...config, kids: !config.kids })}
          className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
            config.kids
              ? 'bg-orange-500 text-white shadow-sm'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          <span>👧</span> Kinderen
        </button>
      </div>

      {/* Progress */}
      {totalCount > 0 && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-stone-500 mb-1">
            <span>{checkedCount} van {totalCount} ingepakt</span>
            <span>{Math.round((checkedCount / totalCount) * 100)}%</span>
          </div>
          <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-300"
              style={{ width: `${(checkedCount / totalCount) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
