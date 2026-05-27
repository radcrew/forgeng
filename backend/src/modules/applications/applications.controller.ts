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
import { Public } from '../../core/auth/public.decorator';
import { Roles } from '../../core/auth/roles.decorator';
import type { ApplicationDto } from '../../common/mappers';
import {
  ApplicationsService,
  type ApplicationStats,
} from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { ListApplicationsQuery } from './dto/list-applications.query';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';

@Controller('applications')
export class ApplicationsController {
  constructor(private readonly service: ApplicationsService) {}

  @Roles('admin')
  @Get('stats')
  stats(): Promise<ApplicationStats> {
    return this.service.stats();
  }

  @Roles('admin')
  @Get()
  list(@Query() query: ListApplicationsQuery): Promise<ApplicationDto[]> {
    return this.service.list(query.status);
  }

  @Public()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateApplicationDto): Promise<ApplicationDto> {
    return this.service.create(dto);
  }

  @Roles('admin')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<ApplicationDto> {
    return this.service.findOne(id);
  }

  @Roles('admin')
  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateApplicationStatusDto,
  ): Promise<ApplicationDto> {
    return this.service.updateStatus(id, dto);
  }
}
