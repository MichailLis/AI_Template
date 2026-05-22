import { BadGatewayException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  extractOpenRouterErrorMessage,
  filterStructuredOutputPromptModels,
  parseOpenRouterModels,
  resolveDefaultPromptModel,
} from './openrouter.utils';

const DEFAULT_OPENROUTER_TIMEOUT_MS = 120_000;

interface OpenRouterPromptRequest {
  model: string;
  prompt: string;
  temperature?: number;
  responseFormat?: 'text' | 'json';
  responseSchema?: {
    name?: string;
    strict?: boolean;
    schema: Record<string, unknown>;
  };
  requireParameters?: boolean;
  useResponseHealing?: boolean;
}

export const resolveOpenRouterTimeoutMs = (config: ConfigService, timeoutMs?: number) => {
  if (Number.isFinite(timeoutMs) && timeoutMs && timeoutMs > 0) {
    return timeoutMs;
  }

  const rawValue = config.get<string | number>('OPENROUTER_TIMEOUT_MS');
  const parsedValue =
    typeof rawValue === 'number' ? rawValue : typeof rawValue === 'string' ? Number(rawValue) : NaN;

  return Number.isFinite(parsedValue) && parsedValue > 0
    ? parsedValue
    : DEFAULT_OPENROUTER_TIMEOUT_MS;
};

const buildHeaders = (config: ConfigService, apiKey: string) => {
  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': config.get<string>('OPENROUTER_HTTP_REFERER') ?? 'http://localhost:5173',
    'X-Title': config.get<string>('OPENROUTER_APP_NAME') ?? 'AI Template Admin',
  };
};

const parseResponsePayload = async (response: Response): Promise<unknown> => {
  return response.json().catch(async () => ({ message: await response.text() }));
};

const buildPromptRequestBody = (dto: OpenRouterPromptRequest) => {
  const responseFormat = dto.responseFormat ?? 'text';

  const openRouterRequestBody: {
    model: string;
    temperature: number;
    messages: Array<{ role: 'user'; content: string }>;
    response_format?:
      | { type: 'json_object' }
      | {
          type: 'json_schema';
          json_schema: {
            name: string;
            strict: boolean;
            schema: Record<string, unknown>;
          };
        };
    provider?: {
      require_parameters?: boolean;
    };
    plugins?: Array<{ id: 'response-healing' }>;
  } = {
    model: dto.model,
    temperature: dto.temperature ?? 0.7,
    messages: [{ role: 'user', content: dto.prompt }],
  };

  if (responseFormat === 'json') {
    if (dto.responseSchema) {
      openRouterRequestBody.response_format = {
        type: 'json_schema',
        json_schema: {
          name: dto.responseSchema.name ?? 'structured_output',
          strict: dto.responseSchema.strict ?? true,
          schema: dto.responseSchema.schema,
        },
      };
    } else {
      openRouterRequestBody.response_format = { type: 'json_object' };
    }

    const requireParameters = dto.requireParameters ?? Boolean(dto.responseSchema);
    if (requireParameters) {
      openRouterRequestBody.provider = {
        require_parameters: true,
      };
    }

    const useResponseHealing = dto.useResponseHealing ?? Boolean(dto.responseSchema);
    if (useResponseHealing) {
      openRouterRequestBody.plugins = [{ id: 'response-healing' }];
    }
  }

  return {
    body: openRouterRequestBody,
    responseFormat,
  };
};

const extractCompletionOutput = (payload: {
  choices?: Array<{
    message?: {
      content?:
        | string
        | Array<{
            text?: string;
          }>;
    };
  }>;
}) => {
  const rawContent = payload.choices?.[0]?.message?.content;

  return typeof rawContent === 'string'
    ? rawContent
    : Array.isArray(rawContent)
      ? rawContent
          .map((chunk) => chunk.text ?? '')
          .join('')
          .trim()
      : '';
};

export const fetchOpenRouterModels = async (config: ConfigService, apiKey: string) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), resolveOpenRouterTimeoutMs(config));

  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: buildHeaders(config, apiKey),
      signal: controller.signal,
    });

    const payload = await parseResponsePayload(response);

    if (!response.ok) {
      const errorMessage = extractOpenRouterErrorMessage(payload);
      throw new BadGatewayException(errorMessage);
    }

    const models = filterStructuredOutputPromptModels(parseOpenRouterModels(payload));

    if (models.length === 0) {
      throw new BadGatewayException('OpenRouter returned no structured output models');
    }

    const configuredDefaultModel = config.get<string>('OPENROUTER_DEFAULT_MODEL');
    const defaultModel = resolveDefaultPromptModel(models, configuredDefaultModel);

    return {
      defaultModel,
      models,
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new BadGatewayException('OpenRouter model catalog request timeout');
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
};

export const generateOpenRouterPrompt = async (
  config: ConfigService,
  apiKey: string,
  dto: OpenRouterPromptRequest,
  options?: { timeoutMs?: number },
) => {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    resolveOpenRouterTimeoutMs(config, options?.timeoutMs),
  );
  const { body, responseFormat } = buildPromptRequestBody(dto);

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: buildHeaders(config, apiKey),
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorPayload = await parseResponsePayload(response);
      const errorMessage = extractOpenRouterErrorMessage(errorPayload);

      throw new BadGatewayException(errorMessage);
    }

    const payload = (await response.json()) as {
      choices?: Array<{
        message?: {
          content?:
            | string
            | Array<{
                text?: string;
              }>;
        };
      }>;
    };

    const output = extractCompletionOutput(payload);

    if (!output) {
      throw new BadGatewayException('OpenRouter returned an empty response');
    }

    const formattedOutput =
      responseFormat === 'json'
        ? (() => {
            try {
              return JSON.stringify(JSON.parse(output), null, 2);
            } catch {
              return output;
            }
          })()
        : output;

    return {
      model: dto.model,
      output: formattedOutput,
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new BadGatewayException('OpenRouter request timeout');
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
};
