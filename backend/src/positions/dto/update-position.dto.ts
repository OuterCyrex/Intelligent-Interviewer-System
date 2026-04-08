import { ApiPropertyOptional } from "@nestjs/swagger";
import type { QuestionDifficulty } from "../../questions/question.entity";

export class UpdatePositionDto {
  @ApiPropertyOptional({ example: "java-backend-engineer" })
  slug?: string;

  @ApiPropertyOptional({ example: "Java Backend Engineer" })
  name?: string;

  @ApiPropertyOptional({ example: "Backend-focused mock interviews covering Java and distributed systems." })
  description?: string;

  @ApiPropertyOptional({ type: [String], example: ["Spring Boot", "Redis", "MySQL"] })
  highlights?: string[];

  @ApiPropertyOptional({ type: [String], example: ["technical correctness", "communication"] })
  evaluationDimensions?: string[];

  @ApiPropertyOptional({ enum: ["junior", "intermediate", "senior"], example: "intermediate" })
  defaultDifficulty?: QuestionDifficulty;

  @ApiPropertyOptional({ example: 4 })
  defaultQuestionCount?: number;
}
