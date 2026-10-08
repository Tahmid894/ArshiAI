import { GoogleGenAI } from '@google/genai';
import { AIProvider, ChatMessage, PersonalityMode, ProviderConfig, ProvidersConfig } from '../types/assistant';

// Environment injected key if available
const ENV_GEMINI_KEY = typeof process !== 'undefined' && process.env?.GEMINI_API_KEY ? process.env.GEMINI_API_KEY : '';

export interface GenerateOptions {
  activeProvider: AIProvider;
  providersConfig: ProvidersConfig;
  personality: PersonalityMode;
  language: 'bn' | 'en' | 'auto';
  conversationHistory: ChatMessage[];
  enableFallback?: boolean;
  fallbackProvider?: AIProvider;
}

export interface AIResponseResult {
  text: string;
  providerUsed: AIProvider;
  modelUsed: string;
  error?: string;
  isFallbackUsed?: boolean;
}

export function getPersonalityPrompt(personality: PersonalityMode, language: 'bn' | 'en' | 'auto'): string {
  const baseIdentity = `You are "ArshiAI" (আরশী এআই), a futuristic, highly intelligent, and empathetic personal AI voice assistant designed with an Android-native spirit.
Your core identity is ArshiAI. Always identify yourself as ArshiAI when asked. Never claim to be ChatGPT, Claude, Gemini, or any other underlying model.`;

  let personaInstructions = '';
  switch (personality) {
    case 'friendly':
      personaInstructions = `Tone: Warm, enthusiastic, caring, and like a dependable close friend. Speak naturally, respectfully, and with heart. Use polite and pleasant colloquial Bengali or English.`;
      break;
    case 'smart':
      personaInstructions = `Tone: Highly articulate, sharp, agile, and insightful. Deliver direct, high-value answers with precision and clarity.`;
      break;
    case 'professional':
      personaInstructions = `Tone: Sophisticated, polished, formal, courteous, and efficient. Suitable for executives and professional daily routines.`;
      break;
    case 'cultural':
      personaInstructions = `Tone: Deeply enriched with Bengali literature, warmth, cultural heritage (রবীন্দ্রনাথ, নজরুল, লালন, বাংলা প্রবাদ ও মাধুর্য). Expressive, poetic yet modern and accessible.`;
      break;
    case 'tech':
      personaInstructions = `Tone: Expert software engineer, Android systems architect, and AI technologist. Concise, technical, giving clean explanations and syntax when appropriate.`;
      break;
  }

  const languageDirective =
    language === 'en'
      ? `Preferred Language: English. Keep answers clear, engaging, and suitable for text-to-speech voice readout.`
      : `Preferred Language: Bengali (বাংলা). বাংলা ভাষায় উত্তর দিন। কথাবার্তা যেন মুখে বলার উপযোগী এবং মিষ্টি হয় (ভয়েস অ্যাসিস্ট্যান্ট ফ্রেন্ডলি)। যদি ব্যবহারকারী ইংরেজিতে প্রশ্ন করেন, তবে ইংরেজিতে বা সাবলীল মিশ্রণে উত্তর দিতে পারেন।`;

  return `${baseIdentity}

${personaInstructions}

${languageDirective}

Voice-Friendly Output Rules:
1. Since responses may be spoken aloud via text-to-speech, keep sentences clear, punchy, and conversational.
2. Avoid excessive lists or clutter unless explicitly requested.
3. Be helpful, concise, and proactive.
4. Current year is 2026.`;
}

function formatErrorMessage(err: any): string {
  if (!err) return 'অজানা ত্রুটি';
  const msg = err.message || String(err);
  try {
    const jsonMatch = msg.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.error?.message) {
        return `${parsed.error.message} (Code: ${parsed.error.code || parsed.error.status || 'ERROR'})`;
      }
    }
  } catch {
    // ignore JSON parse fail
  }
  return msg;
}

