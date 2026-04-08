import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import type { SpeechMetricsInput } from "../../audio/dto/process-speech.dto";
import { SpeechMetricsInput as SpeechMetricsInputDto } from "../../audio/dto/process-speech.dto";

export class SubmitInterviewAnswerDto {
  @ApiProperty({ example: "b45f2be6-0000-4000-8000-222222222222" })
  turnId!: string;

  @ApiPropertyOptional({ example: "I would start with cache invalidation and then add retry plus hot-key protection." })
  answerText?: string;

  @ApiPropertyOptional({ example: "I would start with cache invalidation and then add retry plus hot-key protection." })
  transcript?: string;

  @ApiPropertyOptional({ type: () => SpeechMetricsInputDto })
  speechMetrics?: SpeechMetricsInput;
}
