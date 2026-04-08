import { Controller, Get, Inject } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AppService } from "./app.service";

@ApiTags("system")
@Controller()
export class AppController {
  constructor(@Inject(AppService) private readonly appService: AppService) {}

  @Get("health")
  @ApiOperation({ summary: "Health check" })
  @ApiOkResponse({
    description: "Backend health status",
    schema: {
      type: "object",
      properties: {
        status: { type: "string", example: "ok" },
        framework: { type: "string", example: "nestjs" },
        timestamp: { type: "string", example: "2026-04-08T00:00:00.000Z" }
      }
    }
  })
  getHealth() {
    return this.appService.getHealth();
  }
}
