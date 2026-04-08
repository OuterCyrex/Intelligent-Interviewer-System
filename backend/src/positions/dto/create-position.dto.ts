import type { QuestionDifficulty } from "../../questions/question.entity";

export class CreatePositionDto {
  slug!: string;
  name!: string;
  description!: string;
  highlights!: string[];
  evaluationDimensions?: string[];
  defaultDifficulty?: QuestionDifficulty;
  defaultQuestionCount?: number;
}
