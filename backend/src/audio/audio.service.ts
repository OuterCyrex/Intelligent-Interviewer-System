import { BadRequestException, Injectable } from "@nestjs/common";
import { ProcessSpeechDto, SpeechMetricsInput } from "./dto/process-speech.dto";

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
    return normalized.split(/\s+/).length;
  }
}
