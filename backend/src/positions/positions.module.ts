import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Position } from "./position.entity";
import { PositionsController } from "./positions.controller";
import { PositionsService } from "./positions.service";

@Module({
  imports: [TypeOrmModule.forFeature([Position])],
  controllers: [PositionsController],
  providers: [PositionsService]
})
export class PositionsModule {}
