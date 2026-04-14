import { Injectable } from "@nestjs/common";
import { SpeechTranscriptionResult, SpeechTranscriptionSegment, UploadedAudioFile } from "./audio.types";

interface OpenAiTranscriptionSegmentResponse {
  start?: number;
  end?: number;
  text?: string;
  avg_logprob?: number;
  no_speech_prob?: number;
}

interface OpenAiTranscriptionJsonResponse {
  text?: string;
  language?: string;
  duration?: number;
  segments?: OpenAiTranscriptionSegmentResponse[];
  error?: {
    message?: string;
  };
}

interface DashScopeChatCompletionResponse {
  choices?: Array<{
    finish_reason?: string;
    message?: {
      audio?: {
        transcript?: string;
      };
      transcript?: string;
      content?:
        | string
        | Array<{
            type?: string;
            text?: string;
            transcript?: string;
            audio?: {
              transcript?: string;
            };
            [key: string]: unknown;
          }>;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

interface TranscribeOptions {
  language?: string;
  prompt?: string;
  temperature?: number | null;
}

@Injectable()
export class OpenAiSpeechToTextProvider {
  private readonly provider = "openai";
  private readonly baseUrl = (process.env.OPENAI_STT_BASE_URL?.trim() ||
    process.env.OPENAI_BASE_URL?.trim() ||
    "https://api.openai.com/v1").replace(/\/$/, "");
  private readonly apiKey = process.env.OPENAI_STT_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim() || "";
  private readonly model = process.env.OPENAI_STT_MODEL?.trim() || "gpt-4o-mini-transcribe";
  private readonly defaultLanguage = process.env.OPENAI_STT_LANGUAGE?.trim() || "zh";
  private readonly responseFormat = process.env.OPENAI_STT_RESPONSE_FORMAT?.trim() || "verbose_json";
  private readonly timeoutMs = Number(process.env.OPENAI_STT_TIMEOUT_MS ?? process.env.OPENAI_TIMEOUT_MS ?? 20000);
  private readonly enabled =
    (process.env.STT_ENABLED ?? (this.apiKey ? "true" : "false")).toLowerCase() === "true";

  isReady() {
    return this.enabled && Boolean(this.apiKey);
  }

  getStatus() {
    return {
      enabled: this.enabled,
      ready: this.isReady(),
      provider: this.provider,
      model: this.model,
      baseUrl: this.baseUrl,
      responseFormat: this.responseFormat,
      defaultLanguage: this.defaultLanguage
    };
  }

  async transcribeFile(file: UploadedAudioFile, options: TranscribeOptions = {}): Promise<SpeechTranscriptionResult> {
    if (!this.isReady()) {
      throw new Error("STT provider is not configured.");
    }

    const language = options.language?.trim() || this.defaultLanguage;
    if (this.shouldUseDashScopeChatCompletion()) {
      try {
        return await this.transcribeWithDashScopeChatCompletion(file, options, language || null);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const canFallback =
          message.includes("STT response did not include transcript text") ||
          message.includes("InternalError.Algo.InvalidParameter");

        if (!canFallback) {
          throw error;
        }

        console.warn(
          `[stt] DashScope chat/completions did not yield transcript, retrying via /audio/transcriptions: ${message}`
        );
        return this.transcribeWithMultipart(file, options, language || null);
      }
    }

    return this.transcribeWithMultipart(file, options, language || null);
  }

  private async transcribeWithMultipart(
    file: UploadedAudioFile,
    options: TranscribeOptions,
    fallbackLanguage: string | null
  ) {
    const prompt = options.prompt?.trim() || "";
    const form = new FormData();
    form.set("model", this.model);
    form.set(
      "file",
      new Blob([Uint8Array.from(file.buffer)], {
        type: file.mimetype || "application/octet-stream"
      }),
      file.originalname || "audio.webm"
    );
    form.set("response_format", this.responseFormat);

    if (fallbackLanguage) {
      form.set("language", fallbackLanguage);
    }
    if (prompt) {
      form.set("prompt", prompt);
    }
    if (typeof options.temperature === "number" && Number.isFinite(options.temperature)) {
      form.set("temperature", String(options.temperature));
    }

    const response = await fetch(`${this.baseUrl}/audio/transcriptions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`
      },
      body: form,
      signal: AbortSignal.timeout(this.timeoutMs)
    });

    return this.parseResponse(response, fallbackLanguage);
  }

  private async transcribeWithDashScopeChatCompletion(
    file: UploadedAudioFile,
    options: TranscribeOptions,
    fallbackLanguage: string | null
  ) {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "input_audio",
                input_audio: {
                  data: this.toDataUrl(file)
                }
              }
            ]
          }
        ],
        stream: false,
        extra_body: {
          asr_options: {
            language: fallbackLanguage || undefined,
            enable_itn: false
          }
        }
      }),
      signal: AbortSignal.timeout(this.timeoutMs)
    });

    return this.parseDashScopeChatCompletionResponse(response, fallbackLanguage);
  }

  private async parseResponse(response: Response, fallbackLanguage: string | null) {
    const contentType = response.headers.get("content-type") || "";
    const raw = await response.text();

    if (!response.ok) {
      throw new Error(this.extractErrorMessage(raw, contentType, response.status));
    }

    if (contentType.includes("application/json")) {
      const data = JSON.parse(raw) as OpenAiTranscriptionJsonResponse;
      const transcript = data.text?.trim() || "";
      if (!transcript) {
        throw new Error("STT response did not include transcript text.");
      }

      return {
        transcript,
        language: data.language?.trim() || fallbackLanguage,
        durationSeconds: this.toFiniteNumber(data.duration),
        segments: this.mapSegments(data.segments),
        provider: this.provider,
        model: this.model
      } satisfies SpeechTranscriptionResult;
    }

    const transcript = raw.trim();
    if (!transcript) {
      throw new Error("STT response body was empty.");
    }

    return {
      transcript,
      language: fallbackLanguage,
      durationSeconds: null,
      segments: [],
      provider: this.provider,
      model: this.model
    } satisfies SpeechTranscriptionResult;
  }

  private async parseDashScopeChatCompletionResponse(response: Response, fallbackLanguage: string | null) {
    const contentType = response.headers.get("content-type") || "";
    const raw = await response.text();

    if (!response.ok) {
      throw new Error(this.extractErrorMessage(raw, contentType, response.status));
    }

    const data = JSON.parse(raw) as DashScopeChatCompletionResponse;
    const firstChoice = data.choices?.[0];
    const firstMessage = firstChoice?.message;
    const content = firstMessage?.content;
    const transcriptFromContent = this.extractTextFromContent(content);
    const transcript =
      transcriptFromContent ||
      firstMessage?.audio?.transcript?.trim() ||
      firstMessage?.transcript?.trim() ||
      this.extractTranscriptFromRawJson(raw) ||
      this.findLikelyTranscript(firstMessage) ||
      this.findLikelyTranscript(data);

    const normalizedTranscript = this.normalizeTranscriptCandidate(transcript);
    if (!this.isValidTranscriptCandidate(normalizedTranscript)) {
      console.warn("[stt] DashScope response did not include transcript text.", {
        topLevelKeys: Object.keys(data || {}),
        choiceKeys: Object.keys(firstChoice || {}),
        messageKeys: Object.keys(firstMessage || {}),
        finishReason: firstChoice?.finish_reason || null,
        contentPreview: this.previewUnknown(content),
        rawPreview: raw.slice(0, 1000),
        rejectedTranscript: transcript || null
      });
      throw new Error("STT response did not include transcript text.");
    }

    return {
      transcript: normalizedTranscript,
      language: fallbackLanguage,
      durationSeconds: null,
      segments: [],
      provider: this.provider,
      model: this.model
    } satisfies SpeechTranscriptionResult;
  }

  private extractErrorMessage(raw: string, contentType: string, status: number) {
    if (contentType.includes("application/json")) {
      try {
        const data = JSON.parse(raw) as OpenAiTranscriptionJsonResponse;
        if (data.error?.message) {
          return data.error.message;
        }
      } catch {
        return `STT request failed with status ${status}.`;
      }
    }

    return raw.trim() || `STT request failed with status ${status}.`;
  }

  private mapSegments(segments: OpenAiTranscriptionSegmentResponse[] | undefined): SpeechTranscriptionSegment[] {
    return (segments ?? [])
      .map((segment) => {
        const text = segment.text?.trim() || "";
        return {
          startSeconds: this.toFiniteNumber(segment.start),
          endSeconds: this.toFiniteNumber(segment.end),
          text,
          confidence: this.toConfidence(segment.avg_logprob, segment.no_speech_prob)
        } satisfies SpeechTranscriptionSegment;
      })
      .filter((segment) => segment.text.length > 0);
  }

  private toConfidence(avgLogprob: number | undefined, noSpeechProb: number | undefined) {
    if (typeof avgLogprob !== "number" || !Number.isFinite(avgLogprob)) {
      return null;
    }

    const base = Math.exp(Math.max(-5, Math.min(0, avgLogprob)));
    const noSpeechPenalty =
      typeof noSpeechProb === "number" && Number.isFinite(noSpeechProb)
      ? 1 - Math.max(0, Math.min(1, noSpeechProb)) * 0.5
      : 1;

    return Number(Math.max(0, Math.min(1, base * noSpeechPenalty)).toFixed(3));
  }

  private toFiniteNumber(value: unknown) {
    return typeof value === "number" && Number.isFinite(value) ? value : null;
  }

  private shouldUseDashScopeChatCompletion() {
    return this.baseUrl.includes("dashscope.aliyuncs.com/compatible-mode");
  }

  private toDataUrl(file: UploadedAudioFile) {
    const mime = file.mimetype?.trim() || "application/octet-stream";
    return `data:${mime};base64,${file.buffer.toString("base64")}`;
  }

  private extractTranscriptFromRawJson(raw: string) {
    const patterns = [
      /"content"\s*:\s*"([^"]+)"/,
      /"transcript"\s*:\s*"([^"]+)"/,
      /"text"\s*:\s*"([^"]+)"/
    ];

    for (const pattern of patterns) {
      const match = raw.match(pattern);
      if (!match?.[1]) {
        continue;
      }
      try {
        return JSON.parse(`"${match[1]}"`) as string;
      } catch {
        continue;
      }
    }

    return "";
  }

  private findLikelyTranscript(value: unknown): string {
    const candidates: string[] = [];

    const visit = (node: unknown, keyHint = "") => {
      if (typeof node === "string") {
        const text = node.trim();
        if (!text) {
          return;
        }
        if (["assistant", "user", "system", this.model, this.provider].includes(text)) {
          return;
        }
        const normalizedHint = keyHint.trim().toLowerCase();
        if (
          [
            "content",
            "text",
            "transcript",
            "sentence",
            "result",
            "output_text",
            "value",
            "message",
            "answer"
          ].includes(
            normalizedHint
          ) ||
          /[\u4e00-\u9fff]/.test(text)
        ) {
          candidates.push(text);
        }
        return;
      }

      if (Array.isArray(node)) {
        for (const item of node) {
          visit(item, keyHint);
        }
        return;
      }

      if (node && typeof node === "object") {
        for (const [key, child] of Object.entries(node)) {
          visit(child, key);
        }
      }
    };

    visit(value);

    return candidates
      .filter((item) => !this.isLikelyMetadataToken(item))
      .filter((item) => !this.looksLikeOpaqueId(item))
      .sort((a, b) => b.length - a.length)
      .find((item) => item.length >= 1) || "";
  }

  private extractTextFromContent(content: unknown): string {
    if (typeof content === "string") {
      const normalized = content.trim();
      if (!normalized || this.isLikelyMetadataToken(normalized)) {
        return "";
      }
      return normalized;
    }

    if (Array.isArray(content)) {
      return content
        .map((item) => this.extractTextFromContent(item))
        .filter(Boolean)
        .join("\n")
        .trim();
    }

    if (content && typeof content === "object") {
      const record = content as Record<string, unknown>;
      const maybeText = record.text;
      if (typeof maybeText === "string" && maybeText.trim()) {
        return maybeText.trim();
      }

      const maybeTranscript = record.transcript;
      if (typeof maybeTranscript === "string" && maybeTranscript.trim()) {
        return maybeTranscript.trim();
      }

      const maybeAudioTranscript = (record.audio as { transcript?: unknown } | undefined)?.transcript;
      if (typeof maybeAudioTranscript === "string" && maybeAudioTranscript.trim()) {
        return maybeAudioTranscript.trim();
      }

      return Object.entries(record)
        .filter(([key]) => !["type", "role", "index", "id"].includes(key))
        .map(([, item]) => this.extractTextFromContent(item))
        .filter(Boolean)
        .join("\n")
        .trim();
    }

    return "";
  }

  private isLikelyMetadataToken(value: string) {
    const normalized = value.trim().toLowerCase();
    return [
      "assistant",
      "user",
      "system",
      "content",
      "text",
      "audio",
      "transcript",
      "input_audio",
      "output_text",
      "chat.completion",
      "chat.completion.chunk",
      "completion",
      "stop",
      "length",
      "tool_calls",
      "none",
      "null"
    ].includes(normalized);
  }

  private previewUnknown(value: unknown) {
    if (typeof value === "string") {
      return value.slice(0, 500);
    }
    try {
      return JSON.stringify(value).slice(0, 500);
    } catch {
      return String(value);
    }
  }

  private looksLikeOpaqueId(value: string) {
    const normalized = value.trim();
    if (!normalized) {
      return true;
    }
    if (/^[a-z0-9_-]{24,}$/i.test(normalized) && !/\s/.test(normalized)) {
      return true;
    }
    if (/^[0-9a-f]{16,}$/i.test(normalized) && !/\s/.test(normalized)) {
      return true;
    }
    return false;
  }

  private normalizeTranscriptCandidate(value: string) {
    return value.trim().replace(/\s+/g, " ");
  }

  private isValidTranscriptCandidate(value: string) {
    if (!value) {
      return false;
    }
    if (this.isLikelyMetadataToken(value) || this.looksLikeOpaqueId(value)) {
      return false;
    }

    const normalized = value.trim();
    if (/^[a-z]+(?:\.[a-z0-9_-]+)+$/i.test(normalized)) {
      return false;
    }
    if (/^[\[\]{}"':,._\-]+$/.test(normalized)) {
      return false;
    }

    return true;
  }
}
