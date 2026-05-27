import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
} from '@nestjs/common';

import type { UserDto } from '../../common/mappers';
import { Roles } from '../../core/auth/roles.decorator';
import { ListUsersQuery } from './dto/list-users.query';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UsersService } from './users.service';

@Roles('admin')
@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Get()
  list(@Query() query: ListUsersQuery): Promise<UserDto[]> {
    return this.service.list(query);
  }

  @Patch(':id/role')
  updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRoleDto,
  ): Promise<UserDto> {
    return this.service.updateRole(id, dto);
  }
}
