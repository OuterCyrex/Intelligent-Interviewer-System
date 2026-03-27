import { QuestionDifficulty, QuestionType } from "../question.entity";

export class UpdateQuestionDto {
  positionId?: string;
  type?: QuestionType;
  difficulty?: QuestionDifficulty;
  content?: string;
  expectedKeywords?: string[];
  rubric?: string | null;
}
