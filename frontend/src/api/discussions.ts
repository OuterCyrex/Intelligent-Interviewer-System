import { requestJson } from "../utils/request";

export interface DiscussionItem {
  id: string;
  title: string;
  content: string;
  summary: string;
  userId: string;
  authorAccount: string;
  authorName: string;
  tag: string;
  replyCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DiscussionPageResult {
  items: DiscussionItem[];
  page: number;
  pageSize: number;
  keyword?: string;
  total: number;
  totalPages: number;
}

export interface DiscussionReplyItem {
  id: string;
  discussionId: string;
  content: string;
  userId: string;
  authorAccount: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDiscussionPayload {
  title: string;
  content: string;
  tag?: string;
}

export interface CreateDiscussionReplyPayload {
  content: string;
}

export function fetchDiscussions(baseUrl: string, page: number, pageSize: number, keyword?: string) {
  const query = new URLSearchParams();
  query.set("page", String(page));
  query.set("pageSize", String(pageSize));
  if (keyword?.trim()) {
    query.set("keyword", keyword.trim());
  }

  return requestJson<DiscussionPageResult>(
    baseUrl,
    `/discussions?${query.toString()}`
  );
}

export function createDiscussion(baseUrl: string, token: string, payload: CreateDiscussionPayload) {
  return requestJson<DiscussionItem>(baseUrl, "/discussions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
}

export function fetchDiscussionReplies(baseUrl: string, discussionId: string) {
  return requestJson<DiscussionReplyItem[]>(baseUrl, `/discussions/${discussionId}/replies`);
}

export function createDiscussionReply(
  baseUrl: string,
  token: string,
  discussionId: string,
  payload: CreateDiscussionReplyPayload
) {
  return requestJson<DiscussionReplyItem>(baseUrl, `/discussions/${discussionId}/replies`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
}
