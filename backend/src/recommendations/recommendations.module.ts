import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { KnowledgeModule } from "../knowledge/knowledge.module";
import { InterviewSession } from "../interviews/interview.entity";
import { InterviewTurn } from "../interviews/interview-turn.entity";
import { Question } from "../questions/question.entity";
import { ReportsModule } from "../reports/reports.module";
import { RecommendationsController } from "./recommendations.controller";
import { RecommendationsService } from "./recommendations.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([InterviewSession, InterviewTurn, Question]),
    KnowledgeModule,
    ReportsModule
  ],
  controllers: [RecommendationsController],
  providers: [RecommendationsService]
})
export class RecommendationsModule {}
