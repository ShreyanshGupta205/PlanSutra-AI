import React from 'react';
import { Sparkles } from 'lucide-react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  isDark?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 'md', isDark = false }) => {
  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 24 : 20;
  const textSize = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-2xl' : 'text-xl';
  const textColor = isDark || className.includes('text-white') ? 'text-white' : 'text-navy-950';

  return (
    <div className={`flex items-center gap-2 font-bold tracking-tight select-none ${className}`}>
      <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-700 via-emerald-600 to-emerald-500 flex items-center justify-center text-ivory-50 shadow-sm border border-emerald-800/20">
        <Sparkles size={iconSize} className="text-marigold-400 animate-pulse" />
      </div>
      <div className="flex items-baseline">
        <span className={`font-serif font-bold ${textColor} ${textSize}`}>PlanSutra</span>
        <span className="ml-1 px-1.5 py-0.5 text-xs font-bold uppercase tracking-wider rounded bg-amber-200 text-amber-950 border border-amber-400">
          AI
        </span>
      </div>
    </div>
  );
};
