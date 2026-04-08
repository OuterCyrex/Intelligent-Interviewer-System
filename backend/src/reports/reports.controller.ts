import { Controller, Get, Inject, Param } from "@nestjs/common";
import { ReportsService } from "./reports.service";

@Controller()
export class ReportsController {
  constructor(@Inject(ReportsService) private readonly reportsService: ReportsService) {}

  @Get("reports")
  findAll() {
    return this.reportsService.findAll();
  }

  @Get("interviews/:interviewId/report")
  findByInterview(@Param("interviewId") interviewId: string) {
    return this.reportsService.findByInterview(interviewId);
  }
}
