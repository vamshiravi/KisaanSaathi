import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = process.env.GROQ_API_KEY!;
const WEATHER_API_KEY = process.env.OPENWEATHER_API_KEY!;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get('lat') || '17.3850';
  const lon = searchParams.get('lon') || '78.4867';
  const lang = searchParams.get('lang') || 'hi-IN';

  try {
    const weatherRes = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`
    );
    const w = await weatherRes.json();
    const temp = w.main?.temp;
    const humidity = w.main?.humidity;
    const description = w.weather?.[0]?.description;
    const city = w.name || 'Aapka Ilaka';
    const langLabel = lang === 'te-IN' ? 'Telugu' : lang === 'kn-IN' ? 'Kannada' : 'Hindi';

    const groqRes = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify({
        model: 'llama3-70b-8192',
        max_tokens: 150,
        messages: [{
          role: 'user',
          content: `Weather: Temp ${temp}°C, Humidity ${humidity}%, Condition: ${description}, Location: ${city}. Give a farmer 2-3 specific crop tips for this weather in ${langLabel}. Simple words. Under 50 words. Plain text only.`
        }],
        temperature: 0.4,
      }),
    });

    const groqData = await groqRes.json();
    const advice = groqData.choices?.[0]?.message?.content || '';
    return NextResponse.json({ city, temp, humidity, description, advice });
  } catch {
    return NextResponse.json({
      city: 'Aapka Ilaka', temp: '--', humidity: '--',
      description: 'unavailable',
      advice: 'Mausam jaankari abhi uplabdh nahi. Baad mein try karein.',
    });
  }
}