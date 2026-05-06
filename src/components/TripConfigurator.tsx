'use client';

import { TripConfig, TripType } from '@/lib/types';
import { useState } from 'react';
import { TentIcon, CalendarIcon, MountainIcon, BootIcon, KidsIcon } from './Icons';
import WeatherWidget from './WeatherWidget';

interface Props {
  config: TripConfig;
  onChange: (config: TripConfig) => void;
  onReset: () => void;
  checkedCount: number;
  totalCount: number;
}

const TRIP_TYPES: { value: TripType; label: string; Icon: (p: { className?: string }) => React.ReactElement }[] = [
  { value: 'weekend',    label: '+1 nacht',   Icon: TentIcon },
  { value: 'week',       label: '+7 nachten', Icon: CalendarIcon },
  { value: 'wandeldag',  label: 'Wandeldag',  Icon: MountainIcon },
  { value: 'wandeltrip', label: 'Wandeltrip', Icon: BootIcon },
];

function daysUntil(dateStr: string): number {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T00:00:00');
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

function countdownLabel(days: number): { text: string; color: string } {
  if (days < 0)  return { text: `${Math.abs(days)} dagen geleden vertrokken`, color: 'text-stone-400' };
  if (days === 0) return { text: '🚗 Vandaag vertrekken!', color: 'text-green-600' };
  if (days === 1) return { text: '🎒 Morgen al!',           color: 'text-green-600' };
  if (days <= 7)  return { text: `nog ${days} dagen`,       color: 'text-amber-600' };
  return { text: `nog ${days} dagen`,                        color: 'text-stone-500' };
}

export default function TripConfigurator({ config, onChange, onReset, checkedCount, totalCount }: Props) {
  const isHikingMode = config.type === 'wandeldag' || config.type === 'wandeltrip';
  const activeIndex = TRIP_TYPES.findIndex(t => t.value === config.type);
  const [weatherOpen, setWeatherOpen] = useState(!!config.weatherPlace);
  const [dateOpen, setDateOpen] = useState(!!config.departureDate);
  const allPacked = totalCount > 0 && checkedCount === totalCount;

  const countdown = config.departureDate ? daysUntil(config.departureDate) : null;
  const countdownInfo = countdown !== null ? countdownLabel(countdown) : null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-stone-700 text-sm uppercase tracking-wide">Mijn trip</h2>
        {checkedCount > 0 && !allPacked && (
          <button onClick={onReset} className="text-xs text-red-500 hover:text-red-700 font-medium">
            ↺ Lijst resetten
          </button>
        )}
      </div>

      {/* Trip type — iOS segmented */}
      <div className="relative flex bg-stone-200/60 rounded-xl p-1">
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

      {/* Bergen / Kinderen */}
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
            <KidsIcon className="w-3.5 h-3.5" /> Kinderen
          </button>
        </div>
      )}

      {/* Departure date */}
      <div className="mt-3">
        {!dateOpen ? (
          <button
            onClick={() => setDateOpen(true)}
            className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-600 transition-colors"
          >
            <span>📅</span> Vertrekdatum toevoegen
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm">📅</span>
            <input
              type="date"
              value={config.departureDate ?? ''}
              onChange={e => onChange({ ...config, departureDate: e.target.value || undefined })}
              className="flex-1 border border-stone-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 text-stone-700"
            />
            {countdownInfo ? (
              <span className={`text-xs font-medium whitespace-nowrap ${countdownInfo.color}`}>
                {countdownInfo.text}
              </span>
            ) : null}
            <button
              onClick={() => { setDateOpen(false); onChange({ ...config, departureDate: undefined }); }}
              className="text-stone-300 hover:text-stone-500 text-lg leading-none px-1"
              aria-label="Datum verbergen"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* Weather */}
      <div className="mt-3">
        {!weatherOpen ? (
          <button
            onClick={() => setWeatherOpen(true)}
            className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-600 transition-colors"
          >
            <span>🌤️</span> Weersvoorspelling toevoegen
          </button>
        ) : (
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm">📍</span>
              <input
                type="text"
                placeholder="Locatie (bijv. Arles, Gap, Dordogne)"
                value={config.weatherPlace ?? ''}
                onChange={e => onChange({ ...config, weatherPlace: e.target.value || undefined })}
                className="flex-1 border border-stone-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
              <button
                onClick={() => { setWeatherOpen(false); onChange({ ...config, weatherPlace: undefined }); }}
                className="text-stone-300 hover:text-stone-500 text-lg leading-none px-1"
                aria-label="Weer verbergen"
              >
                ×
              </button>
            </div>
            {config.weatherPlace && <WeatherWidget place={config.weatherPlace} departureDate={config.departureDate} />}
          </div>
        )}
      </div>

      {/* Progress / all-packed celebration */}
      {totalCount > 0 && (
        <div className="mt-3">
          {allPacked ? (
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-center animate-bounce-once">
              <div className="text-2xl mb-0.5">🎉</div>
              <p className="text-sm font-semibold text-green-700">Alles ingepakt!</p>
              <p className="text-xs text-green-500 mt-0.5">Fijne trip!</p>
              <button
                onClick={onReset}
                className="mt-2 text-xs text-green-600 hover:text-green-800 underline"
              >
                Lijst resetten
              </button>
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>
      )}
    </div>
  );
}
