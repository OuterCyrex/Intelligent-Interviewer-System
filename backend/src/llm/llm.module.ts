import { Module } from "@nestjs/common";
import { AudioModule } from "../audio/audio.module";
import { InterviewIntelligenceService } from "./interview-intelligence.service";
import { LlmController } from "./llm.controller";
import { LlmService } from "./llm.service";

@Module({
  imports: [AudioModule],
  controllers: [LlmController],
  providers: [LlmService, InterviewIntelligenceService],
  exports: [LlmService, InterviewIntelligenceService]
})
export class LlmModule {}
