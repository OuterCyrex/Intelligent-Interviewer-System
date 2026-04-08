import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FindOptionsWhere, Repository } from "typeorm";
import { CreateKnowledgeDto } from "./dto/create-knowledge.dto";
import { UpdateKnowledgeDto } from "./dto/update-knowledge.dto";
import { KnowledgeSnippet } from "./knowledge.entity";

interface KnowledgeFilters {
  positionId?: string;
  tag?: string;
  difficulty?: string;
}

@Injectable()
export class KnowledgeService {
  constructor(
    @InjectRepository(KnowledgeSnippet)
    private readonly knowledgeRepository: Repository<KnowledgeSnippet>
  ) {}

  findAll(filters: KnowledgeFilters = {}) {
    const where: FindOptionsWhere<KnowledgeSnippet> = {};

    if (filters.positionId) {
      where.positionId = filters.positionId;
    }
    if (filters.difficulty) {
      where.difficulty = filters.difficulty as KnowledgeSnippet["difficulty"];
    }

    return this.knowledgeRepository.find({
      where,
      relations: {
        position: true
      },
      order: {
        createdAt: "DESC"
      }
    }).then((items) => {
      if (!filters.tag) {
        return items;
      }

      const normalizedTag = filters.tag.trim().toLowerCase();
      return items.filter((item) =>
        item.tags.some((tag) => tag.trim().toLowerCase() === normalizedTag)
      );
    });
  }

  async findOne(id: string) {
    const snippet = await this.knowledgeRepository.findOne({
      where: { id },
      relations: {
        position: true
      }
    });
    if (!snippet) {
      throw new NotFoundException(`Knowledge snippet ${id} not found.`);
    }
    return snippet;
  }

  create(createKnowledgeDto: CreateKnowledgeDto) {
    const snippet = this.knowledgeRepository.create({
      ...createKnowledgeDto,
      tags: createKnowledgeDto.tags ?? [],
      difficulty: createKnowledgeDto.difficulty ?? "intermediate"
    });
    return this.knowledgeRepository.save(snippet);
  }

  async update(id: string, updateKnowledgeDto: UpdateKnowledgeDto) {
    const snippet = await this.findOne(id);
    Object.assign(snippet, updateKnowledgeDto);
    if (updateKnowledgeDto.tags) {
      snippet.tags = updateKnowledgeDto.tags;
    }
    return this.knowledgeRepository.save(snippet);
  }

  async remove(id: string) {
    const snippet = await this.findOne(id);
    await this.knowledgeRepository.remove(snippet);
    return {
      id,
      deleted: true
    };
  }

  async findRelevant(positionId: string, terms: string[], limit = 3) {
    const normalizedTerms = terms.map((term) => term.trim().toLowerCase()).filter(Boolean);
    const snippets = await this.knowledgeRepository.find({
      where: { positionId },
      order: {
        createdAt: "DESC"
      }
    });

    return snippets
      .map((snippet) => {
        const haystack = [snippet.title, snippet.summary, snippet.content, ...snippet.tags]
          .join(" ")
          .toLowerCase();

        const score = normalizedTerms.reduce((total, term) => {
          if (!term) {
            return total;
          }
          return haystack.includes(term) ? total + 1 : total;
        }, 0);

        return {
          snippet,
          score
        };
      })
      .filter((item) => item.score > 0)
      .sort((left, right) => right.score - left.score)
      .slice(0, limit)
      .map((item) => item.snippet);
  }
}
