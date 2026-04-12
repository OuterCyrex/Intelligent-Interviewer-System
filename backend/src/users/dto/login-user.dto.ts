import { ApiProperty } from "@nestjs/swagger";

export class LoginUserDto {
  @ApiProperty({ description: "Login account", example: "alice001" })
  account!: string;

  @ApiProperty({ description: "Login password", example: "P@ssw0rd123" })
  password!: string;
}

