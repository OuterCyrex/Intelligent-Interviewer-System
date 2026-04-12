import { Body, Controller, Get, Headers, Inject, Patch, Post } from "@nestjs/common";
import { ApiBody, ApiHeader, ApiOperation, ApiTags } from "@nestjs/swagger";
import { LoginUserDto } from "./dto/login-user.dto";
import { RegisterUserDto } from "./dto/register-user.dto";
import { UpdateUserProfileDto } from "./dto/update-user-profile.dto";
import { UsersService } from "./users.service";

@ApiTags("users")
@Controller("users")
export class UsersController {
  constructor(@Inject(UsersService) private readonly usersService: UsersService) {}

  @Post("register")
  @ApiOperation({ summary: "Create a new user account" })
  @ApiBody({ type: RegisterUserDto })
  register(@Body() dto: RegisterUserDto) {
    return this.usersService.register(dto);
  }

  @Post("login")
  @ApiOperation({ summary: "Login by account/password" })
  @ApiBody({ type: LoginUserDto })
  login(@Body() dto: LoginUserDto) {
    return this.usersService.login(dto);
  }

  @Post("logout")
  @ApiOperation({ summary: "Logout current token session" })
  @ApiHeader({ name: "Authorization", description: "Bearer {token}" })
  logout(@Headers("authorization") authorization?: string) {
    return this.usersService.logout(authorization);
  }

  @Get("me")
  @ApiOperation({ summary: "Get current user profile" })
  @ApiHeader({ name: "Authorization", description: "Bearer {token}" })
  me(@Headers("authorization") authorization?: string) {
    return this.usersService.getCurrentUser(authorization);
  }

  @Patch("me")
  @ApiOperation({ summary: "Update current user profile" })
  @ApiHeader({ name: "Authorization", description: "Bearer {token}" })
  @ApiBody({ type: UpdateUserProfileDto })
  updateMe(
    @Headers("authorization") authorization: string | undefined,
    @Body() dto: UpdateUserProfileDto
  ) {
    return this.usersService.updateCurrentUser(authorization, dto);
  }
}

