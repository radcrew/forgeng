import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import type { ProfileEnrollmentDto, UserDto } from '@common/mappers';
import { Roles } from '@core/auth/roles.decorator';
import { ListUsersQuery } from './dto/list-users.query';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@Roles('admin')
@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Get()
  list(@Query() query: ListUsersQuery): Promise<UserDto[]> {
    return this.service.list(query);
  }

  @Get(':id/enrollments')
  enrollments(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ProfileEnrollmentDto[]> {
    return this.service.enrollments(id);
  }

  @Patch(':id/role')
  updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRoleDto,
  ): Promise<UserDto> {
    return this.service.updateRole(id, dto);
  }
}
