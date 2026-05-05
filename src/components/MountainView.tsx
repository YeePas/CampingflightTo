'use client';

import { useState } from 'react';

interface Coords { lat: number; lng: number; displayName: string; }

interface WeatherDay {
  date: string;
  code: number;
  tMax: number;
  tMin: number;
  windMax: number;
  uvMax: number;
  precip: number;
  snowfall: number;
  freezing: number;
}

interface Hut {
  id: string;
  name: string;
  altitude: number;
  url: string;
  manned: boolean; // refuge gardé / gîte d'étape
}

interface SunInfo {
  sunrise: string;
  sunset: string;
  dayLength: string;
  eveningGolden: string;
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

function uvLabel(uv: number): { text: string; color: string } {
  if (uv <= 2)  return { text: `UV ${uv} – laag`,      color: 'text-green-600' };
  if (uv <= 5)  return { text: `UV ${uv} – matig`,     color: 'text-yellow-600' };
  if (uv <= 7)  return { text: `UV ${uv} – hoog`,      color: 'text-orange-500' };
  if (uv <= 10) return { text: `UV ${uv} – zeer hoog`, color: 'text-red-500' };
  return               { text: `UV ${uv} – extreem`,   color: 'text-red-700' };
}

const NL_DAY = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'];
const todayStr = () => new Date().toISOString().slice(0, 10);

function localTime(isoUtc: string): string {
  return new Date(isoUtc).toLocaleTimeString('nl-NL', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Amsterdam',
  });
}

