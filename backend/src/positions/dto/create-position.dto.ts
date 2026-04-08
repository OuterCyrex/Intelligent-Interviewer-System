import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import type { QuestionDifficulty } from "../../questions/question.entity";

export class CreatePositionDto {
  @ApiProperty({ example: "java-backend-engineer" })
  slug!: string;

  @ApiProperty({ example: "Java Backend Engineer" })
  name!: string;

  @ApiProperty({ example: "Backend-focused mock interviews covering Java and distributed systems." })
  description!: string;

  @ApiProperty({ type: [String], example: ["Spring Boot", "Redis", "MySQL"] })
  highlights!: string[];

  @ApiPropertyOptional({ type: [String], example: ["technical correctness", "communication"] })
  evaluationDimensions?: string[];

  @ApiPropertyOptional({ enum: ["junior", "intermediate", "senior"], example: "intermediate" })
  defaultDifficulty?: QuestionDifficulty;

  @ApiPropertyOptional({ example: 4 })
  defaultQuestionCount?: number;
}
