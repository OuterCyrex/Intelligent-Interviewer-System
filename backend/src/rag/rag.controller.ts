import { Body, Controller, Inject, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { RetrieveKnowledgeDto } from "./dto/retrieve-knowledge.dto";
import { RagService } from "./rag.service";

@ApiTags("rag")
@Controller("rag")
export class RagController {
  constructor(@Inject(RagService) private readonly ragService: RagService) {}

  @Post("retrieve")
  @ApiOperation({ summary: "Retrieve position-specific knowledge snippets for a query" })
  @ApiBody({ type: RetrieveKnowledgeDto })
  retrieve(@Body() retrieveKnowledgeDto: RetrieveKnowledgeDto) {
    return this.ragService.retrieve(retrieveKnowledgeDto);
  }
}
