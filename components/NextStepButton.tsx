const ROUTES: Record<string, { label: string; href: string }> = {
    crop_issue:        { label: 'Plantix App Dekhein', href: 'https://plantix.net' },
    government_scheme: { label: 'PM-KISAN Form Dekhein', href: 'https://pmkisan.gov.in' },
    financial_help:    { label: 'KCC Bank Jaankari', href: 'https://pmkisan.gov.in/kcc' },
    emotional_distress:{ label: '📞 iCall: 9152987821', href: 'tel:9152987821' },
  };
  
  export default function NextStepButton({ intent, nextStep }: { intent: string; nextStep: string }) {
    const r = ROUTES[intent] || { label: nextStep, href: '#' };
    return (
      <a href={r.href} target='_blank'
        className='mt-6 px-8 py-3 bg-[#F5A623] text-black font-bold rounded-full text-sm hover:scale-105 transition-all'>
        {r.label} →
      </a>
    );
  }