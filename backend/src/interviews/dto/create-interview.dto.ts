import type { InterviewMode } from "../interview.entity";
import type { QuestionDifficulty } from "../../questions/question.entity";

export class CreateInterviewDto {
  positionId!: string;
  candidateName!: string;
  mode?: InterviewMode;
  difficulty?: QuestionDifficulty;
  targetQuestionCount?: number;
  focusAreas?: string[];
}
