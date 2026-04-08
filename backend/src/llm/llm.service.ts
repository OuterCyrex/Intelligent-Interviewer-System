import { Injectable } from "@nestjs/common";

type JsonSchema = Record<string, unknown>;

interface ChatCompletionMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface JsonCompletionRequest {
  schemaName: string;
  systemPrompt: string;
  userPayload: unknown;
  jsonSchema?: JsonSchema;
}

interface JsonCompletionResult<T> {
  provider: string;
  model: string;
  content: T;
}

interface OpenAiChatCompletionResponse {
  model?: string;
  choices?: Array<{
    message?: {
      content?:
        | string
        | Array<{
            type?: string;
            text?: string;
          }>
        | null;
      refusal?: string;
    };
  }>;
  error?: {
    message?: string;
  };
}

@Injectable()
export class LlmService {
  private readonly provider = process.env.LLM_PROVIDER?.trim() || "openai";
  private readonly baseUrl = (process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1").replace(/\/$/, "");
  private readonly apiKey = process.env.OPENAI_API_KEY?.trim() || "";
  private readonly model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
  private readonly temperature = Number(process.env.OPENAI_TEMPERATURE ?? 0.2);
  private readonly timeoutMs = Number(process.env.OPENAI_TIMEOUT_MS ?? 20000);
  private readonly responseFormat = process.env.OPENAI_RESPONSE_FORMAT === "json_schema" ? "json_schema" : "json_object";
  private readonly enabled =
    (process.env.LLM_ENABLED ?? (this.apiKey ? "true" : "false")).toLowerCase() === "true";

  getStatus() {
    return {
      enabled: this.enabled,
      ready: this.isReady(),
      provider: this.provider,
      model: this.model,
      baseUrl: this.baseUrl,
      responseFormat: this.responseFormat
    };
  }

  isReady() {
    return this.enabled && Boolean(this.apiKey);
  }

  async createJsonCompletion<T>(request: JsonCompletionRequest): Promise<JsonCompletionResult<T>> {
    if (!this.isReady()) {
      throw new Error("LLM provider is not configured.");
    }

    const body: Record<string, unknown> = {
      model: this.model,
      temperature: this.temperature,
      messages: this.buildMessages(request.systemPrompt, request.userPayload)
    };

    if (this.responseFormat === "json_schema" && request.jsonSchema) {
      body.response_format = {
        type: "json_schema",
        json_schema: {
          name: request.schemaName,
          strict: true,
          schema: request.jsonSchema
        }
      };
    } else {
      body.response_format = {
        type: "json_object"
      };
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.timeoutMs)
    });

    const data = (await response.json()) as OpenAiChatCompletionResponse;
    if (!response.ok) {
      throw new Error(data.error?.message || `LLM request failed with status ${response.status}.`);
    }

    const content = this.extractTextContent(data);
    const parsed = JSON.parse(this.stripMarkdownCodeFence(content)) as T;

    return {
      provider: this.provider,
      model: data.model || this.model,
      content: parsed
    };
  }

  private buildMessages(systemPrompt: string, userPayload: unknown): ChatCompletionMessage[] {
    return [
      {
        role: "system",
        content: systemPrompt
      },
      {
        role: "user",
        content: JSON.stringify(userPayload)
      }
    ];
  }

  private extractTextContent(data: OpenAiChatCompletionResponse) {
    const choice = data.choices?.[0];
    const message = choice?.message;
    if (!message) {
      throw new Error("LLM response did not include a completion choice.");
    }
    if (message.refusal) {
      throw new Error(`LLM refused the request: ${message.refusal}`);
    }

    const content = message.content;
    if (typeof content === "string") {
      return content;
    }
    if (Array.isArray(content)) {
      const text = content
        .map((item) => item.text || "")
        .join("")
        .trim();
      if (text) {
        return text;
      }
    }

    throw new Error("LLM response content was empty.");
  }

  private stripMarkdownCodeFence(content: string) {
    return content
      .trim()
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
  }
}
