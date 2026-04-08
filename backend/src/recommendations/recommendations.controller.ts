import { Controller, Get, Inject, Param, Query } from "@nestjs/common";
import { RecommendationsService } from "./recommendations.service";

@Controller()
export class RecommendationsController {
  constructor(
    @Inject(RecommendationsService)
    private readonly recommendationsService: RecommendationsService
  ) {}

  @Get("interviews/:interviewId/recommendations")
  getByInterview(@Param("interviewId") interviewId: string) {
    return this.recommendationsService.getByInterview(interviewId);
  }

  @Get("recommendations")
  getOverview(@Query("candidateName") candidateName: string, @Query("positionId") positionId?: string) {
    return this.recommendationsService.getOverview(candidateName, positionId);
  }
}
