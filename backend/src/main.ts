import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { SwaggerAppModule } from "./swagger/swagger-app.module";

async function bootstrap() {
  const swaggerOnly = process.env.SWAGGER_ONLY === "true";
  const app = await NestFactory.create(swaggerOnly ? SwaggerAppModule : AppModule);
  app.enableCors();

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

  await app.listen(3000);
}

void bootstrap();
