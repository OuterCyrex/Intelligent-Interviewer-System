import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, Query } from "@nestjs/common";
import { CreateKnowledgeDto } from "./dto/create-knowledge.dto";
import { UpdateKnowledgeDto } from "./dto/update-knowledge.dto";
import { KnowledgeService } from "./knowledge.service";

@Controller()
export class KnowledgeController {
  constructor(@Inject(KnowledgeService) private readonly knowledgeService: KnowledgeService) {}

  @Post("knowledge")
  create(@Body() createKnowledgeDto: CreateKnowledgeDto) {
    return this.knowledgeService.create(createKnowledgeDto);
  }

  @Get("knowledge")
  findAll(
    @Query("positionId") positionId?: string,
    @Query("tag") tag?: string,
    @Query("difficulty") difficulty?: string
  ) {
    return this.knowledgeService.findAll({
      positionId,
      tag,
      difficulty
    });
  }

  @Get("knowledge/:id")
  findOne(@Param("id") id: string) {
    return this.knowledgeService.findOne(id);
  }

  @Patch("knowledge/:id")
  update(@Param("id") id: string, @Body() updateKnowledgeDto: UpdateKnowledgeDto) {
    return this.knowledgeService.update(id, updateKnowledgeDto);
  }

  @Delete("knowledge/:id")
  remove(@Param("id") id: string) {
    return this.knowledgeService.remove(id);
  }

  @Get("positions/:positionId/knowledge")
  findByPosition(@Param("positionId") positionId: string) {
    return this.knowledgeService.findAll({
      positionId
    });
  }
}
