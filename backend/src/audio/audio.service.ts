import { BadRequestException, Injectable, ServiceUnavailableException } from "@nestjs/common";
import { ProcessSpeechDto, SpeechMetricsInput } from "./dto/process-speech.dto";
import { TranscribeAudioFileDto } from "./dto/transcribe-audio.dto";
import { OpenAiSpeechToTextProvider } from "./openai-speech-to-text.provider";
import { SpeechTranscriptionSegment, UploadedAudioFile } from "./audio.types";

export interface ProcessedSpeechMetrics {
  durationSeconds: number | null;
  fillerWordCount: number;
  averageConfidence: number | null;
  averagePauseMs: number | null;
  paceWpm: number | null;
  fillerRate: number;
  clarityScore: number;
  flags: string[];
}

@Injectable()
export class AudioService {
  private readonly maxFileBytes = Number(process.env.STT_MAX_FILE_SIZE_MB ?? 25) * 1024 * 1024;
  private readonly allowedMimeTypes = new Set([
    "audio/webm",
    "audio/wav",
    "audio/x-wav",
    "audio/mpeg",
    "audio/mp4",
    "audio/aac",
    "audio/ogg",
    "audio/opus",
    "audio/flac",
    "audio/x-m4a",
    "video/webm"
  ]);

  constructor(private readonly speechToTextProvider: OpenAiSpeechToTextProvider) {}

  processSpeech(input: ProcessSpeechDto) {
    const transcript = input.transcript?.trim();
    if (!transcript) {
      throw new BadRequestException("transcript is required.");
    }

    const normalizedTranscript = transcript.replace(/\s+/g, " ");

    const wordCount = this.countWords(normalizedTranscript);
    const metrics = this.normalizeMetrics(input.metrics, wordCount);

    return {
      transcript,
      normalizedTranscript,
      wordCount,
      metrics
    };
  }

  async transcribeAudioFile(file: unknown, input: TranscribeAudioFileDto) {
    const uploadedFile = this.toUploadedAudioFile(file);
    this.validateUploadedFile(uploadedFile);

    if (!this.speechToTextProvider.isReady()) {
      throw new ServiceUnavailableException("STT provider is not configured.");
    }

    const transcription = await this.speechToTextProvider.transcribeFile(uploadedFile, {
      language: input.language,
      prompt: input.prompt,
      temperature: this.parseTemperature(input.temperature)
    });
    const processed = this.processSpeech({
      transcript: transcription.transcript,
      metrics: this.buildMetricsFromTranscription(transcription.transcript, transcription.durationSeconds, transcription.segments)
    });

    return {
      ...processed,
      language: transcription.language,
      sttProvider: transcription.provider,
      sttModel: transcription.model,
      segments: transcription.segments
    };
  }

  private normalizeMetrics(metrics: SpeechMetricsInput | undefined, wordCount: number): ProcessedSpeechMetrics {
    const durationSeconds = metrics?.durationSeconds ?? null;
    const fillerWordCount = metrics?.fillerWordCount ?? 0;
    const averageConfidence = metrics?.averageConfidence ?? null;
    const averagePauseMs = metrics?.averagePauseMs ?? null;
    const paceWpm =
      durationSeconds && durationSeconds > 0
        ? Number(((wordCount / durationSeconds) * 60).toFixed(1))
        : null;
    const fillerRate = wordCount > 0 ? Number((fillerWordCount / wordCount).toFixed(3)) : 0;

    let clarityScore = 78;
    const flags: string[] = [];

    if (paceWpm !== null && paceWpm < 90) {
      clarityScore -= 10;
      flags.push("pace_too_slow");
    } else if (paceWpm !== null && paceWpm > 185) {
      clarityScore -= 8;
      flags.push("pace_too_fast");
    }

    if (fillerRate > 0.08) {
      clarityScore -= 14;
      flags.push("many_fillers");
    } else if (fillerRate > 0.04) {
      clarityScore -= 8;
      flags.push("some_fillers");
    }

    if (averageConfidence !== null && averageConfidence < 0.72) {
      clarityScore -= 10;
      flags.push("low_stt_confidence");
    }

    if (averagePauseMs !== null && averagePauseMs > 1800) {
      clarityScore -= 6;
      flags.push("long_pauses");
    }

    if (wordCount < 18) {
      clarityScore -= 10;
      flags.push("answer_too_short");
    }

    return {
      durationSeconds,
      fillerWordCount,
      averageConfidence,
      averagePauseMs,
      paceWpm,
      fillerRate,
      clarityScore: Math.max(0, Math.min(100, Math.round(clarityScore))),
      flags
    };
  }

