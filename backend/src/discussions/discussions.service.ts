import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Brackets, Repository } from "typeorm";
import { CreateDiscussionDto } from "./dto/create-discussion.dto";
import { CreateDiscussionReplyDto } from "./dto/create-discussion-reply.dto";
import { DiscussionReply } from "./discussion-reply.entity";
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
    @InjectRepository(DiscussionReply)
    private readonly discussionRepliesRepository: Repository<DiscussionReply>,
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

  async findReplies(discussionId: string) {
    await this.ensureDiscussionExists(discussionId);

    return this.discussionRepliesRepository.find({
      where: { discussionId },
      order: { createdAt: "ASC" }
    });
  }

  async createReply(discussionId: string, dto: CreateDiscussionReplyDto, authorization?: string) {
    const discussion = await this.ensureDiscussionExists(discussionId);
    const content = dto.content?.trim() ?? "";
    const user = await this.usersService.getCurrentUser(authorization);

    if (!content) {
      throw new BadRequestException("content is required.");
    }

    const entity = this.discussionRepliesRepository.create({
      discussionId: discussion.id,
      content,
      userId: user.id,
      authorAccount: user.account,
      authorName: user.userName
    });

    const savedReply = await this.discussionRepliesRepository.save(entity);
    await this.discussionsRepository.increment({ id: discussion.id }, "replyCount", 1);

    return savedReply;
  }

  private async ensureDiscussionExists(discussionId: string) {
    const discussion = await this.discussionsRepository.findOneBy({ id: discussionId });
    if (!discussion) {
      throw new NotFoundException("Discussion not found.");
    }
    return discussion;
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
