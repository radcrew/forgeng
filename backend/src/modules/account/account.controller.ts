import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { toUserDto, type UserDto } from '@common/mappers';
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
}
