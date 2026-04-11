import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiTags } from "@nestjs/swagger";
import { CreateKnowledgeDto } from "./dto/create-knowledge.dto";
import { ImportMarkdownKnowledgeDto } from "./dto/import-markdown-knowledge.dto";
import { RebuildKnowledgeEmbeddingsDto } from "./dto/rebuild-knowledge-embeddings.dto";
import { UpdateKnowledgeDto } from "./dto/update-knowledge.dto";
import { KnowledgeService } from "./knowledge.service";

@ApiTags("knowledge")
@Controller()
export class KnowledgeController {
  constructor(@Inject(KnowledgeService) private readonly knowledgeService: KnowledgeService) {}

  @Post("knowledge")
  @ApiOperation({ summary: "Create a knowledge snippet" })
  @ApiBody({ type: CreateKnowledgeDto })
  create(@Body() createKnowledgeDto: CreateKnowledgeDto) {
    return this.knowledgeService.create(createKnowledgeDto);
  }

  @Post("knowledge/import-markdown")
  @ApiOperation({ summary: "Import a Markdown document into vectorized knowledge snippets" })
  @ApiBody({ type: ImportMarkdownKnowledgeDto })
  importMarkdown(@Body() importMarkdownKnowledgeDto: ImportMarkdownKnowledgeDto) {
    return this.knowledgeService.importMarkdown(importMarkdownKnowledgeDto);
  }

  @Post("knowledge/rebuild-embeddings")
  @ApiOperation({ summary: "Rebuild embeddings for existing knowledge snippets" })
  @ApiBody({ type: RebuildKnowledgeEmbeddingsDto })
  rebuildEmbeddings(@Body() rebuildKnowledgeEmbeddingsDto: RebuildKnowledgeEmbeddingsDto) {
    return this.knowledgeService.rebuildEmbeddings(rebuildKnowledgeEmbeddingsDto);
  }

  @Get("knowledge")
  @ApiOperation({ summary: "List knowledge snippets" })
  @ApiQuery({ name: "positionId", required: false })
  @ApiQuery({ name: "tag", required: false })
  @ApiQuery({ name: "difficulty", required: false })
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
  @ApiOperation({ summary: "Get a knowledge snippet by id" })
  @ApiParam({ name: "id", description: "Knowledge snippet UUID" })
  findOne(@Param("id") id: string) {
    return this.knowledgeService.findOne(id);
  }

  @Patch("knowledge/:id")
  @ApiOperation({ summary: "Update a knowledge snippet" })
  @ApiParam({ name: "id", description: "Knowledge snippet UUID" })
  @ApiBody({ type: UpdateKnowledgeDto })
  update(@Param("id") id: string, @Body() updateKnowledgeDto: UpdateKnowledgeDto) {
    return this.knowledgeService.update(id, updateKnowledgeDto);
  }

  @Delete("knowledge/:id")
  @ApiOperation({ summary: "Delete a knowledge snippet" })
  @ApiParam({ name: "id", description: "Knowledge snippet UUID" })
  remove(@Param("id") id: string) {
    return this.knowledgeService.remove(id);
  }

  @Get("positions/:positionId/knowledge")
  @ApiOperation({ summary: "List knowledge snippets for a position" })
  @ApiParam({ name: "positionId", description: "Position UUID" })
  findByPosition(@Param("positionId") positionId: string) {
    return this.knowledgeService.findAll({
      positionId
    });
  }
}
