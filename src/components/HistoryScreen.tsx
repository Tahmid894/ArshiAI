import React, { useState } from 'react';
import {
  ArrowLeft,
  Plus,
  Search,
  MessageSquare,
  Trash2,
  Edit2,
  Check,
  X,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Conversation } from '../types/assistant';

interface HistoryScreenProps {
  conversations: Conversation[];
  activeConversationId: string;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onDeleteConversation: (id: string) => void;
  onClearAll: () => void;
  onBack: () => void;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onRenameConversation,
  onDeleteConversation,
  onClearAll,
  onBack,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitleText, setEditTitleText] = useState('');

  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.messages.some((m) => m.text.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const startRename = (conv: Conversation) => {
    setEditingId(conv.id);
    setEditTitleText(conv.title);
  };

  const saveRename = (id: string) => {
    if (editTitleText.trim()) {
      onRenameConversation(id, editTitleText.trim());
    }
    setEditingId(null);
  };

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen w-full bg-[#07070b] text-neutral-100 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-[#0a0a10]/90 backdrop-blur-md border-b border-neutral-900">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-full hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-bold">Conversation History</h1>
            <p className="text-[11px] text-neutral-400">সংরক্ষিত কথোপকথনসমূহ</p>
          </div>
        </div>

        <button
          onClick={onNewConversation}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md transition-all active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Chat</span>
        </button>
      </div>

      <div className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-6 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="কথোপকথন বা বার্তা খুঁজুন..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-neutral-900/60 border border-neutral-800 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Clear All Header Button if has items */}
        {conversations.length > 0 && (
          <div className="flex items-center justify-between px-1 text-xs text-neutral-500">
            <span>মোট {conversations.length} টি কথোপকথন</span>
            <button
              onClick={() => {
                if (confirm('আপনি কি সমস্ত ইতিহাস মুছে ফেলতে চান?')) {
                  onClearAll();
                }
              }}
              className="hover:text-rose-400 transition-colors"
            >
              সব মুছুন (Clear All)
            </button>
          </div>
        )}

        {/* Conversations List */}
        <div className="space-y-2.5">
          {filtered.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-neutral-900 flex items-center justify-center text-neutral-600">
                <MessageSquare className="w-6 h-6" />
              </div>
              <p className="text-xs text-neutral-400">কোনো কথোপকথন পাওয়া যায়নি।</p>
              <button
                onClick={onNewConversation}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-purple-600/30 text-purple-200 border border-purple-500/30 text-xs font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>নতুন চ্যাট শুরু করুন</span>
              </button>
            </div>
          ) : (
            filtered.map((conv) => {
              const isActive = conv.id === activeConversationId;
              const isEditingThis = editingId === conv.id;
              const msgCount = conv.messages.length;
              const lastMsg = conv.messages[conv.messages.length - 1];

              return (
                <div
                  key={conv.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isActive
                      ? 'bg-purple-950/20 border-purple-500/40 shadow-lg shadow-purple-950/30'
                      : 'bg-neutral-900/40 hover:bg-neutral-900/70 border-neutral-800/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div
                      onClick={() => onSelectConversation(conv.id)}
                      className="flex-1 cursor-pointer space-y-1 min-w-0"
                    >
                      {isEditingThis ? (
                        <div
                          className="flex items-center gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="text"
                            value={editTitleText}
                            onChange={(e) => setEditTitleText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveRename(conv.id);
                              if (e.key === 'Escape') setEditingId(null);
                            }}
                            autoFocus
                            className="flex-1 bg-black/80 border border-purple-500 rounded-lg px-2 py-1 text-xs text-neutral-100 focus:outline-none"
                          />
                          <button
                            onClick={() => saveRename(conv.id)}
                            className="p-1 rounded bg-purple-600 text-white"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1 rounded bg-neutral-800 text-neutral-400"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs font-semibold text-neutral-200 truncate">
                            {conv.title}
                          </h3>
                          {isActive && (
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-purple-600/30 text-purple-300 border border-purple-500/30">
                              ACTIVE
                            </span>
                          )}
                        </div>
                      )}

                      {lastMsg && (
                        <p className="text-[11px] text-neutral-400 truncate font-['Hind_Siliguri',sans-serif]">
                          {lastMsg.text}
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-[10px] text-neutral-500 font-mono pt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(conv.updatedAt)}
                        </span>
                        <span>•</span>
                        <span>{msgCount} টি বার্তা</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0 pt-0.5">
                      <button
                        onClick={() => startRename(conv)}
                        className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
                        title="Rename conversation"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteConversation(conv.id)}
                        className="p-1.5 rounded-lg hover:bg-rose-950/40 text-neutral-400 hover:text-rose-400 transition-colors"
                        title="Delete conversation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
