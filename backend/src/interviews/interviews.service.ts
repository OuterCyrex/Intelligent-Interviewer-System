import {
  Inject,
  BadRequestException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FindOptionsWhere, Repository, IsNull } from "typeorm";
import { InterviewIntelligenceService } from "../llm/interview-intelligence.service";
import { Question } from "../questions/question.entity";
import type {
  QuestionDifficulty,
  QuestionType
} from "../questions/question.entity";
import { Position } from "../positions/position.entity";
import { ReportsService } from "../reports/reports.service";
import { CreateInterviewDto } from "./dto/create-interview.dto";
import { SubmitInterviewAnswerDto } from "./dto/submit-answer.dto";
import { InterviewSession, InterviewStatus } from "./interview.entity";
import { InterviewTurn } from "./interview-turn.entity";

interface InterviewFilters {
  candidateName?: string;
  positionId?: string;
  status?: string;
}

@Injectable()
export class InterviewsService {
  constructor(
    @InjectRepository(InterviewSession)
    private readonly interviewsRepository: Repository<InterviewSession>,
    @InjectRepository(InterviewTurn)
    private readonly interviewTurnsRepository: Repository<InterviewTurn>,
    @InjectRepository(Position)
    private readonly positionsRepository: Repository<Position>,
    @InjectRepository(Question)
    private readonly questionsRepository: Repository<Question>,
    private readonly interviewIntelligenceService: InterviewIntelligenceService,
    @Inject(ReportsService)
    private readonly reportsService: ReportsService
  ) {}

  async create(createInterviewDto: CreateInterviewDto) {
    if (typeof createInterviewDto.positionId !== "string") {
      throw new BadRequestException("positionId must be a string.");
    }
    if (typeof createInterviewDto.candidateName !== "string") {
      throw new BadRequestException("candidateName must be a string.");
    }

    const positionId =
      typeof createInterviewDto.positionId === "string" ? createInterviewDto.positionId.trim() : "";
    const candidateName =
      typeof createInterviewDto.candidateName === "string"
        ? createInterviewDto.candidateName.trim()
        : "";

    if (!positionId) {
      throw new BadRequestException("positionId is required.");
    }
    if (!candidateName) {
      throw new BadRequestException("candidateName is required.");
    }

    const position = await this.positionsRepository.findOneBy({ id: positionId });
    if (!position) {
      throw new NotFoundException(`Position ${positionId} not found.`);
    }

    const difficulty = createInterviewDto.difficulty ?? position.defaultDifficulty;
    const targetQuestionCount = Math.max(
      3,
      Math.min(createInterviewDto.targetQuestionCount ?? position.defaultQuestionCount, 6)
    );
    const questions = await this.pickQuestions(position.id, difficulty, targetQuestionCount);

    if (questions.length === 0) {
      throw new BadRequestException("No active questions are available for this position.");
    }

    const interview = this.interviewsRepository.create({
      positionId: position.id,
      candidateName,
      mode: createInterviewDto.mode ?? "text",
      difficulty,
      status: "in_progress",
      focusAreas: createInterviewDto.focusAreas?.length ? createInterviewDto.focusAreas : position.highlights,
      plannedQuestionIds: questions.map((question) => question.id),
      currentQuestionIndex: 0,
      targetQuestionCount: questions.length,
      startedAt: new Date(),
      completedAt: null
    });

    const savedInterview = await this.interviewsRepository.save(interview);
    await this.createBaseTurn(savedInterview.id, questions[0], 1);

    return this.findOne(savedInterview.id);
  }

  async findAll(filters: InterviewFilters = {}) {
    const where: FindOptionsWhere<InterviewSession> = {};

    if (filters.candidateName) {
      where.candidateName = filters.candidateName;
    }
    if (filters.positionId) {
      where.positionId = filters.positionId;
    }
    if (filters.status) {
      where.status = filters.status as InterviewStatus;
    }

    const interviews = await this.interviewsRepository.find({
      where,
      relations: {
        position: true,
        report: true
      },
      order: {
        createdAt: "DESC"
      }
    });

    return Promise.all(interviews.map((interview) => this.buildInterviewView(interview)));
  }

