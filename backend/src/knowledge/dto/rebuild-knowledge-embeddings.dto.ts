import { ApiPropertyOptional } from "@nestjs/swagger";
import type { QuestionDifficulty } from "../../questions/question.entity";

export class RebuildKnowledgeEmbeddingsDto {
  @ApiPropertyOptional({ example: "a35f2be6-0000-4000-8000-111111111111" })
  positionId?: string;

  @ApiPropertyOptional({ enum: ["junior", "intermediate", "senior"], example: "intermediate" })
  difficulty?: QuestionDifficulty;

  @ApiPropertyOptional({ example: 100, description: "本次最多重建多少条知识向量" })
  limit?: number;
}
