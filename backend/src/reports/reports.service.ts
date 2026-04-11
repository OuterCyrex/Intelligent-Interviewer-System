import {
  BadRequestException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ReportIntelligenceService } from "../llm/report-intelligence.service";
import { Repository } from "typeorm";
import { InterviewSession } from "../interviews/interview.entity";
import { InterviewTurn } from "../interviews/interview-turn.entity";
import { InterviewReport } from "./report.entity";

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(InterviewSession)
    private readonly interviewsRepository: Repository<InterviewSession>,
    @InjectRepository(InterviewTurn)
    private readonly turnsRepository: Repository<InterviewTurn>,
    @InjectRepository(InterviewReport)
    private readonly reportsRepository: Repository<InterviewReport>,
    private readonly reportIntelligenceService: ReportIntelligenceService
  ) {}

  findAll() {
    return this.reportsRepository.find({
      relations: {
        interview: true
      },
      order: {
        createdAt: "DESC"
      }
    });
  }

  async findByInterview(interviewId: string) {
    const report = await this.reportsRepository.findOne({
      where: { interviewId },
      relations: {
        interview: true
      }
    });

    if (report) {
      return report;
    }

    const interview = await this.interviewsRepository.findOneBy({ id: interviewId });
    if (!interview) {
      throw new NotFoundException(`Interview ${interviewId} not found.`);
    }
    if (interview.status !== "completed") {
      throw new BadRequestException("The report is only available after the interview is completed.");
    }

    return this.generateForInterview(interviewId);
  }

  async generateForInterview(interviewId: string) {
    const interview = await this.interviewsRepository.findOne({
      where: { id: interviewId },
      relations: {
        position: true
      }
    });

    if (!interview) {
      throw new NotFoundException(`Interview ${interviewId} not found.`);
    }

    const answeredTurns = await this.turnsRepository.find({
      where: {
        interviewId
      },
      relations: {
        question: true
      },
      order: {
        sequence: "ASC"
      }
    });

    const scoredTurns = answeredTurns.filter((turn) => turn.dimensionScores && turn.overallScore !== null);
    if (scoredTurns.length === 0) {
      throw new BadRequestException("No scored interview turns are available for report generation.");
    }

    const technicalScore = this.average(scoredTurns.map((turn) => turn.dimensionScores?.technical ?? 0));
    const communicationScore = this.average(scoredTurns.map((turn) => turn.dimensionScores?.communication ?? 0));
    const depthScore = this.average(scoredTurns.map((turn) => turn.dimensionScores?.depth ?? 0));
    const roleFitScore = this.average(scoredTurns.map((turn) => turn.dimensionScores?.roleFit ?? 0));
    const overallScore = this.average(scoredTurns.map((turn) => turn.overallScore ?? 0));
    const missedKeywords = this.collectFrequentItems(scoredTurns.flatMap((turn) => turn.missedKeywords), 3);
    const questionTypeBreakdown = this.buildQuestionTypeBreakdown(scoredTurns);
    const reportNarrative = await this.reportIntelligenceService.generateReportNarrative({
      interview: {
        id: interview.id,
        positionId: interview.positionId,
        candidateName: interview.candidateName,
        difficulty: interview.difficulty,
        mode: interview.mode,
        targetQuestionCount: interview.targetQuestionCount,
        position: {
          name: interview.position.name,
          slug: interview.position.slug,
          highlights: interview.position.highlights,
          evaluationDimensions: interview.position.evaluationDimensions
        }
      },
      metrics: {
        overallScore,
        technicalScore,
        communicationScore,
        depthScore,
        roleFitScore,
        questionTypeBreakdown,
        missedKeywords
      },
      turns: scoredTurns.map((turn) => ({
        sequence: turn.sequence,
        kind: turn.kind,
        questionType: turn.questionType,
        prompt: turn.prompt,
        answerText: turn.answerText,
        keywordHits: turn.keywordHits,
        missedKeywords: turn.missedKeywords,
        evaluationSummary: turn.evaluationSummary,
        overallScore: turn.overallScore,
        questionTopic: turn.question?.topic ?? null,
        dimensionScores: turn.dimensionScores
      })),
      retrievalContext: []
    });

    const existingReport = await this.reportsRepository.findOneBy({ interviewId });
    const report = existingReport ?? this.reportsRepository.create({ interviewId });

    report.overallScore = overallScore;
    report.technicalScore = technicalScore;
    report.communicationScore = communicationScore;
    report.depthScore = depthScore;
    report.roleFitScore = roleFitScore;
    report.summary = reportNarrative.summary;
    report.strengths = reportNarrative.strengths;
    report.improvementAreas = reportNarrative.improvementAreas;
    report.nextSteps = reportNarrative.nextSteps;
    report.questionTypeBreakdown = questionTypeBreakdown;
    report.generationSource = reportNarrative.generationSource;
    report.llmProvider = reportNarrative.llmProvider;
    report.llmModel = reportNarrative.llmModel;

    return this.reportsRepository.save(report);
  }

  private average(values: number[]) {
    return Math.round(values.reduce((total, value) => total + value, 0) / values.length);
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
  private buildQuestionTypeBreakdown(turns: InterviewTurn[]) {
    const grouped = new Map<string, { total: number; count: number }>();

    for (const turn of turns) {
      const type = turn.questionType ?? "unknown";
      const current = grouped.get(type) ?? { total: 0, count: 0 };
      current.total += turn.overallScore ?? 0;
      current.count += 1;
      grouped.set(type, current);
    }

    return Array.from(grouped.entries()).reduce<Record<string, number>>((result, [type, value]) => {
      result[type] = Math.round(value.total / value.count);
      return result;
    }, {});
  }
}
