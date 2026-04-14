import { requestJson } from "../utils/request";
import type { SpeechMetrics, SpeechTranscriptionSegment } from "../types/domain";

export interface TranscribeAudioPayload {
  file: File;
  language?: string;
  prompt?: string;
  temperature?: number;
}

export interface TranscribeAudioResponse {
  transcript: string;
  normalizedTranscript: string;
  wordCount: number;
  metrics: SpeechMetrics;
  language: string | null;
  sttProvider: string;
  sttModel: string;
  segments: SpeechTranscriptionSegment[];
}

export function transcribeAudioFile(baseUrl: string, payload: TranscribeAudioPayload) {
  const form = new FormData();
  form.set("file", payload.file, payload.file.name);

  if (payload.language?.trim()) {
    form.set("language", payload.language.trim());
  }
  if (payload.prompt?.trim()) {
    form.set("prompt", payload.prompt.trim());
  }
  if (typeof payload.temperature === "number" && Number.isFinite(payload.temperature)) {
    form.set("temperature", String(payload.temperature));
  }

  return requestJson<TranscribeAudioResponse>(baseUrl, "/audio/transcriptions/file", {
    method: "POST",
    body: form
  });
}
