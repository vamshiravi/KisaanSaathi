'use client';
import { useState, useEffect } from 'react';

interface Scheme { name: string; benefit: string; how: string; }
interface Props {
  response: string;
  app_guidance?: string;
  instant_help?: string;
  schemes?: Scheme[];
  intent: string;
}

export default function ResponseCard({ response, app_guidance, instant_help, schemes, intent }: Props) {
  const [activeTab, setActiveTab] = useState<'instant' | 'app' | 'schemes'>('instant');
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    if (response) speakText(response);
    return () => { window.speechSynthesis?.cancel(); };
  }, [response]);

  const detectLang = (text: string) => {
    if (/[\u0C00-\u0C7F]/.test(text)) return 'te-IN';
    if (/[\u0C80-\u0CFF]/.test(text)) return 'kn-IN';
    return 'hi-IN';
  };

  const speakText = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = detectLang(text);
    u.rate = 0.82;
    u.pitch = 1.05;
    setSpeaking(true);
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
  };

  const stopSpeaking = () => { window.speechSynthesis?.cancel(); setSpeaking(false); };

  const getActiveText = () => {
    if (activeTab === 'instant') return instant_help || '';
    if (activeTab === 'app') return app_guidance || '';
    return schemes?.map(s => `${s.name}: ${s.benefit}. ${s.how}`).join('. ') || '';
  };

  const isEmotional = intent === 'emotional_distress';

  return (
    <div className={`mt-6 w-full max-w-sm rounded-2xl p-4 border
      ${isEmotional ? 'bg-red-950/30 border-red-500/30' : 'bg-[#16213E] border-[#F5A623]/20'}`}>

      {/* Main response */}
      <div className='flex justify-between items-start mb-4'>
        <p className='text-white text-sm leading-relaxed flex-1 mr-2'>{response}</p>
        <button onClick={() => speaking ? stopSpeaking() : speakText(response)}
          className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-base transition-all
            ${speaking ? 'bg-red-500 animate-pulse' : 'bg-[#F5A623]/20 hover:bg-[#F5A623]/40'}`}>
          {speaking ? '⏹' : '🔊'}
        </button>
      </div>

      {/* Tabs */}
      <div className='flex gap-1 mb-3'>
        {[
          { key: 'instant', label: isEmotional ? '💙 Baat Karein' : '⚡ Abhi Karein', color: isEmotional ? 'bg-red-500 text-white' : 'bg-[#F5A623] text-black' },
          { key: 'app',     label: '📱 App Steps', color: 'bg-blue-500 text-white' },
          { key: 'schemes', label: '🏛 Yojanaayein', color: 'bg-green-600 text-white' },
        ].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key as any)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all
              ${activeTab === t.key ? t.color : 'bg-[#1A1A2E] text-gray-400 hover:text-white'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className='bg-[#1A1A2E] rounded-xl p-3 relative min-h-[80px]'>
        {activeTab === 'schemes' && schemes ? (
          <div className='space-y-3 pr-6'>
            {schemes.map((s, i) => (
              <div key={i} className='border-l-2 border-green-500 pl-3'>
                <p className='text-green-400 text-xs font-bold'>{s.name}</p>
                <p className='text-white text-xs mt-0.5'>{s.benefit}</p>
                <p className='text-gray-500 text-xs mt-0.5'>👉 {s.how}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className='text-gray-200 text-sm leading-relaxed whitespace-pre-line pr-8'>
            {activeTab === 'instant' ? instant_help : app_guidance}
          </p>
        )}
        <button onClick={() => speaking ? stopSpeaking() : speakText(getActiveText())}
          className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-sm transition-all
            ${speaking ? 'bg-red-500 animate-pulse' : 'bg-[#F5A623]/10 hover:bg-[#F5A623]/30'}`}>
          🔊
        </button>
      </div>

      {/* Emergency contacts */}
      {isEmotional && (
        <div className='mt-3 space-y-2'>
          <p className='text-red-400 text-xs font-bold text-center'>📞 Abhi Call Karein</p>
          {[
            { name: 'iCall Helpline', sub: 'Hindi, Telugu, Kannada • FREE', tel: '9152987821' },
            { name: 'Vandrevala Foundation', sub: '24 ghante • FREE', tel: '18602662345' },
            { name: 'Snehi', sub: 'All India • FREE', tel: '04424640050' },
          ].map((h, i) => (
            <a key={i} href={`tel:${h.tel}`}
              className='flex items-center justify-between bg-red-900/40 border border-red-500/40 rounded-xl px-3 py-2 hover:bg-red-900/60 transition-all'>
              <div>
                <p className='text-white text-xs font-bold'>{h.name}</p>
                <p className='text-gray-400 text-xs'>{h.sub}</p>
              </div>
              <span className='text-green-400 font-bold text-sm'>📞 Call</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}