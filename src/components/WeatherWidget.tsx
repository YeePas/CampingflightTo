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
const todayStr = () => new Date().toISOString().slice(0, 10);

export default function WeatherWidget({ place }: { place: string }) {
  const [days, setDays] = useState<WeatherDay[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'notfound'>('idle');

  useEffect(() => {
    const trimmed = place.trim();
    if (!trimmed) { setDays([]); setStatus('idle'); return; }

    let cancelled = false;
    setStatus('loading');

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
          `&forecast_days=3&timezone=Europe%2FAmsterdam`
        );
        const wxData = await wxRes.json();
        if (!cancelled) {
          const { time, weathercode, temperature_2m_max, temperature_2m_min } = wxData.daily;
          setDays(time.map((date: string, i: number) => ({
            date,
            code: weathercode[i],
            tMax: Math.round(temperature_2m_max[i]),
            tMin: Math.round(temperature_2m_min[i]),
          })));
          setStatus('idle');
        }
      } catch {
        if (!cancelled) { setDays([]); setStatus('notfound'); }
      }
    }, 700);

    return () => { cancelled = true; clearTimeout(timer); };
  }, [place]);

  if (status === 'loading') return (
    <p className="text-xs text-stone-400 mt-1 animate-pulse">weersvoorspelling laden…</p>
  );
  if (status === 'notfound') return (
    <p className="text-xs text-red-400 mt-1">locatie niet gevonden</p>
  );
  if (!days.length) return null;

  const today = todayStr();
  return (
    <div className="flex gap-1.5 mt-2">
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
  );
}
