import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class RegisterUserDto {
  @ApiProperty({ description: "Login account", example: "alice001" })
  account!: string;

  @ApiProperty({ description: "Login password", example: "P@ssw0rd123" })
  password!: string;

  @ApiPropertyOptional({ description: "Display name", example: "Alice" })
  userName?: string;

  @ApiPropertyOptional({ description: "City", example: "Shanghai" })
  city?: string;

  @ApiPropertyOptional({ description: "Age", example: 24 })
  age?: number | null;

  @ApiPropertyOptional({ description: "Target role", example: "前端开发工程师" })
  targetRole?: string;
}

