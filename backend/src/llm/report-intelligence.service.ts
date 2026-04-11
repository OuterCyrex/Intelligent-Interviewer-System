import { Injectable } from "@nestjs/common";
import { RagService } from "../rag/rag.service";
import { ReportGenerationRequest, ReportGenerationResult } from "./llm.types";
import { LlmService } from "./llm.service";

interface LlmReportPayload {
  summary?: string;
  strengths?: string[];
  improvementAreas?: string[];
  nextSteps?: string[];
}

const REPORT_GENERATION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: { type: "string" },
    strengths: {
      type: "array",
      items: { type: "string" },
      minItems: 2,
      maxItems: 4
    },
    improvementAreas: {
      type: "array",
      items: { type: "string" },
      minItems: 2,
      maxItems: 4
    },
    nextSteps: {
      type: "array",
      items: { type: "string" },
      minItems: 2,
      maxItems: 4
    }
  },
  required: ["summary", "strengths", "improvementAreas", "nextSteps"]
} satisfies Record<string, unknown>;

@Injectable()
export class ReportIntelligenceService {
  constructor(
    private readonly llmService: LlmService,
    private readonly ragService: RagService
  ) {}

  async generateReportNarrative(request: ReportGenerationRequest): Promise<ReportGenerationResult> {
    const requestWithContext = await this.attachRetrievalContext(request);

    if (this.llmService.isReady()) {
      try {
        return await this.generateWithLlm(requestWithContext);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`LLM report generation failed, falling back to heuristics: ${message}`);
      }
    }

    return this.generateHeuristically(requestWithContext);
  }

  private async generateWithLlm(request: ReportGenerationRequest): Promise<ReportGenerationResult> {
    const llmResponse = await this.llmService.createJsonCompletion<LlmReportPayload>({
      schemaName: "interview_report_generation",
      systemPrompt: [
        "You are generating a structured mock interview report for a computer-science interview platform.",
        "Return JSON only.",
        "Use the provided interview metrics and turn data.",
        "Use retrievalContext to suggest concrete next steps and study material focus.",
        "Keep summary concise and specific.",
        "strengths should be short evidence-based observations.",
        "improvementAreas should identify the most important gaps.",
        "nextSteps should be concrete practice actions."
      ].join(" "),
      userPayload: request,
      jsonSchema: REPORT_GENERATION_SCHEMA
    });

    const payload = llmResponse.content;

    return {
      summary:
        payload.summary?.trim() ||
        `Overall ${request.metrics.overallScore}/100. Solid foundation with clear gaps to improve.`,
      strengths: this.normalizeList(payload.strengths, 4),
      improvementAreas: this.normalizeList(payload.improvementAreas, 4),
      nextSteps: this.normalizeList(payload.nextSteps, 4),
      generationSource: "llm",
      llmProvider: llmResponse.provider,
      llmModel: llmResponse.model
    };
  }

  private generateHeuristically(request: ReportGenerationRequest): ReportGenerationResult {
    const strengths = this.buildStrengths(request).slice(0, 4);
    const improvementAreas = this.buildImprovementAreas(request).slice(0, 4);
    const nextSteps = this.buildNextSteps(request).slice(0, 4);
    const summary = `Overall ${request.metrics.overallScore}/100. Strongest areas: ${strengths.slice(0, 2).join("; ")}. Main gaps: ${improvementAreas.slice(0, 2).join("; ")}.`;

    return {
      summary,
      strengths,
      improvementAreas,
      nextSteps,
      generationSource: "heuristic",
      llmProvider: null,
      llmModel: null
    };
  }

  private buildStrengths(request: ReportGenerationRequest) {
    const strengths: string[] = [];
    const { technicalScore, communicationScore, depthScore, roleFitScore } = request.metrics;

    if (technicalScore >= 75) {
      strengths.push("Core concepts were covered with solid technical accuracy");
    }
    if (communicationScore >= 75) {
      strengths.push("Answers stayed organized and easy to follow");
    }
    if (depthScore >= 75) {
      strengths.push("Reasoning included implementation detail and trade-offs");
    }
    if (roleFitScore >= 75) {
      strengths.push("Examples stayed aligned with the target role");
    }

    const strongestTurn = [...request.turns].sort(
      (left, right) => (right.overallScore ?? 0) - (left.overallScore ?? 0)
    )[0];
    if (strongestTurn?.questionTopic) {
      strengths.push(`Strongest topic in this round: ${strongestTurn.questionTopic}`);
    }

    if (strengths.length === 0) {
      strengths.push("The interview round established a usable baseline across multiple question types");
    }

    return strengths;
  }

  private buildImprovementAreas(request: ReportGenerationRequest) {
    const improvements: string[] = [];
    const { communicationScore, depthScore, roleFitScore, missedKeywords } = request.metrics;

    if (missedKeywords.length > 0) {
      improvements.push(`Coverage was thin around ${missedKeywords.join(", ")}`);
    }
    if (communicationScore < 70) {
      improvements.push("Answers need a clearer structure: approach, detail, and trade-offs");
    }
    if (depthScore < 70) {
      improvements.push("Go deeper on edge cases, verification, and production concerns");
    }
    if (roleFitScore < 70) {
      improvements.push("Tie answers back to the target role and realistic project context");
    }
    if (improvements.length === 0) {
      improvements.push("Keep building speed and precision under follow-up pressure");
    }

    return improvements;
  }

  private buildNextSteps(request: ReportGenerationRequest) {
    const steps: string[] = [];
    const { missedKeywords, communicationScore, depthScore } = request.metrics;
    const highlights = request.interview.position.highlights;
    const retrievedSnippet = request.retrievalContext[0];

    if (missedKeywords.length > 0) {
      steps.push(`Review ${missedKeywords[0]} and practice explaining it with a concrete example`);
    }
    if (highlights.length > 0) {
      steps.push(`Prepare one project walkthrough around ${highlights[0]}`);
    }
    if (retrievedSnippet) {
      steps.push(`Study ${retrievedSnippet.title} and connect it to one interview-ready scenario answer`);
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

    return steps;
  }

  private normalizeList(values: string[] | undefined, limit: number) {
    const normalized = (values ?? [])
      .map((value) => value.trim())
      .filter(Boolean);

    return Array.from(new Set(normalized)).slice(0, limit);
  }

  private async attachRetrievalContext(request: ReportGenerationRequest) {
    const seedTerms =
      request.metrics.missedKeywords.length > 0
        ? request.metrics.missedKeywords
        : request.interview.position.highlights;

    try {
      const retrieval = await this.ragService.retrieveForFocusAreas({
        positionId: request.interview.positionId,
        focusAreas: seedTerms,
        difficulty: request.interview.difficulty,
        limit: 3,
        includeContent: true,
        fallbackToRecent: true
      });

      return {
        ...request,
        retrievalContext: retrieval.matches
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`RAG retrieval failed during report generation: ${message}`);
      return {
        ...request,
        retrievalContext: []
      };
    }
  }
}
