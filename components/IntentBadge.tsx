const BADGE: Record<string, { color: string; icon: string; label: string }> = {
    crop_issue:        { color: 'bg-green-500',  icon: '🌱', label: 'Fasal Samasya' },
    financial_help:    { color: 'bg-yellow-500', icon: '💰', label: 'Paisa Madad' },
    government_scheme: { color: 'bg-blue-500',   icon: '🏛', label: 'Sarkari Yojana' },
    emotional_distress:{ color: 'bg-red-500',    icon: '💙', label: 'Emotional Madad' },
  };
  
  export default function IntentBadge({ intent }: { intent: string }) {
    const b = BADGE[intent] || { color: 'bg-gray-500', icon: '❓', label: intent };
    return (
      <div className={`mt-6 px-6 py-2 rounded-full ${b.color} text-white font-bold text-sm flex items-center gap-2`}>
        {b.icon} {b.label}
      </div>
    );
  }