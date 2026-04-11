import {
  BadRequestException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { InterviewSession } from "../interviews/interview.entity";
import { InterviewTurn } from "../interviews/interview-turn.entity";
import { Question } from "../questions/question.entity";
import { RagService } from "../rag/rag.service";
import { ReportsService } from "../reports/reports.service";

@Injectable()
export class RecommendationsService {
  constructor(
    @InjectRepository(InterviewSession)
    private readonly interviewsRepository: Repository<InterviewSession>,
    @InjectRepository(InterviewTurn)
    private readonly turnsRepository: Repository<InterviewTurn>,
    @InjectRepository(Question)
    private readonly questionsRepository: Repository<Question>,
    private readonly ragService: RagService,
    private readonly reportsService: ReportsService
  ) {}

  async getByInterview(interviewId: string) {
    const interview = await this.interviewsRepository.findOne({
      where: { id: interviewId },
      relations: {
        position: true,
        report: true
      }
    });

    if (!interview) {
      throw new NotFoundException(`Interview ${interviewId} not found.`);
    }

    const report = await this.reportsService.findByInterview(interviewId);
    const turns = await this.turnsRepository.find({
      where: { interviewId },
      relations: {
        question: true
      },
      order: {
        sequence: "ASC"
      }
    });

    const focusAreas = this.collectFrequentItems(turns.flatMap((turn) => turn.missedKeywords), 4);
    const effectiveFocusAreas =
      focusAreas.length > 0 ? focusAreas : interview.focusAreas.length > 0 ? interview.focusAreas : interview.position.highlights;
    const knowledgeRecommendations = await this.ragService.retrieveForFocusAreas({
      positionId: interview.positionId,
      focusAreas: effectiveFocusAreas,
      difficulty: interview.difficulty,
      limit: 4,
      fallbackToRecent: true
    });
    const practicedQuestionIds = turns
      .map((turn) => turn.questionId)
      .filter((questionId): questionId is string => Boolean(questionId));
    const practiceQuestions = await this.rankPracticeQuestions(
      interview.positionId,
      effectiveFocusAreas,
      practicedQuestionIds
    );
    const history = await this.getRecentHistory(interview.candidateName, interview.positionId);
    const latestHistory = history[0];
    const previousHistory = history[1];

    return {
      interviewId,
      candidateName: interview.candidateName,
      position: {
        id: interview.position.id,
        slug: interview.position.slug,
        name: interview.position.name
      },
      focusAreas: effectiveFocusAreas,
      latestReport: report,
      trend: {
        completedInterviews: history.length,
        latestOverallScore: latestHistory?.report?.overallScore ?? report.overallScore,
        previousOverallScore: previousHistory?.report?.overallScore ?? null,
        delta:
          latestHistory?.report && previousHistory?.report
            ? latestHistory.report.overallScore - previousHistory.report.overallScore
            : null
      },
      knowledgeRecommendations: knowledgeRecommendations.matches.map((snippet) => ({
        id: snippet.id,
        title: snippet.title,
        summary: snippet.summary,
        tags: snippet.tags,
        difficulty: snippet.difficulty,
        retrievalScore: snippet.score,
        matchedTerms: snippet.matchedTerms,
        matchedFields: snippet.matchedFields
      })),
      practiceQuestions: practiceQuestions.map((question) => ({
        id: question.id,
        topic: question.topic,
        type: question.type,
        difficulty: question.difficulty,
        content: question.content,
        expectedKeywords: question.expectedKeywords
      }))
    };
  }

  async getOverview(candidateName: string, positionId?: string) {
    const normalizedCandidateName = candidateName?.trim() ?? "";
    if (!normalizedCandidateName) {
      throw new BadRequestException("candidateName is required.");
    }

    const history = await this.getRecentHistory(normalizedCandidateName, positionId);
    if (history.length === 0) {
      return {
        candidateName: normalizedCandidateName,
        completedInterviews: 0,
        averageOverallScore: null,
        focusAreas: [],
        recentReports: []
      };
    }

    const interviewIds = history.map((interview) => interview.id);
    const turns = await this.turnsRepository.find({
      where: interviewIds.map((id) => ({ interviewId: id }))
    });
    const focusAreas = this.collectFrequentItems(turns.flatMap((turn) => turn.missedKeywords), 5);
    const reports = history
      .map((interview) => interview.report)
      .filter(
        (report): report is NonNullable<(typeof history)[number]["report"]> => Boolean(report)
      );
    const averageOverallScore =
      reports.length > 0
        ? Math.round(reports.reduce((total, report) => total + report.overallScore, 0) / reports.length)
        : null;

    return {
      candidateName: normalizedCandidateName,
      completedInterviews: history.length,
      averageOverallScore,
      focusAreas,
      recentReports: history.map((interview) => ({
        interviewId: interview.id,
        positionName: interview.position.name,
        completedAt: interview.completedAt,
        overallScore: interview.report?.overallScore ?? null,
        summary: interview.report?.summary ?? null
      }))
    };
  }

  private async getRecentHistory(candidateName: string, positionId?: string) {
    const interviews = await this.interviewsRepository.find({
      where: {
        candidateName,
        status: "completed",
        ...(positionId ? { positionId } : {})
      },
      relations: {
        position: true,
        report: true
      },
      order: {
        completedAt: "DESC",
        createdAt: "DESC"
      },
      take: 5
    });

    return interviews;
  }

  private async rankPracticeQuestions(positionId: string, focusAreas: string[], excludeIds: string[]) {
    const normalizedFocusAreas = focusAreas.map((area) => area.toLowerCase());
    const questions = await this.questionsRepository.find({
      where: {
        positionId,
        isActive: true
      },
      order: {
        createdAt: "ASC"
      }
    });

    return questions
      .filter((question) => !excludeIds.includes(question.id))
      .map((question) => {
        const haystack = [
          question.topic,
          question.content,
          ...question.expectedKeywords,
          ...question.evaluationFocus
        ]
          .join(" ")
          .toLowerCase();

        const score = normalizedFocusAreas.reduce((total, focus) => {
          return haystack.includes(focus) ? total + 1 : total;
        }, 0);

        return {
          question,
          score
        };
      })
      .sort((left, right) => right.score - left.score)
      .slice(0, 4)
      .map((item) => item.question);
  }

  private collectFrequentItems(items: string[], limit: number) {
    const counts = new Map<string, number>();

    for (const item of items) {
      const normalized = item.trim();
      if (!normalized) {
        continue;
      }
      counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
    }

    return Array.from(counts.entries())
      .sort((left, right) => right[1] - left[1])
      .slice(0, limit)
      .map(([item]) => item);
  }
}
