import React from 'react';

interface LiveBadgeProps {
  count: number;
  label?: string;
  className?: string;
}

export const LiveBadge: React.FC<LiveBadgeProps> = ({ count, label = 'waiting', className = '' }) => {
  const isHigh = count > 10;
  const isMedium = count > 5;
  
  const dotColor = isHigh ? 'bg-orange-500' : isMedium ? 'bg-yellow-500' : 'bg-green-500';
  const dotPingColor = isHigh ? 'bg-orange-400' : isMedium ? 'bg-yellow-400' : 'bg-green-400';
  const textColor = isHigh ? 'text-orange-400' : isMedium ? 'text-yellow-400' : 'text-green-400';

  return (
    <div className={`flex items-center gap-1.5 font-bold ${className}`}>
      <span className="relative flex h-2 w-2">
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${dotPingColor} opacity-75`}></span>
        <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`}></span>
      </span>
      <span className={`text-[11px] uppercase tracking-wider ${textColor}`}>
        {count} {label}
      </span>
    </div>
  );
};
