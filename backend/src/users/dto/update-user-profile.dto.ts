import { ApiPropertyOptional } from "@nestjs/swagger";

export class UpdateUserProfileDto {
  @ApiPropertyOptional({ description: "Display name", example: "Alice" })
  userName?: string;

  @ApiPropertyOptional({ description: "City", example: "Shanghai" })
  city?: string;

  @ApiPropertyOptional({ description: "Age", example: 24 })
  age?: number | null;

  @ApiPropertyOptional({ description: "Target role", example: "后端开发工程师" })
  targetRole?: string;
}

