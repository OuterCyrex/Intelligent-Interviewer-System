import { Body, Controller, Get, Inject, Param, Post, Query } from "@nestjs/common";
import { CreateInterviewDto } from "./dto/create-interview.dto";
import { SubmitInterviewAnswerDto } from "./dto/submit-answer.dto";
import { InterviewsService } from "./interviews.service";

@Controller("interviews")
export class InterviewsController {
  constructor(@Inject(InterviewsService) private readonly interviewsService: InterviewsService) {}

  @Post()
  create(@Body() createInterviewDto: CreateInterviewDto) {
    return this.interviewsService.create(createInterviewDto);
  }

  @Get()
  findAll(
    @Query("candidateName") candidateName?: string,
    @Query("positionId") positionId?: string,
    @Query("status") status?: string
  ) {
    return this.interviewsService.findAll({
      candidateName,
      positionId,
      status
    });
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.interviewsService.findOne(id);
  }

  @Get(":id/active-turn")
  findActiveTurn(@Param("id") id: string) {
    return this.interviewsService.findActiveTurn(id);
  }

  @Post(":id/answers")
  submitAnswer(@Param("id") id: string, @Body() submitAnswerDto: SubmitInterviewAnswerDto) {
    return this.interviewsService.submitAnswer(id, submitAnswerDto);
  }

  @Post(":id/complete")
  complete(@Param("id") id: string) {
    return this.interviewsService.complete(id);
  }
}