export default function MountainView() {
  const [input, setInput]     = useState('');
  const [coords, setCoords]   = useState<Coords | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [weather, setWeather] = useState<WeatherDay[]>([]);
  const [huts, setHuts]       = useState<Hut[]>([]);
  const [sun, setSun]         = useState<SunInfo | null>(null);

  const search = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setLoading(true);
    setNotFound(false);
    setWeather([]);
    setHuts([]);
    setSun(null);
    setCoords(null);

    try {
      // Geocode via Open-Meteo (same as WeatherWidget)
      const geoRes  = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(trimmed)}&count=1&language=nl`
      );
      const geoData = await geoRes.json();
      if (!geoData.results?.length) { setNotFound(true); setLoading(false); return; }

      const { latitude: lat, longitude: lng, name } = geoData.results[0];
      setCoords({ lat, lng, displayName: name });

      // Fire all three fetches in parallel
      await Promise.all([
        fetchWeather(lat, lng),
        fetchHuts(lat, lng),
        fetchSun(lat, lng),
      ]);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeather = async (lat: number, lng: number) => {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
      `&daily=weathercode,temperature_2m_max,temperature_2m_min,windspeed_10m_max,uv_index_max,precipitation_sum,snowfall_sum` +
      `&hourly=freezing_level_height` +
      `&forecast_days=5&timezone=Europe%2FAmsterdam`;
    const data = await (await fetch(url)).json();
    const d = data.daily;
    const freezingHourly: number[] = data.hourly.freezing_level_height;
    setWeather(d.time.map((date: string, i: number) => ({
      date,
      code:     d.weathercode[i],
      tMax:     Math.round(d.temperature_2m_max[i]),
      tMin:     Math.round(d.temperature_2m_min[i]),
      windMax:  Math.round(d.windspeed_10m_max[i]),
      uvMax:    Math.round(d.uv_index_max[i] ?? 0),
      precip:   Math.round((d.precipitation_sum[i] ?? 0) * 10) / 10,
      snowfall: Math.round((d.snowfall_sum[i] ?? 0) * 10) / 10,
      freezing: Math.round(freezingHourly[i * 24 + 12] ?? 0), // noon value
    })));
  };

  const fetchHuts = async (lat: number, lng: number) => {
    const d = 0.2; // ~22 km bounding box — focused on the searched area
    const bbox = `${lng - d},${lat - d},${lng + d},${lat + d}`;
    try {
      const res  = await fetch(
        `https://www.refuges.info/api/bbox?bbox=${bbox}&type_points=cabane,refuge,gite&format=geojson`
      );
      const data = await res.json();
      if (!data.features?.length) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const MANNED = ['refuge gardé', "gîte d'étape"];
      const result: Hut[] = (data.features as any[])
        .map(f => ({
          id:       String(f.properties?.id ?? Math.random()),
          name:     f.properties?.nom ?? 'Onbekend',
          altitude: f.properties?.coord?.alt ?? (f.geometry?.coordinates?.[2] ?? 0),
          url:      f.properties?.lien ?? '',   // API uses 'lien', not 'url'
          manned:   MANNED.includes(f.properties?.type?.valeur ?? ''),
        }))
        .filter((h: Hut) => h.name !== 'Onbekend')
        // Manned refuges first, then unmanned — within each group sort by altitude desc
        .sort((a: Hut, b: Hut) => {
          if (a.manned !== b.manned) return a.manned ? -1 : 1;
          return b.altitude - a.altitude;
        })
        .slice(0, 12);
      setHuts(result);
    } catch {
      // huts are optional — silently swallow
    }
  };

  const fetchSun = async (lat: number, lng: number) => {
    try {
      const res  = await fetch(
        `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lng}&date=today&formatted=0`
      );
      const data = await res.json();
      if (data.status !== 'OK') return;

      const sunriseMs  = new Date(data.results.sunrise).getTime();
      const sunsetMs   = new Date(data.results.sunset).getTime();
      const daySeconds = Math.round((sunsetMs - sunriseMs) / 1000);
      const h = Math.floor(daySeconds / 3600);
      const m = Math.floor((daySeconds % 3600) / 60);
      // Evening golden hour ≈ 1 hour before sunset
      const eveningGoldenMs = sunsetMs - 60 * 60 * 1000;

      setSun({
        sunrise:      localTime(data.results.sunrise),
        sunset:       localTime(data.results.sunset),
        dayLength:    `${h}u ${m}m`,
        eveningGolden: localTime(new Date(eveningGoldenMs).toISOString()),
      });
    } catch {
      // optional
    }
  };

  return (
    <div>
      {/* Search bar */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && search()}
          placeholder="Berggebied (bijv. Écrins, Dolomiten, Arles)"
          className="flex-1 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
        />
        <button
          onClick={search}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {loading ? '…' : '🔍'}
        </button>
      </div>

      {notFound && (
        <p className="text-sm text-red-400 mb-3">Locatie niet gevonden.</p>
      )}

      {coords && (
        <p className="text-xs text-stone-400 mb-3">
          📍 {coords.displayName} &nbsp;·&nbsp; {coords.lat.toFixed(3)}°N {coords.lng.toFixed(3)}°O
        </p>
      )}

      {/* Sunrise / sunset */}
      {sun && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 mb-3 grid grid-cols-4 gap-2 text-center">
          {[
            { icon: '🌅', label: 'Zonsopgang',   value: sun.sunrise },
            { icon: '🌄', label: 'Golden hour',  value: sun.eveningGolden },
            { icon: '🌇', label: 'Zonsondergang', value: sun.sunset },
            { icon: '⏱️', label: 'Daglengte',    value: sun.dayLength },
          ].map(({ icon, label, value }) => (
            <div key={label}>
              <div className="text-lg leading-none mb-0.5">{icon}</div>
              <div className="text-[10px] text-stone-400 leading-tight">{label}</div>
              <div className="text-xs font-semibold text-stone-700 mt-0.5">{value}</div>
            </div>
          ))}
        </div>
      )}

      {/* 5-day mountain weather */}
      {weather.length > 0 && (
        <div className="mb-4">
          <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wide mb-2">Bergweer — 5 dagen</p>
          <div className="space-y-2">
            {weather.map(d => {
              const isToday = d.date === todayStr();
              const dayName = isToday ? 'Vandaag' : NL_DAY[new Date(d.date + 'T12:00:00').getDay()];
              const uv = uvLabel(d.uvMax);
              return (
                <div key={d.date} className="bg-white border border-stone-100 rounded-xl px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-stone-500 w-14 shrink-0">{dayName}</span>
                    <span className="text-xl leading-none">{wIcon(d.code)}</span>
                    <span className="text-sm font-bold text-stone-700">{d.tMax}°</span>
                    <span className="text-xs text-stone-400">{d.tMin}°</span>
                    <div className="flex-1" />
                    <span className="text-xs text-blue-500">💨 {d.windMax} km/h</span>
                    <span className={`text-xs font-medium ${uv.color}`}>{uv.text}</span>
                  </div>
                  {(d.snowfall > 0 || d.precip > 0 || d.freezing > 0) && (
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 pl-16">
                      {d.snowfall > 0 && (
                        <span className="text-[11px] text-sky-500">❄️ {d.snowfall} cm sneeuw</span>
                      )}
                      {d.precip > 0 && d.snowfall === 0 && (
                        <span className="text-[11px] text-blue-400">🌧️ {d.precip} mm</span>
                      )}
                      {d.freezing > 0 && (
                        <span className="text-[11px] text-stone-400">
                          🌡️ Sneeuwgrens {d.freezing.toLocaleString('nl-NL')} m
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Nearby huts */}
      {huts.length > 0 && (
        <div className="mb-3">
          <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wide mb-2">
            Berghutten in de buurt
          </p>
          <div className="space-y-1.5">
            {huts.map(h => (
              <a
                key={h.id}
                href={h.url || `https://www.refuges.info`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-white border border-stone-100 rounded-xl px-3 py-2.5 hover:border-stone-300 transition-colors"
              >
                <span className="text-base">{h.manned ? '🏠' : '⛺'}</span>
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-stone-700 font-medium leading-tight block truncate">{h.name}</span>
                  {h.manned && (
                    <span className="text-[10px] text-green-600 font-medium">bewaakt</span>
                  )}
                </div>
                {h.altitude > 0 && (
                  <span className="text-xs text-stone-400 shrink-0">
                    {h.altitude.toLocaleString('nl-NL')} m
                  </span>
                )}
                <span className="text-stone-300 text-xs">›</span>
              </a>
            ))}
          </div>
          <p className="text-[10px] text-stone-300 mt-1.5 text-right">Bron: refuges.info</p>
        </div>
      )}

      {/* Empty state */}
      {!coords && !loading && (
        <div className="text-center py-12 text-stone-300">
          <div className="text-5xl mb-3">⛰️</div>
          <p className="text-sm">Zoek een berggebied</p>
          <p className="text-xs mt-1">Weer, sneeuwgrens, hutten en meer</p>
        </div>
      )}
    </div>
  );
}
