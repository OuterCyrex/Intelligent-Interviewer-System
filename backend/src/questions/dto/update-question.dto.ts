import { ApiPropertyOptional } from "@nestjs/swagger";
import { QuestionDifficulty, QuestionType } from "../question.entity";

export class UpdateQuestionDto {
  @ApiPropertyOptional({ example: "a35f2be6-0000-4000-8000-111111111111" })
  positionId?: string;

  @ApiPropertyOptional({ enum: ["technical", "project", "scenario", "behavioral"], example: "technical" })
  type?: QuestionType;

  @ApiPropertyOptional({ enum: ["junior", "intermediate", "senior"], example: "intermediate" })
  difficulty?: QuestionDifficulty;

  @ApiPropertyOptional({ example: "How would you handle cache consistency between Redis and MySQL?" })
  content?: string;

  @ApiPropertyOptional({ example: "Cache consistency" })
  topic?: string;

  @ApiPropertyOptional({ type: [String], example: ["cache invalidation", "retry", "double delete"] })
  expectedKeywords?: string[];

  @ApiPropertyOptional({ type: [String], example: ["failure handling", "retry timing"] })
  followUpHints?: string[];

  @ApiPropertyOptional({ type: [String], example: ["Redis", "MySQL", "system design"] })
  evaluationFocus?: string[];

  @ApiPropertyOptional({ nullable: true, example: "Look for consistency strategy, failure handling, and production trade-offs." })
  rubric?: string | null;

  @ApiPropertyOptional({ example: true })
  isActive?: boolean;
}
