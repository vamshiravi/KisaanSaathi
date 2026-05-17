'use client';
import { useEffect, useState } from 'react';

interface MandiPrice { commodity: string; market: string; price: string; unit: string; }

const STATES = ['Telangana', 'Karnataka', 'Maharashtra', 'Punjab', 'Uttar Pradesh'];

export default function MandiCard() {
  const [prices, setPrices] = useState<MandiPrice[]>([]);
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState('Telangana');
  const [expanded, setExpanded] = useState(false);
  const [isMock, setIsMock] = useState(false);

  useEffect(() => {
    if (!expanded) return;
    setLoading(true);
    fetch(`/api/mandi?state=${encodeURIComponent(state)}`)
      .then(r => r.json())
      .then(d => { setPrices(d.prices || []); setIsMock(d.source === 'mock'); setLoading(false); })
      .catch(() => setLoading(false));
  }, [expanded, state]);

  return (
    <div className='w-full max-w-sm mt-3'>
      <button onClick={() => setExpanded(!expanded)}
        className='w-full bg-[#16213E] border border-green-500/20 rounded-2xl p-3 flex items-center justify-between hover:border-green-400/40 transition-all'>
        <div className='flex items-center gap-3'>
          <span className='text-2xl'>📈</span>
          <div className='text-left'>
            <p className='text-white text-sm font-semibold'>Mandi Bhav</p>
            <p className='text-gray-400 text-xs'>Aaj ke daam</p>
          </div>
        </div>
        <span className='text-gray-400 text-xs'>{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && (
        <div className='bg-[#16213E] border border-green-500/20 border-t-0 rounded-b-2xl px-3 pb-4'>
          <div className='flex gap-1 pt-3 pb-2 overflow-x-auto'>
            {STATES.map(s => (
              <button key={s} onClick={() => setState(s)}
                className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all
                  ${state === s ? 'bg-green-500 text-black' : 'bg-[#1A1A2E] text-gray-400'}`}>
                {s}
              </button>
            ))}
          </div>
          {loading
            ? <div className='space-y-2'>{[1,2,3].map(i => <div key={i} className='h-10 bg-[#1A1A2E] rounded-lg animate-pulse' />)}</div>
            : <div className='space-y-2'>
                {prices.slice(0, 7).map((p, i) => (
                  <div key={i} className='bg-[#1A1A2E] rounded-xl px-3 py-2 flex justify-between items-center'>
                    <div>
                      <p className='text-white text-sm font-medium'>{p.commodity}</p>
                      <p className='text-gray-500 text-xs'>{p.market}</p>
                    </div>
                    <div className='text-right'>
                      <p className='text-green-400 font-bold text-sm'>₹{p.price}</p>
                      <p className='text-gray-500 text-xs'>/{p.unit}</p>
                    </div>
                  </div>
                ))}
                {isMock && <p className='text-gray-600 text-xs text-center mt-1'>* Sample rates for demo</p>}
              </div>
          }
        </div>
      )}
    </div>
  );
}