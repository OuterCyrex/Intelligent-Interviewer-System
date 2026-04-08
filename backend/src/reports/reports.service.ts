import {
  BadRequestException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
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
    private readonly reportsRepository: Repository<InterviewReport>
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
    const strengths = this.buildStrengths({
      technicalScore,
      communicationScore,
      depthScore,
      roleFitScore
    }, scoredTurns);
    const improvementAreas = this.buildImprovementAreas({
      communicationScore,
      depthScore,
      roleFitScore
    }, missedKeywords);
    const nextSteps = this.buildNextSteps(interview.position.highlights, missedKeywords, communicationScore, depthScore);
    const questionTypeBreakdown = this.buildQuestionTypeBreakdown(scoredTurns);
    const summary = `Overall ${overallScore}/100. Strongest areas: ${strengths.slice(0, 2).join("; ")}. Main gaps: ${improvementAreas.slice(0, 2).join("; ")}.`;

    const existingReport = await this.reportsRepository.findOneBy({ interviewId });
    const report = existingReport ?? this.reportsRepository.create({ interviewId });

    report.overallScore = overallScore;
    report.technicalScore = technicalScore;
    report.communicationScore = communicationScore;
    report.depthScore = depthScore;
    report.roleFitScore = roleFitScore;
    report.summary = summary;
    report.strengths = strengths;
    report.improvementAreas = improvementAreas;
    report.nextSteps = nextSteps;
    report.questionTypeBreakdown = questionTypeBreakdown;

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

  private buildStrengths(
    scores: {
      technicalScore: number;
      communicationScore: number;
      depthScore: number;
      roleFitScore: number;
    },
    turns: InterviewTurn[]
  ) {
    const strengths: string[] = [];

    if (scores.technicalScore >= 75) {
      strengths.push("Core concepts were covered with solid technical accuracy");
    }
    if (scores.communicationScore >= 75) {
      strengths.push("Answers stayed organized and easy to follow");
    }
    if (scores.depthScore >= 75) {
      strengths.push("Reasoning included implementation detail and trade-offs");
    }
    if (scores.roleFitScore >= 75) {
      strengths.push("Examples stayed aligned with the target role");
    }

    const strongestTurn = [...turns].sort((left, right) => (right.overallScore ?? 0) - (left.overallScore ?? 0))[0];
    if (strongestTurn?.question?.topic) {
      strengths.push(`Strongest topic in this round: ${strongestTurn.question.topic}`);
    }

    return strengths.slice(0, 4);
  }

  private buildImprovementAreas(
    scores: {
      communicationScore: number;
      depthScore: number;
      roleFitScore: number;
    },
    missedKeywords: string[]
  ) {
    const improvements: string[] = [];

    if (missedKeywords.length > 0) {
      improvements.push(`Coverage was thin around ${missedKeywords.join(", ")}`);
    }
    if (scores.communicationScore < 70) {
      improvements.push("Answers need a clearer structure: approach, detail, and trade-offs");
    }
    if (scores.depthScore < 70) {
      improvements.push("Go deeper on edge cases, verification, and production concerns");
    }
    if (scores.roleFitScore < 70) {
      improvements.push("Tie answers back to the target role and realistic project context");
    }

    if (improvements.length === 0) {
      improvements.push("Keep building speed and precision under follow-up pressure");
    }

    return improvements.slice(0, 4);
  }

  private buildNextSteps(
    highlights: string[],
    missedKeywords: string[],
    communicationScore: number,
    depthScore: number
  ) {
    const steps: string[] = [];

    if (missedKeywords.length > 0) {
      steps.push(`Review ${missedKeywords[0]} and practice explaining it with a concrete example`);
    }
    if (highlights.length > 0) {
      steps.push(`Prepare one project walkthrough around ${highlights[0]}`);
    }
    if (communicationScore < 75) {
      steps.push("Rehearse longer answers out loud using a three-step structure");
    }
    if (depthScore < 75) {
      steps.push("Add trade-offs, monitoring, and fallback strategies to technical answers");
    }
    if (steps.length < 3) {
      steps.push("Run another mock interview and target a higher score on the weakest dimension");
    }

    return steps.slice(0, 4);
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
