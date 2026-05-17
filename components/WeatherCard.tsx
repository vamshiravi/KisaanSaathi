'use client';
import { useEffect, useState } from 'react';

interface WeatherData {
  city: string;
  temp: number | string;
  humidity: number | string;
  description: string;
  advice: string;
}

const ICONS: Record<string, string> = {
  'clear sky': '☀️', 'few clouds': '🌤️', 'scattered clouds': '⛅',
  'broken clouds': '☁️', 'shower rain': '🌧️', 'rain': '🌧️',
  'thunderstorm': '⛈️', 'snow': '❄️', 'mist': '🌫️', 'haze': '🌫️',
};

export default function WeatherCard({ lang }: { lang: string }) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setLoading(true);
    const load = (lat = '17.3850', lon = '78.4867') => {
      fetch(`/api/weather?lat=${lat}&lon=${lon}&lang=${lang}`)
        .then(r => r.json())
        .then(d => { setWeather(d); setLoading(false); })
        .catch(() => setLoading(false));
    };
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        p => load(String(p.coords.latitude), String(p.coords.longitude)),
        () => load()
      );
    } else { load(); }
  }, [lang]);

  if (loading) return <div className='w-full max-w-sm bg-[#16213E] rounded-2xl p-3 mt-4 animate-pulse h-12' />;
  if (!weather) return null;

  const icon = ICONS[weather.description?.toLowerCase()] || '🌡️';

  return (
    <div className='w-full max-w-sm mt-4'>
      <button onClick={() => setExpanded(!expanded)}
        className='w-full bg-[#16213E] border border-blue-500/20 rounded-2xl p-3 flex items-center justify-between hover:border-blue-400/40 transition-all'>
        <div className='flex items-center gap-3'>
          <span className='text-2xl'>{icon}</span>
          <div className='text-left'>
            <p className='text-white text-sm font-semibold'>{weather.city}</p>
            <p className='text-gray-400 text-xs'>{weather.temp}°C • {weather.humidity}% Nami</p>
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <span className='text-blue-400 text-xs font-bold'>Mausam</span>
          <span className='text-gray-400 text-xs'>{expanded ? '▲' : '▼'}</span>
        </div>
      </button>
      {expanded && (
        <div className='bg-[#16213E] border border-blue-500/20 border-t-0 rounded-b-2xl px-4 pb-4'>
          <div className='border-t border-[#1A1A2E] pt-3'>
            <p className='text-blue-300 text-xs font-bold mb-1'>🌱 Fasal Salah</p>
            <p className='text-gray-200 text-sm leading-relaxed'>{weather.advice}</p>
          </div>
        </div>
      )}
    </div>
  );
}