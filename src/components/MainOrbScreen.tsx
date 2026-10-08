import React from 'react';
import {
  Mic,
  MicOff,
  MessageSquare,
  Settings,
  History,
  Activity,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  AlertCircle,
  Smartphone,
} from 'lucide-react';
import { Orb } from './Orb';
import { OrbState, AIProvider } from '../types/assistant';

interface MainOrbScreenProps {
  orbState: OrbState;
  activeProvider: AIProvider;
  isListening: boolean;
  isSpeaking: boolean;
  interimTranscript: string;
  finalTranscript: string;
  assistantResponsePreview: string | null;
  errorMessage: string | null;
  bridgeNotice: { type: string; message: string; details?: string } | null;
  onToggleMic: () => void;
  onRetryMic: () => void;
  onStopSpeaking: () => void;
  onOpenChat: () => void;
  onOpenSettings: () => void;
  onOpenHistory: () => void;
  onOpenDiagnostics: () => void;
  onOpenAndroidBridge: () => void;
}

export const MainOrbScreen: React.FC<MainOrbScreenProps> = ({
  orbState,
  activeProvider,
  isListening,
  isSpeaking,
  interimTranscript,
  finalTranscript,
  assistantResponsePreview,
  errorMessage,
  bridgeNotice,
  onToggleMic,
  onRetryMic,
  onStopSpeaking,
  onOpenChat,
  onOpenSettings,
  onOpenHistory,
  onOpenDiagnostics,
  onOpenAndroidBridge,
}) => {
  const getStateTitle = () => {
    switch (orbState) {
      case 'listening':
        return 'ArshiAI শুনছে...';
      case 'thinking':
        return 'ArshiAI ভাবছে...';
      case 'speaking':
        return 'ArshiAI কথা বলছে...';
      case 'error':
        return 'সংযোগ বা ভয়েস সমস্যা';
      case 'idle':
      default:
        return 'ArshiAI Ready';
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-36px)] w-full flex flex-col justify-between items-center px-4 py-5 bg-[#07070b] overflow-hidden select-none">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 rounded-full bg-purple-900/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 rounded-full bg-pink-900/15 blur-[120px] pointer-events-none" />

      {/* Top Navigation & Brand Header */}
      <div className="w-full max-w-md flex items-center justify-between z-20">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-600 via-pink-600 to-rose-600 flex items-center justify-center font-black text-xs text-white shadow-lg shadow-purple-950/50 border border-purple-400/30">
            AR
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-extrabold tracking-tight text-neutral-100">
                ArshiAI
              </h1>
              <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
            </div>
            <p className="text-[10px] text-neutral-500 font-mono uppercase">
              Neural Assistant • {activeProvider}
            </p>
          </div>
        </div>

        {/* Top Action Icons: History, Diagnostics, Settings */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenDiagnostics}
            className="p-2 rounded-2xl bg-neutral-900/80 hover:bg-neutral-800 text-neutral-400 hover:text-pink-400 transition-colors border border-neutral-800"
            title="Voice Diagnostics"
          >
            <Activity className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenHistory}
            className="p-2 rounded-2xl bg-neutral-900/80 hover:bg-neutral-800 text-neutral-400 hover:text-purple-400 transition-colors border border-neutral-800"
            title="Conversation History"
          >
            <History className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-2xl bg-neutral-900/80 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors border border-neutral-800"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Middle Center: Orb & Main Status */}
      <div className="flex flex-col items-center justify-center my-auto w-full max-w-md text-center z-10 space-y-4">
        {/* Animated AI Orb */}
        <div className="relative flex items-center justify-center py-2">
          <Orb state={orbState} size={250} onClick={onToggleMic} />

          {/* Quick Speak indicator / Stop button */}
          {isSpeaking && (
            <button
              onClick={onStopSpeaking}
              className="absolute -bottom-2 px-3 py-1 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-semibold flex items-center gap-1 shadow-lg shadow-rose-950/60 animate-in fade-in"
            >
              <VolumeX className="w-3.5 h-3.5" />
              <span>কথা থামান</span>
            </button>
          )}
        </div>

        {/* Status Text & Bengali Subtitle */}
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-['Plus_Jakarta_Sans',sans-serif]">
            {getStateTitle()}
          </h2>
          <p className="text-sm sm:text-base font-normal text-neutral-400 font-['Hind_Siliguri',sans-serif]">
            আপনার ব্যক্তিগত AI সহকারী
          </p>
        </div>

        {/* Live / Interim Voice Bubble */}
        {(interimTranscript || isListening) && (
          <div className="w-full max-w-sm px-4 py-3 rounded-2xl bg-purple-950/30 border border-purple-800/40 text-purple-200 text-xs sm:text-sm font-['Hind_Siliguri',sans-serif] shadow-lg animate-in fade-in">
            {interimTranscript ? (
              <span>"{interimTranscript}..."</span>
            ) : (
              <span className="text-neutral-400 italic">শুনছি... এখন কথা বলুন</span>
            )}
          </div>
        )}

        {/* Final recognized text preview */}
        {finalTranscript && !interimTranscript && (
          <div className="w-full max-w-sm px-3.5 py-2.5 rounded-2xl bg-neutral-900/60 border border-neutral-800 text-neutral-300 text-xs font-['Hind_Siliguri',sans-serif]">
            <span className="text-neutral-500 text-[10px] block mb-0.5">আপনি বলেছেন:</span>
            "{finalTranscript}"
          </div>
        )}

        {/* Assistant Response Card Preview */}
        {assistantResponsePreview && !isListening && (
          <div
            onClick={onOpenChat}
            className="w-full max-w-sm p-4 rounded-2xl bg-neutral-900/80 hover:bg-neutral-900 border border-neutral-800/90 text-neutral-200 text-xs sm:text-sm font-['Hind_Siliguri',sans-serif] text-left cursor-pointer transition-all hover:border-purple-500/50 space-y-2"
          >
            <div className="flex items-center justify-between text-[10px] font-mono text-purple-400">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> ArshiAI Response
              </span>
              <span className="text-neutral-500">চ্যাটে দেখুন →</span>
            </div>
            <p className="line-clamp-3 leading-relaxed">{assistantResponsePreview}</p>
          </div>
        )}

        {/* Android Bridge Action Notice Card */}
        {bridgeNotice && (
          <div
            onClick={onOpenAndroidBridge}
            className="w-full max-w-sm p-3.5 rounded-2xl bg-amber-950/30 border border-amber-800/40 text-amber-200 text-left text-xs cursor-pointer hover:bg-amber-950/45 transition-colors space-y-1.5"
          >
            <div className="flex items-center justify-between text-[11px] font-bold text-amber-400 uppercase">
              <span className="flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5" /> Android Bridge Required
              </span>
              <span className="text-[10px] font-mono">বিস্তারিত →</span>
            </div>
            <p className="text-amber-200/90 text-xs">{bridgeNotice.message}</p>
          </div>
        )}

        {/* Error message with Retry button */}
        {errorMessage && (
          <div className="w-full max-w-sm p-3 rounded-2xl bg-rose-950/40 border border-rose-800/40 text-rose-300 text-xs text-center space-y-2 animate-in fade-in">
            <div className="flex items-center justify-center gap-1.5 font-medium">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={onRetryMic}
              className="px-3.5 py-1.5 rounded-xl bg-rose-800/50 hover:bg-rose-700/60 text-white font-semibold text-xs inline-flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>পুনরায় চেষ্টা করুন (Retry)</span>
            </button>
          </div>
        )}
      </div>

      {/* Bottom Main Controls */}
      <div className="w-full max-w-md flex items-center justify-around py-4 z-20">
        {/* Text Chat Button */}
        <button
          onClick={onOpenChat}
          className="p-4 rounded-3xl bg-neutral-900/90 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 shadow-xl transition-all duration-200 active:scale-95"
          title="Text Chat"
        >
          <MessageSquare className="w-6 h-6" />
        </button>

        {/* Large Central Glowing Microphone Button */}
        <div className="relative">
          {/* Subtle Outer Ripple Ring when listening */}
          {isListening && (
            <div className="absolute inset-0 -m-3 rounded-full bg-pink-500/20 animate-ping pointer-events-none" />
          )}

          <button
            onClick={onToggleMic}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl active:scale-90 ${
              isListening
                ? 'bg-gradient-to-tr from-pink-600 to-rose-600 text-white ring-4 ring-pink-500/50 shadow-pink-900/60'
                : 'bg-gradient-to-tr from-purple-600 via-pink-600 to-rose-600 text-white hover:from-purple-500 hover:to-rose-500 shadow-purple-900/40'
            }`}
            title={isListening ? 'শোনা বন্ধ করুন' : 'ArshiAI-এর সাথে কথা বলুন'}
          >
            {isListening ? (
              <MicOff className="w-8 h-8 text-white animate-pulse" />
            ) : (
              <Mic className="w-8 h-8 text-white" />
            )}
          </button>
        </div>

        {/* Conversation History Button */}
        <button
          onClick={onOpenHistory}
          className="p-4 rounded-3xl bg-neutral-900/90 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 shadow-xl transition-all duration-200 active:scale-95"
          title="History"
        >
          <History className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
