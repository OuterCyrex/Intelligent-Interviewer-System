import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { InterviewSession } from "../interviews/interview.entity";
import { InterviewTurn } from "../interviews/interview-turn.entity";
import { Question } from "../questions/question.entity";
import { RagModule } from "../rag/rag.module";
import { ReportsModule } from "../reports/reports.module";
import { RecommendationsController } from "./recommendations.controller";
import { RecommendationsService } from "./recommendations.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([InterviewSession, InterviewTurn, Question]),
    RagModule,
    ReportsModule
  ],
  controllers: [RecommendationsController],
  providers: [RecommendationsService]
})
export class RecommendationsModule {}
