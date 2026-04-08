import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AudioModule } from "./audio/audio.module";
import { MvpSeedService } from "./bootstrap/mvp-seed.service";
import { InterviewSession } from "./interviews/interview.entity";
import { InterviewTurn } from "./interviews/interview-turn.entity";
import { InterviewsModule } from "./interviews/interviews.module";
import { KnowledgeSnippet } from "./knowledge/knowledge.entity";
import { KnowledgeModule } from "./knowledge/knowledge.module";
import { LlmModule } from "./llm/llm.module";
import { PositionsModule } from "./positions/positions.module";
import { Position } from "./positions/position.entity";
import { Question } from "./questions/question.entity";
import { QuestionsModule } from "./questions/questions.module";
import { RecommendationsModule } from "./recommendations/recommendations.module";
import { InterviewReport } from "./reports/report.entity";
import { ReportsModule } from "./reports/reports.module";

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: "postgres",
      host: process.env.POSTGRES_HOST ?? "127.0.0.1",
      port: Number(process.env.POSTGRES_PORT ?? 5432),
      username: process.env.POSTGRES_USER ?? "postgres",
      password: process.env.POSTGRES_PASSWORD ?? "postgres",
      database: process.env.POSTGRES_DB ?? "intervene_app",
      autoLoadEntities: true,
      synchronize: true
    }),
    TypeOrmModule.forFeature([Position, Question, KnowledgeSnippet, InterviewSession, InterviewTurn, InterviewReport]),
    AudioModule,
    KnowledgeModule,
    LlmModule,
    PositionsModule,
    QuestionsModule,
    ReportsModule,
    InterviewsModule,
    RecommendationsModule
  ],
  controllers: [AppController],
  providers: [AppService, MvpSeedService]
})
export class AppModule {}
