import { Controller, Get, Inject } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { LlmService } from "./llm.service";

@ApiTags("llm")
@Controller("llm")
export class LlmController {
  constructor(@Inject(LlmService) private readonly llmService: LlmService) {}

  @Get("status")
  @ApiOperation({ summary: "Get LLM provider configuration status" })
  getStatus() {
    return this.llmService.getStatus();
  }

  @Get("self-check")
  @ApiOperation({ summary: "Run LLM connectivity self-check for chat and embeddings" })
  async selfCheck() {
    return this.llmService.runSelfCheck();
  }
}
