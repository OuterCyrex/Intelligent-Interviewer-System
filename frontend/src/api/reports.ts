import type { Report } from "../types/domain";
import { requestJson } from "../utils/request";

export interface ReportWithInterview extends Report {
  id: string;
  interviewId: string;
  createdAt?: string;
  interview?: {
    id: string;
    positionId?: string;
    candidateName: string;
    completedAt?: string;
    position?: {
      name: string;
    };
  };
}

export interface ReportPageResult {
  items: ReportWithInterview[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export function fetchReports(baseUrl: string) {
  return requestJson<ReportWithInterview[]>(baseUrl, "/reports");
}

export function fetchReportsPage(baseUrl: string, page: number, pageSize: number) {
  const query = new URLSearchParams();
  query.set("page", String(page));
  query.set("pageSize", String(pageSize));

  return requestJson<ReportPageResult>(baseUrl, `/reports?${query.toString()}`);
}

export function fetchReportByInterview(baseUrl: string, interviewId: string) {
  return requestJson<Report>(baseUrl, `/interviews/${interviewId}/report`);
}
