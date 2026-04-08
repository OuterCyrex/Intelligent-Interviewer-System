import type { QuestionDifficulty } from "../../questions/question.entity";

export class CreateKnowledgeDto {
  positionId!: string;
  title!: string;
  summary!: string;
  content!: string;
  tags!: string[];
  difficulty?: QuestionDifficulty;
}
