import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import {
  toCohortDto,
  toUserDto,
  type ProfileEnrollmentDto,
  type UserDto,
} from '@common/mappers';
import type { AuthUser } from '@core/auth/auth.types';
import { CurrentUser } from '@core/auth/current-user.decorator';
import { PrismaService } from '@core/database/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@ApiTags('account')
@Controller('account')
export class AccountController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('me')
  getMe(@CurrentUser() user: AuthUser): UserDto {
    return toUserDto(user);
  }

  @Patch('profile')
  async updateProfile(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateProfileDto,
  ): Promise<UserDto> {
    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: dto,
    });
    return toUserDto(updated);
  }

  @Get('enrollments')
  async getEnrollments(
    @CurrentUser() user: AuthUser,
  ): Promise<ProfileEnrollmentDto[]> {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId: user.id },
      orderBy: { enrolledAt: 'desc' },
      include: {
        cohort: { include: { _count: { select: { enrollments: true } } } },
      },
    });

    return enrollments.map((e) => ({
      id: e.id,
      enrolledAt: e.enrolledAt.toISOString(),
      cohort: toCohortDto(e.cohort, e.cohort._count.enrollments),
    }));
  }
}
