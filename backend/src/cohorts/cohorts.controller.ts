import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { Roles } from '../common/auth/roles.decorator';
import type { CohortDto, EnrollmentDto } from '../common/serializers';
import { CohortsService } from './cohorts.service';
import { CreateCohortDto } from './dto/create-cohort.dto';
import { EnrollDto } from './dto/enroll.dto';
import { UpdateCohortDto } from './dto/update-cohort.dto';

@Controller('cohorts')
export class CohortsController {
  constructor(private readonly service: CohortsService) {}

  @Get()
  list(): Promise<CohortDto[]> {
    return this.service.list();
  }

  @Roles('admin')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateCohortDto): Promise<CohortDto> {
    return this.service.create(dto);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<CohortDto> {
    return this.service.findOne(id);
  }

  @Roles('admin')
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCohortDto,
  ): Promise<CohortDto> {
    return this.service.update(id, dto);
  }

  @Roles('admin')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.service.remove(id);
  }

  @Roles('admin', 'mentor')
  @Get(':id/enrollments')
  enrollments(@Param('id', ParseIntPipe) id: number): Promise<EnrollmentDto[]> {
    return this.service.enrollments(id);
  }

  @Roles('admin')
  @Post(':id/enroll')
  @HttpCode(HttpStatus.CREATED)
  enroll(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: EnrollDto,
  ): Promise<EnrollmentDto> {
    return this.service.enroll(id, dto);
  }
}
