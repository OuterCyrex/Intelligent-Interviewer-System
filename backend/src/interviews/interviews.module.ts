import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { LlmModule } from "../llm/llm.module";
import { Position } from "../positions/position.entity";
import { Question } from "../questions/question.entity";
import { ReportsModule } from "../reports/reports.module";
import { InterviewSession } from "./interview.entity";
import { InterviewTurn } from "./interview-turn.entity";
import { InterviewsController } from "./interviews.controller";
import { InterviewsService } from "./interviews.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([InterviewSession, InterviewTurn, Position, Question]),
    LlmModule,
    ReportsModule
  ],
  controllers: [InterviewsController],
  providers: [InterviewsService],
  exports: [InterviewsService]
})
export class InterviewsModule {}
