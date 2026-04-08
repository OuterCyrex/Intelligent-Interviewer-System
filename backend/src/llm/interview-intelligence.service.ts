import { BadRequestException, Injectable } from "@nestjs/common";
import { AudioService } from "../audio/audio.service";
import { SubmitInterviewAnswerDto } from "../interviews/dto/submit-answer.dto";
import { InterviewSession } from "../interviews/interview.entity";
import type { InterviewAudioMetrics } from "../interviews/interview-turn.entity";
import { Question } from "../questions/question.entity";
import type { QuestionType } from "../questions/question.entity";
import { InterviewEvaluationRequest, InterviewEvaluationResult } from "./llm.types";
import { LlmService } from "./llm.service";

interface LlmInterviewEvaluationPayload {
  keywordHits?: string[];
  missedKeywords?: string[];
  scores?: {
    technical?: number;
    communication?: number;
    depth?: number;
    roleFit?: number;
  };
  overallScore?: number;
  evaluationSummary?: string;
  needsFollowUp?: boolean;
  followUpReason?: string | null;
  followUpPrompt?: string | null;
}

const INTERVIEW_EVALUATION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    keywordHits: {
      type: "array",
      items: { type: "string" }
    },
    missedKeywords: {
      type: "array",
      items: { type: "string" }
    },
    scores: {
      type: "object",
      additionalProperties: false,
      properties: {
        technical: { type: "integer", minimum: 0, maximum: 100 },
        communication: { type: "integer", minimum: 0, maximum: 100 },
        depth: { type: "integer", minimum: 0, maximum: 100 },
        roleFit: { type: "integer", minimum: 0, maximum: 100 }
      },
      required: ["technical", "communication", "depth", "roleFit"]
    },
    overallScore: { type: "integer", minimum: 0, maximum: 100 },
    evaluationSummary: { type: "string" },
    needsFollowUp: { type: "boolean" },
    followUpReason: { type: ["string", "null"] },
    followUpPrompt: { type: ["string", "null"] }
  },
  required: [
    "keywordHits",
    "missedKeywords",
    "scores",
    "overallScore",
    "evaluationSummary",
    "needsFollowUp",
    "followUpReason",
    "followUpPrompt"
  ]
} satisfies Record<string, unknown>;

@Injectable()
export class InterviewIntelligenceService {
  constructor(
    private readonly audioService: AudioService,
    private readonly llmService: LlmService
  ) {}

  async evaluateAnswer(
    interview: InterviewSession,
    question: Question,
    submitAnswerDto: SubmitInterviewAnswerDto
  ): Promise<InterviewEvaluationResult> {
    const rawAnswer = submitAnswerDto.answerText?.trim() || submitAnswerDto.transcript?.trim() || "";
    if (!rawAnswer) {
      throw new BadRequestException("An answerText or transcript is required.");
    }

    const processedSpeech =
      interview.mode === "speech" || submitAnswerDto.transcript
        ? this.audioService.processSpeech({
            transcript: submitAnswerDto.transcript?.trim() ?? rawAnswer,
            metrics: submitAnswerDto.speechMetrics
          })
        : null;

    const request: InterviewEvaluationRequest = {
      interview: {
        mode: interview.mode,
        position: {
          name: interview.position.name,
          slug: interview.position.slug,
          highlights: interview.position.highlights,
          evaluationDimensions: interview.position.evaluationDimensions
        }
      },
      question: {
        topic: question.topic,
        type: question.type,
        difficulty: question.difficulty,
        content: question.content,
        expectedKeywords: question.expectedKeywords,
        followUpHints: question.followUpHints,
        evaluationFocus: question.evaluationFocus,
        rubric: question.rubric
      },
      rawAnswer,
      transcript: submitAnswerDto.transcript?.trim() ?? null,
      processedSpeech
    };

    if (this.llmService.isReady()) {
      try {
        return await this.evaluateWithLlm(request);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`LLM evaluation failed, falling back to heuristics: ${message}`);
      }
    }

