import { Body, Controller, Get, Headers, Inject, Post, Query } from "@nestjs/common";
import { ApiBody, ApiHeader, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { CreateDiscussionDto } from "./dto/create-discussion.dto";
import { DiscussionsService } from "./discussions.service";

@ApiTags("discussions")
@Controller("discussions")
export class DiscussionsController {
  constructor(@Inject(DiscussionsService) private readonly discussionsService: DiscussionsService) {}

  @Get()
  @ApiOperation({ summary: "List discussions by page" })
  @ApiQuery({ name: "page", required: false, description: "Page number starts from 1" })
  @ApiQuery({ name: "pageSize", required: false, description: "Page size, max 20" })
  @ApiQuery({ name: "keyword", required: false, description: "Keyword search by title/content/tag/author" })
  findPage(
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
    @Query("keyword") keyword?: string
  ) {
    return this.discussionsService.findPage({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      keyword
    });
  }

  @Post()
  @ApiOperation({ summary: "Create a discussion post" })
  @ApiHeader({ name: "Authorization", description: "Bearer {token}" })
  @ApiBody({ type: CreateDiscussionDto })
  create(@Body() dto: CreateDiscussionDto, @Headers("authorization") authorization?: string) {
    return this.discussionsService.create(dto, authorization);
  }
}
