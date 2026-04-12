// Centralized API Manager for AG3NT UI
// Handles OpenAI, OpenRouter, NVIDIA-compatible, etc.

export type Provider = 'openai' | 'openrouter' | 'custom';

export interface APIConfig {
  provider: Provider;
  baseUrl: string;
  apiKey: string;
  model: string;
  temperature: number;
  top_p: number;
  max_tokens: number;
}

export class APIManager {
  config: APIConfig;

  constructor(config: APIConfig) {
    this.config = config;
  }

  updateConfig(config: Partial<APIConfig>) {
    this.config = { ...this.config, ...config };
  }

  validateConfig(): string | null {
    if (!this.config.provider) return 'Provider required';
    if (!this.config.apiKey) return 'API key required';
    if (!this.config.model) return 'Model required';
    if (!this.config.baseUrl) return 'Base URL required';
    return null;
  }

  async testConnection(): Promise<{ ok: boolean; error?: string }> {
    try {
      const res = await this.createCompletion({
        messages: [{ role: 'user', content: 'Say "connection successful".' }],
        stream: false,
        test: true,
      });
      return { ok: !!res };
    } catch (e: any) {
      return { ok: false, error: e?.message || String(e) };
    }
  }

  async createCompletion({ messages, stream = true, test = false }: { messages: any[]; stream?: boolean; test?: boolean }) {
    const { provider, baseUrl, apiKey, model, temperature, top_p, max_tokens } = this.config;
    let url = '';
    let headers: Record<string, string> = {};
    let body: any = {};

    if (provider === 'openai' || provider === 'custom' || provider === 'openrouter') {
      url = `${baseUrl.replace(/\/$/, '')}/chat/completions`;
      headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      };
      body = {
        model,
        messages,
        max_tokens,
        stream,
        temperature,
        top_p,
      };
    } else {
      throw new Error('Unsupported provider');
    }

    const resp = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    if (!resp.ok) throw new Error(await resp.text());
    if (stream && !test) return resp.body; // caller handles stream
    return await resp.json();
  }
}

export const defaultConfig: APIConfig = {
  provider: 'openai',
  baseUrl: 'https://api.openai.com/v1',
  apiKey: '',
  model: '',
  temperature: 1,
  top_p: 1,
  max_tokens: 4096,
};
