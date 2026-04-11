import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FindOptionsWhere, Repository } from "typeorm";
import { LlmService } from "../llm/llm.service";
import { Position } from "../positions/position.entity";
import { CreateKnowledgeDto } from "./dto/create-knowledge.dto";
import { ImportMarkdownKnowledgeDto } from "./dto/import-markdown-knowledge.dto";
import { RebuildKnowledgeEmbeddingsDto } from "./dto/rebuild-knowledge-embeddings.dto";
import { UpdateKnowledgeDto } from "./dto/update-knowledge.dto";
import { KnowledgeSnippet } from "./knowledge.entity";
import { splitMarkdownIntoKnowledgeChunks } from "./markdown-import";

interface KnowledgeFilters {
  positionId?: string;
  tag?: string;
  difficulty?: string;
}

interface VectorSearchParams {
  positionId: string;
  queryText: string;
  difficulty?: string;
  limit: number;
  includeContent: boolean;
  minSimilarity?: number;
}

interface VectorSearchMatch {
  id: string;
  title: string;
  summary: string;
  content: string | null;
  tags: string[];
  difficulty: KnowledgeSnippet["difficulty"];
  similarity: number;
}

interface VectorSearchRow {
  id: string;
  title: string;
  summary: string;
  content: string | null;
  tags: string | string[] | null;
  difficulty: KnowledgeSnippet["difficulty"];
  similarity: number | string | null;
}

