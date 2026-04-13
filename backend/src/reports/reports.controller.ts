import { Controller, Get, Inject, Param, Query } from "@nestjs/common";
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from "@nestjs/swagger";
import { ReportsService } from "./reports.service";

@ApiTags("reports")
@Controller()
export class ReportsController {
  constructor(@Inject(ReportsService) private readonly reportsService: ReportsService) {}

  @Get("reports")
  @ApiOperation({ summary: "List generated interview reports" })
  @ApiQuery({ name: "page", required: false, description: "Page number starts from 1" })
  @ApiQuery({ name: "pageSize", required: false, description: "Page size, max 20" })
  findAll(@Query("page") page?: string, @Query("pageSize") pageSize?: string) {
    if (page !== undefined || pageSize !== undefined) {
      return this.reportsService.findPage({
        page: page ? Number(page) : undefined,
        pageSize: pageSize ? Number(pageSize) : undefined
      });
    }
    return this.reportsService.findAll();
  }

  @Get("interviews/:interviewId/report")
  @ApiOperation({ summary: "Get the report for an interview" })
  @ApiParam({ name: "interviewId", description: "Interview UUID" })
  findByInterview(@Param("interviewId") interviewId: string) {
    return this.reportsService.findByInterview(interviewId);
  }

  @Get("reports/summary")
  @ApiOperation({ summary: "Get aggregated summary based on historical reports (rule-based, no AI)" })
  @ApiQuery({ name: "candidateName", required: false, description: "Filter by candidate name" })
  @ApiQuery({ name: "positionId", required: false, description: "Filter by position id" })
  findSummary(@Query("candidateName") candidateName?: string, @Query("positionId") positionId?: string) {
    return this.reportsService.findSummary({
      candidateName,
      positionId
    });
  }
}
