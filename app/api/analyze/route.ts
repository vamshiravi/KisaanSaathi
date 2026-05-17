import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const SYSTEM_PROMPT = `You are KisanSaathi, a warm and trusted AI helper for Indian farmers.
Respond ONLY with a valid JSON object. No extra text. No backticks. Just pure JSON.

The JSON must have exactly these fields:
{
  "intent": "crop_issue or financial_help or government_scheme or emotional_distress or mandi_help",
  "language_detected": "hindi or telugu or kannada",
  "response": "main reply in same language as farmer, warm and simple, under 60 words",
  "instant_solution": "only for crop_issue: exactly 10 detailed steps numbered 1 to 10 in farmer language",
  "pesticide": "only for crop_issue: exact pesticide name, quantity, how and when to spray",
  "schemes": "only for government_scheme: 3 relevant schemes with name, benefit, eligibility, how to apply",
  "bank_procedure": "only for financial_help: 10 step by step bank procedure in simple words",
  "mandi_info": "only for mandi_help: how to sell crop, nearest mandi type, eNAM registration steps, MSP info, transport tips, 8 detailed points",
  "emotional_message": "only for emotional_distress: warm 3-4 sentences like caring friend, in farmer language",
  "next_step": "one short action in farmer language",
  "confidence": 0.9
}

RULES:
- crop_issue: farmer talks about pests, diseases, dry crop, yellow leaves, floods, seeds
- financial_help: farmer talks about loan, tractor, pump, borewell, EMI, debt, money
- government_scheme: farmer asks about yojana, subsidy, PM-KISAN, PMFBY, KCC, form
- mandi_help: farmer wants to SELL crop, find mandi price, transport to market, eNAM
- emotional_distress: farmer sounds sad, tired, hopeless, stressed, mentions giving up
- Always reply in the EXACT same language farmer used
- instant_solution must have exactly 10 numbered steps, never less
- bank_procedure must have exactly 10 numbered steps
- mandi_info must have 8 detailed points
- emotional_message must always include iCall: 9152987821
- Never use English words inside Hindi/Telugu/Kannada responses`;

export async function POST(req: NextRequest) {
  try {
    const { text, lang } = await req.json();

    if (!text?.trim()) {
      return NextResponse.json({
        intent: 'crop_issue',
        response: 'Kuch sunai nahi diya. Dobara bolein.',
        next_step: 'Dobara try karein',
        confidence: 0.0,
      });
    }

    const groqRes = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: `Farmer says (language: ${lang}): ${text}` },
          ],
          temperature: 0.3,
          max_tokens: 2000,
        }),
      }
    );

    const groqData = await groqRes.json();
    const raw = groqData?.choices?.[0]?.message?.content || '';

    if (!raw) throw new Error('Empty response from Groq');

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found');

    const result = JSON.parse(jsonMatch[0]);

    supabase.from('conversations').insert({
      message: text,
      language: lang,
      intent: result.intent,
      response: result.response,
      timestamp: new Date().toISOString(),
    }).then(() => {});

    return NextResponse.json(result);

  } catch (err) {
    console.error('Error:', err);
    return NextResponse.json({
      intent: 'crop_issue',
      response: 'Maafi karo, kuch gadbad ho gayi. Dobara bolein.',
      next_step: 'Dobara try karein',
      confidence: 0.0,
    });
  }
}