import { Body, Controller, Delete, Get, Inject, Param, Patch, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { CreatePositionDto } from "./dto/create-position.dto";
import { UpdatePositionDto } from "./dto/update-position.dto";
import { PositionsService } from "./positions.service";

@ApiTags("positions")
@Controller("positions")
export class PositionsController {
  constructor(@Inject(PositionsService) private readonly positionsService: PositionsService) {}

  @Post()
  @ApiOperation({ summary: "Create a position track" })
  @ApiBody({ type: CreatePositionDto })
  create(@Body() createPositionDto: CreatePositionDto) {
    return this.positionsService.create(createPositionDto);
  }

  @Get()
  @ApiOperation({ summary: "List position tracks" })
  findAll() {
    return this.positionsService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a position by id" })
  @ApiParam({ name: "id", description: "Position UUID" })
  findOne(@Param("id") id: string) {
    return this.positionsService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a position" })
  @ApiParam({ name: "id", description: "Position UUID" })
  @ApiBody({ type: UpdatePositionDto })
  update(@Param("id") id: string, @Body() updatePositionDto: UpdatePositionDto) {
    return this.positionsService.update(id, updatePositionDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a position" })
  @ApiParam({ name: "id", description: "Position UUID" })
  remove(@Param("id") id: string) {
    return this.positionsService.remove(id);
  }
}
