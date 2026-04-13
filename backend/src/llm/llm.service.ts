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
  onTextDelta?: (delta: string) => void;
}

interface JsonCompletionResult<T> {
  provider: string;
  model: string;
  content: T;
}

interface EmbeddingRequest {
  input: string | string[];
  model?: string;
}

interface EmbeddingResult {
  provider: string;
  model: string;
  embeddings: number[][];
}

interface LlmSelfCheckResult {
  ok: boolean;
  timestamp: string;
  checks: {
    chat: {
      ok: boolean;
      durationMs: number;
      provider: string;
      model: string;
      error?: string;
    };
    embedding: {
      ok: boolean;
      durationMs: number;
      provider: string;
      model: string;
      dimensions?: number;
      error?: string;
    };
  };
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

interface OpenAiEmbeddingResponse {
  model?: string;
  data?: Array<{
    embedding?: number[];
    index?: number;
  }>;
  error?: {
    message?: string;
  };
}

type ParsedResponse<T> = {
  data: T;
  contentType: string;
};

@Injectable()
export class LlmService {
  private readonly provider = process.env.LLM_PROVIDER?.trim() || "openai";
  private readonly baseUrl = (process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1").replace(/\/$/, "");
  private readonly embeddingBaseUrl = (process.env.OPENAI_EMBEDDING_BASE_URL?.trim() || this.baseUrl).replace(/\/$/, "");
  private readonly apiKey = process.env.OPENAI_API_KEY?.trim() || "";
  private readonly embeddingApiKey = process.env.OPENAI_EMBEDDING_API_KEY?.trim() || this.apiKey;
  private readonly model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
  private readonly embeddingModel = process.env.OPENAI_EMBEDDING_MODEL?.trim() || "text-embedding-3-small";
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
      embeddingModel: this.embeddingModel,
      baseUrl: this.baseUrl,
      embeddingBaseUrl: this.embeddingBaseUrl,
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
      messages: this.buildMessages(request.systemPrompt, request.userPayload),
      stream: Boolean(request.onTextDelta)
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

    if (request.onTextDelta) {
      const streamed = await this.readChatCompletionStream(response, request.onTextDelta);
      const parsed = JSON.parse(this.stripMarkdownCodeFence(streamed.contentText)) as T;
      return {
        provider: this.provider,
        model: streamed.model || this.model,
        content: parsed
      };
    }

    const { data } = await this.parseJsonResponse<OpenAiChatCompletionResponse>(response, "chat completion");
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

  async createEmbeddings(request: EmbeddingRequest): Promise<EmbeddingResult> {
    if (!this.isReady()) {
      throw new Error("LLM provider is not configured.");
    }

    const response = await fetch(`${this.embeddingBaseUrl}/embeddings`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.embeddingApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: request.model || this.embeddingModel,
        input: request.input
      }),
      signal: AbortSignal.timeout(this.timeoutMs)
    });

    const { data } = await this.parseJsonResponse<OpenAiEmbeddingResponse>(response, "embedding");
    if (!response.ok) {
      throw new Error(data.error?.message || `Embedding request failed with status ${response.status}.`);
    }

    const embeddings = (data.data ?? [])
      .sort((left, right) => (left.index ?? 0) - (right.index ?? 0))
      .map((item) => item.embedding ?? []);

    if (embeddings.length === 0 || embeddings.some((embedding) => embedding.length === 0)) {
      throw new Error("Embedding response did not include usable vectors.");
    }

