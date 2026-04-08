import type { SpeechMetricsInput } from "../../audio/dto/process-speech.dto";

export class SubmitInterviewAnswerDto {
  turnId!: string;
  answerText?: string;
  transcript?: string;
  speechMetrics?: SpeechMetricsInput;
}
