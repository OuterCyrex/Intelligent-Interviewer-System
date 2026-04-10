import type { KnowledgeItem, Question } from "../types/domain";
import { requestJson } from "../utils/request";

export function fetchPositionQuestions(baseUrl: string, positionId: string) {
  return requestJson<Question[]>(baseUrl, `/positions/${positionId}/questions`);
}

export function fetchPositionKnowledge(baseUrl: string, positionId: string) {
  return requestJson<KnowledgeItem[]>(baseUrl, `/positions/${positionId}/knowledge`);
}
