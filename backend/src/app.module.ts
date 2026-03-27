import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PositionsModule } from "./positions/positions.module";
import { QuestionsModule } from "./questions/questions.module";

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: "postgres",
      host: process.env.POSTGRES_HOST ?? "127.0.0.1",
      port: Number(process.env.POSTGRES_PORT ?? 5432),
      username: process.env.POSTGRES_USER ?? "postgres",
      password: process.env.POSTGRES_PASSWORD ?? "postgres",
      database: process.env.POSTGRES_DB ?? "intervene_app",
      autoLoadEntities: true,
      synchronize: true
    }),
    PositionsModule,
    QuestionsModule
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}
