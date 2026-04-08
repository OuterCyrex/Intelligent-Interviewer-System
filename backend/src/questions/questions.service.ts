import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FindOptionsWhere, Repository } from "typeorm";
import { CreateQuestionDto } from "./dto/create-question.dto";
import { UpdateQuestionDto } from "./dto/update-question.dto";
import { Question } from "./question.entity";
import type { QuestionDifficulty, QuestionType } from "./question.entity";

interface QuestionFilters {
  positionId?: string;
  type?: string;
  difficulty?: string;
  active?: string;
}

@Injectable()
export class QuestionsService {
  constructor(
    @InjectRepository(Question)
    private readonly questionsRepository: Repository<Question>
  ) {}

  findAll(filters: QuestionFilters = {}) {
    const where: FindOptionsWhere<Question> = {};

    if (filters.positionId) {
      where.positionId = filters.positionId;
    }
    if (filters.type) {
      where.type = filters.type as QuestionType;
    }
    if (filters.difficulty) {
      where.difficulty = filters.difficulty as QuestionDifficulty;
    }
    if (filters.active !== undefined) {
      where.isActive = filters.active !== "false";
    }

    return this.questionsRepository.find({
      where,
      relations: {
        position: true
      },
      order: {
        createdAt: "DESC"
      }
    });
  }

  findByPosition(positionId: string) {
    return this.questionsRepository.find({
      where: { positionId },
      order: {
        createdAt: "DESC"
      }
    });
  }

  async findOne(id: string) {
    const question = await this.questionsRepository.findOne({
      where: { id },
      relations: {
        position: true
      }
    });
    if (!question) {
      throw new NotFoundException(`Question ${id} not found.`);
    }
    return question;
  }

  create(createQuestionDto: CreateQuestionDto) {
    const question = this.questionsRepository.create({
      ...createQuestionDto,
      topic: createQuestionDto.topic,
      expectedKeywords: createQuestionDto.expectedKeywords ?? [],
      followUpHints: createQuestionDto.followUpHints ?? [],
      evaluationFocus: createQuestionDto.evaluationFocus ?? [],
      isActive: createQuestionDto.isActive ?? true,
      rubric: createQuestionDto.rubric ?? null
    });
    return this.questionsRepository.save(question);
  }

  async update(id: string, updateQuestionDto: UpdateQuestionDto) {
    const question = await this.findOne(id);
    Object.assign(question, updateQuestionDto);
    if (updateQuestionDto.expectedKeywords) {
      question.expectedKeywords = updateQuestionDto.expectedKeywords;
    }
    if (updateQuestionDto.followUpHints) {
      question.followUpHints = updateQuestionDto.followUpHints;
    }
    if (updateQuestionDto.evaluationFocus) {
      question.evaluationFocus = updateQuestionDto.evaluationFocus;
    }
    if (Object.prototype.hasOwnProperty.call(updateQuestionDto, "rubric")) {
      question.rubric = updateQuestionDto.rubric ?? null;
    }
    return this.questionsRepository.save(question);
  }

  async remove(id: string) {
    const question = await this.findOne(id);
    await this.questionsRepository.remove(question);
    return {
      id,
      deleted: true
    };
  }
}
