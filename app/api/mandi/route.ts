import { NextRequest, NextResponse } from 'next/server';

const MOCK = [
  { commodity: 'Wheat / Gehun',    market: 'Hyderabad',  price: '2200', unit: 'Quintal' },
  { commodity: 'Rice / Chawal',    market: 'Hyderabad',  price: '3100', unit: 'Quintal' },
  { commodity: 'Cotton / Kapas',   market: 'Warangal',   price: '6800', unit: 'Quintal' },
  { commodity: 'Maize / Makka',    market: 'Nizamabad',  price: '1950', unit: 'Quintal' },
  { commodity: 'Soybean',          market: 'Hyderabad',  price: '4200', unit: 'Quintal' },
  { commodity: 'Onion / Pyaaz',    market: 'Kurnool',    price: '1200', unit: 'Quintal' },
  { commodity: 'Turmeric / Haldi', market: 'Nizamabad',  price: '8500', unit: 'Quintal' },
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const state = searchParams.get('state') || 'Telangana';
  const API_KEY = process.env.DATA_GOV_API_KEY;

  try {
    if (!API_KEY) throw new Error('No key');
    const res = await fetch(
      `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${API_KEY}&format=json&filters[state]=${encodeURIComponent(state)}&limit=8`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) throw new Error('failed');
    const data = await res.json();
    const prices = (data.records || []).map((r: any) => ({
      commodity: r.commodity, market: r.market,
      price: r.modal_price || r.min_price, unit: 'Quintal',
    }));
    return NextResponse.json({ prices, source: 'data.gov.in', state });
  } catch {
    return NextResponse.json({ prices: MOCK, source: 'mock', state });
  }
}