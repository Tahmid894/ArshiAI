import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Send,
  Mic,
  MicOff,
  Copy,
  Check,
  RotateCcw,
  Volume2,
  Trash2,
  Sparkles,
  Smartphone,
  AlertCircle,
} from 'lucide-react';
import { ChatMessage, AIProvider } from '../types/assistant';

interface ChatScreenProps {
  messages: ChatMessage[];
  activeProvider: AIProvider;
  isListening: boolean;
  isThinking: boolean;
  interimTranscript: string;
  onSendMessage: (text: string) => void;
  onToggleMic: () => void;
  onRegenerate: () => void;
  onClearChat: () => void;
  onSpeakMessage: (text: string) => void;
  onBack: () => void;
  onOpenAndroidBridge: (action?: any) => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  messages,
  activeProvider,
  isListening,
  isThinking,
  interimTranscript,
  onSendMessage,
  onToggleMic,
  onRegenerate,
  onClearChat,
  onSpeakMessage,
  onBack,
  onOpenAndroidBridge,
}) => {
  const [inputText, setInputText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, interimTranscript, isThinking]);

  const handleSend = () => {
    if (!inputText.trim() || isThinking) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen w-full bg-[#07070b] text-neutral-100 flex flex-col">
      {/* Top Header */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-[#0a0a10]/90 backdrop-blur-md border-b border-neutral-900">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-full hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center font-bold text-xs text-white shadow-md">
              AR
            </div>
            <div>
              <h2 className="text-sm font-bold flex items-center gap-1.5">
                <span>ArshiAI Chat</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </h2>
              <p className="text-[10px] text-neutral-400 font-mono uppercase">
                {activeProvider} Neural Active
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onRegenerate}
            disabled={messages.length === 0 || isThinking}
            className="p-2 rounded-xl hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors disabled:opacity-40"
            title="Regenerate last response"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={onClearChat}
            className="p-2 rounded-xl hover:bg-rose-950/40 text-neutral-400 hover:text-rose-400 transition-colors"
            title="Clear chat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 max-w-2xl w-full mx-auto px-4 py-4 space-y-4 overflow-y-auto">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          const isCopied = copiedId === msg.id;

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-3xl p-4 text-sm leading-relaxed shadow-lg ${
                  isUser
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-tr-sm'
                    : msg.isError
                    ? 'bg-rose-950/60 border border-rose-800/60 text-rose-200 rounded-tl-sm'
                    : 'bg-neutral-900/80 border border-neutral-800/80 text-neutral-200 rounded-tl-sm font-["Hind_Siliguri",sans-serif]'
                }`}
              >
                {/* Message Text */}
                <div className="whitespace-pre-wrap break-words">{msg.text}</div>

                {/* If message triggered an Android Bridge event */}
                {msg.bridgeAction && (
                  <div
                    onClick={() => onOpenAndroidBridge(msg.bridgeAction)}
                    className="mt-3 p-2.5 rounded-xl bg-purple-950/50 border border-purple-800/50 flex items-center justify-between gap-2 text-xs text-purple-200 cursor-pointer hover:bg-purple-900/40 transition-colors"
                  >
                    <div className="flex items-center gap-1.5 font-medium">
                      <Smartphone className="w-3.5 h-3.5 text-pink-400" />
                      <span>Android Bridge Command</span>
                    </div>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-purple-800/50 text-purple-300">
                      View Architecture
                    </span>
                  </div>
                )}
              </div>

              {/* Message Footer: Timestamp, Provider & Action buttons */}
              <div
                className={`flex items-center gap-2 px-1 text-[10px] text-neutral-500 font-mono ${
                  isUser ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <span>{formatTime(msg.timestamp)}</span>
                {!isUser && msg.providerUsed && (
                  <>
                    <span>•</span>
                    <span className="uppercase text-purple-400/80">{msg.providerUsed}</span>
                  </>
                )}

                {!isUser && !msg.isError && (
                  <div className="flex items-center gap-1 ml-1">
                    <button
                      onClick={() => handleCopy(msg.id, msg.text)}
                      className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200"
                      title="Copy response"
                    >
                      {isCopied ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                    <button
                      onClick={() => onSpeakMessage(msg.text)}
                      className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200"
                      title="Listen aloud (TTS)"
                    >
                      <Volume2 className="w-3 h-3 text-pink-400" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Live Interim Transcript Bubble while Listening */}
        {isListening && interimTranscript && (
          <div className="flex flex-col items-end space-y-1 animate-in fade-in">
            <div className="max-w-[85%] rounded-3xl p-4 text-sm bg-purple-950/40 border border-purple-800/40 text-purple-200 rounded-tr-sm italic font-['Hind_Siliguri',sans-serif]">
              {interimTranscript}...
            </div>
            <span className="text-[10px] text-pink-400 font-mono animate-pulse">
              ● রিয়েলটাইম ভয়েস শনাক্তকরণ...
            </span>
          </div>
        )}

        {/* Thinking Indicator */}
        {isThinking && (
          <div className="flex flex-col items-start space-y-1 animate-in fade-in">
            <div className="rounded-3xl p-4 text-sm bg-neutral-900/80 border border-neutral-800 text-neutral-300 rounded-tl-sm flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-purple-400 animate-spin" />
              <span className="font-['Hind_Siliguri',sans-serif]">ArshiAI ভাবছে...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Input Area */}
      <div className="sticky bottom-0 z-30 p-3 sm:p-4 bg-[#0a0a10]/95 backdrop-blur-md border-t border-neutral-900">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          {/* Microphone button */}
          <button
            onClick={onToggleMic}
            className={`p-3 rounded-2xl transition-all active:scale-95 flex items-center justify-center ${
              isListening
                ? 'bg-pink-600 text-white shadow-lg shadow-pink-900/50 animate-pulse'
                : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800'
            }`}
            title={isListening ? 'ভয়েস রেকর্ডিং থামান' : 'ভয়েস ইনপুট শুরু করুন'}
          >
            {isListening ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-pink-400" />}
          </button>

          {/* Text Input */}
          <div className="flex-1 relative flex items-center">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend();
              }}
              placeholder={
                isListening ? 'ArshiAI শুনছে... বলুন' : 'বার্তা লিখুন বা বলুন (যেমন: হ্যালো ArshiAI)...'
              }
              disabled={isThinking}
              className="w-full py-3 pl-4 pr-11 rounded-2xl bg-neutral-900/80 border border-neutral-800 text-xs sm:text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-purple-500 font-['Hind_Siliguri',sans-serif]"
            />
            <button
              onClick={handleSend}
              disabled={!inputText.trim() || isThinking}
              className="absolute right-2 p-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-40 disabled:hover:bg-purple-600 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
