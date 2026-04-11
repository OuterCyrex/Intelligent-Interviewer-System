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
    const heuristicBaseline = this.generateHeuristicSections(request);
    const llmResponse = await this.llmService.createJsonCompletion<LlmReportPayload>({
      schemaName: "interview_report_generation",
      systemPrompt: this.buildReportSystemPrompt(),
      userPayload: request,
      jsonSchema: REPORT_GENERATION_SCHEMA
    });

    const payload = llmResponse.content;

    return {
      summary: this.normalizeSummary(payload.summary, heuristicBaseline.summary),
      strengths: this.mergeWithFallback(payload.strengths, heuristicBaseline.strengths, 4),
      improvementAreas: this.mergeWithFallback(
        payload.improvementAreas,
        heuristicBaseline.improvementAreas,
        4
      ),
      nextSteps: this.mergeWithFallback(payload.nextSteps, heuristicBaseline.nextSteps, 4),
      generationSource: "llm",
      llmProvider: llmResponse.provider,
      llmModel: llmResponse.model
    };
  }

  private generateHeuristically(request: ReportGenerationRequest): ReportGenerationResult {
    const heuristic = this.generateHeuristicSections(request);

    return {
      summary: heuristic.summary,
      strengths: heuristic.strengths,
      improvementAreas: heuristic.improvementAreas,
      nextSteps: heuristic.nextSteps,
      generationSource: "heuristic",
      llmProvider: null,
      llmModel: null
    };
  }

  private buildStrengths(request: ReportGenerationRequest) {
    const strengths: string[] = [];
    const { technicalScore, communicationScore, depthScore, roleFitScore } = request.metrics;
    const strongestTurn = this.pickTurn(request.turns, "strongest");

    if (technicalScore >= 75) {
      strengths.push("核心知识点覆盖较完整，技术回答总体准确");
    }
    if (communicationScore >= 75) {
      strengths.push("回答结构较清晰，表达过程便于跟进理解");
    }
    if (depthScore >= 75) {
      strengths.push("回答能展开到实现细节，并体现一定权衡意识");
    }
    if (roleFitScore >= 75) {
      strengths.push("回答内容与目标岗位场景保持了较好的贴合度");
    }

    if (strongestTurn?.questionTopic) {
      strengths.push(`本轮表现最稳定的话题是“${strongestTurn.questionTopic}”`);
    }

    if (strengths.length === 0) {
      strengths.push("本轮面试已经形成可用于后续提升的基础能力画像");
    }

    return strengths;
  }

  private buildImprovementAreas(request: ReportGenerationRequest) {
    const improvements: string[] = [];
    const { communicationScore, depthScore, roleFitScore, missedKeywords } = request.metrics;
    const weakestTurn = this.pickTurn(request.turns, "weakest");

    if (missedKeywords.length > 0) {
      improvements.push(`对 ${missedKeywords.join("、")} 的覆盖还不够完整`);
    }
    if (communicationScore < 70) {
      improvements.push("回答结构还可继续强化，建议固定为思路、细节、权衡三段式");
    }
    if (depthScore < 70) {
      improvements.push("技术回答要进一步补足边界条件、验证方式与线上稳定性考虑");
    }
    if (roleFitScore < 70) {
      improvements.push("回答需要更多结合目标岗位和真实项目场景展开");
    }
    if (weakestTurn?.questionTopic) {
      improvements.push(`“${weakestTurn.questionTopic}”相关回答还可以继续打磨`);
    }
    if (improvements.length === 0) {
      improvements.push("在追问压力下继续提升回答速度与表达精度");
    }

    return improvements;
  }

  private buildNextSteps(request: ReportGenerationRequest) {
    const steps: string[] = [];
    const { missedKeywords, communicationScore, depthScore } = request.metrics;
    const highlights = request.interview.position.highlights;
    const retrievedSnippet = request.retrievalContext[0];

    if (missedKeywords.length > 0) {
      steps.push(`优先复习“${missedKeywords[0]}”，并准备一个可复述的项目化案例`);
    }
    if (highlights.length > 0) {
      steps.push(`围绕“${highlights[0]}”准备一段 2 到 3 分钟的项目讲述`);
    }
    if (retrievedSnippet) {
      steps.push(`结合知识片段“${retrievedSnippet.title}”整理一版可直接用于面试的标准回答`);
    }
    if (communicationScore < 75) {
      steps.push("用口述方式反复练习长回答，固定三段式表达框架");
    }
    if (depthScore < 75) {
      steps.push("技术题回答时补上权衡、监控指标和降级兜底方案");
    }
    if (steps.length < 3) {
      steps.push(`再进行一轮模拟面试，重点拉升“${request.metrics.weakestDimension.label}”分数`);
    }

    return steps;
  }

  private normalizeList(values: string[] | undefined, limit: number) {
    const normalized = (values ?? [])
      .map((value) => value.trim())
      .filter(Boolean);

    return Array.from(new Set(normalized)).slice(0, limit);
  }

  private mergeWithFallback(
    values: string[] | undefined,
    fallback: string[],
    limit: number
  ) {
    return Array.from(new Set([...this.normalizeList(values, limit), ...fallback])).slice(0, limit);
  }

  private normalizeSummary(summary: string | undefined, fallback: string) {
    const normalized = summary?.trim();
    return normalized || fallback;
  }

  private buildReportSystemPrompt() {
    return [
      "你是一名中文技术面试总结助手，负责为模拟面试生成最终报告。",
      "必须只返回 JSON，不要输出任何额外说明。",
      "所有内容都使用简体中文。",
      "summary 需要是 2 到 3 句的正式总结，明确总体水平、最强项和最需要优先改进的方向。",
      "strengths 必须是基于面试证据的优势观察，不要写空话。",
      "improvementAreas 必须指出最关键的问题，不要和 strengths 重复。",
      "nextSteps 必须是可以执行的训练动作，优先结合 retrievalContext 提供的学习主题。",
      "只能基于提供的 turns、metrics 和 retrievalContext 作答。",
      "retrievalContext 只能用于生成学习建议，不能捏造候选人在面试中说过的话。",
      "如果证据不足，要保守描述。"
    ].join(" ");
  }

  private generateHeuristicSections(request: ReportGenerationRequest) {
    const strengths = this.buildStrengths(request).slice(0, 4);
    const improvementAreas = this.buildImprovementAreas(request).slice(0, 4);
    const nextSteps = this.buildNextSteps(request).slice(0, 4);
    const strongestTurn = this.pickTurn(request.turns, "strongest");
    const weakestTurn = this.pickTurn(request.turns, "weakest");
    const summaryParts = [
      `本次模拟面试综合得分 ${request.metrics.overallScore} 分。`,
      `表现最强的维度是${request.metrics.strongestDimension.label}（${request.metrics.strongestDimension.score} 分），最需要优先提升的是${request.metrics.weakestDimension.label}（${request.metrics.weakestDimension.score} 分）。`,
      strongestTurn?.questionTopic
        ? `在“${strongestTurn.questionTopic}”上的回答相对更成熟${weakestTurn?.questionTopic ? `，而“${weakestTurn.questionTopic}”仍有明显提升空间。` : "。"}`
        : `本轮共完成 ${request.metrics.answeredTurnCount} 个已评分回合，其中追问 ${request.metrics.followUpTurnCount} 次。`
    ];

    return {
      summary: summaryParts.join(" "),
      strengths,
      improvementAreas,
      nextSteps
    };
  }

  private pickTurn(
    turns: ReportGenerationRequest["turns"],
    mode: "strongest" | "weakest"
  ) {
    return [...turns].sort((left, right) => {
      return mode === "strongest"
        ? (right.overallScore ?? 0) - (left.overallScore ?? 0)
        : (left.overallScore ?? 0) - (right.overallScore ?? 0);
    })[0];
  }

  private async attachRetrievalContext(request: ReportGenerationRequest) {
    const seedTerms =
      request.metrics.focusAreas.length > 0
        ? request.metrics.focusAreas
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
