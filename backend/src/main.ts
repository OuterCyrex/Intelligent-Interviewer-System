import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle("Intelligent Interviewer API")
    .setDescription("Backend API documentation for the AI mock interview MVP.")
    .setVersion("0.1.0")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, document, {
    jsonDocumentUrl: "docs/json"
  });

  await app.listen(3000);
}

void bootstrap();
