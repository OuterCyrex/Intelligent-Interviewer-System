import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreatePositionDto } from "./dto/create-position.dto";
import { UpdatePositionDto } from "./dto/update-position.dto";
import { Position } from "./position.entity";

@Injectable()
export class PositionsService {
  constructor(
    @InjectRepository(Position)
    private readonly positionsRepository: Repository<Position>
  ) {}

  findAll() {
    return this.positionsRepository.find({
      order: {
        createdAt: "DESC"
      }
    });
  }

  async findOne(id: string) {
    const position = await this.positionsRepository.findOneBy({ id });
    if (!position) {
      throw new NotFoundException(`Position ${id} not found.`);
    }
    return position;
  }

  create(createPositionDto: CreatePositionDto) {
    const position = this.positionsRepository.create({
      ...createPositionDto,
      highlights: createPositionDto.highlights ?? []
    });
    return this.positionsRepository.save(position);
  }

  async update(id: string, updatePositionDto: UpdatePositionDto) {
    const position = await this.findOne(id);
    Object.assign(position, updatePositionDto);
    if (updatePositionDto.highlights) {
      position.highlights = updatePositionDto.highlights;
    }
    return this.positionsRepository.save(position);
  }

  async remove(id: string) {
    const position = await this.findOne(id);
    await this.positionsRepository.remove(position);
    return {
      id,
      deleted: true
    };
  }
}
