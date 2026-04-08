import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { InterviewSession } from "../interviews/interview.entity";
import { InterviewTurn } from "../interviews/interview-turn.entity";
import { InterviewReport } from "./report.entity";
import { ReportsController } from "./reports.controller";
import { ReportsService } from "./reports.service";

@Module({
  imports: [TypeOrmModule.forFeature([InterviewSession, InterviewTurn, InterviewReport])],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService]
})
export class ReportsModule {}
