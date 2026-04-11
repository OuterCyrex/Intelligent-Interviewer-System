import { Module } from "@nestjs/common";
import { KnowledgeModule } from "../knowledge/knowledge.module";
import { RagController } from "./rag.controller";
import { RagService } from "./rag.service";

@Module({
  imports: [KnowledgeModule],
  controllers: [RagController],
  providers: [RagService],
  exports: [RagService]
})
export class RagModule {}
