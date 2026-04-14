import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class TranscribeAudioFileDto {
  @ApiProperty({
    type: "string",
    format: "binary",
    description: "Candidate answer audio file to transcribe."
  })
  file!: unknown;

  @ApiPropertyOptional({
    example: "zh",
    description: "Preferred transcription language. Defaults to zh."
  })
  language?: string;

  @ApiPropertyOptional({
    example: "请优先识别技术术语，例如 Redis、MySQL、Spring Boot。",
    description: "Optional provider prompt to improve domain term recognition."
  })
  prompt?: string;

  @ApiPropertyOptional({
    example: 0,
    description: "Optional transcription temperature. Lower values are more deterministic."
  })
  temperature?: number | string;
}
