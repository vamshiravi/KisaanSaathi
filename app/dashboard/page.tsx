'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const COLORS = ['#27AE60', '#F5A623', '#2980B9', '#E74C3C', '#F39C12'];
const INTENTS = ['crop_issue', 'financial_help', 'government_scheme', 'emotional_distress', 'mandi_help'];

const LABELS: any = {
  crop_issue:         '🌱 Fasal',
  financial_help:     '💰 Paisa',
  government_scheme:  '📋 Yojana',
  emotional_distress: '💙 Madad',
  mandi_help:         '🏪 Mandi',
};

export default function Dashboard() {
  const [rows, setRows] = useState<any[]>([]);
  const [lastUpdated, setLastUpdated] = useState('');

  const fetchData = async () => {
    const { data, error } = await supabase
      .from('conversations')
      .select('id, message, intent, response, language, timestamp')
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Supabase Error:', error);
    } else {
      setRows(data || []);
      setLastUpdated(new Date().toLocaleTimeString());
    }
  };

  useEffect(() => {
    fetchData();

    const interval = setInterval(fetchData, 3000);

    const channel = supabase
      .channel('live-dashboard')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'conversations' },
        () => fetchData()
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  const pieData = INTENTS.map((intent) => ({
    name: LABELS[intent],
    value: rows.filter((r) => r.intent === intent).length,
  })).filter(d => d.value > 0);

  const timeAgo = (ts: string) => {
    const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
    return `${Math.floor(diff/3600)}h ago`;
  };

  return (
    <main className="min-h-screen bg-[#1A1A2E] p-8 text-white">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h1 className="text-[#F5A623] text-3xl font-bold">
            🌾 KisanSaathi — Live Dashboard
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Real conversations, logged live
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-[#F5A623]">{rows.length}</p>
          <p className="text-gray-400 text-xs">Total Conversations</p>
          {lastUpdated && (
            <p className="text-gray-600 text-xs mt-1">Updated: {lastUpdated}</p>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-5 gap-3 mb-8 mt-6">
        {INTENTS.map((intent, i) => (
          <div key={intent} className="bg-[#16213E] rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold" style={{ color: COLORS[i] }}>
              {rows.filter((r) => r.intent === intent).length}
            </p>
            <p className="text-gray-400 text-xs mt-1">{LABELS[intent]}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-6 flex-wrap">
        {/* Pie Chart */}
        <div className="bg-[#16213E] rounded-2xl p-6">
          <h2 className="text-white font-bold mb-4">Intent Breakdown</h2>
          {pieData.length > 0 ? (
            <PieChart width={280} height={240}>
              <Pie data={pieData} dataKey="value" nameKey="name"
                cx="50%" cy="50%" outerRadius={85}>
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          ) : (
            <div className="w-64 h-48 flex items-center justify-center text-gray-500 text-sm">
              Koi conversation nahi abhi
            </div>
          )}
        </div>

        {/* Live Feed */}
        <div className="bg-[#16213E] rounded-2xl p-6 flex-1 min-w-72">
          <h2 className="text-white font-bold mb-4">
            🔴 Live Feed — {rows.length} conversations
          </h2>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {rows.slice(0, 15).map((r) => (
              <div key={r.id}
                className="bg-[#1A1A2E] rounded-xl p-3 flex justify-between items-start gap-3">
                <div className="flex-1">
                  <p className="text-gray-300 text-xs leading-relaxed">
                    {r.message ? r.message.slice(0, 60) : 'No message'}
                    {r.message?.length > 60 ? '...' : ''}
                  </p>
                  <p className="text-gray-600 text-xs mt-1">
                    {r.language} • {r.timestamp ? timeAgo(r.timestamp) : ''}
                  </p>
                </div>
                <span className="text-xs font-bold whitespace-nowrap px-2 py-1 rounded-full"
                  style={{
                    backgroundColor: COLORS[INTENTS.indexOf(r.intent)] + '33',
                    color: COLORS[INTENTS.indexOf(r.intent)]
                  }}>
                  {LABELS[r.intent] || r.intent}
                </span>
              </div>
            ))}
            {rows.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">Koi baat nahi hui abhi</p>
                <p className="text-gray-600 text-xs mt-1">App mein baat karein — yahan dikhai dega</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Language breakdown */}
      <div className="mt-6 bg-[#16213E] rounded-2xl p-5">
        <h2 className="text-white font-bold mb-3">🗣️ Languages Used</h2>
        <div className="flex gap-6">
          {['hi-IN', 'te-IN', 'kn-IN'].map(l => (
            <div key={l} className="text-center">
              <p className="text-xl font-bold text-[#F5A623]">
                {rows.filter(r => r.language === l).length}
              </p>
              <p className="text-gray-400 text-xs">
                {l === 'hi-IN' ? 'Hindi' : l === 'te-IN' ? 'Telugu' : 'Kannada'}
              </p>
            </div>
          ))}
        </div>
      </div>

      <a href="/"
        className="mt-6 inline-block px-6 py-2 bg-[#F5A623]
        text-black font-bold rounded-full text-sm hover:scale-105 transition-all">
        ← Back to App
      </a>
    </main>
  );
}