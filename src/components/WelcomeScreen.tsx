import React from 'react';
import { Sparkles, Settings, ArrowRight, Shield, Mic, Cpu } from 'lucide-react';
import { Orb } from './Orb';

interface WelcomeScreenProps {
  onGetStarted: () => void;
  onOpenSettings: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onGetStarted, onOpenSettings }) => {
  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between items-center px-6 py-8 bg-[#07070b] overflow-hidden text-neutral-100">
      {/* Ambient background glow orbs */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 rounded-full bg-purple-900/20 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 rounded-full bg-pink-900/20 blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-rose-950/15 blur-[120px] pointer-events-none" />

      {/* Top Header Badge */}
      <div className="w-full flex items-center justify-between max-w-md pt-2 z-10">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900/80 border border-neutral-800 text-[11px] font-mono text-purple-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>NEURAL KERNEL 2.5</span>
        </div>
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-full bg-neutral-900/80 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors border border-neutral-800"
          title="AI Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Center Interactive Hero Section */}
      <div className="flex flex-col items-center justify-center my-auto z-10 max-w-md w-full text-center">
        {/* Animated Orb in Idle mode */}
        <div className="mb-6">
          <Orb state="idle" size={200} />
        </div>

        {/* Brand Name & Typography */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-transparent border border-purple-500/20 text-xs font-semibold text-purple-300 tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            <span>ARSHI AI CORE</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-br from-white via-neutral-100 to-neutral-400 bg-clip-text text-transparent">
            ARSHI AI
          </h1>

          <p className="text-base sm:text-lg font-medium text-purple-200/90 tracking-wide">
            Your Private AI Voice Assistant
          </p>

          <p className="text-sm sm:text-base font-normal text-neutral-400 font-['Hind_Siliguri',sans-serif]">
            আপনার ব্যক্তিগত AI সহকারী
          </p>
        </div>

        {/* Feature Badges Grid */}
        <div className="grid grid-cols-3 gap-2.5 w-full mt-8 max-w-sm">
          <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-neutral-900/50 border border-neutral-800/60 backdrop-blur-sm">
            <Mic className="w-4 h-4 text-pink-400 mb-1" />
            <span className="text-[11px] font-medium text-neutral-300">বাংলা ও English</span>
            <span className="text-[9px] text-neutral-500">Real Voice</span>
          </div>
          <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-neutral-900/50 border border-neutral-800/60 backdrop-blur-sm">
            <Cpu className="w-4 h-4 text-purple-400 mb-1" />
            <span className="text-[11px] font-medium text-neutral-300">6 Providers</span>
            <span className="text-[9px] text-neutral-500">OpenAI, Claude+</span>
          </div>
          <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-neutral-900/50 border border-neutral-800/60 backdrop-blur-sm">
            <Shield className="w-4 h-4 text-rose-400 mb-1" />
            <span className="text-[11px] font-medium text-neutral-300">Android Bridge</span>
            <span className="text-[9px] text-neutral-500">Private & Secure</span>
          </div>
        </div>
      </div>

      {/* Bottom CTA Buttons */}
      <div className="w-full max-w-md flex flex-col sm:flex-row items-center gap-3 z-10 pt-4">
        <button
          onClick={onGetStarted}
          className="w-full flex-1 group flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:from-purple-500 hover:via-pink-500 hover:to-rose-500 text-white font-semibold text-sm shadow-lg shadow-purple-900/30 transition-all duration-200 active:scale-[0.98]"
        >
          <span>GET STARTED</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>

        <button
          onClick={onOpenSettings}
          className="w-full sm:w-auto flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white font-medium text-sm transition-all duration-200 active:scale-[0.98]"
        >
          <Settings className="w-4 h-4 text-neutral-400" />
          <span>AI SETTINGS</span>
        </button>
      </div>
    </div>
  );
};
