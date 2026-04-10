import type { Report } from "../types/domain";
import { requestJson } from "../utils/request";

export interface ReportWithInterview extends Report {
  id: string;
  interviewId: string;
  createdAt?: string;
  interview?: {
    id: string;
    candidateName: string;
    completedAt?: string;
    position?: {
      name: string;
    };
  };
}

export function fetchReports(baseUrl: string) {
  return requestJson<ReportWithInterview[]>(baseUrl, "/reports");
}

export function fetchReportByInterview(baseUrl: string, interviewId: string) {
  return requestJson<Report>(baseUrl, `/interviews/${interviewId}/report`);
}
