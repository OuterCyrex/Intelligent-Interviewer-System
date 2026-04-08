import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { QuestionDifficulty, QuestionType } from "../question.entity";

export class CreateQuestionDto {
  @ApiProperty({ example: "a35f2be6-0000-4000-8000-111111111111" })
  positionId!: string;

  @ApiProperty({ enum: ["technical", "project", "scenario", "behavioral"], example: "technical" })
  type!: QuestionType;

  @ApiProperty({ enum: ["junior", "intermediate", "senior"], example: "intermediate" })
  difficulty!: QuestionDifficulty;

  @ApiProperty({ example: "How would you handle cache consistency between Redis and MySQL?" })
  content!: string;

  @ApiProperty({ example: "Cache consistency" })
  topic!: string;

  @ApiProperty({ type: [String], example: ["cache invalidation", "retry", "double delete"] })
  expectedKeywords!: string[];

  @ApiPropertyOptional({ type: [String], example: ["failure handling", "retry timing"] })
  followUpHints?: string[];

  @ApiPropertyOptional({ type: [String], example: ["Redis", "MySQL", "system design"] })
  evaluationFocus?: string[];

  @ApiPropertyOptional({ example: "Look for consistency strategy, failure handling, and production trade-offs." })
  rubric?: string;

  @ApiPropertyOptional({ example: true })
  isActive?: boolean;
}
