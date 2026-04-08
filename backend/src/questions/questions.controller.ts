import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiTags } from "@nestjs/swagger";
import { CreateQuestionDto } from "./dto/create-question.dto";
import { UpdateQuestionDto } from "./dto/update-question.dto";
import { QuestionsService } from "./questions.service";

@ApiTags("questions")
@Controller()
export class QuestionsController {
  constructor(@Inject(QuestionsService) private readonly questionsService: QuestionsService) {}

  @Post("questions")
  @ApiOperation({ summary: "Create a question" })
  @ApiBody({ type: CreateQuestionDto })
  create(@Body() createQuestionDto: CreateQuestionDto) {
    return this.questionsService.create(createQuestionDto);
  }

  @Get("questions")
  @ApiOperation({ summary: "List questions" })
  @ApiQuery({ name: "positionId", required: false })
  @ApiQuery({ name: "type", required: false })
  @ApiQuery({ name: "difficulty", required: false })
  @ApiQuery({ name: "active", required: false, description: "Use false to include inactive=false filter." })
  findAll(
    @Query("positionId") positionId?: string,
    @Query("type") type?: string,
    @Query("difficulty") difficulty?: string,
    @Query("active") active?: string
  ) {
    return this.questionsService.findAll({
      positionId,
      type,
      difficulty,
      active
    });
  }

  @Get("questions/:id")
  @ApiOperation({ summary: "Get a question by id" })
  @ApiParam({ name: "id", description: "Question UUID" })
  findOne(@Param("id") id: string) {
    return this.questionsService.findOne(id);
  }

  @Patch("questions/:id")
  @ApiOperation({ summary: "Update a question" })
  @ApiParam({ name: "id", description: "Question UUID" })
  @ApiBody({ type: UpdateQuestionDto })
  update(@Param("id") id: string, @Body() updateQuestionDto: UpdateQuestionDto) {
    return this.questionsService.update(id, updateQuestionDto);
  }

  @Delete("questions/:id")
  @ApiOperation({ summary: "Delete a question" })
  @ApiParam({ name: "id", description: "Question UUID" })
  remove(@Param("id") id: string) {
    return this.questionsService.remove(id);
  }

  @Get("positions/:positionId/questions")
  @ApiOperation({ summary: "List questions for a position" })
  @ApiParam({ name: "positionId", description: "Position UUID" })
  findByPosition(@Param("positionId") positionId: string) {
    return this.questionsService.findByPosition(positionId);
  }
}
