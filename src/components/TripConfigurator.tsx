'use client';

import { TripConfig, TripType } from '@/lib/types';
import { TentIcon, CalendarIcon, MountainIcon, BootIcon } from './Icons';

interface Props {
  config: TripConfig;
  onChange: (config: TripConfig) => void;
  onReset: () => void;
  checkedCount: number;
  totalCount: number;
}

const TRIP_TYPES: { value: TripType; label: string; Icon: (p: { className?: string }) => React.ReactElement }[] = [
  { value: 'weekend', label: '+1 nacht', Icon: TentIcon },
  { value: 'week', label: '+7 nachten', Icon: CalendarIcon },
  { value: 'wandeldag', label: 'Wandeldag', Icon: MountainIcon },
  { value: 'wandeltrip', label: 'Wandeltrip', Icon: BootIcon },
];

export default function TripConfigurator({ config, onChange, onReset, checkedCount, totalCount }: Props) {
  const isHikingMode = config.type === 'wandeldag' || config.type === 'wandeltrip';
  const activeIndex = TRIP_TYPES.findIndex(t => t.value === config.type);

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

      {/* Trip type — single-row iOS segmented control */}
      <div className="relative flex bg-stone-200/60 rounded-xl p-1">
        {/* Sliding indicator */}
        <div
          className="absolute top-1 bottom-1 bg-green-600 rounded-lg shadow-sm transition-all duration-200 ease-out"
          style={{
            left: `calc(${activeIndex * 25}% + 0.25rem)`,
            width: 'calc(25% - 0.5rem)',
          }}
        />
        {TRIP_TYPES.map(t => {
          const Icon = t.Icon;
          const isActive = config.type === t.value;
          return (
            <button
              key={t.value}
              onClick={() => {
                const isHike = t.value === 'wandeldag' || t.value === 'wandeltrip';
                onChange({ ...config, type: t.value, ...(isHike ? { mountains: false, kids: false } : {}) });
              }}
              className={`relative flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-lg transition-colors duration-200 ${
                isActive ? 'text-white' : 'text-stone-600'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[10px] font-semibold leading-none tracking-tight">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Bergen / Kinderen — chip toggles, hidden in hiking mode */}
      {!isHikingMode && (
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => onChange({ ...config, mountains: !config.mountains })}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5 ${
              config.mountains
                ? 'bg-blue-50 border-blue-300 text-blue-700'
                : 'bg-white border-stone-200 text-stone-500 hover:border-stone-300'
            }`}
          >
            <MountainIcon className="w-3.5 h-3.5" /> Bergen
          </button>
          <button
            onClick={() => onChange({ ...config, kids: !config.kids })}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5 ${
              config.kids
                ? 'bg-orange-50 border-orange-300 text-orange-700'
                : 'bg-white border-stone-200 text-stone-500 hover:border-stone-300'
            }`}
          >
            <span className="text-sm leading-none">👧</span> Kinderen
          </button>
        </div>
      )}

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