  async findOne(id: string) {
    const interview = await this.interviewsRepository.findOne({
      where: { id },
      relations: {
        position: true,
        report: true
      }
    });

    if (!interview) {
      throw new NotFoundException(`Interview ${id} not found.`);
    }

    return this.buildInterviewView(interview);
  }

  async findActiveTurn(interviewId: string) {
    await this.ensureInterview(interviewId);
    return this.interviewTurnsRepository.findOne({
      where: {
        interviewId,
        answeredAt: IsNull()
      },
      relations: {
        question: true
      },
      order: {
        sequence: "ASC"
      }
    });
  }

  async submitAnswer(
    interviewId: string,
    submitAnswerDto: SubmitInterviewAnswerDto,
    options?: {
      onLlmTextDelta?: (delta: string) => void;
    }
  ) {
    const interview = await this.ensureInterview(interviewId);
    if (interview.status === "completed") {
      throw new BadRequestException("This interview is already completed.");
    }

    const turn = await this.interviewTurnsRepository.findOne({
      where: {
        id: submitAnswerDto.turnId,
        interviewId
      },
      relations: {
        question: true
      }
    });

    if (!turn) {
      throw new NotFoundException(`Interview turn ${submitAnswerDto.turnId} not found.`);
    }
    if (turn.answeredAt) {
      throw new BadRequestException("This turn has already been answered.");
    }
    if (!turn.question) {
      throw new BadRequestException("This interview turn is missing its source question.");
    }

    const evaluatedAnswer = await this.interviewIntelligenceService.evaluateAnswer(
      interview,
      turn.question,
      submitAnswerDto,
      options
    );

    turn.inputMode = evaluatedAnswer.inputMode;
    turn.answerText = evaluatedAnswer.normalizedAnswer;
    turn.transcript = evaluatedAnswer.transcript;
    turn.keywordHits = evaluatedAnswer.keywordHits;
    turn.missedKeywords = evaluatedAnswer.missedKeywords;
    turn.audioMetrics = evaluatedAnswer.audioMetrics;
    turn.dimensionScores = evaluatedAnswer.scores;
    turn.overallScore = evaluatedAnswer.overallScore;
    turn.evaluationSummary = evaluatedAnswer.evaluationSummary;
    turn.evaluationSource = evaluatedAnswer.evaluationSource;
    turn.llmProvider = evaluatedAnswer.llmProvider;
    turn.llmModel = evaluatedAnswer.llmModel;
    turn.needsFollowUp = evaluatedAnswer.needsFollowUp;
    turn.followUpReason = evaluatedAnswer.followUpReason;
    turn.answeredAt = new Date();
    await this.interviewTurnsRepository.save(turn);

    let nextTurn: InterviewTurn | null = null;
    let report = null;

    if (turn.kind === "base" && evaluatedAnswer.needsFollowUp && evaluatedAnswer.followUpPrompt) {
      nextTurn = await this.createFollowUpTurn(interview.id, turn, evaluatedAnswer.followUpPrompt);
    } else {
      const advanced = await this.advanceInterview(interview, turn.sequence + 1);
      nextTurn = advanced.nextTurn;
      report = advanced.report;
    }

    return {
      answeredTurn: turn,
      nextTurn,
      report,
      interview: await this.findOne(interviewId)
    };
  }

  async complete(interviewId: string) {
    const interview = await this.ensureInterview(interviewId);
    if (interview.status !== "completed") {
      interview.status = "completed";
      interview.completedAt = new Date();
      await this.interviewsRepository.save(interview);
    }

    const report = await this.reportsService.generateForInterview(interview.id);

    return {
      interview: await this.findOne(interview.id),
      report
    };
  }

  private async ensureInterview(id: string) {
    const interview = await this.interviewsRepository.findOne({
      where: { id },
      relations: {
        position: true,
        report: true
      }
    });

    if (!interview) {
      throw new NotFoundException(`Interview ${id} not found.`);
    }

    return interview;
  }

