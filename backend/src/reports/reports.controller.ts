import { Controller, Get, Inject, Param } from "@nestjs/common";
import { ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { ReportsService } from "./reports.service";

@ApiTags("reports")
@Controller()
export class ReportsController {
  constructor(@Inject(ReportsService) private readonly reportsService: ReportsService) {}

  @Get("reports")
  @ApiOperation({ summary: "List generated interview reports" })
  findAll() {
    return this.reportsService.findAll();
  }

  @Get("interviews/:interviewId/report")
  @ApiOperation({ summary: "Get the report for an interview" })
  @ApiParam({ name: "interviewId", description: "Interview UUID" })
  findByInterview(@Param("interviewId") interviewId: string) {
    return this.reportsService.findByInterview(interviewId);
  }
}
