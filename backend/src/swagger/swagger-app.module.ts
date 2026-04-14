import { Module } from "@nestjs/common";
import { AppController } from "../app.controller";
import { AppService } from "../app.service";
import { AudioController } from "../audio/audio.controller";
import { AudioService } from "../audio/audio.service";
import { DiscussionsController } from "../discussions/discussions.controller";
import { DiscussionsService } from "../discussions/discussions.service";
import { InterviewsController } from "../interviews/interviews.controller";
import { InterviewsService } from "../interviews/interviews.service";
import { KnowledgeController } from "../knowledge/knowledge.controller";
import { KnowledgeService } from "../knowledge/knowledge.service";
import { LlmController } from "../llm/llm.controller";
import { LlmService } from "../llm/llm.service";
import { PositionsController } from "../positions/positions.controller";
import { PositionsService } from "../positions/positions.service";
import { QuestionsController } from "../questions/questions.controller";
import { QuestionsService } from "../questions/questions.service";
import { RagController } from "../rag/rag.controller";
import { RagService } from "../rag/rag.service";
import { RecommendationsController } from "../recommendations/recommendations.controller";
import { RecommendationsService } from "../recommendations/recommendations.service";
import { ReportsController } from "../reports/reports.controller";
import { ReportsService } from "../reports/reports.service";
import { UsersController } from "../users/users.controller";
import { UsersService } from "../users/users.service";

const appServiceStub = {
  getHealth: () => ({
    status: "ok",
    framework: "nestjs",
    timestamp: new Date().toISOString()
  })
} as AppService;

const audioServiceStub = {
  processSpeech: () => ({
    transcript: "",
    normalizedTranscript: "",
    wordCount: 0,
    metrics: {
      durationSeconds: null,
      fillerWordCount: 0,
      averageConfidence: null,
      averagePauseMs: null,
      paceWpm: null,
      fillerRate: 0,
      clarityScore: 0,
      flags: []
    }
  })
} as unknown as AudioService;

const positionsServiceStub = {
  create: async () => ({}),
  findAll: async () => [],
  findOne: async () => ({}),
  update: async () => ({}),
  remove: async () => ({ deleted: true })
} as unknown as PositionsService;

const questionsServiceStub = {
  create: async () => ({}),
  findAll: async () => [],
  findOne: async () => ({}),
  update: async () => ({}),
  remove: async () => ({ deleted: true }),
  findByPosition: async () => []
} as unknown as QuestionsService;

const knowledgeServiceStub = {
  create: async () => ({}),
  importMarkdown: async () => ({
    importedCount: 0,
    position: {},
    embeddingProvider: "openai",
    embeddingModel: "text-embedding-3-small",
    chunks: []
  }),
  rebuildEmbeddings: async () => ({
    updatedCount: 0,
    embeddingProvider: "openai",
    embeddingModel: "text-embedding-3-small",
    snippets: []
  }),
  findAll: async () => [],
  findOne: async () => ({}),
  update: async () => ({}),
  remove: async () => ({ deleted: true })
} as unknown as KnowledgeService;

const interviewsServiceStub = {
  create: async () => ({}),
  findAll: async () => [],
  findOne: async () => ({}),
  findActiveTurn: async () => null,
  submitAnswer: async () => ({}),
  complete: async () => ({})
} as unknown as InterviewsService;

const reportsServiceStub = {
  findAll: async () => [],
  findByInterview: async () => ({}),
  findSummary: async () => ({
    candidateName: null,
    positionId: null,
    totalReports: 0,
    averageOverallScore: null,
    bestOverallScore: null,
    latestOverallScore: null,
    weakestDimensions: [],
    strengthHighlights: [],
    improvementHighlights: [],
    learningPlan: [],
    sourceBreakdown: {
      llm: 0,
      heuristic: 0
    },
    overview: ""
  })
} as unknown as ReportsService;

const recommendationsServiceStub = {
  getByInterview: async () => ({}),
  getOverview: async () => ({})
} as unknown as RecommendationsService;

const llmServiceStub = {
  getStatus: () => ({
    enabled: false,
    ready: false,
    provider: "openai",
    model: "gpt-4o-mini",
    embeddingModel: "text-embedding-3-small",
    baseUrl: "https://api.openai.com/v1",
    responseFormat: "json_object"
  }),
  runSelfCheck: async () => ({
    ok: false,
    timestamp: new Date().toISOString(),
    checks: {
      chat: {
        ok: false,
        durationMs: 0,
        provider: "openai",
        model: "gpt-4o-mini",
        error: "not configured"
      },
      embedding: {
        ok: false,
        durationMs: 0,
        provider: "openai",
        model: "text-embedding-3-small",
        error: "not configured"
      }
    }
  })
} as LlmService;

const ragServiceStub = {
  retrieve: async () => ({
    positionId: "",
    query: null,
    normalizedTerms: [],
    totalCandidates: 0,
    matches: []
  })
} as unknown as RagService;

const usersServiceStub = {
  register: async () => ({
    token: "token",
    user: {}
  }),
  login: async () => ({
    token: "token",
    user: {}
  }),
  logout: async () => ({ success: true }),
  getCurrentUser: async () => ({}),
  updateCurrentUser: async () => ({})
} as unknown as UsersService;

const discussionsServiceStub = {
  findPage: async () => ({
    items: [],
    page: 1,
    pageSize: 6,
    total: 0,
    totalPages: 1
  }),
  create: async () => ({}),
  findReplies: async () => [],
  createReply: async () => ({})
} as unknown as DiscussionsService;

@Module({
  controllers: [
    AppController,
    AudioController,
    PositionsController,
    QuestionsController,
    KnowledgeController,
    InterviewsController,
    ReportsController,
    RecommendationsController,
    LlmController,
    RagController,
    UsersController,
    DiscussionsController
  ],
  providers: [
    {
      provide: AppService,
      useValue: appServiceStub
    },
    {
      provide: AudioService,
      useValue: audioServiceStub
    },
    {
      provide: PositionsService,
      useValue: positionsServiceStub
    },
    {
      provide: QuestionsService,
      useValue: questionsServiceStub
    },
    {
      provide: KnowledgeService,
      useValue: knowledgeServiceStub
    },
    {
      provide: InterviewsService,
      useValue: interviewsServiceStub
    },
    {
      provide: ReportsService,
      useValue: reportsServiceStub
    },
    {
      provide: RecommendationsService,
      useValue: recommendationsServiceStub
    },
    {
      provide: LlmService,
      useValue: llmServiceStub
    },
    {
      provide: RagService,
      useValue: ragServiceStub
    },
    {
      provide: UsersService,
      useValue: usersServiceStub
    },
    {
      provide: DiscussionsService,
      useValue: discussionsServiceStub
    }
  ]
})
export class SwaggerAppModule {}
