import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import type { QuestionDifficulty } from "../../questions/question.entity";

export class RetrieveKnowledgeDto {
  @ApiProperty({ example: "a35f2be6-0000-4000-8000-111111111111" })
  positionId!: string;

  @ApiPropertyOptional({
    example: "How should I reason about Redis and MySQL consistency in a backend interview?"
  })
  query?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ["Redis", "MySQL", "cache invalidation", "retry"]
  })
  terms?: string[];

  @ApiPropertyOptional({ enum: ["junior", "intermediate", "senior"], example: "intermediate" })
  difficulty?: QuestionDifficulty;

  @ApiPropertyOptional({ example: 3, minimum: 1, maximum: 10 })
  limit?: number;

  @ApiPropertyOptional({ example: false, default: false })
  includeContent?: boolean;
}
