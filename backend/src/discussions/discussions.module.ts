import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UsersModule } from "../users/users.module";
import { Discussion } from "./discussion.entity";
import { DiscussionsController } from "./discussions.controller";
import { DiscussionsService } from "./discussions.service";

@Module({
  imports: [TypeOrmModule.forFeature([Discussion]), UsersModule],
  controllers: [DiscussionsController],
  providers: [DiscussionsService],
  exports: [DiscussionsService]
})
export class DiscussionsModule {}
