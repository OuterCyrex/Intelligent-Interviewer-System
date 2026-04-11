import { Module, forwardRef } from "@nestjs/common";
import { AudioModule } from "../audio/audio.module";
import { RagModule } from "../rag/rag.module";
import { InterviewIntelligenceService } from "./interview-intelligence.service";
import { LlmController } from "./llm.controller";
import { LlmService } from "./llm.service";
import { ReportIntelligenceService } from "./report-intelligence.service";

@Module({
  imports: [AudioModule, forwardRef(() => RagModule)],
  controllers: [LlmController],
  providers: [LlmService, InterviewIntelligenceService, ReportIntelligenceService],
  exports: [LlmService, InterviewIntelligenceService, ReportIntelligenceService]
})
export class LlmModule {}
