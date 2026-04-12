import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateDiscussionDto {
  @ApiProperty({ description: "Discussion title", example: "前端性能优化到底先看什么指标？" })
  title!: string;

  @ApiProperty({ description: "Discussion content", example: "最近上线后 LCP 变差，大家一般怎么排查？" })
  content!: string;

  @ApiPropertyOptional({ description: "Topic tag", example: "性能" })
  tag?: string;
}
