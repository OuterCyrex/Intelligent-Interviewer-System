import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class SpeechMetricsInput {
  @ApiPropertyOptional({ example: 42, description: "Audio duration in seconds." })
  durationSeconds?: number;

  @ApiPropertyOptional({ example: 3, description: "Detected filler word count." })
  fillerWordCount?: number;

  @ApiPropertyOptional({ example: 0.93, description: "Average STT confidence score." })
  averageConfidence?: number;

  @ApiPropertyOptional({ example: 480, description: "Average pause length in milliseconds." })
  averagePauseMs?: number;
}

export class ProcessSpeechDto {
  @ApiProperty({
    example: "I would first isolate the bottleneck and then verify the system metrics before rolling out a fix."
  })
  transcript!: string;

  @ApiPropertyOptional({ type: () => SpeechMetricsInput })
  metrics?: SpeechMetricsInput;
}