    return {
      provider: this.provider,
      model: data.model || request.model || this.embeddingModel,
      embeddings
    };
  }

  async runSelfCheck(): Promise<LlmSelfCheckResult> {
    const timestamp = new Date().toISOString();
    if (!this.isReady()) {
      return {
        ok: false,
        timestamp,
        checks: {
          chat: {
            ok: false,
            durationMs: 0,
            provider: this.provider,
            model: this.model,
            error: "LLM provider is not configured."
          },
          embedding: {
            ok: false,
            durationMs: 0,
            provider: this.provider,
            model: this.embeddingModel,
            error: "LLM provider is not configured."
          }
        }
      };
    }

    const chatStart = Date.now();
    let chatCheck: LlmSelfCheckResult["checks"]["chat"];
    try {
      const completion = await this.createJsonCompletion<{ ok: boolean }>({
        schemaName: "llm_self_check",
        systemPrompt: "Return JSON only. Set ok=true.",
        userPayload: { task: "health-check" },
        jsonSchema: {
          type: "object",
          additionalProperties: false,
          properties: {
            ok: { type: "boolean" }
          },
          required: ["ok"]
        }
      });
      chatCheck = {
        ok: Boolean(completion.content.ok),
        durationMs: Date.now() - chatStart,
        provider: completion.provider,
        model: completion.model
      };
    } catch (error) {
      chatCheck = {
        ok: false,
        durationMs: Date.now() - chatStart,
        provider: this.provider,
        model: this.model,
        error: error instanceof Error ? error.message : String(error)
      };
    }

    const embeddingStart = Date.now();
    let embeddingCheck: LlmSelfCheckResult["checks"]["embedding"];
    try {
      const embedding = await this.createEmbeddings({ input: "health-check" });
      embeddingCheck = {
        ok: true,
        durationMs: Date.now() - embeddingStart,
        provider: embedding.provider,
        model: embedding.model,
        dimensions: embedding.embeddings[0]?.length ?? 0
      };
    } catch (error) {
      embeddingCheck = {
        ok: false,
        durationMs: Date.now() - embeddingStart,
        provider: this.provider,
        model: this.embeddingModel,
        error: error instanceof Error ? error.message : String(error)
      };
    }

    return {
      ok: chatCheck.ok && embeddingCheck.ok,
      timestamp,
      checks: {
        chat: chatCheck,
        embedding: embeddingCheck
      }
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

  private async readChatCompletionStream(response: Response, onTextDelta: (delta: string) => void) {
    if (!response.ok) {
      const { data } = await this.parseJsonResponse<OpenAiChatCompletionResponse>(response, "chat completion");
      throw new Error(data.error?.message || `LLM request failed with status ${response.status}.`);
    }

    const contentType = (response.headers.get("content-type") || "").toLowerCase();
    if (!response.body || !contentType.includes("text/event-stream")) {
      const { data } = await this.parseJsonResponse<OpenAiChatCompletionResponse>(response, "chat completion");
      const content = this.extractTextContent(data);
      if (content) {
        onTextDelta(content);
      }
      return {
        contentText: content,
        model: data.model || this.model
      };
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let contentText = "";
    let model = this.model;

    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        break;
      }
      buffer += decoder.decode(value, { stream: true });

      let boundary = buffer.indexOf("\n\n");
      while (boundary !== -1) {
        const chunk = buffer.slice(0, boundary).trim();
        buffer = buffer.slice(boundary + 2);

        const lines = chunk
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.startsWith("data:"))
          .map((line) => line.slice("data:".length).trim())
          .filter(Boolean);

        for (const line of lines) {
          if (line === "[DONE]") {
            continue;
          }
          try {
            const parsed = JSON.parse(line) as Record<string, unknown>;
            if (typeof parsed.model === "string" && parsed.model) {
              model = parsed.model;
            }
            const delta = this.extractDeltaContent(parsed);
            if (delta) {
              contentText += delta;
              onTextDelta(delta);
            }
          } catch {
            // ignore malformed chunk
          }
        }

        boundary = buffer.indexOf("\n\n");
      }
    }

    return {
      contentText,
      model
    };
  }

  private extractDeltaContent(payload: Record<string, unknown>) {
    const choices = Array.isArray(payload.choices) ? payload.choices : [];
    const first = choices[0] as Record<string, unknown> | undefined;
    if (!first) {
      return "";
    }

    const delta = (first.delta as Record<string, unknown> | undefined) ?? {};
    const message = (first.message as Record<string, unknown> | undefined) ?? {};
    const content = delta.content ?? message.content;

    if (typeof content === "string") {
      return content;
    }
    if (Array.isArray(content)) {
      return content
        .map((item) => (item as { text?: string })?.text || "")
        .join("");
    }

    return "";
  }

  private async parseJsonResponse<T>(response: Response, requestName: string): Promise<ParsedResponse<T>> {
    const contentType = (response.headers.get("content-type") || "").toLowerCase();
    const raw = await response.text();

    if (!raw.trim()) {
      throw new Error(`${requestName} response is empty (status ${response.status}).`);
    }

    if (contentType.includes("text/event-stream")) {
      const sseJson = this.extractJsonFromEventStream(raw);
      if (sseJson) {
        return {
          data: sseJson as T,
          contentType
        };
      }
      const snippet = raw.slice(0, 120).replace(/\s+/g, " ").trim();
      throw new Error(
        `${requestName} returned event-stream that could not be parsed as JSON (status ${response.status}). body: ${snippet}`
      );
    }

    if (!contentType.includes("application/json")) {
      const snippet = raw.slice(0, 120).replace(/\s+/g, " ").trim();
      throw new Error(
        `${requestName} returned non-JSON response (status ${response.status}, content-type: ${contentType || "unknown"}). body: ${snippet}`
      );
    }

    try {
      return {
        data: JSON.parse(raw) as T,
        contentType
      };
    } catch {
      const snippet = raw.slice(0, 120).replace(/\s+/g, " ").trim();
      throw new Error(
        `${requestName} returned invalid JSON (status ${response.status}). body: ${snippet}`
      );
    }
  }

  private extractJsonFromEventStream(raw: string): unknown | null {
    const trimmed = raw.trim();

    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      try {
        return JSON.parse(trimmed);
      } catch {
        return null;
      }
    }

    const dataLines = trimmed
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trim())
      .filter((line) => line && line !== "[DONE]");

    for (let i = dataLines.length - 1; i >= 0; i--) {
      const chunk = dataLines[i];
      if (chunk.startsWith("{") && chunk.endsWith("}")) {
        try {
          return JSON.parse(chunk);
        } catch {
          // ignore and continue
        }
      }
    }

    return null;
  }
}
