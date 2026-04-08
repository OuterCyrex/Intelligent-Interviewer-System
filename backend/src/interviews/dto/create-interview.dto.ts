import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import type { InterviewMode } from "../interview.entity";
import type { QuestionDifficulty } from "../../questions/question.entity";

export class CreateInterviewDto {
  @ApiProperty({ example: "a35f2be6-0000-4000-8000-111111111111" })
  positionId!: string;

  @ApiProperty({ example: "Alice" })
  candidateName!: string;

  @ApiPropertyOptional({ enum: ["text", "speech"], example: "text" })
  mode?: InterviewMode;

  @ApiPropertyOptional({ enum: ["junior", "intermediate", "senior"], example: "intermediate" })
  difficulty?: QuestionDifficulty;

  @ApiPropertyOptional({ example: 4 })
  targetQuestionCount?: number;

  @ApiPropertyOptional({ type: [String], example: ["Redis", "system design"] })
  focusAreas?: string[];
}
