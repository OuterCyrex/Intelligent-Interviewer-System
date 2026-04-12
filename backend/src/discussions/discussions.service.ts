import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Brackets, Repository } from "typeorm";
import { CreateDiscussionDto } from "./dto/create-discussion.dto";
import { Discussion } from "./discussion.entity";
import { UsersService } from "../users/users.service";

interface QueryOptions {
  page?: number;
  pageSize?: number;
  keyword?: string;
}

@Injectable()
export class DiscussionsService {
  constructor(
    @InjectRepository(Discussion)
    private readonly discussionsRepository: Repository<Discussion>,
    private readonly usersService: UsersService
  ) {}

  async findPage(options: QueryOptions = {}) {
    const page = this.normalizePage(options.page);
    const pageSize = this.normalizePageSize(options.pageSize);
    const keyword = (options.keyword ?? "").trim();

    const query = this.discussionsRepository
      .createQueryBuilder("discussion")
      .orderBy("discussion.created_at", "DESC")
      .skip((page - 1) * pageSize)
      .take(pageSize);

    if (keyword) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where("discussion.title ILIKE :keyword", { keyword: `%${keyword}%` })
            .orWhere("discussion.content ILIKE :keyword", { keyword: `%${keyword}%` })
            .orWhere("discussion.summary ILIKE :keyword", { keyword: `%${keyword}%` })
            .orWhere("discussion.tag ILIKE :keyword", { keyword: `%${keyword}%` })
            .orWhere("discussion.author_name ILIKE :keyword", { keyword: `%${keyword}%` });
        })
      );
    }

    const [items, total] = await query.getManyAndCount();

    return {
      items,
      page,
      pageSize,
      keyword,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize))
    };
  }

  async create(dto: CreateDiscussionDto, authorization?: string) {
    const title = dto.title?.trim() ?? "";
    const content = dto.content?.trim() ?? "";
    const tag = dto.tag?.trim() || "讨论";
    const user = await this.usersService.getCurrentUser(authorization);

    if (!title) {
      throw new BadRequestException("title is required.");
    }
    if (!content) {
      throw new BadRequestException("content is required.");
    }

    const summary = content.length > 80 ? `${content.slice(0, 80)}...` : content;

    const entity = this.discussionsRepository.create({
      title,
      content,
      summary,
      userId: user.id,
      authorAccount: user.account,
      authorName: user.userName,
      tag,
      replyCount: 0
    });

    return this.discussionsRepository.save(entity);
  }

  private normalizePage(page: number | undefined) {
    const value = Number(page ?? 1);
    if (!Number.isFinite(value) || value < 1) {
      return 1;
    }
    return Math.floor(value);
  }

  private normalizePageSize(pageSize: number | undefined) {
    const value = Number(pageSize ?? 6);
    if (!Number.isFinite(value) || value < 1) {
      return 6;
    }
    return Math.min(20, Math.floor(value));
  }
}
