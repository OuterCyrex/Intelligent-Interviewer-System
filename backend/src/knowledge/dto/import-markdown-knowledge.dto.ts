import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import type { QuestionDifficulty } from "../../questions/question.entity";

export class ImportMarkdownKnowledgeDto {
  @ApiProperty({ example: "a35f2be6-0000-4000-8000-111111111111" })
  positionId!: string;

  @ApiProperty({ example: "Redis 缓存一致性实战" })
  title!: string;

  @ApiProperty({
    example: "# Redis 缓存一致性\n\n## 为什么会不一致\n\n在高并发写入场景下，缓存与数据库会出现短暂不一致..."
  })
  markdown!: string;

  @ApiPropertyOptional({
    type: [String],
    example: ["Redis", "缓存", "一致性"]
  })
  tags?: string[];

  @ApiPropertyOptional({ enum: ["junior", "intermediate", "senior"], example: "intermediate" })
  difficulty?: QuestionDifficulty;

  @ApiPropertyOptional({ example: 1200, description: "单个知识分块的最大字符数" })
  maxChunkLength?: number;

  @ApiPropertyOptional({ example: 120, description: "相邻分块之间的重叠字符数" })
  overlap?: number;
}
