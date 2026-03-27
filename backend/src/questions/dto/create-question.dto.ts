import { QuestionDifficulty, QuestionType } from "../question.entity";

export class CreateQuestionDto {
  positionId!: string;
  type!: QuestionType;
  difficulty!: QuestionDifficulty;
  content!: string;
  expectedKeywords!: string[];
  rubric?: string;
}