  private countWords(text: string) {
    const normalized = text.trim();
    if (!normalized) {
      return 0;
    }

    const latinWords = normalized.match(/[A-Za-z0-9]+(?:[._+-][A-Za-z0-9]+)*/g)?.length ?? 0;
    const hanCharacters = Array.from(normalized.matchAll(/\p{Script=Han}/gu)).length;

    return latinWords + hanCharacters;
  }

  private toUploadedAudioFile(file: unknown): UploadedAudioFile {
    if (
      !file ||
      typeof file !== "object" ||
      !("buffer" in file) ||
      !("originalname" in file) ||
      !("mimetype" in file) ||
      !("size" in file)
    ) {
      throw new BadRequestException("audio file is required.");
    }

    const uploadedFile = file as UploadedAudioFile;
    if (!Buffer.isBuffer(uploadedFile.buffer)) {
      throw new BadRequestException("uploaded audio file is invalid.");
    }

    return uploadedFile;
  }

  private validateUploadedFile(file: UploadedAudioFile) {
    if (!file.size || file.size <= 0) {
      throw new BadRequestException("uploaded audio file is empty.");
    }
    if (file.size > this.maxFileBytes) {
      throw new BadRequestException(
        `uploaded audio file exceeds the ${Math.round(this.maxFileBytes / (1024 * 1024))} MB limit.`
      );
    }

    const mimetype = file.mimetype?.trim().toLowerCase() || "";
    if (mimetype && !this.allowedMimeTypes.has(mimetype) && !mimetype.startsWith("audio/")) {
      throw new BadRequestException(`unsupported audio mimetype: ${file.mimetype}.`);
    }
  }

  private parseTemperature(value: number | string | undefined) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
    return null;
  }

  private buildMetricsFromTranscription(
    transcript: string,
    durationSeconds: number | null,
    segments: SpeechTranscriptionSegment[]
  ): SpeechMetricsInput {
    return {
      durationSeconds: durationSeconds ?? this.getDurationFromSegments(segments) ?? undefined,
      fillerWordCount: this.countFillerWords(transcript),
      averageConfidence: this.getAverageConfidence(segments) ?? undefined,
      averagePauseMs: this.getAveragePauseMs(segments) ?? undefined
    };
  }

  private countFillerWords(transcript: string) {
    const normalized = transcript.trim().toLowerCase();
    if (!normalized) {
      return 0;
    }

    const fillerPatterns = [/嗯/g, /呃/g, /额/g, /啊/g, /这个/g, /那个/g, /就是/g, /然后/g, /\bum\b/g, /\buh\b/g];

    return fillerPatterns.reduce((count, pattern) => count + (normalized.match(pattern)?.length ?? 0), 0);
  }

  private getAverageConfidence(segments: SpeechTranscriptionSegment[]) {
    const confidences = segments
      .map((segment) => segment.confidence)
      .filter((confidence): confidence is number => typeof confidence === "number" && Number.isFinite(confidence));

    if (confidences.length === 0) {
      return null;
    }

    return Number((confidences.reduce((sum, confidence) => sum + confidence, 0) / confidences.length).toFixed(3));
  }

  private getAveragePauseMs(segments: SpeechTranscriptionSegment[]) {
    const pauses: number[] = [];

    for (let index = 1; index < segments.length; index += 1) {
      const previousEnd = segments[index - 1]?.endSeconds;
      const currentStart = segments[index]?.startSeconds;
      if (typeof previousEnd !== "number" || typeof currentStart !== "number") {
        continue;
      }

      const gapMs = (currentStart - previousEnd) * 1000;
      if (gapMs > 0) {
        pauses.push(gapMs);
      }
    }

    if (pauses.length === 0) {
      return null;
    }

    return Math.round(pauses.reduce((sum, pause) => sum + pause, 0) / pauses.length);
  }

  private getDurationFromSegments(segments: SpeechTranscriptionSegment[]) {
    const endTimes = segments
      .map((segment) => segment.endSeconds)
      .filter((endSeconds): endSeconds is number => typeof endSeconds === "number" && Number.isFinite(endSeconds));

    if (endTimes.length === 0) {
      return null;
    }

    return Math.max(...endTimes);
  }
}
