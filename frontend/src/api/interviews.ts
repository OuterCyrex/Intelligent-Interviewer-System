import type { Difficulty, InterviewMode, InterviewTurn, InterviewView, SpeechMetrics } from "../types/domain";
import { requestJson } from "../utils/request";

export interface CreateInterviewPayload {
  positionId: string;
  candidateName: string;
  mode: InterviewMode;
  difficulty?: Difficulty;
  targetQuestionCount: number;
  focusAreas?: string[];
}

export interface SubmitAnswerPayload {
  turnId: string;
  answerText?: string;
  transcript?: string;
  speechMetrics?: Partial<SpeechMetrics>;
}

export interface SubmitAnswerResponse {
  answeredTurn: InterviewTurn;
  interview: InterviewView;
}

export function createInterview(baseUrl: string, payload: CreateInterviewPayload) {
  return requestJson<InterviewView>(baseUrl, "/interviews", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function fetchInterview(baseUrl: string, interviewId: string) {
  return requestJson<InterviewView>(baseUrl, `/interviews/${interviewId}`);
}

export function submitInterviewAnswer(baseUrl: string, interviewId: string, payload: SubmitAnswerPayload) {
  return requestJson<SubmitAnswerResponse>(baseUrl, `/interviews/${interviewId}/answers`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function completeInterview(baseUrl: string, interviewId: string) {
  return requestJson<{ interview: InterviewView }>(baseUrl, `/interviews/${interviewId}/complete`, {
    method: "POST"
  });
}
