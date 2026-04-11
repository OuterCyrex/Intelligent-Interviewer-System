import { BadRequestException, Injectable } from "@nestjs/common";
import { KnowledgeService } from "../knowledge/knowledge.service";
import type { KnowledgeSnippet } from "../knowledge/knowledge.entity";
import type { QuestionDifficulty } from "../questions/question.entity";
import type { Question } from "../questions/question.entity";
import type { RagMatch, RagRetrievalRequest, RagRetrievalResult } from "./rag.types";

interface RankedSnippet extends RagMatch {
  updatedAt: number;
}

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "how",
  "i",
  "in",
  "into",
  "is",
  "it",
  "of",
  "on",
  "or",
  "that",
  "the",
  "this",
  "to",
  "we",
  "what",
  "when",
  "where",
  "would",
  "you",
  "your"
]);

@Injectable()
export class RagService {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  async retrieve(request: RagRetrievalRequest): Promise<RagRetrievalResult> {
    const positionId = request.positionId.trim();
    if (!positionId) {
      throw new BadRequestException("positionId is required.");
    }

    const limit = this.normalizeLimit(request.limit);
    const normalizedTerms = this.buildSearchTerms(request.query, request.terms);
    if (normalizedTerms.length === 0 && !request.fallbackToRecent) {
      throw new BadRequestException("At least one search term or query is required.");
    }

    const snippets = await this.knowledgeService.findAll({
      positionId,
      difficulty: request.difficulty
    });

    const ranked = snippets
      .map((snippet) => this.rankSnippet(snippet, normalizedTerms, request.includeContent ?? false))
      .filter((item) => item.score > 0)
      .sort((left, right) => this.compareMatches(left, right))
      .slice(0, limit)
      .map((item) => this.stripInternalFields(item));

    if (ranked.length > 0 || !request.fallbackToRecent) {
      return {
        positionId,
        query: request.query?.trim() || null,
        normalizedTerms,
        totalCandidates: snippets.length,
        matches: ranked
      };
    }

    const fallbackMatches = snippets
      .slice(0, limit)
      .map((snippet) => ({
        id: snippet.id,
        title: snippet.title,
        summary: snippet.summary,
        content: request.includeContent ? snippet.content : null,
        tags: snippet.tags,
        difficulty: snippet.difficulty,
        score: 0,
        matchedTerms: [],
        matchedFields: []
      }));

    return {
      positionId,
      query: request.query?.trim() || null,
      normalizedTerms,
      totalCandidates: snippets.length,
      matches: fallbackMatches
    };
  }

  async retrieveForInterviewQuestion(params: {
    positionId: string;
    difficulty?: QuestionDifficulty;
    question: Pick<Question, "topic" | "content" | "expectedKeywords" | "evaluationFocus" | "followUpHints">;
    answerText?: string | null;
    limit?: number;
  }) {
    return this.retrieve({
      positionId: params.positionId,
      difficulty: params.difficulty,
      query: `${params.question.topic}. ${params.question.content}`,
      terms: [
        ...params.question.expectedKeywords,
        ...params.question.evaluationFocus,
        ...params.question.followUpHints,
        params.answerText ?? ""
      ],
      limit: params.limit ?? 3,
      includeContent: true
    });
  }

  async retrieveForFocusAreas(params: {
    positionId: string;
    focusAreas: string[];
    difficulty?: QuestionDifficulty;
    limit?: number;
    includeContent?: boolean;
    fallbackToRecent?: boolean;
  }) {
    return this.retrieve({
      positionId: params.positionId,
      query: params.focusAreas.join(", "),
      terms: params.focusAreas,
      difficulty: params.difficulty,
      limit: params.limit ?? 4,
      includeContent: params.includeContent ?? false,
      fallbackToRecent: params.fallbackToRecent ?? false
    });
  }

  private normalizeLimit(limit?: number) {
    if (!Number.isFinite(limit)) {
      return 3;
    }

    return Math.max(1, Math.min(Math.trunc(limit ?? 3), 10));
  }

  private buildSearchTerms(query?: string, terms?: string[]) {
    const phraseTerms = (terms ?? [])
      .flatMap((term) => [term, ...this.tokenize(term)])
      .concat(query ? this.tokenize(query) : [])
      .map((term) => this.normalizeTerm(term))
      .filter(Boolean) as string[];

    return Array.from(new Set(phraseTerms)).slice(0, 24);
  }

  private tokenize(input: string) {
    const normalized = input.toLowerCase();
    const tokens = normalized.match(/[a-z0-9][a-z0-9+#.-]*/g) ?? [];

    return tokens.filter((token) => token.length > 1 && !STOP_WORDS.has(token));
  }

  private normalizeTerm(term: string) {
    const normalized = term.trim().toLowerCase().replace(/\s+/g, " ");
    if (!normalized || STOP_WORDS.has(normalized)) {
      return "";
    }
    return normalized;
  }

  private rankSnippet(
    snippet: KnowledgeSnippet,
    normalizedTerms: string[],
    includeContent: boolean
  ): RankedSnippet {
    const normalizedTags = snippet.tags.map((tag) => this.normalizeTerm(tag)).filter(Boolean);
    const fields = {
      title: snippet.title.toLowerCase(),
      summary: snippet.summary.toLowerCase(),
      content: snippet.content.toLowerCase()
    };

    let score = 0;
    const matchedTerms = new Set<string>();
    const matchedFields = new Set<string>();

    for (const term of normalizedTerms) {
      let termScore = 0;

      if (normalizedTags.some((tag) => tag === term)) {
        termScore += 8;
        matchedFields.add("tags");
      } else if (normalizedTags.some((tag) => tag.includes(term))) {
        termScore += 5;
        matchedFields.add("tags");
      }

      if (fields.title.includes(term)) {
        termScore += 5;
        matchedFields.add("title");
      }
      if (fields.summary.includes(term)) {
        termScore += 3;
        matchedFields.add("summary");
      }
      if (fields.content.includes(term)) {
        termScore += 2;
        matchedFields.add("content");
      }

      if (termScore > 0) {
        score += termScore;
        matchedTerms.add(term);
      }
    }

    if (matchedTerms.size >= 2) {
      score += matchedTerms.size;
    }

    return {
      id: snippet.id,
      title: snippet.title,
      summary: snippet.summary,
      content: includeContent ? snippet.content : null,
      tags: snippet.tags,
      difficulty: snippet.difficulty,
      score,
      matchedTerms: Array.from(matchedTerms),
      matchedFields: Array.from(matchedFields),
      updatedAt: snippet.updatedAt.getTime()
    };
  }

  private compareMatches(left: RankedSnippet, right: RankedSnippet) {
    return (
      right.score - left.score ||
      right.matchedTerms.length - left.matchedTerms.length ||
      right.updatedAt - left.updatedAt
    );
  }

  private stripInternalFields(match: RankedSnippet): RagMatch {
    return {
      id: match.id,
      title: match.title,
      summary: match.summary,
      content: match.content,
      tags: match.tags,
      difficulty: match.difficulty,
      score: match.score,
      matchedTerms: match.matchedTerms,
      matchedFields: match.matchedFields
    };
  }
}
