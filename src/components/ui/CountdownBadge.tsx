import { Clock } from 'lucide-react';
import { useCountdown } from '../../hooks/useCountdown';

interface CountdownBadgeProps {
  endDate: string;
}

export function CountdownBadge({ endDate }: CountdownBadgeProps) {
  const { timeLeft, isExpired } = useCountdown(endDate);

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${
        isExpired
          ? 'bg-gray-200 text-gray-700'
          : 'bg-gradient-to-r from-orange-500 to-red-500 text-white animate-pulse'
      }`}
    >
      <Clock size={14} />
      <span>{timeLeft}</span>
    </div>
  );
}
