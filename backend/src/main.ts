import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { loadBackendEnv } from "./config/load-env";
import { AppModule } from "./app.module";
import { SwaggerAppModule } from "./swagger/swagger-app.module";

loadBackendEnv();

async function bootstrap() {
  const swaggerOnly = process.env.SWAGGER_ONLY === "true";
  const enableSwagger = process.env.ENABLE_SWAGGER !== "false";
  console.log(`[bootstrap] creating app. swaggerOnly=${swaggerOnly}, enableSwagger=${enableSwagger}`);
  const app = await NestFactory.create(swaggerOnly ? SwaggerAppModule : AppModule);
  app.enableCors();
  console.log("[bootstrap] app created, cors enabled");

  if (enableSwagger) {
    try {
      console.log("[bootstrap] initializing swagger");
      const config = new DocumentBuilder()
        .setTitle("Intelligent Interviewer API")
        .setDescription(
          swaggerOnly
            ? "Backend API documentation running in Swagger-only mode without database dependencies."
            : "Backend API documentation for the AI mock interview MVP."
        )
        .setVersion("0.1.0")
        .build();

      const document = SwaggerModule.createDocument(app, config);
      SwaggerModule.setup("docs", app, document, {
        jsonDocumentUrl: "docs/json"
      });
      console.log("[bootstrap] swagger initialized");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`Swagger initialization failed. Continuing without /docs. ${message}`);
    }
  }

  console.log("[bootstrap] starting http server on :3000");
  await app.listen(3000);
  console.log("[bootstrap] http server is listening on :3000");
}

void bootstrap().catch((error) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error(`[bootstrap] failed: ${message}`);
  process.exit(1);
});
