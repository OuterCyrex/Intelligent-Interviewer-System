import { Module } from "@nestjs/common";
import { AppController } from "../app.controller";
import { AppService } from "../app.service";
import { AudioController } from "../audio/audio.controller";
import { AudioService } from "../audio/audio.service";
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
  findByInterview: async () => ({})
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
    RagController
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
    }
  ]
})
export class SwaggerAppModule {}
