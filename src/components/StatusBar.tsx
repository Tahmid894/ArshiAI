import React, { useState, useEffect } from 'react';
import { Wifi, Battery, Sparkles, Radio } from 'lucide-react';
import { OrbState, AIProvider } from '../types/assistant';

interface StatusBarProps {
  orbState: OrbState;
  activeProvider: AIProvider;
}

export const StatusBar: React.FC<StatusBarProps> = ({ orbState, activeProvider }) => {
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  const getStatusDot = () => {
    switch (orbState) {
      case 'listening':
        return 'bg-pink-500 animate-ping';
      case 'thinking':
        return 'bg-indigo-400 animate-pulse';
      case 'speaking':
        return 'bg-rose-400 animate-pulse';
      case 'error':
        return 'bg-amber-500 animate-bounce';
      case 'idle':
      default:
        return 'bg-emerald-400';
    }
  };

  return (
    <div className="w-full flex items-center justify-between px-5 py-2 text-[11px] font-mono tracking-wider text-neutral-400 border-b border-neutral-900/60 select-none bg-[#07070b]/80 backdrop-blur-md z-40">
      {/* Left: Time & AI Assistant Active Badge */}
      <div className="flex items-center gap-2.5">
        <span className="font-semibold text-neutral-200">{timeStr || '12:00'}</span>
        <span className="text-neutral-600">|</span>
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot()}`} />
          <span className="uppercase text-[9px] font-medium tracking-widest text-neutral-300">
            ARSHI·OS
          </span>
        </div>
      </div>

      {/* Right: Provider & Android System Icons */}
      <div className="flex items-center gap-2.5">
        <div className="hidden sm:flex items-center gap-1 text-[10px] text-purple-300/80 uppercase font-sans font-medium px-2 py-0.5 rounded bg-purple-950/40 border border-purple-800/30">
          <Sparkles className="w-2.5 h-2.5 text-purple-400" />
          <span>{activeProvider}</span>
        </div>
        <div className="flex items-center gap-2 text-neutral-400">
          <Radio className="w-3 h-3 text-neutral-400" />
          <Wifi className="w-3.5 h-3.5 text-neutral-300" />
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-neutral-300">100%</span>
            <Battery className="w-3.5 h-3.5 text-emerald-400" />
          </div>
        </div>
      </div>
    </div>
  );
};
