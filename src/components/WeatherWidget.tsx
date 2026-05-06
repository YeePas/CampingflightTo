'use client';

import { useState, useEffect } from 'react';

interface WeatherDay {
  date: string;
  code: number;
  tMax: number;
  tMin: number;
}

function wIcon(code: number): string {
  if (code === 0) return '☀️';
  if (code <= 3) return '⛅';
  if (code <= 48) return '🌫️';
  if (code <= 67) return '🌧️';
  if (code <= 77) return '❄️';
  if (code <= 82) return '🌦️';
  if (code <= 86) return '🌨️';
  return '⛈️';
}

const NL_DAY = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'];
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Open-Meteo's free forecast endpoint supports up to 16 days ahead.
// We need 3 days starting from departure, so departure must be within 13 days.
const MAX_FORECAST_DAYS = 16;
const SHOW_DAYS = 3;
const MAX_OFFSET = MAX_FORECAST_DAYS - SHOW_DAYS; // 13

function daysBetween(from: string, to: string): number {
  // Both yyyy-MM-dd; compare via Date in local time
  const fromD = new Date(from + 'T12:00:00');
  const toD   = new Date(to   + 'T12:00:00');
  return Math.round((toD.getTime() - fromD.getTime()) / 86_400_000);
}

interface Props {
  place: string;
  /** Trip departure date (yyyy-MM-dd). Forecast starts from this day if within ~13 days; otherwise falls back to today. */
  departureDate?: string;
}

export default function WeatherWidget({ place, departureDate }: Props) {
  const [days, setDays] = useState<WeatherDay[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'notfound'>('idle');
  const [startDate, setStartDate] = useState<string>(todayStr());

  useEffect(() => {
    const trimmed = place.trim();
    if (!trimmed) { setDays([]); setStatus('idle'); return; }

    let cancelled = false;
    setStatus('loading');

    const today = todayStr();
    // Decide where the forecast should start:
    //  - departureDate provided AND within forecast window → start from departureDate
    //  - otherwise (no date set, or too far in the future, or already past) → start from today
    let from = today;
    if (departureDate) {
      const offset = daysBetween(today, departureDate);
      if (offset > 0 && offset <= MAX_OFFSET) from = departureDate;
    }
    setStartDate(from);
    const forecastDays = Math.min(MAX_FORECAST_DAYS, daysBetween(today, from) + SHOW_DAYS);

    const timer = setTimeout(async () => {
      try {
        const geoRes = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(trimmed)}&count=1&language=nl`
        );
        const geoData = await geoRes.json();
        if (!geoData.results?.length) {
          if (!cancelled) { setDays([]); setStatus('notfound'); }
          return;
        }
        const { latitude, longitude } = geoData.results[0];

        const wxRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
          `&daily=weathercode,temperature_2m_max,temperature_2m_min` +
          `&forecast_days=${forecastDays}&timezone=Europe%2FAmsterdam`
        );
        const wxData = await wxRes.json();
        if (!cancelled) {
          const { time, weathercode, temperature_2m_max, temperature_2m_min } = wxData.daily;
          setDays(
            (time as string[])
              .map((date: string, i: number) => ({
                date,
                code: weathercode[i],
                tMax: Math.round(temperature_2m_max[i]),
                tMin: Math.round(temperature_2m_min[i]),
              }))
              .filter(d => d.date >= from)
              .slice(0, SHOW_DAYS)
          );
          setStatus('idle');
        }
      } catch {
        if (!cancelled) { setDays([]); setStatus('notfound'); }
      }
    }, 700);

    return () => { cancelled = true; clearTimeout(timer); };
  }, [place, departureDate]);

  if (status === 'loading') return (
    <p className="text-xs text-stone-400 mt-1 animate-pulse">weersvoorspelling laden…</p>
  );
  if (status === 'notfound') return (
    <p className="text-xs text-red-400 mt-1">locatie niet gevonden</p>
  );
  if (!days.length) return null;

  const today = todayStr();
  const startsFromDeparture = startDate !== today;

  return (
    <div className="mt-2">
      {startsFromDeparture && (
        <p className="text-[10px] text-stone-400 mb-1">vanaf vertrekdatum</p>
      )}
      <div className="flex gap-1.5">
        {days.map(d => {
          const dayName = d.date === today ? 'vandaag' : NL_DAY[new Date(d.date + 'T12:00:00').getDay()];
          return (
            <div key={d.date} className="flex-1 bg-stone-50 rounded-xl py-2 px-1 text-center">
              <div className="text-[10px] text-stone-400 font-medium uppercase tracking-wide">{dayName}</div>
              <div className="text-lg my-0.5 leading-none">{wIcon(d.code)}</div>
              <div className="text-xs font-semibold text-stone-700">{d.tMax}°</div>
              <div className="text-[10px] text-stone-400">{d.tMin}°</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
