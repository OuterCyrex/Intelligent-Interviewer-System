import type { QuestionDifficulty } from "../../questions/question.entity";

export class UpdateKnowledgeDto {
  positionId?: string;
  title?: string;
  summary?: string;
  content?: string;
  tags?: string[];
  difficulty?: QuestionDifficulty;
}
