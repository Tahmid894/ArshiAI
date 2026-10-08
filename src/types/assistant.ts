export type OrbState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error';

export type LanguageMode = 'bn' | 'en' | 'auto';

export type PersonalityMode = 'friendly' | 'smart' | 'professional' | 'cultural' | 'tech';

export type SpeechSpeed = 0.7 | 0.9 | 1.0 | 1.2 | 1.5;

export type AIProvider = 'openai' | 'openrouter' | 'gemini' | 'groq' | 'deepseek' | 'claude';

export interface ProviderConfig {
  enabled: boolean;
  apiKey: string;
  model: string;
  customModel?: string;
  baseUrl?: string;
}

export type ProvidersConfig = Record<AIProvider, ProviderConfig>;

export interface ActiveSettings {
  activeProvider: AIProvider;
  enableFallback: boolean;
  fallbackProvider: AIProvider;
  language: LanguageMode;
  personality: PersonalityMode;
  speechSpeed: SpeechSpeed;
  autoSpeak: boolean;
  selectedVoiceURI: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: number;
  providerUsed?: AIProvider;
  modelUsed?: string;
  isError?: boolean;
  bridgeAction?: {
    type: string;
    details: string;
    status: 'bridge_required' | 'executed';
  };
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
}

export interface DiagnosticsState {
  micPermission: 'prompt' | 'granted' | 'denied' | 'unsupported';
  speechRecognitionSupported: boolean;
  isListening: boolean;
  audioStarted: boolean;
  soundStarted: boolean;
  speechStarted: boolean;
  interimTranscript: string;
  finalTranscript: string;
  lastEvent: string;
  lastError: string | null;
  activeProvider: AIProvider;
  aiStatus: 'ready' | 'listening' | 'thinking' | 'speaking' | 'error';
}

export interface AndroidCommandResult {
  isCommand: boolean;
  commandType?: string;
  appTarget?: string;
  details?: string;
  bridgeMessage?: string;
}
