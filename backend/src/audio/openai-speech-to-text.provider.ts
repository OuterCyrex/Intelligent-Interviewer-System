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

    if (language) {
      form.set("language", language);
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

    return this.parseResponse(response, language || null);
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
}
