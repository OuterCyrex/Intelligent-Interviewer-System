import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateQuestionDto } from "./dto/create-question.dto";
import { UpdateQuestionDto } from "./dto/update-question.dto";
import { Question } from "./question.entity";

@Injectable()
export class QuestionsService {
  constructor(
    @InjectRepository(Question)
    private readonly questionsRepository: Repository<Question>
  ) {}

  findAll() {
    return this.questionsRepository.find({
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
      expectedKeywords: createQuestionDto.expectedKeywords ?? [],
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