  private async buildInterviewView(interview: InterviewSession) {
    const turns = await this.interviewTurnsRepository.find({
      where: { interviewId: interview.id },
      relations: {
        question: true
      },
      order: {
        sequence: "ASC",
        createdAt: "ASC"
      }
    });

    const activeTurn = turns.find((turn) => !turn.answeredAt) ?? null;
    const answeredBaseTurns = turns.filter((turn) => turn.kind === "base" && turn.answeredAt);

    return {
      ...interview,
      turns,
      activeTurn,
      progress: {
        answeredBaseQuestions: answeredBaseTurns.length,
        targetQuestionCount: interview.targetQuestionCount,
        askedTurns: turns.length,
        completed: interview.status === "completed"
      }
    };
  }

  private async pickQuestions(positionId: string, difficulty: QuestionDifficulty, limit: number) {
    const allQuestions = await this.questionsRepository.find({
      where: {
        positionId,
        isActive: true
      },
      order: {
        createdAt: "ASC"
      }
    });

    const matchingDifficulty = allQuestions.filter((question) => question.difficulty === difficulty);
    const source = matchingDifficulty.length > 0 ? matchingDifficulty : allQuestions;
    const byType = new Map<QuestionType, Question[]>();

    for (const question of source) {
      const bucket = byType.get(question.type) ?? [];
      bucket.push(question);
      byType.set(question.type, bucket);
    }

    const orderedTypes: QuestionType[] = ["technical", "project", "scenario", "behavioral"];
    const selected: Question[] = [];

    for (const type of orderedTypes) {
      const bucket = byType.get(type);
      if (bucket?.length && selected.length < limit) {
        selected.push(bucket[0]);
      }
    }

    for (const question of source) {
      if (selected.length >= limit) {
        break;
      }
      if (!selected.some((item) => item.id === question.id)) {
        selected.push(question);
      }
    }

    return selected.slice(0, limit);
  }

  private async createBaseTurn(interviewId: string, question: Question, sequence: number) {
    const turn = this.interviewTurnsRepository.create({
      interviewId,
      questionId: question.id,
      parentTurnId: null,
      sequence,
      kind: "base",
      questionType: question.type,
      prompt: question.content,
      inputMode: null,
      answerText: null,
      transcript: null,
      keywordHits: [],
      missedKeywords: [],
      audioMetrics: null,
      dimensionScores: null,
      overallScore: null,
      evaluationSummary: null,
      evaluationSource: "heuristic",
      llmProvider: null,
      llmModel: null,
      needsFollowUp: false,
      followUpReason: null,
      answeredAt: null
    });

    return this.interviewTurnsRepository.save(turn);
  }

  private async createFollowUpTurn(interviewId: string, parentTurn: InterviewTurn, prompt: string) {
    const count = await this.interviewTurnsRepository.count({
      where: { interviewId }
    });

    const turn = this.interviewTurnsRepository.create({
      interviewId,
      questionId: parentTurn.questionId,
      parentTurnId: parentTurn.id,
      sequence: count + 1,
      kind: "follow_up",
      questionType: parentTurn.questionType,
      prompt,
      inputMode: null,
      answerText: null,
      transcript: null,
      keywordHits: [],
      missedKeywords: [],
      audioMetrics: null,
      dimensionScores: null,
      overallScore: null,
      evaluationSummary: null,
      evaluationSource: "heuristic",
      llmProvider: null,
      llmModel: null,
      needsFollowUp: false,
      followUpReason: null,
      answeredAt: null
    });

    return this.interviewTurnsRepository.save(turn);
  }

  private async advanceInterview(interview: InterviewSession, nextSequence: number) {
    const nextQuestionIndex = interview.currentQuestionIndex + 1;
    const nextQuestionId = interview.plannedQuestionIds[nextQuestionIndex];

    if (nextQuestionId) {
      const nextQuestion = await this.questionsRepository.findOneBy({ id: nextQuestionId });
      if (!nextQuestion) {
        throw new NotFoundException(`Question ${nextQuestionId} not found.`);
      }

      interview.currentQuestionIndex = nextQuestionIndex;
      await this.interviewsRepository.save(interview);

      return {
        nextTurn: await this.createBaseTurn(interview.id, nextQuestion, nextSequence),
        report: null
      };
    }

    interview.status = "completed";
    interview.completedAt = new Date();
    await this.interviewsRepository.save(interview);

    return {
      nextTurn: null,
      report: await this.reportsService.generateForInterview(interview.id)
    };
  }
}
