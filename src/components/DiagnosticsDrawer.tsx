import React from 'react';
import { X, Activity, Mic, CheckCircle2, XCircle, AlertCircle, Cpu, Radio } from 'lucide-react';
import { DiagnosticsState } from '../types/assistant';

interface DiagnosticsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  diagnostics: DiagnosticsState;
  onTestMicrophone: () => void;
}

export const DiagnosticsDrawer: React.FC<DiagnosticsDrawerProps> = ({
  isOpen,
  onClose,
  diagnostics,
  onTestMicrophone,
}) => {
  if (!isOpen) return null;

  const getMicStatusBadge = () => {
    switch (diagnostics.micPermission) {
      case 'granted':
        return (
          <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" /> Granted
          </span>
        );
      case 'denied':
        return (
          <span className="inline-flex items-center gap-1 text-rose-400 font-semibold">
            <XCircle className="w-3.5 h-3.5" /> Denied
          </span>
        );
      case 'unsupported':
        return (
          <span className="inline-flex items-center gap-1 text-amber-400 font-semibold">
            <AlertCircle className="w-3.5 h-3.5" /> Unsupported
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-neutral-400">
            Prompt / Pending
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-[#0c0c14] border border-neutral-800 shadow-2xl p-6 text-neutral-100 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-pink-950/50 border border-pink-800/40 text-pink-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Voice Diagnostics</h2>
              <p className="text-xs text-neutral-400">ভয়েস ইঞ্জিন ও মাইক্রোফোন স্টেটাস</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Diagnostics Metrics Grid */}
        <div className="space-y-3 font-mono text-xs">
          {/* Row 1: Microphone */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-900/70 border border-neutral-800/80">
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-neutral-400" />
              <span className="text-neutral-300 font-sans text-xs">Microphone:</span>
            </div>
            {getMicStatusBadge()}
          </div>

          {/* Row 2: Speech Recognition */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-900/70 border border-neutral-800/80">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-neutral-400" />
              <span className="text-neutral-300 font-sans text-xs">Speech Recognition:</span>
            </div>
            {diagnostics.speechRecognitionSupported ? (
              <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Available
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-rose-400 font-semibold">
                <XCircle className="w-3.5 h-3.5" /> Unavailable
              </span>
            )}
          </div>

          {/* Row 3: Listening */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-900/70 border border-neutral-800/80">
            <span className="text-neutral-300 font-sans text-xs">Listening:</span>
            <span
              className={`font-semibold ${
                diagnostics.isListening ? 'text-pink-400 animate-pulse' : 'text-neutral-400'
              }`}
            >
              {diagnostics.isListening ? 'Yes (শুনছে)' : 'No (নিষ্ক্রিয়)'}
            </span>
          </div>

          {/* Row 4: AI Provider */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-900/70 border border-neutral-800/80">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-400" />
              <span className="text-neutral-300 font-sans text-xs">AI Provider:</span>
            </div>
            <span className="uppercase font-semibold text-purple-300">
              {diagnostics.activeProvider}
            </span>
          </div>

          {/* Row 5: AI Status */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-900/70 border border-neutral-800/80">
            <span className="text-neutral-300 font-sans text-xs">AI Status:</span>
            <span
              className={`font-semibold capitalize ${
                diagnostics.aiStatus === 'ready'
                  ? 'text-emerald-400'
                  : diagnostics.aiStatus === 'listening'
                  ? 'text-pink-400'
                  : diagnostics.aiStatus === 'thinking'
                  ? 'text-indigo-400'
                  : diagnostics.aiStatus === 'speaking'
                  ? 'text-rose-400'
                  : 'text-amber-400'
              }`}
            >
              {diagnostics.aiStatus}
            </span>
          </div>

          {/* Row 6: Detected Text */}
          <div className="p-3 rounded-2xl bg-neutral-900/70 border border-neutral-800/80 space-y-1">
            <div className="text-[11px] text-neutral-400 font-sans">Detected Text:</div>
            <div className="p-2 rounded-xl bg-black/50 text-neutral-200 text-xs min-h-[38px] break-words">
              {diagnostics.interimTranscript || diagnostics.finalTranscript || (
                <span className="text-neutral-600 italic">এখনও কোনো কথা ধরা পড়েনি</span>
              )}
            </div>
          </div>

          {/* Last Raw Event / Error */}
          {diagnostics.lastError && (
            <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-800/40 text-[11px] text-rose-300">
              <strong>Last Error:</strong> {diagnostics.lastError}
            </div>
          )}
          <div className="text-[10px] text-neutral-500 text-right">
            Last Event: {diagnostics.lastEvent || 'none'}
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={onTestMicrophone}
            className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <Mic className="w-3.5 h-3.5" />
            <span>মাইক্রোফোন পারমিশন টেস্ট</span>
          </button>
          <button
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition-colors"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
