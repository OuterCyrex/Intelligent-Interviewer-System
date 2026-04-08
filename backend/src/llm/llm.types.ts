import type { ProcessedSpeechMetrics } from "../audio/audio.service";
import type { InterviewSession } from "../interviews/interview.entity";
import type { InterviewAudioMetrics, InterviewTurnScores } from "../interviews/interview-turn.entity";
import type { Position } from "../positions/position.entity";
import type { Question } from "../questions/question.entity";

export interface InterviewEvaluationResult {
  normalizedAnswer: string;
  transcript: string | null;
  inputMode: InterviewSession["mode"];
  keywordHits: string[];
  missedKeywords: string[];
  scores: InterviewTurnScores;
  overallScore: number;
  evaluationSummary: string;
  needsFollowUp: boolean;
  followUpReason: string | null;
  followUpPrompt: string | null;
  audioMetrics: InterviewAudioMetrics | null;
  evaluationSource: "llm" | "heuristic";
  llmProvider: string | null;
  llmModel: string | null;
}

export interface InterviewEvaluationRequest {
  interview: Pick<InterviewSession, "mode"> & {
    position: Pick<Position, "name" | "slug" | "highlights" | "evaluationDimensions">;
  };
  question: Pick<
    Question,
    "topic" | "type" | "difficulty" | "content" | "expectedKeywords" | "followUpHints" | "evaluationFocus" | "rubric"
  >;
  rawAnswer: string;
  transcript: string | null;
  processedSpeech: {
    transcript: string;
    normalizedTranscript: string;
    wordCount: number;
    metrics: ProcessedSpeechMetrics;
  } | null;
}
