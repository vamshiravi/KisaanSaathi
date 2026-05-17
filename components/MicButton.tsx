'use client';
import { useState } from 'react';

export default function MicButton({ lang, onResult }: { lang: string; onResult: (t: string) => void }) {
  const [listening, setListening] = useState(false);

  const startListening = () => {
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SR) { alert('Voice not supported. Use Chrome browser.'); return; }
    const r = new SR();
    r.lang = lang;
    r.interimResults = false;
    r.onresult = (e: any) => onResult(e.results[0][0].transcript);
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    setListening(true);
    r.start();
  };

  return (
    <button onClick={startListening}
      className={`w-32 h-32 rounded-full flex items-center justify-center text-5xl transition-all duration-300 shadow-lg
        ${listening ? 'bg-red-500 animate-pulse scale-110' : 'bg-[#F5A623] hover:scale-105'}`}>
      🎤
    </button>
  );
}