import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import type { QuestionDifficulty } from "../../questions/question.entity";

export class CreateKnowledgeDto {
  @ApiProperty({ example: "a35f2be6-0000-4000-8000-111111111111" })
  positionId!: string;

  @ApiProperty({ example: "Cache and database consistency patterns" })
  title!: string;

  @ApiProperty({ example: "Common options for keeping Redis and MySQL aligned under write pressure." })
  summary!: string;

  @ApiProperty({ example: "Cover cache invalidation timing, delayed double delete, idempotent retry, and hot key protection." })
  content!: string;

  @ApiProperty({ type: [String], example: ["Redis", "MySQL", "cache invalidation"] })
  tags!: string[];

  @ApiPropertyOptional({ enum: ["junior", "intermediate", "senior"], example: "intermediate" })
  difficulty?: QuestionDifficulty;
}
