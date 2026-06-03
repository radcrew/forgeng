import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@core/auth/current-user.decorator';
import type { AuthUser } from '@core/auth/auth.types';
import type { SubmissionDto } from '@common/mappers';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { ListSubmissionsQuery } from './dto/list-submissions.query';
import { UpdateSubmissionDto } from './dto/update-submission.dto';
import { SubmissionsService } from './submissions.service';

@ApiTags('submissions')
@Controller('submissions')
export class SubmissionsController {
  constructor(private readonly service: SubmissionsService) {}

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query() query: ListSubmissionsQuery,
  ): Promise<SubmissionDto[]> {
    return this.service.list(user, query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() dto: CreateSubmissionDto,
    @CurrentUser() user: AuthUser,
  ): Promise<SubmissionDto> {
    return this.service.create(dto, user);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ): Promise<SubmissionDto> {
    return this.service.findOne(id, user);
  }

  @Patch(':id')
  resubmit(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSubmissionDto,
    @CurrentUser() user: AuthUser,
  ): Promise<SubmissionDto> {
    return this.service.resubmit(id, dto, user);
  }
}
