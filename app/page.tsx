'use client';
import { useState } from 'react';

export default function Home() {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState('hi-IN');
  const [error, setError] = useState('');
  const [cropTab, setCropTab] = useState<'instant' | 'plantix'>('instant');
  const [speaking, setSpeaking] = useState(false);

  const toStr = (val: any): string => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    if (Array.isArray(val)) return val.map((v: any) =>
      typeof v === 'string' ? v : JSON.stringify(v)
    ).join('\n');
    return JSON.stringify(val, null, 2);
  };
  const speak = (text: any, detectedLang?: string) => {
    const str = toStr(text);
    if (!str) return;

    setSpeaking(true);

    // Try ResponsiveVoice first
    if ((window as any).responsiveVoice) {
      let voiceName = 'Hindi Female';
      if (detectedLang === 'telugu' || lang === 'te-IN') voiceName = 'Telugu Female';
      else if (detectedLang === 'kannada' || lang === 'kn-IN') voiceName = 'Kannada Female';

      (window as any).responsiveVoice.speak(str, voiceName, {
        rate: 0.85,
        onend: () => setSpeaking(false),
        onerror: () => {
          // Fallback to browser TTS
          browserSpeak(str, detectedLang);
        },
      });
    } else {
      // Fallback to browser TTS
      browserSpeak(str, detectedLang);
    }
  };

  const browserSpeak = (str: string, detectedLang?: string) => {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(str);
    if (detectedLang === 'telugu' || lang === 'te-IN') utter.lang = 'te-IN';
    else if (detectedLang === 'kannada' || lang === 'kn-IN') utter.lang = 'kn-IN';
    else utter.lang = 'hi-IN';
    utter.rate = 0.85;
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utter);
  };

  const startListening = () => {
    setError('');
    setResult(null);
    setTranscript('');
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SR) { setError('Chrome browser use karein.'); return; }
    const r = new SR();
    r.lang = lang;
    r.interimResults = false;
    r.continuous = false;
    r.maxAlternatives = 1;
    r.onstart = () => setListening(true);
    r.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      setTranscript(text);
      analyzeText(text);
    };
    r.onerror = (e: any) => {
      setListening(false);
      if (e.error === 'no-speech') setError('Awaaz nahi aayi. Dobara bolein.');
      else if (e.error === 'not-allowed') setError('Microphone permission dijiye.');
      else setError('Kuch gadbad hui. Dobara try karein.');
    };
    r.onend = () => setListening(false);
    r.start();
  };

  const analyzeText = async (text: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, lang }),
      });
      const data = await res.json();
      setResult(data);
      speak(data.response, data.language_detected);
    } catch {
      setError('Server se connect nahi hua.');
    }
    setLoading(false);
  };

  const BADGE: any = {
    crop_issue:         { color: 'bg-green-500',  icon: '🌱', label: 'Fasal Samasya'   },
    financial_help:     { color: 'bg-yellow-500', icon: '💰', label: 'Paisa Madad'     },
    government_scheme:  { color: 'bg-blue-500',   icon: '📋', label: 'Sarkari Yojana'  },
    emotional_distress: { color: 'bg-red-500',    icon: '💙', label: 'Emotional Madad' },
  };

  const badge = result ? BADGE[result.intent] : null;

  return (
    <main className="min-h-screen bg-[#1A1A2E] flex flex-col items-center px-6 py-10">
      <h1 className="text-[#F5A623] text-4xl font-bold mt-4">🌾 KisanSaathi AI</h1>
      <p className="text-gray-400 text-sm mt-2 mb-6">Aapka Saathi, Har Mushkil Mein</p>

      {/* Language Toggle */}
      <div className="flex gap-3 mb-8">
        {[['te-IN','Telugu'],['hi-IN','Hindi'],['kn-IN','Kannada']].map(([code, name]) => (
          <button key={code} onClick={() => setLang(code)}
            className={`px-4 py-1 rounded-full text-sm font-bold transition-all
              ${lang === code ? 'bg-[#F5A623] text-black' : 'bg-[#16213E] text-gray-400'}`}>
            {name}
          </button>
        ))}
      </div>

      {/* Mic Button */}
      <button onClick={startListening} disabled={listening || loading}
        className={`w-36 h-36 rounded-full text-6xl shadow-xl transition-all duration-300
          ${listening ? 'bg-red-500 animate-pulse scale-110'
          : loading ? 'bg-gray-600 cursor-not-allowed'
          : 'bg-[#F5A623] hover:scale-105'}`}>
        {loading ? '⏳' : '🎤'}
      </button>
      <p className="text-gray-500 text-sm mt-3">
        {listening ? '🔴 Sun raha hoon...'
        : loading ? 'Soch raha hoon...'
        : 'Tap karke baat karein'}
      </p>

      {error && <p className="text-red-400 mt-3 text-sm text-center">{error}</p>}

      {transcript && (
        <p className="text-white mt-5 text-center max-w-sm bg-[#16213E] px-4 py-3 rounded-xl">
          "{transcript}"
        </p>
      )}

      {/* Intent Badge */}
      {badge && (
        <div className={`mt-5 px-6 py-2 rounded-full ${badge.color} text-white font-bold flex items-center gap-2`}>
          {badge.icon} {badge.label}
        </div>
      )}

      {/* Response Card */}
      {result && (
        <div className="mt-4 bg-[#16213E] rounded-2xl p-5 max-w-md w-full text-white text-sm leading-relaxed">
          <p>{toStr(result.response)}</p>
          <button onClick={() => speak(result.response, result.language_detected)}
            className="mt-3 text-xs text-[#F5A623] underline">
            {speaking ? '🔊 Bol raha hoon...' : '🔊 Dobara suno'}
          </button>
        </div>
      )}

      {/* ── CROP ISSUE ── */}
      {result?.intent === 'crop_issue' && (
        <div className="mt-4 max-w-md w-full">
          <div className="flex gap-2 mb-3">
            <button onClick={() => setCropTab('instant')}
              className={`flex-1 py-2 rounded-full text-sm font-bold transition-all
                ${cropTab === 'instant' ? 'bg-green-500 text-white' : 'bg-[#16213E] text-gray-400'}`}>
              ⚡ Turant Upay
            </button>
            <button onClick={() => setCropTab('plantix')}
              className={`flex-1 py-2 rounded-full text-sm font-bold transition-all
                ${cropTab === 'plantix' ? 'bg-green-500 text-white' : 'bg-[#16213E] text-gray-400'}`}>
              📱 Plantix App
            </button>
          </div>

          {cropTab === 'instant' && (
            <div className="bg-[#16213E] rounded-2xl p-4 text-sm text-white space-y-2">
              <p className="font-bold text-green-400 mb-2">⚡ Abhi Yeh 10 Kadam Uthayein:</p>
              {result.instant_solution && (
                <div className="whitespace-pre-line leading-relaxed">
                  {toStr(result.instant_solution)}
                </div>
              )}
              {result.pesticide && (
                <div className="mt-4 bg-[#1A1A2E] rounded-xl p-3">
                  <p className="font-bold text-yellow-400 mb-1">🧪 Dawai / Spray:</p>
                  <p className="leading-relaxed">{toStr(result.pesticide)}</p>
                </div>
              )}
              <button onClick={() => speak(
                toStr(result.instant_solution) + ' ' + toStr(result.pesticide),
                result.language_detected
              )} className="mt-2 text-xs text-[#F5A623] underline">
                🔊 Yeh Steps Sunein
              </button>
            </div>
          )}

          {cropTab === 'plantix' && (
            <div className="bg-[#16213E] rounded-2xl p-4 text-sm text-white space-y-2">
              <p className="font-bold text-green-400">📱 Plantix App Kaise Use Karein:</p>
              <p>1. Play Store mein <strong>Plantix</strong> search karein</p>
              <p>2. App install karein — bilkul free hai</p>
              <p>3. Account banayein — phone number se</p>
              <p>4. Apni fasal chunein — jaise wheat, rice, cotton</p>
              <p>5. Bimaar patte ya fasal ki photo khichein</p>
              <p>6. App turant batayega kya bimari hai</p>
              <p>7. App dawai ka naam aur dose bhi batayega</p>
              <p>8. Zaroorat ho toh expert se bhi baat kar sakte hain</p>
              <button onClick={() => speak(
                'Plantix app play store mein download karein. Fasal ki photo khichein. App bata dega kya dawai lagani hai.',
                result.language_detected
              )} className="text-xs text-[#F5A623] underline">🔊 Suno</button>
              <a href="https://plantix.net" target="_blank"
                className="mt-2 block text-center px-6 py-2 bg-green-500 text-white font-bold rounded-full">
                Plantix App Download →
              </a>
            </div>
          )}
        </div>
      )}

      {/* ── GOVERNMENT SCHEME ── */}
      {result?.intent === 'government_scheme' && (
        <div className="mt-4 bg-[#16213E] rounded-2xl p-5 max-w-md w-full">
          <p className="font-bold text-blue-400 mb-3">📋 Aapke Liye Yojanaen:</p>
          {result.schemes && (
            <div className="text-white text-sm leading-relaxed whitespace-pre-line">
              {toStr(result.schemes)}
            </div>
          )}
          <button onClick={() => speak(result.schemes, result.language_detected)}
            className="mt-3 text-xs text-[#F5A623] underline">
            🔊 Yojana Sunein
          </button>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <a href="https://pmkisan.gov.in" target="_blank"
              className="text-center px-3 py-2 bg-blue-500 text-white font-bold rounded-full text-xs">
              PM-KISAN →
            </a>
            <a href="https://pmfby.gov.in" target="_blank"
              className="text-center px-3 py-2 bg-blue-700 text-white font-bold rounded-full text-xs">
              PMFBY →
            </a>
            <a href="https://www.nabard.org" target="_blank"
              className="text-center px-3 py-2 bg-green-600 text-white font-bold rounded-full text-xs">
              NABARD →
            </a>
            <a href="https://kisansuvidha.gov.in" target="_blank"
              className="text-center px-3 py-2 bg-green-800 text-white font-bold rounded-full text-xs">
              Kisan Suvidha →
            </a>
          </div>
        </div>
      )}

      {/* ── FINANCIAL HELP ── */}
      {result?.intent === 'financial_help' && (
        <div className="mt-4 bg-[#16213E] rounded-2xl p-5 max-w-md w-full">
          <p className="font-bold text-yellow-400 mb-3">🏦 Bank Loan Ke 10 Kadam:</p>
          {result.bank_procedure && (
            <div className="text-white text-sm leading-relaxed whitespace-pre-line">
              {toStr(result.bank_procedure)}
            </div>
          )}
          <button onClick={() => speak(result.bank_procedure, result.language_detected)}
            className="mt-3 text-xs text-[#F5A623] underline">
            🔊 Steps Sunein
          </button>
          <div className="mt-4 bg-[#1A1A2E] rounded-xl p-3">
            <p className="font-bold text-white text-sm mb-2">📄 Ye Kagaz Laayein:</p>
            <div className="text-gray-300 text-xs space-y-1">
              <p>• Aadhaar Card (original + photocopy)</p>
              <p>• Zameen ke kagaz — Khasra / Khatauni</p>
              <p>• Bank Passbook (last 6 months)</p>
              <p>• Passport size photo x4</p>
              <p>• Ration Card ya BPL Card</p>
              <p>• PAN Card (agar ho)</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <a href="https://www.sbi.co.in/web/agri-rural/agriculture-banking/crop-loan/kisan-credit-card"
              target="_blank"
              className="text-center px-3 py-2 bg-yellow-500 text-black font-bold rounded-full text-xs">
              SBI KCC Loan →
            </a>
            <a href="https://www.nabard.org/content.aspx?id=572" target="_blank"
              className="text-center px-3 py-2 bg-yellow-700 text-white font-bold rounded-full text-xs">
              Tractor Loan →
            </a>
            <a href="https://pmkisan.gov.in" target="_blank"
              className="text-center px-3 py-2 bg-green-600 text-white font-bold rounded-full text-xs">
              PM-KISAN →
            </a>
            <a href="https://www.mudra.org.in" target="_blank"
              className="text-center px-3 py-2 bg-orange-500 text-white font-bold rounded-full text-xs">
              Mudra Loan →
            </a>
          </div>
        </div>
      )}

      {/* ── EMOTIONAL DISTRESS ── */}
      {result?.intent === 'emotional_distress' && (
        <div className="mt-4 bg-[#16213E] rounded-2xl p-5 max-w-md w-full border-2 border-red-500">
          <p className="font-bold text-red-400 mb-3">💙 Aap Akele Nahi Hain</p>
          {result.emotional_message && (
            <p className="text-white text-sm leading-relaxed mb-3">
              {toStr(result.emotional_message)}
            </p>
          )}
          <button onClick={() => speak(result.emotional_message || result.response, result.language_detected)}
            className="mb-4 text-xs text-[#F5A623] underline block">
            🔊 Sunein
          </button>
          <div className="space-y-3">
            <a href="tel:9152987821"
              className="block text-center px-6 py-3 bg-red-500 text-white font-bold rounded-full text-sm animate-pulse">
              📞 iCall: 9152987821 — Abhi Call Karein
            </a>
            <a href="tel:14416"
              className="block text-center px-6 py-3 bg-orange-500 text-white font-bold rounded-full text-sm">
              🌾 Kisan Helpline: 14416
            </a>
            <a href="tel:112"
              className="block text-center px-6 py-3 bg-red-700 text-white font-bold rounded-full text-sm">
              🚨 Emergency: 112
            </a>
          </div>
          <p className="text-gray-400 text-xs mt-3 text-center">
            iCall — free, confidential, trained counsellors, 24/7
          </p>
        </div>
      )}

      <a href="/dashboard" className="mt-10 text-xs text-gray-500 underline">
        View Live Dashboard →
      </a>
    </main>
  );
}