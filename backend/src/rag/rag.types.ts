import type { QuestionDifficulty } from "../questions/question.entity";

export interface RagRetrievalRequest {
  positionId: string;
  query?: string;
  terms?: string[];
  difficulty?: QuestionDifficulty;
  limit?: number;
  includeContent?: boolean;
  fallbackToRecent?: boolean;
}

export interface RagMatch {
  id: string;
  title: string;
  summary: string;
  content: string | null;
  tags: string[];
  difficulty: QuestionDifficulty;
  score: number;
  matchedTerms: string[];
  matchedFields: string[];
}

export interface RagRetrievalResult {
  positionId: string;
  query: string | null;
  normalizedTerms: string[];
  totalCandidates: number;
  matches: RagMatch[]

}
