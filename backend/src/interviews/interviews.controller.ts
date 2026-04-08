import { Body, Controller, Get, Inject, Param, Post, Query } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiTags } from "@nestjs/swagger";
import { CreateInterviewDto } from "./dto/create-interview.dto";
import { SubmitInterviewAnswerDto } from "./dto/submit-answer.dto";
import { InterviewsService } from "./interviews.service";

@ApiTags("interviews")
@Controller("interviews")
export class InterviewsController {
  constructor(@Inject(InterviewsService) private readonly interviewsService: InterviewsService) {}

  @Post()
  @ApiOperation({ summary: "Start a new interview session" })
  @ApiBody({ type: CreateInterviewDto })
  create(@Body() createInterviewDto: CreateInterviewDto) {
    return this.interviewsService.create(createInterviewDto);
  }

  @Get()
  @ApiOperation({ summary: "List interview sessions" })
  @ApiQuery({ name: "candidateName", required: false })
  @ApiQuery({ name: "positionId", required: false })
  @ApiQuery({ name: "status", required: false })
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
  @ApiOperation({ summary: "Get an interview session by id" })
  @ApiParam({ name: "id", description: "Interview UUID" })
  findOne(@Param("id") id: string) {
    return this.interviewsService.findOne(id);
  }

  @Get(":id/active-turn")
  @ApiOperation({ summary: "Get the current unanswered turn for an interview" })
  @ApiParam({ name: "id", description: "Interview UUID" })
  findActiveTurn(@Param("id") id: string) {
    return this.interviewsService.findActiveTurn(id);
  }

  @Post(":id/answers")
  @ApiOperation({ summary: "Submit an answer for the current interview turn" })
  @ApiParam({ name: "id", description: "Interview UUID" })
  @ApiBody({ type: SubmitInterviewAnswerDto })
  submitAnswer(@Param("id") id: string, @Body() submitAnswerDto: SubmitInterviewAnswerDto) {
    return this.interviewsService.submitAnswer(id, submitAnswerDto);
  }

  @Post(":id/complete")
  @ApiOperation({ summary: "Force completion and generate the interview report" })
  @ApiParam({ name: "id", description: "Interview UUID" })
  complete(@Param("id") id: string) {
    return this.interviewsService.complete(id);
  }
}
