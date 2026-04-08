import { QuestionDifficulty, QuestionType } from "../question.entity";

export class UpdateQuestionDto {
  positionId?: string;
  type?: QuestionType;
  difficulty?: QuestionDifficulty;
  content?: string;
  topic?: string;
  expectedKeywords?: string[];
  followUpHints?: string[];
  evaluationFocus?: string[];
  rubric?: string | null;
  isActive?: boolean;
}
