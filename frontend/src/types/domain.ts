export type Difficulty = "junior" | "intermediate" | "senior";
export type InterviewMode = "text" | "speech";

export interface Position {
  id: string;
  slug: string;
  name: string;
  description: string;
  highlights: string[];
  defaultDifficulty: Difficulty;
}

export interface Question {
  id: string;
  topic: string;
  type: string;
  difficulty: Difficulty;
  content: string;
  expectedKeywords: string[];
}

export interface KnowledgeItem {
  id: string;
  title: string;
  summary: string;
  difficulty: Difficulty;
  tags: string[];
}

export interface InterviewTurn {
  id: string;
  sequence?: number;
  prompt?: string;
  answerText?: string | null;
  answeredAt?: string | null;
  evaluationSummary?: string;
  overallScore?: number;
  evaluationSource?: "heuristic" | "llm";
}

export interface InterviewView {
  id: string;
  positionId?: string;
  candidateName: string;
  status: "in_progress" | "completed";
  completedAt?: string | null;
  position?: {
    id: string;
    name: string;
    slug?: string;
  } | null;
  progress?: {
    answeredBaseQuestions: number;
    targetQuestionCount: number;
    askedTurns: number;
    completed: boolean;
  };
  turns?: InterviewTurn[];
  activeTurn?: InterviewTurn | null;
}

export interface Report {
  overallScore: number;
  technicalScore: number;
  communicationScore: number;
  depthScore: number;
  roleFitScore: number;
  summary: string;
  strengths: string[];
  improvementAreas: string[];
  nextSteps: string[];
  generationSource?: "heuristic" | "llm";
  llmProvider?: string | null;
  llmModel?: string | null;
}

export interface Recommendations {
  focusAreas: string[];
  trend?: {
    completedInterviews: number;
    latestOverallScore: number | null;
    previousOverallScore: number | null;
    delta: number | null;
  };
  knowledgeRecommendations: Array<{ id: string; title: string; summary: string; difficulty: Difficulty }>;
  practiceQuestions: Array<{ id: string; topic: string; type: string; difficulty: Difficulty }>;
}

export interface Overview {
  candidateName: string;
  completedInterviews: number;
  averageOverallScore: number | null;
  focusAreas: string[];
}

