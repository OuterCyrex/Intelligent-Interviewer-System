import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, Query } from "@nestjs/common";
import { CreateQuestionDto } from "./dto/create-question.dto";
import { UpdateQuestionDto } from "./dto/update-question.dto";
import { QuestionsService } from "./questions.service";

@Controller()
export class QuestionsController {
  constructor(@Inject(QuestionsService) private readonly questionsService: QuestionsService) {}

  @Post("questions")
  create(@Body() createQuestionDto: CreateQuestionDto) {
    return this.questionsService.create(createQuestionDto);
  }

  @Get("questions")
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
  findOne(@Param("id") id: string) {
    return this.questionsService.findOne(id);
  }

  @Patch("questions/:id")
  update(@Param("id") id: string, @Body() updateQuestionDto: UpdateQuestionDto) {
    return this.questionsService.update(id, updateQuestionDto);
  }

  @Delete("questions/:id")
  remove(@Param("id") id: string) {
    return this.questionsService.remove(id);
  }

  @Get("positions/:positionId/questions")
  findByPosition(@Param("positionId") positionId: string) {
    return this.questionsService.findByPosition(positionId);
  }
}
