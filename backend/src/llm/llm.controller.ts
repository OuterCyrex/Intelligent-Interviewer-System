import { Controller, Get, Inject } from "@nestjs/common";
import { LlmService } from "./llm.service";

@Controller("llm")
export class LlmController {
  constructor(@Inject(LlmService) private readonly llmService: LlmService) {}

  @Get("status")
  getStatus() {
    return this.llmService.getStatus();
  }
}
