import { ActiveSettings, AIProvider, Conversation, ProvidersConfig } from '../types/assistant';

const SETTINGS_KEY = 'arshi_ai_settings_v1';
const PROVIDERS_KEY = 'arshi_ai_providers_v1';
const CONVERSATIONS_KEY = 'arshi_ai_conversations_v1';
const CURRENT_CONV_ID_KEY = 'arshi_ai_current_conv_id_v1';
const HAS_SEEN_WELCOME_KEY = 'arshi_ai_has_seen_welcome_v1';

export const DEFAULT_PROVIDERS: ProvidersConfig = {
  openai: {
    enabled: true,
    apiKey: '',
    model: 'gpt-5-mini',
  },
  openrouter: {
    enabled: true,
    apiKey: '',
    model: 'openrouter/free',
    baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
  },
  gemini: {
    enabled: true,
    apiKey: '',
    model: 'gemini-3.8-flash',
  },
  groq: {
    enabled: true,
    apiKey: '',
    model: 'llama-3.3-70b-versatile',
  },
  deepseek: {
    enabled: true,
    apiKey: '',
    model: 'deepseek-chat',
  },
  claude: {
    enabled: true,
    apiKey: '',
    model: 'claude-3-5-sonnet-20241022',
  },
};

export const DEFAULT_SETTINGS: ActiveSettings = {
  activeProvider: 'gemini',
  enableFallback: false,
  fallbackProvider: 'openrouter',
  language: 'bn',
  personality: 'friendly',
  speechSpeed: 1.0,
  autoSpeak: true,
  selectedVoiceURI: '',
};

export function getStoredSettings(): ActiveSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveStoredSettings(settings: ActiveSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings to localStorage:', err);
  }
}

export function getStoredProviders(): ProvidersConfig {
  try {
    const raw = localStorage.getItem(PROVIDERS_KEY);
    if (!raw) return DEFAULT_PROVIDERS;
    const parsed = JSON.parse(raw);
    const geminiConfig = { ...DEFAULT_PROVIDERS.gemini, ...(parsed.gemini || {}) };
    if (!geminiConfig.model || geminiConfig.model === 'gemini-2.5-flash' || geminiConfig.model === 'gemini-2.0-flash') {
      geminiConfig.model = 'gemini-3.8-flash';
    }
    return {
      openai: { ...DEFAULT_PROVIDERS.openai, ...(parsed.openai || {}) },
      openrouter: { ...DEFAULT_PROVIDERS.openrouter, ...(parsed.openrouter || {}) },
      gemini: geminiConfig,
      groq: { ...DEFAULT_PROVIDERS.groq, ...(parsed.groq || {}) },
      deepseek: { ...DEFAULT_PROVIDERS.deepseek, ...(parsed.deepseek || {}) },
      claude: { ...DEFAULT_PROVIDERS.claude, ...(parsed.claude || {}) },
    };
  } catch {
    return DEFAULT_PROVIDERS;
  }
}

export function saveStoredProviders(providers: ProvidersConfig): void {
  try {
    localStorage.setItem(PROVIDERS_KEY, JSON.stringify(providers));
  } catch (err) {
    console.error('Failed to save providers to localStorage:', err);
  }
}

export function getStoredConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(CONVERSATIONS_KEY);
    if (!raw) {
      const initialConv: Conversation = {
        id: 'conv-' + Date.now(),
        title: 'নতুন কথোপকথন',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [
          {
            id: 'msg-init',
            sender: 'assistant',
            text: 'হ্যালো! আমি ArshiAI (আরশী এআই)। আপনার ব্যক্তিগত ভয়েস ও স্মার্ট সহকারী। আমি আপনাকে কীভাবে সাহায্য করতে পারি?',
            timestamp: Date.now(),
          },
        ],
      };
      saveStoredConversations([initialConv]);
      return [initialConv];
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveStoredConversations(conversations: Conversation[]): void {
  try {
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
  } catch (err) {
    console.error('Failed to save conversations to localStorage:', err);
  }
}

export function getCurrentConversationId(): string | null {
  return localStorage.getItem(CURRENT_CONV_ID_KEY);
}

export function setCurrentConversationId(id: string): void {
  localStorage.setItem(CURRENT_CONV_ID_KEY, id);
}

export function getHasSeenWelcome(): boolean {
  return localStorage.getItem(HAS_SEEN_WELCOME_KEY) === 'true';
}

export function setHasSeenWelcome(seen: boolean): void {
  localStorage.setItem(HAS_SEEN_WELCOME_KEY, seen ? 'true' : 'false');
}

export function maskApiKey(key: string): string {
  if (!key || key.trim().length === 0) return '';
  const trimmed = key.trim();
  if (trimmed.length <= 8) {
    return '••••••••';
  }
  const prefix = trimmed.slice(0, 3);
  const suffix = trimmed.slice(-4);
  return `${prefix}••••••••${suffix}`;
}
