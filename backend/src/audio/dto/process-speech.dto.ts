export interface SpeechMetricsInput {
  durationSeconds?: number;
  fillerWordCount?: number;
  averageConfidence?: number;
  averagePauseMs?: number;
}

export class ProcessSpeechDto {
  transcript!: string;
  metrics?: SpeechMetricsInput;
}
