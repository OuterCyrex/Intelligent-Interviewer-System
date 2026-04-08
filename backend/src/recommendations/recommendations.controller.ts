import { Controller, Get, Inject, Param, Query } from "@nestjs/common";
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from "@nestjs/swagger";
import { RecommendationsService } from "./recommendations.service";

@ApiTags("recommendations")
@Controller()
export class RecommendationsController {
  constructor(
    @Inject(RecommendationsService)
    private readonly recommendationsService: RecommendationsService
  ) {}

  @Get("interviews/:interviewId/recommendations")
  @ApiOperation({ summary: "Get recommendations for a completed interview" })
  @ApiParam({ name: "interviewId", description: "Interview UUID" })
  getByInterview(@Param("interviewId") interviewId: string) {
    return this.recommendationsService.getByInterview(interviewId);
  }

  @Get("recommendations")
  @ApiOperation({ summary: "Get recommendation overview for a candidate" })
  @ApiQuery({ name: "candidateName", required: true })
  @ApiQuery({ name: "positionId", required: false })
  getOverview(@Query("candidateName") candidateName: string, @Query("positionId") positionId?: string) {
    return this.recommendationsService.getOverview(candidateName, positionId);
  }
}