export async function testProviderConnection(
  provider: AIProvider,
  config: ProviderConfig
): Promise<{ success: boolean; message: string; latencyMs: number }> {
  const startTime = Date.now();
  const testPrompt = 'Hello! Reply only with: "ArshiAI connection successful."';

  try {
    const key = config.apiKey?.trim() || (provider === 'gemini' ? ENV_GEMINI_KEY : '');
    if (!key) {
      return {
        success: false,
        message: 'কোনো API Key প্রদান করা হয়নি। দয়া করে API Key প্রদান করুন।',
        latencyMs: 0,
      };
    }

    switch (provider) {
      case 'gemini': {
        const ai = new GoogleGenAI({ apiKey: key });
        let modelName = config.model?.trim() || 'gemini-3.8-flash';
        if (modelName === 'gemini-2.5-flash' || modelName === 'gemini-2.0-flash' || modelName === 'gemini-1.5-flash') {
          modelName = 'gemini-3.8-flash';
        }
        const res = await ai.models.generateContent({
          model: modelName,
          contents: testPrompt,
        });
        const latency = Date.now() - startTime;
        if (res.text) {
          return { success: true, message: `সংযুক্ত সফল! মডেল: ${modelName} (${latency}ms)`, latencyMs: latency };
        }
        throw new Error('No response content');
      }

      case 'openai': {
        const modelName = config.model?.trim() || 'gpt-5-mini';
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({
            model: modelName,
            messages: [{ role: 'user', content: testPrompt }],
            max_tokens: 30,
          }),
        });

        const latency = Date.now() - startTime;
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData?.error?.message || `HTTP ${res.status}: ${res.statusText}`);
        }
        return { success: true, message: `OpenAI সংযুক্ত সফল! মডেল: ${modelName} (${latency}ms)`, latencyMs: latency };
      }

      case 'openrouter': {
        const modelName = config.model?.trim() || 'openrouter/free';
        const url = config.baseUrl || 'https://openrouter.ai/api/v1/chat/completions';
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${key}`,
            'HTTP-Referer': 'https://arshiai.local',
            'X-Title': 'ArshiAI',
          },
          body: JSON.stringify({
            model: modelName,
            messages: [{ role: 'user', content: testPrompt }],
            max_tokens: 30,
          }),
        });

        const latency = Date.now() - startTime;
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData?.error?.message || `HTTP ${res.status}: ${res.statusText}`);
        }
        return { success: true, message: `OpenRouter সংযুক্ত সফল! মডেল: ${modelName} (${latency}ms)`, latencyMs: latency };
      }

      case 'groq': {
        const modelName = config.model?.trim() || 'llama-3.3-70b-versatile';
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({
            model: modelName,
            messages: [{ role: 'user', content: testPrompt }],
            max_tokens: 30,
          }),
        });

        const latency = Date.now() - startTime;
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData?.error?.message || `HTTP ${res.status}: ${res.statusText}`);
        }
        return { success: true, message: `Groq সংযুক্ত সফল! মডেল: ${modelName} (${latency}ms)`, latencyMs: latency };
      }

      case 'deepseek': {
        const modelName = config.model?.trim() || 'deepseek-chat';
        const res = await fetch('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({
            model: modelName,
            messages: [{ role: 'user', content: testPrompt }],
            max_tokens: 30,
          }),
        });

        const latency = Date.now() - startTime;
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData?.error?.message || `HTTP ${res.status}: ${res.statusText}`);
        }
        return { success: true, message: `DeepSeek সংযুক্ত সফল! মডেল: ${modelName} (${latency}ms)`, latencyMs: latency };
      }

      case 'claude': {
        const modelName = config.model?.trim() || 'claude-3-5-sonnet-20241022';
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': key,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
          },
          body: JSON.stringify({
            model: modelName,
            messages: [{ role: 'user', content: testPrompt }],
            max_tokens: 30,
          }),
        });

        const latency = Date.now() - startTime;
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData?.error?.message || `HTTP ${res.status}: ${res.statusText}`);
        }
        return { success: true, message: `Anthropic Claude সংযুক্ত সফল! (${latency}ms)`, latencyMs: latency };
      }

      default:
        return { success: false, message: 'অজানা প্রোভাইডার।', latencyMs: 0 };
    }
  } catch (err: any) {
    const latency = Date.now() - startTime;
    return {
      success: false,
      message: `সংযোগ ত্রুটি: ${err?.message || 'অজানা ত্রুটি'}`,
      latencyMs: latency,
    };
  }
}

async function callProviderOnce(
  provider: AIProvider,
  config: ProviderConfig,
  systemPrompt: string,
  history: ChatMessage[],
  userPrompt: string
): Promise<{ text: string; model: string }> {
  const key = config.apiKey?.trim() || (provider === 'gemini' ? ENV_GEMINI_KEY : '');
  if (!key) {
    throw new Error(`${provider.toUpperCase()} API Key অনুপস্থিত। সেটিংস থেকে আপনার API Key প্রবেশ করান।`);
  }

  // Format messages
  const recentHistory = history.slice(-6); // Last 6 turns for context

  switch (provider) {
    case 'gemini': {
      let modelName = config.model?.trim() || 'gemini-3.8-flash';
      if (modelName === 'gemini-2.5-flash' || modelName === 'gemini-2.0-flash' || modelName === 'gemini-1.5-flash') {
        modelName = 'gemini-3.8-flash';
      }
      const ai = new GoogleGenAI({ apiKey: key });

      // Build conversation contents
      const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

      for (const msg of recentHistory) {
        if (msg.sender === 'user') {
          contents.push({ role: 'user', parts: [{ text: msg.text }] });
        } else if (msg.sender === 'assistant' && !msg.isError) {
          contents.push({ role: 'model', parts: [{ text: msg.text }] });
        }
      }
      contents.push({ role: 'user', parts: [{ text: userPrompt }] });

      const res = await ai.models.generateContent({
        model: modelName,
        contents,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7,
        },
      });

      if (!res.text) throw new Error('Gemini ফাঁকা উত্তর প্রদান করেছে।');
      return { text: res.text, model: modelName };
    }

    case 'openai':
    case 'openrouter':
    case 'groq':
    case 'deepseek': {
      let endpoint = 'https://api.openai.com/v1/chat/completions';
      let defaultModel = 'gpt-5-mini';
      let extraHeaders: Record<string, string> = {};

      if (provider === 'openrouter') {
        endpoint = config.baseUrl || 'https://openrouter.ai/api/v1/chat/completions';
        defaultModel = 'openrouter/free';
        extraHeaders = {
          'HTTP-Referer': 'https://arshiai.app',
          'X-Title': 'ArshiAI',
        };
      } else if (provider === 'groq') {
        endpoint = 'https://api.groq.com/openai/v1/chat/completions';
        defaultModel = 'llama-3.3-70b-versatile';
      } else if (provider === 'deepseek') {
        endpoint = 'https://api.deepseek.com/chat/completions';
        defaultModel = 'deepseek-chat';
      }

      const modelName = config.model?.trim() || defaultModel;

      const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
        { role: 'system', content: systemPrompt },
      ];

      for (const msg of recentHistory) {
        if (msg.sender === 'user') {
          messages.push({ role: 'user', content: msg.text });
        } else if (msg.sender === 'assistant' && !msg.isError) {
          messages.push({ role: 'assistant', content: msg.text });
        }
      }
      messages.push({ role: 'user', content: userPrompt });

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
          ...extraHeaders,
        },
        body: JSON.stringify({
          model: modelName,
          messages,
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        const msg = errorBody?.error?.message || `HTTP ${res.status}: ${res.statusText}`;
        throw new Error(`${provider.toUpperCase()} ত্রুটি (${res.status}): ${msg}`);
      }

      const data = await res.json();
      const reply = data?.choices?.[0]?.message?.content;
      if (!reply) throw new Error('কোনো উত্তর পাওয়া যায়নি।');
      return { text: reply, model: modelName };
    }

    case 'claude': {
      const modelName = config.model?.trim() || 'claude-3-5-sonnet-20241022';
      const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

      for (const msg of recentHistory) {
        if (msg.sender === 'user') {
          messages.push({ role: 'user', content: msg.text });
        } else if (msg.sender === 'assistant' && !msg.isError) {
          messages.push({ role: 'assistant', content: msg.text });
        }
      }
      messages.push({ role: 'user', content: userPrompt });

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: modelName,
          system: systemPrompt,
          messages,
          max_tokens: 1000,
          temperature: 0.7,
        }),
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        const msg = errorBody?.error?.message || `HTTP ${res.status}: ${res.statusText}`;
        throw new Error(`Claude ত্রুটি (${res.status}): ${msg}`);
      }

      const data = await res.json();
      const textBlock = data?.content?.find((c: any) => c.type === 'text');
      if (!textBlock?.text) throw new Error('Claude কোনো উত্তর প্রদান করেনি।');
      return { text: textBlock.text, model: modelName };
    }

    default:
      throw new Error(`অসমর্থিত প্রোভাইডার: ${provider}`);
  }
}

export async function generateArshiResponse(
  userPrompt: string,
  options: GenerateOptions
): Promise<AIResponseResult> {
  const systemPrompt = getPersonalityPrompt(options.personality, options.language);
  const primaryProvider = options.activeProvider;
  const primaryConfig = options.providersConfig[primaryProvider];

  try {
    const result = await callProviderOnce(
      primaryProvider,
      primaryConfig,
      systemPrompt,
      options.conversationHistory,
      userPrompt
    );
    return {
      text: result.text,
      providerUsed: primaryProvider,
      modelUsed: result.model,
    };
  } catch (primaryErr: any) {
    console.error(`Primary provider ${primaryProvider} failed:`, primaryErr);
    const primaryMsg = formatErrorMessage(primaryErr);

    // If fallback is enabled and fallback provider actually has an API key configured
    if (
      options.enableFallback &&
      options.fallbackProvider &&
      options.fallbackProvider !== primaryProvider
    ) {
      const fallbackProvider = options.fallbackProvider;
      const fallbackConfig = options.providersConfig[fallbackProvider];
      const hasKey = fallbackConfig.apiKey?.trim() || (fallbackProvider === 'gemini' ? ENV_GEMINI_KEY : '');

      if (hasKey) {
        try {
          const fallbackResult = await callProviderOnce(
            fallbackProvider,
            fallbackConfig,
            systemPrompt,
            options.conversationHistory,
            userPrompt
          );
          return {
            text: fallbackResult.text,
            providerUsed: fallbackProvider,
            modelUsed: fallbackResult.model,
            isFallbackUsed: true,
          };
        } catch (fallbackErr: any) {
          console.error(`Fallback provider ${fallbackProvider} also failed:`, fallbackErr);
          const fallbackMsg = formatErrorMessage(fallbackErr);
          throw new Error(
            `[${primaryProvider.toUpperCase()}] ত্রুটি: ${primaryMsg}\n(ফলব্যাক [${fallbackProvider.toUpperCase()}]: ${fallbackMsg})`
          );
        }
      }
    }

    // Explicitly throw formatted real error
    throw new Error(primaryMsg);
  }
}
