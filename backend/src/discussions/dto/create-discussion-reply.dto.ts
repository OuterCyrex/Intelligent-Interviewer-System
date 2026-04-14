import { ApiProperty } from "@nestjs/swagger";

export class CreateDiscussionReplyDto {
  @ApiProperty({ description: "Reply content", example: "我一般会先讲结论，再补排查路径和最终指标变化。" })
  content!: string;
}