@Injectable()
export class KnowledgeService {
  constructor(
    @InjectRepository(KnowledgeSnippet)
    private readonly knowledgeRepository: Repository<KnowledgeSnippet>,
    @InjectRepository(Position)
    private readonly positionsRepository: Repository<Position>,
    private readonly llmService: LlmService
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

  async importMarkdown(importMarkdownDto: ImportMarkdownKnowledgeDto) {
    const positionId = importMarkdownDto.positionId?.trim();
    const title = importMarkdownDto.title?.trim();
    const markdown = importMarkdownDto.markdown?.trim();

    if (!positionId) {
      throw new BadRequestException("positionId is required.");
    }
    if (!title) {
      throw new BadRequestException("title is required.");
    }
    if (!markdown) {
      throw new BadRequestException("markdown is required.");
    }
    if (!this.llmService.isReady()) {
      throw new BadRequestException("LLM embedding provider is not configured.");
    }

    const position = await this.positionsRepository.findOneBy({ id: positionId });
    if (!position) {
      throw new NotFoundException(`Position ${positionId} not found.`);
    }

    await this.ensureVectorColumn();

    const chunks = splitMarkdownIntoKnowledgeChunks({
      title,
      markdown,
      tags: importMarkdownDto.tags ?? [],
      maxChunkLength: this.normalizeChunkLength(importMarkdownDto.maxChunkLength),
      overlap: this.normalizeOverlap(importMarkdownDto.overlap)
    });

    if (chunks.length === 0) {
      throw new BadRequestException("Markdown content could not be split into valid knowledge chunks.");
    }

    const embeddingsResponse = await this.llmService.createEmbeddings({
      input: chunks.map((chunk) => `${chunk.title}\n${chunk.summary}\n${chunk.content}`)
    });

    const results = [];
    for (const [index, chunk] of chunks.entries()) {
      const saved = await this.upsertKnowledgeChunk({
        positionId,
        title: chunk.title,
        summary: chunk.summary,
        content: chunk.content,
        tags: chunk.tags,
        difficulty: importMarkdownDto.difficulty ?? "intermediate"
      });

      await this.storeEmbedding(saved.id, embeddingsResponse.embeddings[index]);
      results.push({
        id: saved.id,
        title: saved.title,
        summary: saved.summary,
        tags: saved.tags,
        difficulty: saved.difficulty
      });
    }

    return {
      importedCount: results.length,
      position: {
        id: position.id,
        slug: position.slug,
        name: position.name
      },
      embeddingProvider: embeddingsResponse.provider,
      embeddingModel: embeddingsResponse.model,
      chunks: results
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

  async searchByEmbedding(params: VectorSearchParams): Promise<VectorSearchMatch[]> {
    const queryText = params.queryText.trim();
    if (!queryText || !this.llmService.isReady()) {
      return [];
    }

    await this.ensureVectorColumn();

    const embeddingResponse = await this.llmService.createEmbeddings({
      input: queryText
    });
    const [embedding] = embeddingResponse.embeddings;
    const vector = `[${embedding.join(",")}]`;
    const parameters: Array<string | number | boolean> = [
      vector,
      params.positionId,
      params.includeContent,
      params.limit
    ];

    let difficultyClause = "";
    if (params.difficulty) {
      parameters.push(params.difficulty);
      difficultyClause = ` AND difficulty = $${parameters.length}`;
    }

    const rows = (await this.knowledgeRepository.query(
      `
        SELECT
          id,
          title,
          summary,
          CASE WHEN $3::boolean THEN content ELSE NULL END AS content,
          tags,
          difficulty,
          GREATEST(0, 1 - (embedding <=> $1::vector)) AS similarity
        FROM knowledge_snippets
        WHERE position_id = $2
          AND embedding IS NOT NULL
          ${difficultyClause}
        ORDER BY embedding <=> $1::vector
        LIMIT $4
      `,
      parameters
    )) as VectorSearchRow[];

    return rows
      .map((row) => ({
        id: row.id as string,
        title: row.title as string,
        summary: row.summary as string,
        content: (row.content as string | null) ?? null,
        tags: this.parseSimpleArray(row.tags),
        difficulty: row.difficulty as KnowledgeSnippet["difficulty"],
        similarity: Number(row.similarity ?? 0)
      }))
      .filter((row) => row.similarity >= (params.minSimilarity ?? 0));
  }

  async rebuildEmbeddings(rebuildEmbeddingsDto: RebuildKnowledgeEmbeddingsDto) {
    if (!this.llmService.isReady()) {
      throw new BadRequestException("LLM embedding provider is not configured.");
    }

    await this.ensureVectorColumn();

    const where: FindOptionsWhere<KnowledgeSnippet> = {};
    if (rebuildEmbeddingsDto.positionId) {
      where.positionId = rebuildEmbeddingsDto.positionId;
    }
    if (rebuildEmbeddingsDto.difficulty) {
      where.difficulty = rebuildEmbeddingsDto.difficulty;
    }

    const snippets = await this.knowledgeRepository.find({
      where,
      order: {
        createdAt: "ASC"
      },
      take: this.normalizeRebuildLimit(rebuildEmbeddingsDto.limit)
    });

    if (snippets.length === 0) {
      return {
        updatedCount: 0,
        embeddingProvider: this.llmService.getStatus().provider,
        embeddingModel: this.llmService.getStatus().embeddingModel,
        snippets: []
      };
    }

    const batchSize = 16;
    let updatedCount = 0;
    let embeddingProvider = this.llmService.getStatus().provider;
    let embeddingModel = this.llmService.getStatus().embeddingModel;

    for (let index = 0; index < snippets.length; index += batchSize) {
      const batch = snippets.slice(index, index + batchSize);
      const embeddingResponse = await this.llmService.createEmbeddings({
        input: batch.map((snippet) => `${snippet.title}\n${snippet.summary}\n${snippet.content}`)
      });

      embeddingProvider = embeddingResponse.provider;
      embeddingModel = embeddingResponse.model;

      for (const [offset, snippet] of batch.entries()) {
        await this.storeEmbedding(snippet.id, embeddingResponse.embeddings[offset]);
        updatedCount += 1;
      }
    }

    return {
      updatedCount,
      embeddingProvider,
      embeddingModel,
      snippets: snippets.map((snippet) => ({
        id: snippet.id,
        title: snippet.title,
        difficulty: snippet.difficulty
      }))
    };
  }

  private async upsertKnowledgeChunk(createKnowledgeDto: CreateKnowledgeDto) {
    let snippet = await this.knowledgeRepository.findOneBy({
      positionId: createKnowledgeDto.positionId,
      title: createKnowledgeDto.title
    });

    if (!snippet) {
      snippet = this.knowledgeRepository.create({
        ...createKnowledgeDto,
        tags: createKnowledgeDto.tags ?? [],
        difficulty: createKnowledgeDto.difficulty ?? "intermediate"
      });
    } else {
      snippet.summary = createKnowledgeDto.summary;
      snippet.content = createKnowledgeDto.content;
      snippet.tags = createKnowledgeDto.tags ?? [];
      snippet.difficulty = createKnowledgeDto.difficulty ?? "intermediate";
    }

    return this.knowledgeRepository.save(snippet);
  }

  private async ensureVectorColumn() {
    await this.knowledgeRepository.query("CREATE EXTENSION IF NOT EXISTS vector");
    await this.knowledgeRepository.query(
      "ALTER TABLE knowledge_snippets ADD COLUMN IF NOT EXISTS embedding vector(1536)"
    );
    await this.knowledgeRepository.query(
      "CREATE INDEX IF NOT EXISTS idx_knowledge_snippets_embedding ON knowledge_snippets USING hnsw (embedding vector_cosine_ops)"
    );
  }

  private async storeEmbedding(id: string, embedding: number[]) {
    const vector = `[${embedding.join(",")}]`;
    await this.knowledgeRepository.query(
      "UPDATE knowledge_snippets SET embedding = $1::vector, updated_at = now() WHERE id = $2",
      [vector, id]
    );
  }

  private normalizeChunkLength(value?: number) {
    if (!Number.isFinite(value)) {
      return 1200;
    }

    return Math.max(300, Math.min(Math.trunc(value ?? 1200), 4000));
  }

  private normalizeOverlap(value?: number) {
    if (!Number.isFinite(value)) {
      return 120;
    }

    return Math.max(0, Math.min(Math.trunc(value ?? 120), 400));
  }

  private normalizeRebuildLimit(value?: number) {
    if (!Number.isFinite(value)) {
      return 200;
    }

    return Math.max(1, Math.min(Math.trunc(value ?? 200), 1000));
  }

  private parseSimpleArray(value: unknown) {
    if (Array.isArray(value)) {
      return value.map((item) => String(item));
    }
    if (typeof value !== "string" || !value.trim()) {
      return [];
    }

    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
}