    return this.evaluateHeuristically(request);
  }

  private async evaluateWithLlm(request: InterviewEvaluationRequest): Promise<InterviewEvaluationResult> {
    const normalizedAnswer = (request.processedSpeech?.normalizedTranscript ?? request.rawAnswer).replace(/\s+/g, " ");
    const llmResponse = await this.llmService.createJsonCompletion<LlmInterviewEvaluationPayload>({
      schemaName: "interview_answer_evaluation",
      systemPrompt: [
        "You are evaluating a mock interview answer for a computer-science interview backend.",
        "Return JSON only.",
        "Score four dimensions from 0 to 100 as integers: technical, communication, depth, roleFit.",
        "Only mark keywordHits from the provided expectedKeywords list.",
        "Be conservative and grounded in the provided answer.",
        "Set needsFollowUp to true only when the answer is shallow, incomplete, uncertain, or misses key concepts.",
        "If needsFollowUp is false, set followUpReason and followUpPrompt to null.",
        "evaluationSummary should be one concise sentence."
      ].join(" "),
      userPayload: {
        position: request.interview.position,
        question: request.question,
        answer: {
          raw: request.rawAnswer,
          normalized: normalizedAnswer,
          transcript: request.transcript,
          audioMetrics: request.processedSpeech?.metrics ?? null
        }
      },
      jsonSchema: INTERVIEW_EVALUATION_SCHEMA
    });

    return this.normalizeLlmResult(request, llmResponse.content, llmResponse.provider, llmResponse.model);
  }

  private normalizeLlmResult(
    request: InterviewEvaluationRequest,
    payload: LlmInterviewEvaluationPayload,
    provider: string,
    model: string
  ): InterviewEvaluationResult {
    const normalizedAnswer = (request.processedSpeech?.normalizedTranscript ?? request.rawAnswer).replace(/\s+/g, " ");
    const allowedKeywords = new Set(request.question.expectedKeywords);
    const keywordHits = this.unique(
      (payload.keywordHits ?? []).filter((keyword) => allowedKeywords.has(keyword))
    );
    const missedKeywords = request.question.expectedKeywords.filter((keyword) => !keywordHits.includes(keyword));
    const technical = this.clampScore(payload.scores?.technical ?? 0);
    const communication = this.clampScore(payload.scores?.communication ?? 0);
    const depth = this.clampScore(payload.scores?.depth ?? 0);
    const roleFit = this.clampScore(payload.scores?.roleFit ?? 0);
    const overallScore = this.clampScore(
      payload.overallScore ??
        Math.round(technical * 0.35 + communication * 0.2 + depth * 0.25 + roleFit * 0.2)
    );
    const needsFollowUp = Boolean(payload.needsFollowUp);
    const followUpReason = needsFollowUp ? payload.followUpReason?.trim() || null : null;
    const followUpPrompt = needsFollowUp ? payload.followUpPrompt?.trim() || null : null;

    return {
      normalizedAnswer,
      transcript: request.processedSpeech?.transcript ?? request.transcript,
      inputMode: request.processedSpeech ? "speech" : "text",
      keywordHits,
      missedKeywords,
      scores: {
        technical,
        communication,
        depth,
        roleFit
      },
      overallScore,
      evaluationSummary:
        payload.evaluationSummary?.trim() ||
        `Estimated ${overallScore}/100 with ${keywordHits.length}/${request.question.expectedKeywords.length || 1} target keywords covered.`,
      needsFollowUp,
      followUpReason,
      followUpPrompt,
      audioMetrics: request.processedSpeech?.metrics ?? null,
      evaluationSource: "llm",
      llmProvider: provider,
      llmModel: model
    };
  }

  private evaluateHeuristically(request: InterviewEvaluationRequest): InterviewEvaluationResult {
    const normalizedAnswer = (request.processedSpeech?.normalizedTranscript ?? request.rawAnswer).replace(/\s+/g, " ");
    const lowerAnswer = normalizedAnswer.toLowerCase();
    const keywordHits = request.question.expectedKeywords.filter((keyword) =>
      lowerAnswer.includes(keyword.toLowerCase())
    );
    const missedKeywords = request.question.expectedKeywords.filter(
      (keyword) => !keywordHits.includes(keyword)
    );
    const wordCount = normalizedAnswer.split(/\s+/).filter(Boolean).length;
    const targetWordCount = this.getTargetWordCount(request.question.type);
    const lengthScore = Math.min(100, Math.round((wordCount / targetWordCount) * 100));
    const keywordScore =
      request.question.expectedKeywords.length > 0
        ? Math.round((keywordHits.length / request.question.expectedKeywords.length) * 100)
        : Math.min(100, lengthScore);
    const depthSignals = this.countMatches(lowerAnswer, [
      "because",
      "trade-off",
      "tradeoff",
      "for example",
      "first",
      "then",
      "finally",
      "monitor",
      "fallback",
      "consistency",
      "latency",
      "rollback"
    ]);
    const structureSignals = this.countMatches(lowerAnswer, [
      "first",
      "second",
      "third",
      "then",
      "finally",
      "because"
    ]);
    const uncertaintySignals = this.countMatches(lowerAnswer, [
      "not sure",
      "don't know",
      "maybe",
      "probably",
      "kind of"
    ]);
    const roleSignals = [
      ...request.interview.position.highlights,
      ...request.question.evaluationFocus
    ].filter((term) => lowerAnswer.includes(term.toLowerCase()));

    const technical = this.clampScore(
      keywordScore * 0.7 + lengthScore * 0.15 + depthSignals * 6 - uncertaintySignals * 6
    );
    const communication = this.clampScore(
      lengthScore * 0.45 +
        Math.min(structureSignals, 3) * 10 +
        (request.processedSpeech?.metrics.clarityScore ?? 80) * 0.25 -
        uncertaintySignals * 5
    );
    const depth = this.clampScore(
      keywordScore * 0.45 +
        lengthScore * 0.25 +
        Math.min(depthSignals, 4) * 11 -
        uncertaintySignals * 6
    );
    const roleFit = this.clampScore(
      keywordScore * 0.35 +
        Math.min(roleSignals.length, 3) * 15 +
        depth * 0.2 +
        communication * 0.1
    );
    const overallScore = Math.round(
      technical * 0.35 + communication * 0.2 + depth * 0.25 + roleFit * 0.2
    );

    const needsFollowUp =
      keywordScore < 60 ||
      depth < 60 ||
      wordCount < Math.round(targetWordCount * 0.65) ||
      uncertaintySignals >= 2;
    const followUpReason = needsFollowUp
      ? this.buildFollowUpReason(missedKeywords, wordCount, targetWordCount, uncertaintySignals)
      : null;
    const followUpPrompt = needsFollowUp
      ? this.buildFollowUpPrompt(request.question.followUpHints, missedKeywords, wordCount, targetWordCount)
      : null;

    return {
      normalizedAnswer,
      transcript: request.processedSpeech?.transcript ?? request.transcript,
      inputMode: request.processedSpeech ? "speech" : "text",
      keywordHits,
      missedKeywords,
      scores: {
        technical,
        communication,
        depth,
        roleFit
      },
      overallScore,
      evaluationSummary: `Covered ${keywordHits.length}/${request.question.expectedKeywords.length || 1} target keywords with an estimated ${overallScore}/100 quality score.`,
      needsFollowUp,
      followUpReason,
      followUpPrompt,
      audioMetrics: request.processedSpeech?.metrics ?? null,
      evaluationSource: "heuristic",
      llmProvider: null,
      llmModel: null
    };
  }

  private buildFollowUpReason(
    missedKeywords: string[],
    wordCount: number,
    targetWordCount: number,
    uncertaintySignals: number
  ) {
    if (missedKeywords.length > 0) {
      return `Missing core concepts: ${missedKeywords.slice(0, 3).join(", ")}.`;
    }
    if (wordCount < targetWordCount) {
      return "The answer is too short for a realistic interview response.";
    }
    if (uncertaintySignals > 0) {
      return "The answer included uncertainty language and needs clearer reasoning.";
    }
    return "The answer needs more detail and stronger trade-off analysis.";
  }

  private buildFollowUpPrompt(
    followUpHints: string[],
    missedKeywords: string[],
    wordCount: number,
    targetWordCount: number
  ) {
    if (missedKeywords.length > 0) {
      return `Go deeper on ${missedKeywords.slice(0, 2).join(" and ")}. Walk me through your reasoning, trade-offs, and how you would verify the result in production.`;
    }
    if (wordCount < targetWordCount && followUpHints.length > 0) {
      return `Please expand your answer and specifically cover ${followUpHints[0]}.`;
    }
    if (followUpHints.length > 0) {
      return `Continue by covering ${followUpHints.slice(0, 2).join(" and ")} in more detail.`;
    }
    return "Expand your answer with the implementation details, edge cases, and trade-offs you would bring up in a real interview.";
  }

  private countMatches(text: string, terms: string[]) {
    return terms.reduce((count, term) => (text.includes(term) ? count + 1 : count), 0);
  }

  private getTargetWordCount(questionType: QuestionType) {
    switch (questionType) {
      case "project":
      case "scenario":
        return 60;
      case "behavioral":
        return 35;
      default:
        return 45;
    }
  }

  private clampScore(value: number) {
    return Math.max(0, Math.min(100, Math.round(value)));
  }

  private unique(values: string[]) {
    return Array.from(new Set(values));
  }
}
