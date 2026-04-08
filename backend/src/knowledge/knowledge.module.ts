import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { KnowledgeController } from "./knowledge.controller";
import { KnowledgeSnippet } from "./knowledge.entity";
import { KnowledgeService } from "./knowledge.service";

@Module({
  imports: [TypeOrmModule.forFeature([KnowledgeSnippet])],
  controllers: [KnowledgeController],
  providers: [KnowledgeService],
  exports: [KnowledgeService]
})
export class KnowledgeModule {}
