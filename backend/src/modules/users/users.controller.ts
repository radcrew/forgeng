import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import type { ProfileEnrollmentDto, UserDto } from '@common/mappers';
import { Roles } from '@core/auth/roles.decorator';
import { ListUsersQuery } from './dto/list-users.query';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import {
  UsersService,
  type PaginatedUsers,
  type PaymentDto,
  type UserPaymentStats,
} from './users.service';

@ApiTags('users')
@Roles('admin')
@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Get()
  list(@Query() query: ListUsersQuery): Promise<PaginatedUsers> {
    return this.service.list(query);
  }

  @Get(':id')
  getById(@Param('id', ParseIntPipe) id: number): Promise<UserDto> {
    return this.service.getById(id);
  }

  @Post(':id/payments')
  recordPayment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RecordPaymentDto,
  ): Promise<PaymentDto> {
    return this.service.recordPayment(id, dto);
  }

  @Get(':id/payment-stats')
  paymentStats(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<UserPaymentStats> {
    return this.service.paymentStats(id);
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
