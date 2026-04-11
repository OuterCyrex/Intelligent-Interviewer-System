import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { LlmModule } from "../llm/llm.module";
import { Position } from "../positions/position.entity";
import { KnowledgeController } from "./knowledge.controller";
import { KnowledgeSnippet } from "./knowledge.entity";
import { KnowledgeService } from "./knowledge.service";

@Module({
  imports: [TypeOrmModule.forFeature([KnowledgeSnippet, Position]), forwardRef(() => LlmModule)],
  controllers: [KnowledgeController],
  providers: [KnowledgeService],
  exports: [KnowledgeService]
})
export class KnowledgeModule {}
