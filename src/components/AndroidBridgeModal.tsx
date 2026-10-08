import React from 'react';
import { X, Smartphone, AlertTriangle, ShieldCheck, Terminal, Layers, Radio } from 'lucide-react';

interface AndroidBridgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCommand?: {
    type: string;
    details?: string;
    message: string;
  } | null;
}

export const AndroidBridgeModal: React.FC<AndroidBridgeModalProps> = ({
  isOpen,
  onClose,
  activeCommand,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-3xl bg-[#0d0d14] border border-neutral-800 shadow-2xl p-6 text-neutral-100 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-950/60 border border-purple-800/50 text-purple-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Android Bridge Architecture</h2>
              <p className="text-xs text-neutral-400">অ্যান্ড্রয়েড সিস্টেম সংযোগ ও এক্সেসিবিলিটি রূপরেখা</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* If triggered by a real-time command */}
        {activeCommand && (
          <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-800/40 text-amber-200 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
              <AlertTriangle className="w-4 h-4" />
              <span>Android Bridge Required</span>
            </div>
            <p className="text-sm font-medium">{activeCommand.message}</p>
            {activeCommand.details && (
              <div className="text-[11px] font-mono text-amber-300/80 bg-amber-900/30 px-2.5 py-1.5 rounded-lg">
                {activeCommand.details}
              </div>
            )}
          </div>
        )}

        {/* Real Environment Disclaimer */}
        <div className="p-4 rounded-2xl bg-neutral-900/70 border border-neutral-800 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-neutral-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>ব্রাউজার প্রিভিউ লিমিটেশন ও সততা পলিসি</span>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            ব্রাউজার নিরাপত্তা স্যান্ডবক্সের কারণে ওয়েব প্রিভিউ থেকে সরাসরি ডিভাইসের ব্যাকগ্রাউন্ড অ্যাপ নিয়ন্ত্রণ বা কল করা সম্ভব নয়। ArshiAI কোনো ভুয়া সাফল্য প্রদর্শন করে না। এটি নেটিভ অ্যান্ড্রয়েড ডিভাইসে ইনস্টল হলে ব্রিজ স্বয়ংক্রিয়ভাবে কার্যকর হবে।
          </p>
        </div>

        {/* Prepared Abstraction API */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-300">
            <Terminal className="w-4 h-4" />
            <span>প্রস্তুতকৃত অ্যান্ড্রয়েড ব্রিজ মেথডসমূহ:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-neutral-900/80 border border-neutral-800 text-neutral-300">
              <span className="text-pink-400 font-semibold">openYouTube() / openWhatsApp()</span>
              <p className="text-[10px] text-neutral-500 font-sans mt-0.5">Package Intent: com.google.android.youtube / com.whatsapp</p>
            </div>
            <div className="p-2.5 rounded-xl bg-neutral-900/80 border border-neutral-800 text-neutral-300">
              <span className="text-pink-400 font-semibold">openChrome() / openFacebook()</span>
              <p className="text-[10px] text-neutral-500 font-sans mt-0.5">Package Intent: com.android.chrome / com.facebook.katana</p>
            </div>
            <div className="p-2.5 rounded-xl bg-neutral-900/80 border border-neutral-800 text-neutral-300">
              <span className="text-pink-400 font-semibold">scrollDown()</span>
              <p className="text-[10px] text-neutral-500 font-sans mt-0.5">ArshiAccessibilityService.dispatchGesture (YouTube/All)</p>
            </div>
            <div className="p-2.5 rounded-xl bg-neutral-900/80 border border-neutral-800 text-neutral-300">
              <span className="text-pink-400 font-semibold">makePhoneCall() / sendSMS()</span>
              <p className="text-[10px] text-neutral-500 font-sans mt-0.5">TelecomManager ACTION_DIAL & SmsManager Intent</p>
            </div>
            <div className="p-2.5 rounded-xl bg-neutral-900/80 border border-neutral-800 text-neutral-300">
              <span className="text-pink-400 font-semibold">setVolumeUp() / setVolumeDown()</span>
              <p className="text-[10px] text-neutral-500 font-sans mt-0.5">AudioManager.adjustStreamVolume (STREAM_MUSIC)</p>
            </div>
            <div className="p-2.5 rounded-xl bg-neutral-900/80 border border-neutral-800 text-neutral-300">
              <span className="text-pink-400 font-semibold">toggleFlashlight()</span>
              <p className="text-[10px] text-neutral-500 font-sans mt-0.5">CameraManager.setTorchMode (Camera Flash)</p>
            </div>
          </div>
        </div>

        {/* Accessibility & Background Service Architecture */}
        <div className="space-y-2.5 pt-2 border-t border-neutral-800/80">
          <div className="flex items-center gap-2 text-xs font-semibold text-rose-300">
            <Layers className="w-4 h-4" />
            <span>Accessibility & Background Voice সার্ভিস ইন্টিগ্রেশন</span>
          </div>

          <div className="space-y-2 text-xs text-neutral-400">
            <div className="flex items-start gap-2">
              <Radio className="w-3.5 h-3.5 text-purple-400 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Android Accessibility Service:</strong> স্ক্রিন রিডিং, বাটন ক্লিপিং, টেক্সট টাইপিং ও স্বয়ংক্রিয় স্ক্রলিং অপারেশনের জন্য প্রস্তুত।
              </span>
            </div>
            <div className="flex items-start gap-2">
              <Radio className="w-3.5 h-3.5 text-pink-400 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Foreground Service:</strong> ব্যাকগ্রাউন্ডে অলওয়েজ-অন ভয়েস লিসেনিং, পারসিস্টেন্ট নোটিফিকেশন ও দ্রুত ওয়েক-আপ কিওয়ার্ড সাপোর্ট।
              </span>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium text-xs transition-colors"
          >
            বুঝেছি / CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
