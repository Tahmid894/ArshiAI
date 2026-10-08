import React, { useState } from 'react';
import {
  ArrowLeft,
  Key,
  Cpu,
  Globe,
  Volume2,
  Sliders,
  Smartphone,
  Info,
  Check,
  Eye,
  EyeOff,
  Trash2,
  Edit2,
  Play,
  RotateCcw,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import {
  ActiveSettings,
  AIProvider,
  PersonalityMode,
  ProvidersConfig,
  SpeechSpeed,
} from '../types/assistant';
import { maskApiKey } from '../services/storage';
import { testProviderConnection } from '../services/aiProviders';
import { speechSynthesizer } from '../services/speechSynthesis';
import { androidBridge } from '../services/androidBridge';

interface SettingsScreenProps {
  settings: ActiveSettings;
  providers: ProvidersConfig;
  onSaveSettings: (settings: ActiveSettings) => void;
  onSaveProviders: (providers: ProvidersConfig) => void;
  onBack: () => void;
  onOpenDiagnostics: () => void;
  onOpenAndroidBridge: () => void;
  onClearAllHistory: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  providers,
  onSaveSettings,
  onSaveProviders,
  onBack,
  onOpenDiagnostics,
  onOpenAndroidBridge,
  onClearAllHistory,
}) => {
  const [activeTab, setActiveTab] = useState<'ai' | 'voice' | 'general' | 'bridge' | 'about'>('ai');
  const [localSettings, setLocalSettings] = useState<ActiveSettings>({ ...settings });
  const [localProviders, setLocalProviders] = useState<ProvidersConfig>({ ...providers });

  // Key visibility & editing states per provider
  const [editingKey, setEditingKey] = useState<Record<AIProvider, boolean>>({
    openai: false,
    openrouter: false,
    gemini: false,
    groq: false,
    deepseek: false,
    claude: false,
  });
  const [revealedKey, setRevealedKey] = useState<Record<AIProvider, boolean>>({
    openai: false,
    openrouter: false,
    gemini: false,
    groq: false,
    deepseek: false,
    claude: false,
  });
  const [keyInputTemp, setKeyInputTemp] = useState<Record<AIProvider, string>>({
    openai: '',
    openrouter: '',
    gemini: '',
    groq: '',
    deepseek: '',
    claude: '',
  });

  // Test connection state
  const [testingProvider, setTestingProvider] = useState<AIProvider | null>(null);
  const [testResult, setTestResult] = useState<Record<string, { success: boolean; msg: string }>>({});
  const [savedBanner, setSavedBanner] = useState<boolean>(false);

  // Available voices
  const voices = speechSynthesizer.getAvailableVoices();

  const handleProviderConfigChange = (
    provider: AIProvider,
    key: keyof ProvidersConfig[AIProvider],
    value: any
  ) => {
    setLocalProviders((prev) => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        [key]: value,
      },
    }));
  };

  const handleSaveAll = () => {
    onSaveSettings(localSettings);
    onSaveProviders(localProviders);
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 2500);
  };

  const handleTestConnection = async (provider: AIProvider) => {
    setTestingProvider(provider);
    const config = localProviders[provider];
    const res = await testProviderConnection(provider, config);
    setTestingProvider(null);
    setTestResult((prev) => ({
      ...prev,
      [provider]: { success: res.success, msg: res.message },
    }));
  };

  const handleSaveKey = (provider: AIProvider) => {
    const rawVal = keyInputTemp[provider];
    if (rawVal !== undefined) {
      handleProviderConfigChange(provider, 'apiKey', rawVal.trim());
    }
    setEditingKey((prev) => ({ ...prev, [provider]: false }));
  };

  const handleDeleteKey = (provider: AIProvider) => {
    handleProviderConfigChange(provider, 'apiKey', '');
    setKeyInputTemp((prev) => ({ ...prev, [provider]: '' }));
    setEditingKey((prev) => ({ ...prev, [provider]: false }));
  };

  const testTTSVoice = () => {
    speechSynthesizer.speak(
      'হ্যালো! আমি ArshiAI। আপনার ভয়েস সেটিংস সফলভাবে কনফিগার করা হয়েছে।',
      {
        speed: localSettings.speechSpeed,
        lang: localSettings.language,
        voiceURI: localSettings.selectedVoiceURI,
      }
    );
  };

  const providerNames: Record<AIProvider, string> = {
    openai: 'OpenAI',
    openrouter: 'OpenRouter',
    gemini: 'Google Gemini',
    groq: 'Groq',
    deepseek: 'DeepSeek',
    claude: 'Anthropic Claude',
  };

  const modelSuggestions: Record<AIProvider, string[]> = {
    openai: ['gpt-5', 'gpt-5-mini', 'gpt-4o', 'gpt-4o-mini'],
    openrouter: ['openrouter/free', 'google/gemini-2.0-flash-exp:free', 'meta-llama/llama-3.3-70b-instruct'],
    gemini: ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite', 'gemini-3.1-pro-preview'],
    groq: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
    deepseek: ['deepseek-chat', 'deepseek-reasoner'],
    claude: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
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
          <div>
            <h1 className="text-base font-bold">Settings</h1>
            <p className="text-[11px] text-neutral-400">ArshiAI কনফিগারেশন ও প্রোভাইডার সেটিংস</p>
          </div>
        </div>

        <button
          onClick={handleSaveAll}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-950/40 transition-all active:scale-95"
        >
          <Check className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </div>

      {savedBanner && (
        <div className="bg-emerald-950/90 border-b border-emerald-800 px-4 py-2 text-center text-xs font-medium text-emerald-300 animate-in fade-in">
          ✓ সমস্ত সেটিংস সফলভাবে সংরক্ষিত হয়েছে!
        </div>
      )}

      {/* Tabs Bar */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-neutral-900 overflow-x-auto no-scrollbar bg-[#09090f]">
        <button
          onClick={() => setActiveTab('ai')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
            activeTab === 'ai'
              ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>AI Providers</span>
        </button>
        <button
          onClick={() => setActiveTab('voice')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
            activeTab === 'voice'
              ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Volume2 className="w-3.5 h-3.5" />
          <span>Voice & TTS</span>
        </button>
        <button
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
            activeTab === 'general'
              ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Language & Persona</span>
        </button>
        <button
          onClick={() => setActiveTab('bridge')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
            activeTab === 'bridge'
              ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Android Bridge</span>
        </button>
        <button
          onClick={() => setActiveTab('about')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
            activeTab === 'about'
              ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Info className="w-3.5 h-3.5" />
          <span>About</span>
        </button>
      </div>

      {/* Main Settings Content */}
      <div className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* ================= TAB: AI PROVIDERS ================= */}
        {activeTab === 'ai' && (
          <div className="space-y-6">
            {/* Active Provider Selector Card */}
            <div className="p-5 rounded-3xl bg-neutral-900/60 border border-neutral-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-neutral-200">Active AI Provider</h3>
                  <p className="text-xs text-neutral-400">
                    ArshiAI শুধুমাত্র নির্বাচিত প্রোভাইডার থেকেই উত্তর গ্রহণ করবে
                  </p>
                </div>
                <Zap className="w-4 h-4 text-purple-400" />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(['gemini', 'openai', 'openrouter', 'groq', 'deepseek', 'claude'] as AIProvider[]).map(
                  (prov) => {
                    const isActive = localSettings.activeProvider === prov;
                    return (
                      <button
                        key={prov}
                        onClick={() =>
                          setLocalSettings((s) => ({ ...s, activeProvider: prov }))
                        }
                        className={`p-3 rounded-2xl flex flex-col items-start gap-1 text-left transition-all ${
                          isActive
                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-950/40 ring-2 ring-purple-400'
                            : 'bg-neutral-950/60 hover:bg-neutral-800 text-neutral-300 border border-neutral-800'
                        }`}
                      >
                        <span className="text-xs font-bold">{providerNames[prov]}</span>
                        <span className={`text-[10px] ${isActive ? 'text-purple-100' : 'text-neutral-500'}`}>
                          {localProviders[prov].model || 'Standard'}
                        </span>
                      </button>
                    );
                  }
                )}
              </div>

              {/* Fallback Provider Toggle */}
              <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-neutral-300">
                    অটো ফলব্যাক প্রোভাইডার সক্রিয় করুন
                  </span>
                  <p className="text-[11px] text-neutral-500">
                    প্রধান প্রোভাইডার ত্রুটি দিলে ব্যাকআপ প্রোভাইডার ব্যবহার করবে
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={localSettings.enableFallback}
                  onChange={(e) =>
                    setLocalSettings((s) => ({ ...s, enableFallback: e.target.checked }))
                  }
                  className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                />
              </div>

              {localSettings.enableFallback && (
                <div className="pt-2 flex items-center gap-3">
                  <span className="text-xs text-neutral-400">ফলব্যাক প্রোভাইডার:</span>
                  <select
                    value={localSettings.fallbackProvider}
                    onChange={(e) =>
                      setLocalSettings((s) => ({
                        ...s,
                        fallbackProvider: e.target.value as AIProvider,
                      }))
                    }
                    className="bg-neutral-950 border border-neutral-800 text-xs text-neutral-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-purple-500"
                  >
                    {(['gemini', 'openrouter', 'groq', 'deepseek', 'openai', 'claude'] as AIProvider[])
                      .filter((p) => p !== localSettings.activeProvider)
                      .map((p) => (
                        <option key={p} value={p}>
                          {providerNames[p]}
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>

            {/* Security Warning Notice */}
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-950/20 border border-amber-900/30 text-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs space-y-1">
                <p className="font-semibold">API Key নিরাপত্তা সতর্কতা:</p>
                <p className="text-amber-300/80">
                  "API key আপনার নিজের দায়িত্বে ব্যবহার করুন।" সমস্ত কি লোকাল ডিভাইসের মেমোরিতে নিরাপদে সংরক্ষিত থাকে এবং কখনো পাবলিক সার্ভারে প্রকাশ করা হয় না।
                </p>
              </div>
            </div>

            {/* Provider Configuration List */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 px-1">
                প্রোভাইডার কনফিগারেশন ও API Keys
              </h3>

              {(['openai', 'openrouter', 'gemini', 'groq', 'deepseek', 'claude'] as AIProvider[]).map(
                (prov) => {
                  const cfg = localProviders[prov];
                  const isEditing = editingKey[prov];
                  const isRevealed = revealedKey[prov];
                  const currentKey = cfg.apiKey || '';
                  const hasSavedKey = currentKey.length > 0;
                  const suggestions = modelSuggestions[prov] || [];
                  const testStatus = testResult[prov];

                  return (
                    <div
                      key={prov}
                      className="p-4 sm:p-5 rounded-3xl bg-neutral-900/40 border border-neutral-800/80 space-y-3 transition-colors hover:border-neutral-700/80"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-purple-950/40 text-purple-400 border border-purple-800/30">
                            <Key className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-neutral-200">
                                {providerNames[prov]}
                              </span>
                              {localSettings.activeProvider === prov && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                  ACTIVE
                                </span>
                              )}
                              {prov === 'gemini' && !hasSavedKey && (
                                <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/40">
                                  SYSTEM KEY AVAILABLE
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Enable toggle */}
                        <div className="flex items-center gap-2">
                          <label className="text-[11px] text-neutral-400">সক্রিয়</label>
                          <input
                            type="checkbox"
                            checked={cfg.enabled}
                            onChange={(e) =>
                              handleProviderConfigChange(prov, 'enabled', e.target.checked)
                            }
                            className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* API Key Input / Masked Key */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-neutral-400 flex items-center justify-between">
                          <span>API Key</span>
                          {hasSavedKey && !isEditing && (
                            <span className="text-[10px] text-neutral-500 font-mono">
                              সুরক্ষিত ও মাস্কড
                            </span>
                          )}
                        </label>

                        {isEditing || !hasSavedKey ? (
                          <div className="flex items-center gap-2">
                            <input
                              type={isRevealed ? 'text' : 'password'}
                              value={
                                keyInputTemp[prov] !== undefined
                                  ? keyInputTemp[prov]
                                  : currentKey
                              }
                              onChange={(e) =>
                                setKeyInputTemp((prev) => ({
                                  ...prev,
                                  [prov]: e.target.value,
                                }))
                              }
                              placeholder={
                                prov === 'openai'
                                  ? 'sk-...'
                                  : prov === 'openrouter'
                                  ? 'sk-or-...'
                                  : 'আপনার API Key প্রবেশ করান'
                              }
                              className="flex-1 bg-black/60 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 font-mono focus:outline-none focus:border-purple-500"
                            />
                            <button
                              onClick={() =>
                                setRevealedKey((prev) => ({
                                  ...prev,
                                  [prov]: !prev[prov],
                                }))
                              }
                              className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400"
                              title="Show/Hide"
                            >
                              {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => handleSaveKey(prov)}
                              className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold"
                            >
                              Save Key
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/50 border border-neutral-800/80">
                            <div className="font-mono text-xs text-neutral-300">
                              {isRevealed ? currentKey : maskApiKey(currentKey)}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() =>
                                  setRevealedKey((prev) => ({
                                    ...prev,
                                    [prov]: !prev[prov],
                                  }))
                                }
                                className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200"
                                title="Show / Hide"
                              >
                                {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                onClick={() => {
                                  setKeyInputTemp((prev) => ({
                                    ...prev,
                                    [prov]: currentKey,
                                  }));
                                  setEditingKey((prev) => ({ ...prev, [prov]: true }));
                                }}
                                className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200"
                                title="Edit key"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteKey(prov)}
                                className="p-1.5 rounded-lg hover:bg-rose-950/50 text-neutral-400 hover:text-rose-400"
                                title="Delete key"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Model Selector & Custom Model */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        <div>
                          <label className="text-[11px] text-neutral-400 block mb-1">
                            Model Selection
                          </label>
                          <select
                            value={suggestions.includes(cfg.model) ? cfg.model : 'custom'}
                            onChange={(e) => {
                              if (e.target.value !== 'custom') {
                                handleProviderConfigChange(prov, 'model', e.target.value);
                              }
                            }}
                            className="w-full bg-black/60 border border-neutral-800 text-xs text-neutral-200 rounded-xl px-3 py-2 focus:outline-none focus:border-purple-500 font-mono"
                          >
                            {suggestions.map((m) => (
                              <option key={m} value={m}>
                                {m}
                              </option>
                            ))}
                            <option value="custom">কাস্টম মডেল লিখুন...</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[11px] text-neutral-400 block mb-1">
                            Custom Model ID
                          </label>
                          <input
                            type="text"
                            value={cfg.model || ''}
                            onChange={(e) =>
                              handleProviderConfigChange(prov, 'model', e.target.value)
                            }
                            placeholder="যেমন: gpt-5, deepseek-chat"
                            className="w-full bg-black/60 border border-neutral-800 text-xs text-neutral-200 rounded-xl px-3 py-2 focus:outline-none focus:border-purple-500 font-mono"
                          />
                        </div>
                      </div>

                      {/* OpenRouter custom Base URL */}
                      {prov === 'openrouter' && (
                        <div className="pt-1">
                          <label className="text-[11px] text-neutral-400 block mb-1">
                            Endpoint URL
                          </label>
                          <input
                            type="text"
                            value={cfg.baseUrl || 'https://openrouter.ai/api/v1/chat/completions'}
                            onChange={(e) =>
                              handleProviderConfigChange(prov, 'baseUrl', e.target.value)
                            }
                            className="w-full bg-black/60 border border-neutral-800 text-xs text-neutral-300 rounded-xl px-3 py-2 font-mono"
                          />
                        </div>
                      )}

                      {/* Test Connection Button & Status */}
                      <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-t border-neutral-800/60">
                        <button
                          onClick={() => handleTestConnection(prov)}
                          disabled={testingProvider === prov}
                          className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                        >
                          <Zap className="w-3.5 h-3.5 text-pink-400" />
                          <span>
                            {testingProvider === prov ? 'টেস্টিং সংযোগ...' : 'TEST CONNECTION'}
                          </span>
                        </button>

                        {testStatus && (
                          <div
                            className={`text-xs px-2.5 py-1 rounded-lg ${
                              testStatus.success
                                ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                                : 'bg-rose-950/60 text-rose-300 border border-rose-800/40'
                            }`}
                          >
                            {testStatus.msg}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        )}

        {/* ================= TAB: VOICE & TTS ================= */}
        {activeTab === 'voice' && (
          <div className="space-y-5">
            {/* Speech Speed */}
            <div className="p-5 rounded-3xl bg-neutral-900/60 border border-neutral-800 space-y-3">
              <div>
                <h3 className="text-sm font-bold text-neutral-200">Speech Speed</h3>
                <p className="text-xs text-neutral-400">ArshiAI-এর কথা বলার গতি নির্ধারণ করুন</p>
              </div>

              <div className="grid grid-cols-5 gap-2 pt-2">
                {([0.7, 0.9, 1.0, 1.2, 1.5] as SpeechSpeed[]).map((spd) => {
                  const isSel = localSettings.speechSpeed === spd;
                  return (
                    <button
                      key={spd}
                      onClick={() =>
                        setLocalSettings((s) => ({ ...s, speechSpeed: spd }))
                      }
                      className={`py-2 rounded-xl text-xs font-bold font-mono transition-all ${
                        isSel
                          ? 'bg-purple-600 text-white shadow-md shadow-purple-950/50'
                          : 'bg-neutral-950/70 hover:bg-neutral-800 text-neutral-400 border border-neutral-800'
                      }`}
                    >
                      {spd}x
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Voice Selection */}
            <div className="p-5 rounded-3xl bg-neutral-900/60 border border-neutral-800 space-y-3">
              <div>
                <h3 className="text-sm font-bold text-neutral-200">ভয়েস নির্বাচন (Voice Selection)</h3>
                <p className="text-xs text-neutral-400">
                  সিস্টেমে ইনস্টল থাকা বাংলা বা ইংরেজি সিন্থেসিস ভয়েস
                </p>
              </div>

              <select
                value={localSettings.selectedVoiceURI}
                onChange={(e) =>
                  setLocalSettings((s) => ({ ...s, selectedVoiceURI: e.target.value }))
                }
                className="w-full bg-black/60 border border-neutral-800 text-xs text-neutral-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-purple-500"
              >
                <option value="">স্বয়ংক্রিয় ভয়েস (Auto Best Voice)</option>
                {voices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={testTTSVoice}
                  className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Play className="w-3.5 h-3.5 text-pink-400" />
                  <span>ভয়েস শুনুন (Test Voice)</span>
                </button>

                <div className="flex items-center gap-2">
                  <label className="text-xs text-neutral-400">অটো কথা বলা (Auto Speak)</label>
                  <input
                    type="checkbox"
                    checked={localSettings.autoSpeak}
                    onChange={(e) =>
                      setLocalSettings((s) => ({ ...s, autoSpeak: e.target.checked }))
                    }
                    className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Diagnostics Quick Access */}
            <div className="p-5 rounded-3xl bg-neutral-900/60 border border-neutral-800 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-neutral-200">Voice Diagnostics</h4>
                <p className="text-xs text-neutral-400">মাইক্রোফোন ও স্পিচ রিকগনিশন রিয়েল-টাইম ডায়াগনস্টিকস</p>
              </div>
              <button
                onClick={onOpenDiagnostics}
                className="px-4 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/40 text-purple-200 border border-purple-500/30 text-xs font-semibold transition-colors"
              >
                ওপেন ডায়াগনস্টিকস
              </button>
            </div>
          </div>
        )}

        {/* ================= TAB: GENERAL (LANGUAGE & PERSONALITY) ================= */}
        {activeTab === 'general' && (
          <div className="space-y-5">
            {/* Language Selection */}
            <div className="p-5 rounded-3xl bg-neutral-900/60 border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-neutral-200">ভাষা নির্বাচন (Language)</h3>
                  <p className="text-xs text-neutral-400">
                    স্পিচ রিকগনিশন ও কথোপকথনের ডিফল্ট ভাষা
                  </p>
                </div>
                <Globe className="w-4 h-4 text-purple-400" />
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2">
                {[
                  { id: 'bn', label: 'বাংলা (bn-BD)', desc: 'ডিফল্ট' },
                  { id: 'en', label: 'English (en-US)', desc: 'Global' },
                  { id: 'auto', label: 'Auto Detect', desc: 'স্বয়ংক্রিয়' },
                ].map((item) => {
                  const isSel = localSettings.language === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() =>
                        setLocalSettings((s) => ({ ...s, language: item.id as any }))
                      }
                      className={`p-3 rounded-2xl flex flex-col items-center justify-center text-center transition-all ${
                        isSel
                          ? 'bg-purple-600 text-white shadow-md shadow-purple-950/50'
                          : 'bg-neutral-950/70 hover:bg-neutral-800 text-neutral-400 border border-neutral-800'
                      }`}
                    >
                      <span className="text-xs font-bold">{item.label}</span>
                      <span className={`text-[10px] ${isSel ? 'text-purple-200' : 'text-neutral-500'}`}>
                        {item.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Personality Modes */}
            <div className="p-5 rounded-3xl bg-neutral-900/60 border border-neutral-800 space-y-3">
              <div>
                <h3 className="text-sm font-bold text-neutral-200">ব্যক্তিত্ব মোড (Personality)</h3>
                <p className="text-xs text-neutral-400">
                  ArshiAI-এর চরিত্রের মেজাজ ও উত্তর প্রদানের ধরন
                </p>
              </div>

              <div className="space-y-2 pt-1">
                {[
                  {
                    id: 'friendly',
                    name: 'Friendly Companion (বন্ধুত্বপূর্ণ সহচর)',
                    desc: 'উষ্ণ, আন্তরিক, যত্নশীল ও ঘনিষ্ঠ বন্ধুর মতো সহযোগী।',
                  },
                  {
                    id: 'smart',
                    name: 'Smart Assistant (স্মার্ট সহকারী)',
                    desc: 'তীক্ষ্ণ বুদ্ধিমত্তা, দ্রুতগতির কার্যকরী ও প্রাসঙ্গিক বিশ্লেষণ।',
                  },
                  {
                    id: 'professional',
                    name: 'Professional (পেশাদার)',
                    desc: 'মার্জিত, নিখুঁত ও প্রফেশনাল স্তরের আনুষ্ঠানিক উত্তর।',
                  },
                  {
                    id: 'cultural',
                    name: 'Bengali Cultural (বাঙালি সাংস্কৃতিক)',
                    desc: 'বাঙালি সংস্কৃতি, ঐতিহ্য, সাহিত্য ও ভাষার মাধুর্যে সমৃদ্ধ।',
                  },
                  {
                    id: 'tech',
                    name: 'Tech & Code Expert (প্রযুক্তি ও কোড বিশেষজ্ঞ)',
                    desc: 'সফটওয়্যার ডেভেলপমেন্ট, অ্যান্ড্রয়েড আর্কিটেকচার ও কোড এক্সপার্ট।',
                  },
                ].map((p) => {
                  const isSel = localSettings.personality === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() =>
                        setLocalSettings((s) => ({ ...s, personality: p.id as PersonalityMode }))
                      }
                      className={`w-full p-3.5 rounded-2xl flex items-start text-left gap-3 transition-all ${
                        isSel
                          ? 'bg-purple-600/20 border border-purple-500/50 text-white'
                          : 'bg-neutral-950/50 hover:bg-neutral-800/50 border border-neutral-800 text-neutral-300'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full mt-0.5 border flex items-center justify-center flex-shrink-0 ${
                          isSel ? 'border-purple-400 bg-purple-500' : 'border-neutral-600'
                        }`}
                      >
                        {isSel && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-neutral-200">{p.name}</div>
                        <div className="text-[11px] text-neutral-400 mt-0.5">{p.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Conversation History Management */}
            <div className="p-5 rounded-3xl bg-neutral-900/60 border border-neutral-800 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-rose-300">চ্যাট হিস্ট্রি রিসেট</h4>
                <p className="text-xs text-neutral-400">সমস্ত কথোপকথন ইতিহাস মুছে ফেলুন</p>
              </div>
              <button
                onClick={() => {
                  if (confirm('আপনি কি সমস্ত কথোপকথন ইতিহাস মুছে ফেলতে চান?')) {
                    onClearAllHistory();
                  }
                }}
                className="px-3.5 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-800/40 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All History</span>
              </button>
            </div>
          </div>
        )}

        {/* ================= TAB: ANDROID BRIDGE ================= */}
        {activeTab === 'bridge' && (
          <div className="space-y-4">
            <div className="p-5 rounded-3xl bg-neutral-900/60 border border-neutral-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-neutral-200">Android Bridge & Accessibility</h3>
                  <p className="text-xs text-neutral-400">নেটিভ অ্যান্ড্রয়েড ডিভাইস ইন্টিগ্রেশন ও ব্রিজিং</p>
                </div>
                <Smartphone className="w-4 h-4 text-purple-400" />
              </div>

              {/* Accessibility Status Card */}
              <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-300">Accessibility Service:</span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        androidBridge.isAccessibilityServiceEnabled()
                          ? 'bg-emerald-400 animate-pulse'
                          : 'bg-neutral-600'
                      }`}
                    />
                    <span
                      className={`text-xs font-bold ${
                        androidBridge.isAccessibilityServiceEnabled()
                          ? 'text-emerald-400'
                          : 'text-neutral-400'
                      }`}
                    >
                      {androidBridge.isAccessibilityServiceEnabled() ? 'Enabled (সক্রিয়)' : 'Disabled (নিষ্ক্রিয়)'}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-neutral-400 leading-relaxed">
                  YouTube স্ক্রল ডাউন এবং অটোমেশন চালানোর জন্য অ্যান্ড্রয়েড সেটিংসে এক্সেসিবিলিটি সার্ভিস চালু থাকতে হবে।
                </p>

                <button
                  onClick={() => {
                    if (androidBridge.isNativeEnvironment()) {
                      androidBridge.openAccessibilitySettings();
                    } else {
                      onOpenAndroidBridge();
                    }
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-md transition-all active:scale-95"
                >
                  Enable Accessibility
                </button>
              </div>

              <div className="pt-2">
                <button
                  onClick={onOpenAndroidBridge}
                  className="w-full py-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-200 border border-purple-500/30 text-xs font-semibold transition-colors"
                >
                  ব্রিজ আর্কিটেকচার ও সাপোর্টেড কমান্ড দেখুন
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB: ABOUT ================= */}
        {activeTab === 'about' && (
          <div className="p-6 rounded-3xl bg-neutral-900/60 border border-neutral-800 space-y-4 text-center">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-purple-600 via-pink-600 to-rose-600 flex items-center justify-center shadow-lg shadow-purple-950/50 text-white font-black text-xl tracking-wider">
              AR
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-neutral-100">ARSHI AI</h3>
              <p className="text-xs text-neutral-400">সংস্করণ: 2.5 (2026 Android Edition)</p>
              <p className="text-xs text-purple-300 mt-1">"আপনার ব্যক্তিগত AI সহকারী"</p>
            </div>
            <div className="pt-3 border-t border-neutral-800 text-xs text-neutral-400 text-left space-y-2 leading-relaxed">
              <p>
                • <strong>মাল্টি-প্রোভাইডার ইঞ্জিন:</strong> OpenAI, OpenRouter, Google Gemini, Groq, DeepSeek ও Anthropic Claude সাপোর্ট।
              </p>
              <p>
                • <strong>রিয়েল ভয়েস:</strong> বাংলা ও ইংরেজি সরাসরি স্পিচ রিকগনিশন এবং প্রাকৃতিক টেক্সট-টু-স্পিচ রিডআউট।
              </p>
              <p>
                • <strong>গোপনীয়তা:</strong> কোনো থার্ড-পার্টি ট্র্যাকার নেই, সমস্ত API Key আপনার নিজের ব্রাউজারে এনক্রিপ্টেড।
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
