export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenRouterCompletionOptions {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: 'json_object' };
}

export interface OpenRouterResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  error?: {
    message: string;
    code?: number;
    metadata?: Record<string, unknown>;
  };
}

export class OpenRouterError extends Error {
  statusCode?: number;
  responseBody?: unknown;

  constructor(message: string, statusCode?: number, responseBody?: unknown) {
    super(message);
    this.name = 'OpenRouterError';
    this.statusCode = statusCode;
    this.responseBody = responseBody;
  }
}

export class OpenRouterRateLimitError extends OpenRouterError {
  constructor(message = 'OpenRouter rate limit exceeded (429)', responseBody?: unknown) {
    super(message, 429, responseBody);
    this.name = 'OpenRouterRateLimitError';
  }
}

export class OpenRouterAuthError extends OpenRouterError {
  constructor(message = 'OpenRouter authentication failed (401)', responseBody?: unknown) {
    super(message, 401, responseBody);
    this.name = 'OpenRouterAuthError';
  }
}

export async function createChatCompletion(
  options: OpenRouterCompletionOptions
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new OpenRouterAuthError('OPENROUTER_API_KEY is not set in environment variables');
  }

  const model = options.model || process.env.OPENROUTER_MODEL || 'openrouter/auto';
  const temperature =
    options.temperature !== undefined
      ? options.temperature
      : process.env.OPENROUTER_TEMPERATURE
      ? parseFloat(process.env.OPENROUTER_TEMPERATURE)
      : 0.5;

  const payload: Record<string, unknown> = {
    model,
    messages: options.messages,
    temperature,
  };

  if (options.max_tokens) {
    payload.max_tokens = options.max_tokens;
  }

  if (options.response_format) {
    payload.response_format = options.response_format;
  }

  let response: globalThis.Response;
  try {
    response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.CLIENT_ORIGIN || 'http://localhost:3000',
        'X-Title': 'Life RPG AI Quest Generator',
      },
      body: JSON.stringify(payload),
    });
  } catch (networkError) {
    throw new OpenRouterError(
      `Failed to connect to OpenRouter: ${networkError instanceof Error ? networkError.message : String(networkError)}`
    );
  }

  let json: OpenRouterResponse;
  try {
    json = (await response.json()) as OpenRouterResponse;
  } catch (parseError) {
    throw new OpenRouterError(
      `OpenRouter returned non-JSON response with status ${response.status}`,
      response.status
    );
  }

  if (!response.ok) {
    const errorMessage =
      json?.error?.message || `OpenRouter request failed with status ${response.status}`;

    if (response.status === 429) {
      throw new OpenRouterRateLimitError(errorMessage, json);
    }
    if (response.status === 401 || response.status === 403) {
      throw new OpenRouterAuthError(errorMessage, json);
    }
    throw new OpenRouterError(errorMessage, response.status, json);
  }

  if (json.error) {
    throw new OpenRouterError(json.error.message, response.status, json);
  }

  const content = json.choices?.[0]?.message?.content;
  if (!content) {
    throw new OpenRouterError('OpenRouter returned an empty message content', response.status, json);
  }

  return content;
}
