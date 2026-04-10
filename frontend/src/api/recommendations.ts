import type { Overview, Recommendations } from "../types/domain";
import { requestJson, toQueryString } from "../utils/request";

export function fetchRecommendationsByInterview(baseUrl: string, interviewId: string) {
  return requestJson<Recommendations>(baseUrl, `/interviews/${interviewId}/recommendations`);
}

export function fetchCandidateOverview(baseUrl: string, candidateName: string, positionId?: string) {
  const query = toQueryString({ candidateName, positionId });
  return requestJson<Overview>(baseUrl, `/recommendations${query}`);
}
