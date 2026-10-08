/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  ActiveSettings,
  AIProvider,
  ChatMessage,
  Conversation,
  DiagnosticsState,
  OrbState,
  ProvidersConfig,
} from './types/assistant';
import {
  getStoredSettings,
  saveStoredSettings,
  getStoredProviders,
  saveStoredProviders,
  getStoredConversations,
  saveStoredConversations,
  getCurrentConversationId,
  setCurrentConversationId,
  getHasSeenWelcome,
  setHasSeenWelcome,
} from './services/storage';
import { speechRecognizer } from './services/speechRecognition';
import { speechSynthesizer } from './services/speechSynthesis';
import { generateArshiResponse } from './services/aiProviders';
import { androidBridge } from './services/androidBridge';

import { StatusBar } from './components/StatusBar';
import { WelcomeScreen } from './components/WelcomeScreen';
import { MainOrbScreen } from './components/MainOrbScreen';
import { ChatScreen } from './components/ChatScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { HistoryScreen } from './components/HistoryScreen';
import { DiagnosticsDrawer } from './components/DiagnosticsDrawer';
import { AndroidBridgeModal } from './components/AndroidBridgeModal';

export default function App() {
  // App views
  const [currentView, setCurrentView] = useState<'welcome' | 'main' | 'chat' | 'settings' | 'history'>(
    () => (getHasSeenWelcome() ? 'main' : 'welcome')
  );

  // Assistant states
  const [orbState, setOrbState] = useState<OrbState>('idle');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isThinking, setIsThinking] = useState<boolean>(false);

  // Settings & Providers state
  const [settings, setSettings] = useState<ActiveSettings>(getStoredSettings);
  const [providers, setProviders] = useState<ProvidersConfig>(getStoredProviders);

  // Conversations & History
  const [conversations, setConversations] = useState<Conversation[]>(getStoredConversations);
  const [activeConvId, setActiveConvId] = useState<string>(() => {
    const saved = getCurrentConversationId();
    if (saved && conversations.some((c) => c.id === saved)) return saved;
    return conversations[0]?.id || 'conv-default';
  });

  // Transcripts & Previews
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [finalTranscript, setFinalTranscript] = useState<string>('');
  const [lastResponsePreview, setLastResponsePreview] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Android Bridge state
  const [bridgeNotice, setBridgeNotice] = useState<{
    type: string;
    message: string;
    details?: string;
  } | null>(null);
  const [isBridgeModalOpen, setIsBridgeModalOpen] = useState<boolean>(false);

  // Diagnostics drawer
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState<boolean>(false);
  const [diagnostics, setDiagnostics] = useState<DiagnosticsState>({
    micPermission: 'prompt',
    speechRecognitionSupported: speechRecognizer.isSupported(),
    isListening: false,
    audioStarted: false,
    soundStarted: false,
    speechStarted: false,
    interimTranscript: '',
    finalTranscript: '',
    lastEvent: 'initialized',
    lastError: null,
    activeProvider: settings.activeProvider,
    aiStatus: 'ready',
  });

  // Synchronize storage
  useEffect(() => {
    saveStoredSettings(settings);
  }, [settings]);

  useEffect(() => {
    saveStoredProviders(providers);
  }, [providers]);

  useEffect(() => {
    saveStoredConversations(conversations);
  }, [conversations]);

  useEffect(() => {
    setCurrentConversationId(activeConvId);
  }, [activeConvId]);

  // Keep diagnostics in sync with assistant status
  useEffect(() => {
    setDiagnostics((prev) => ({
      ...prev,
      activeProvider: settings.activeProvider,
      isListening,
      aiStatus: isThinking
        ? 'thinking'
        : isSpeaking
        ? 'speaking'
        : isListening
        ? 'listening'
        : errorMessage
        ? 'error'
        : 'ready',
    }));
  }, [settings.activeProvider, isListening, isThinking, isSpeaking, errorMessage]);

  // Active conversation object
  const currentConversation =
    conversations.find((c) => c.id === activeConvId) || conversations[0] || {
      id: 'conv-fallback',
      title: 'নতুন কথোপকথন',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
    };

  // Helper to add message
  const addMessageToCurrentConv = (
    msg: Omit<ChatMessage, 'id' | 'timestamp'> & { id?: string; timestamp?: number }
  ) => {
    const newMsg: ChatMessage = {
      id: msg.id || 'msg-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      timestamp: msg.timestamp || Date.now(),
      sender: msg.sender,
      text: msg.text,
      providerUsed: msg.providerUsed,
      modelUsed: msg.modelUsed,
      isError: msg.isError,
      bridgeAction: msg.bridgeAction,
    };

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeConvId) {
          // If title is default, generate from first user prompt
          let title = c.title;
          if (c.title === 'নতুন কথোপকথন' && msg.sender === 'user') {
            title = msg.text.slice(0, 24) + (msg.text.length > 24 ? '...' : '');
          }
          return {
            ...c,
            title,
            updatedAt: Date.now(),
            messages: [...c.messages, newMsg],
          };
        }
        return c;
      })
    );

    return newMsg;
  };

  // Process user message (either from voice or text input)
  const processUserPrompt = async (userText: string) => {
    if (!userText.trim()) return;

    setErrorMessage(null);
    setBridgeNotice(null);
    setInterimTranscript('');
    setFinalTranscript(userText);

    // 1. Add User Message
    addMessageToCurrentConv({
      sender: 'user',
      text: userText,
    });

    // 2. Check if text matches an Android Assistant Command
    const androidCmd = androidBridge.parseCommand(userText);

    if (androidCmd.type !== 'none') {
      // 2a. Time Command
      if (androidCmd.type === 'time') {
        const timeResult = androidBridge.getCurrentTimeFormatted();
        const responseText =
          settings.language === 'en' ? timeResult.englishText : timeResult.bengaliText;

        addMessageToCurrentConv({
          sender: 'assistant',
          text: responseText,
          providerUsed: settings.activeProvider,
        });

        setLastResponsePreview(responseText);
        setOrbState('speaking');
        setIsSpeaking(true);

        if (settings.autoSpeak) {
          speechSynthesizer.speak(
            responseText,
            {
              speed: settings.speechSpeed,
              lang: settings.language,
              voiceURI: settings.selectedVoiceURI,
            },
            {
              onEnd: () => {
                setIsSpeaking(false);
                setOrbState('idle');
              },
              onError: () => {
                setIsSpeaking(false);
                setOrbState('idle');
              },
            }
          );
        } else {
          setTimeout(() => {
            setIsSpeaking(false);
            setOrbState('idle');
          }, 1200);
        }
        return;
      }

      // 2b. Android System / App Bridge Commands (YouTube, WhatsApp, Call, Scroll, Volume, Flashlight)
      let bridgeResult;
      switch (androidCmd.type) {
        case 'open_youtube':
          bridgeResult = await androidBridge.openYouTube();
          break;
        case 'open_whatsapp':
          bridgeResult = await androidBridge.openWhatsApp();
          break;
        case 'open_chrome':
          bridgeResult = await androidBridge.openChrome();
          break;
        case 'open_facebook':
          bridgeResult = await androidBridge.openFacebook();
          break;
        case 'open_app':
          bridgeResult = await androidBridge.openApp(androidCmd.target || 'App');
          break;
        case 'scroll_youtube':
        case 'scroll':
          bridgeResult = await androidBridge.scrollDown();
          break;
        case 'whatsapp_msg':
          bridgeResult = await androidBridge.sendWhatsAppMessage(androidCmd.target || 'মা');
          break;
        case 'call':
          bridgeResult = await androidBridge.makePhoneCall(androidCmd.target || 'মা');
          break;
        case 'sms':
          bridgeResult = await androidBridge.sendSMS(androidCmd.target || 'মা');
          break;
        case 'volume_up':
          bridgeResult = await androidBridge.setVolumeUp();
          break;
        case 'volume_down':
          bridgeResult = await androidBridge.setVolumeDown();
          break;
        case 'volume':
          bridgeResult = await androidBridge.setVolume((androidCmd.details as any) || 'up');
          break;
        case 'torch':
          bridgeResult = await androidBridge.toggleFlashlight((androidCmd.details as any) || 'toggle');
          break;
        default:
          bridgeResult = await androidBridge.openApp('App');
      }

      const responseText =
        settings.language === 'en' ? bridgeResult.userMessageEn : bridgeResult.userMessageBn;

      addMessageToCurrentConv({
        sender: 'assistant',
        text: responseText,
        providerUsed: settings.activeProvider,
        bridgeAction: {
          type: androidCmd.type,
          details: bridgeResult.technicalDetails || '',
          status: 'bridge_required',
        },
      });

      setBridgeNotice({
        type: androidCmd.type,
        message: responseText,
        details: bridgeResult.technicalDetails,
      });

      setLastResponsePreview(responseText);
      setOrbState('speaking');
      setIsSpeaking(true);

      if (settings.autoSpeak) {
        const spokenShort = 'Android Bridge সংযোগ প্রয়োজন। এটি নেটিভ অ্যান্ড্রয়েড অ্যাপে কাজ করবে।';
        speechSynthesizer.speak(
          spokenShort,
          {
            speed: settings.speechSpeed,
            lang: settings.language,
            voiceURI: settings.selectedVoiceURI,
          },
          {
            onEnd: () => {
              setIsSpeaking(false);
              setOrbState('idle');
            },
            onError: () => {
              setIsSpeaking(false);
              setOrbState('idle');
            },
          }
        );
      } else {
        setTimeout(() => {
          setIsSpeaking(false);
          setOrbState('idle');
        }, 1200);
      }
      return;
    }

    // 3. Regular AI Conversation with Selected Provider
    setOrbState('thinking');
    setIsThinking(true);

    try {
      const response = await generateArshiResponse(userText, {
        activeProvider: settings.activeProvider,
        providersConfig: providers,
        personality: settings.personality,
        language: settings.language,
        conversationHistory: currentConversation.messages,
        enableFallback: settings.enableFallback,
        fallbackProvider: settings.fallbackProvider,
      });

      setIsThinking(false);

      addMessageToCurrentConv({
        sender: 'assistant',
        text: response.text,
        providerUsed: response.providerUsed,
        modelUsed: response.modelUsed,
      });

      setLastResponsePreview(response.text);

      // Speak aloud if autoSpeak enabled
      if (settings.autoSpeak) {
        setOrbState('speaking');
        setIsSpeaking(true);
        speechSynthesizer.speak(
          response.text,
          {
            speed: settings.speechSpeed,
            lang: settings.language,
            voiceURI: settings.selectedVoiceURI,
          },
          {
            onEnd: () => {
              setIsSpeaking(false);
              setOrbState('idle');
            },
            onError: () => {
              setIsSpeaking(false);
              setOrbState('idle');
            },
          }
        );
      } else {
        setOrbState('idle');
      }
    } catch (err: any) {
      console.error('Error generating AI response:', err);
      setIsThinking(false);
      setOrbState('error');

      const errText = err?.message || 'উত্তর তৈরি করতে ত্রুটি হয়েছে। প্রোভাইডার সেটিংস চেক করুন।';
      setErrorMessage(errText);

      addMessageToCurrentConv({
        sender: 'assistant',
        text: `ত্রুটি: ${errText}`,
        providerUsed: settings.activeProvider,
        isError: true,
      });

      // Speak brief error notification
      if (settings.autoSpeak) {
        speechSynthesizer.speak(
          'উত্তর তৈরি করতে সমস্যা হয়েছে। অনুগ্রহ করে প্রোভাইডার সেটিংস বা ইন্টারনেট চেক করুন।',
          { speed: settings.speechSpeed, lang: settings.language }
        );
      }
    }
  };

  // Toggle Microphone
  const handleToggleMic = async () => {
    // If speaking, stop synthesis first
    if (speechSynthesizer.isSpeaking()) {
      speechSynthesizer.stop();
      setIsSpeaking(false);
      setOrbState('idle');
      return;
    }

    // If currently listening, stop recognition
    if (isListening) {
      speechRecognizer.stopListening();
      setIsListening(false);
      setOrbState('idle');
      return;
    }

    // Reset transcripts and error for fresh session
    setErrorMessage(null);
    setInterimTranscript('');
    setOrbState('listening');
    setIsListening(true);

    const started = await speechRecognizer.startListening(settings.language, {
      onStart: () => {
        setIsListening(true);
        setOrbState('listening');
        setDiagnostics((d) => ({
          ...d,
          isListening: true,
          lastEvent: 'onstart',
          micPermission: 'granted',
        }));
      },
      onAudioStart: () => {
        setDiagnostics((d) => ({ ...d, audioStarted: true, lastEvent: 'onaudiostart' }));
      },
      onSoundStart: () => {
        setDiagnostics((d) => ({ ...d, soundStarted: true, lastEvent: 'onsoundstart' }));
      },
      onSpeechStart: () => {
        setDiagnostics((d) => ({ ...d, speechStarted: true, lastEvent: 'onspeechstart' }));
      },
      onInterimResult: (text) => {
        setInterimTranscript(text);
        setDiagnostics((d) => ({ ...d, interimTranscript: text, lastEvent: 'onresult (interim)' }));
      },
      onFinalResult: (text) => {
        setIsListening(false);
        setInterimTranscript('');
        setFinalTranscript(text);
        setDiagnostics((d) => ({ ...d, finalTranscript: text, lastEvent: 'onresult (final)' }));
        processUserPrompt(text);
      },
      onSpeechEnd: () => {
        setDiagnostics((d) => ({ ...d, lastEvent: 'onspeechend' }));
      },
      onAudioEnd: () => {
        setDiagnostics((d) => ({ ...d, lastEvent: 'onaudioend' }));
      },
      onEnd: () => {
        setIsListening(false);
        setDiagnostics((d) => ({ ...d, isListening: false, lastEvent: 'onend' }));
        // If not transitioned to thinking or speaking, return to idle
        setOrbState((current) => (current === 'listening' ? 'idle' : current));
      },
      onError: (userMsg, rawError) => {
        setIsListening(false);
        setOrbState('error');
        setErrorMessage(userMsg);
        setDiagnostics((d) => ({
          ...d,
          isListening: false,
          lastEvent: `onerror (${rawError})`,
          lastError: `${rawError}: ${userMsg}`,
          micPermission: rawError === 'not-allowed' ? 'denied' : d.micPermission,
        }));
      },
      onNoMatch: () => {
        setDiagnostics((d) => ({ ...d, lastEvent: 'onnomatch' }));
      },
      onEvent: (name, details) => {
        setDiagnostics((d) => ({ ...d, lastEvent: name }));
      },
    });

    if (!started) {
      setIsListening(false);
      setOrbState('error');
    }
  };

  const handleRetryMic = () => {
    setErrorMessage(null);
    handleToggleMic();
  };

  const handleStopSpeaking = () => {
    speechSynthesizer.stop();
    setIsSpeaking(false);
    setOrbState('idle');
  };

  // Conversation Management Handlers
  const handleNewConversation = () => {
    const newConv: Conversation = {
      id: 'conv-' + Date.now(),
      title: 'নতুন কথোপকথন',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [
        {
          id: 'msg-' + Date.now(),
          sender: 'assistant',
          text: 'হ্যালো! আমি ArshiAI। নতুন আলোচনা শুরু করতে আপনার প্রশ্ন করুন বা ভয়েস বোতাম চাপুন।',
          timestamp: Date.now(),
        },
      ],
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveConvId(newConv.id);
    setCurrentView('main');
  };

  const handleSelectConversation = (id: string) => {
    setActiveConvId(id);
    setCurrentView('main');
  };

  const handleRenameConversation = (id: string, newTitle: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle, updatedAt: Date.now() } : c))
    );
  };

  const handleDeleteConversation = (id: string) => {
    setConversations((prev) => {
      const remaining = prev.filter((c) => c.id !== id);
      if (remaining.length === 0) {
        const fresh: Conversation = {
          id: 'conv-' + Date.now(),
          title: 'নতুন কথোপকথন',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: [
            {
              id: 'msg-' + Date.now(),
              sender: 'assistant',
              text: 'হ্যালো! আমি ArshiAI। আপনাকে কীভাবে সাহায্য করতে পারি?',
              timestamp: Date.now(),
            },
          ],
        };
        setActiveConvId(fresh.id);
        return [fresh];
      }
      if (activeConvId === id) {
        setActiveConvId(remaining[0].id);
      }
      return remaining;
    });
  };

  const handleClearAllConversations = () => {
    const fresh: Conversation = {
      id: 'conv-' + Date.now(),
      title: 'নতুন কথোপকথন',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [
        {
          id: 'msg-' + Date.now(),
          sender: 'assistant',
          text: 'হ্যালো! আমি ArshiAI। আপনাকে কীভাবে সাহায্য করতে পারি?',
          timestamp: Date.now(),
        },
      ],
    };
    setConversations([fresh]);
    setActiveConvId(fresh.id);
  };

  const handleRegenerateLastResponse = () => {
    const msgs = currentConversation.messages;
    if (msgs.length === 0) return;

    // Find last user message
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].sender === 'user') {
        processUserPrompt(msgs[i].text);
        break;
      }
    }
  };

  const handleTestMicrophone = async () => {
    const res = await speechRecognizer.requestMicrophonePermission();
    setDiagnostics((d) => ({
      ...d,
      micPermission: res,
    }));
  };

  return (
    <div className="min-h-screen w-full bg-[#07070b] text-neutral-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Android System Status Bar (Shown across all active views except Welcome) */}
      {currentView !== 'welcome' && (
        <StatusBar orbState={orbState} activeProvider={settings.activeProvider} />
      )}

      {/* Main View Router */}
      <div className="flex-1 flex flex-col">
        {currentView === 'welcome' && (
          <WelcomeScreen
            onGetStarted={() => {
              setHasSeenWelcome(true);
              setCurrentView('main');
            }}
            onOpenSettings={() => {
              setHasSeenWelcome(true);
              setCurrentView('settings');
            }}
          />
        )}

        {currentView === 'main' && (
          <MainOrbScreen
            orbState={orbState}
            activeProvider={settings.activeProvider}
            isListening={isListening}
            isSpeaking={isSpeaking}
            interimTranscript={interimTranscript}
            finalTranscript={finalTranscript}
            assistantResponsePreview={lastResponsePreview}
            errorMessage={errorMessage}
            bridgeNotice={bridgeNotice}
            onToggleMic={handleToggleMic}
            onRetryMic={handleRetryMic}
            onStopSpeaking={handleStopSpeaking}
            onOpenChat={() => setCurrentView('chat')}
            onOpenSettings={() => setCurrentView('settings')}
            onOpenHistory={() => setCurrentView('history')}
            onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
            onOpenAndroidBridge={() => setIsBridgeModalOpen(true)}
          />
        )}

        {currentView === 'chat' && (
          <ChatScreen
            messages={currentConversation.messages}
            activeProvider={settings.activeProvider}
            isListening={isListening}
            isThinking={isThinking}
            interimTranscript={interimTranscript}
            onSendMessage={processUserPrompt}
            onToggleMic={handleToggleMic}
            onRegenerate={handleRegenerateLastResponse}
            onClearChat={() => {
              setConversations((prev) =>
                prev.map((c) =>
                  c.id === activeConvId
                    ? {
                        ...c,
                        messages: [
                          {
                            id: 'msg-' + Date.now(),
                            sender: 'assistant',
                            text: 'কথোপকথন পরিষ্কার করা হয়েছে। আপনি নতুন কোনো কিছু জিজ্ঞাসা করতে পারেন।',
                            timestamp: Date.now(),
                          },
                        ],
                      }
                    : c
                )
              );
            }}
            onSpeakMessage={(text) => {
              setOrbState('speaking');
              setIsSpeaking(true);
              speechSynthesizer.speak(
                text,
                {
                  speed: settings.speechSpeed,
                  lang: settings.language,
                  voiceURI: settings.selectedVoiceURI,
                },
                {
                  onEnd: () => {
                    setIsSpeaking(false);
                    setOrbState('idle');
                  },
                  onError: () => {
                    setIsSpeaking(false);
                    setOrbState('idle');
                  },
                }
              );
            }}
            onBack={() => setCurrentView('main')}
            onOpenAndroidBridge={(action) => {
              if (action) {
                setBridgeNotice({
                  type: action.type,
                  message: `Android Bridge required: ${action.type} অ্যাকশন বাস্তবায়ন`,
                  details: action.details,
                });
              }
              setIsBridgeModalOpen(true);
            }}
          />
        )}

        {currentView === 'settings' && (
          <SettingsScreen
            settings={settings}
            providers={providers}
            onSaveSettings={setSettings}
            onSaveProviders={setProviders}
            onBack={() => setCurrentView('main')}
            onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
            onOpenAndroidBridge={() => setIsBridgeModalOpen(true)}
            onClearAllHistory={handleClearAllConversations}
          />
        )}

        {currentView === 'history' && (
          <HistoryScreen
            conversations={conversations}
            activeConversationId={activeConvId}
            onSelectConversation={handleSelectConversation}
            onNewConversation={handleNewConversation}
            onRenameConversation={handleRenameConversation}
            onDeleteConversation={handleDeleteConversation}
            onClearAll={handleClearAllConversations}
            onBack={() => setCurrentView('main')}
          />
        )}
      </div>

      {/* Voice Diagnostics Modal / Drawer */}
      <DiagnosticsDrawer
        isOpen={isDiagnosticsOpen}
        onClose={() => setIsDiagnosticsOpen(false)}
        diagnostics={diagnostics}
        onTestMicrophone={handleTestMicrophone}
      />

      {/* Android Bridge Architecture Modal */}
      <AndroidBridgeModal
        isOpen={isBridgeModalOpen}
        onClose={() => setIsBridgeModalOpen(false)}
        activeCommand={bridgeNotice}
      />
    </div>
  );
}
