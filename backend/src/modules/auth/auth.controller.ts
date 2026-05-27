import { Body, Controller, Get, Patch } from '@nestjs/common';
import { CurrentUser } from '../../core/auth/current-user.decorator';
import type { AuthUser } from '../../core/auth/auth.types';
import { toUserDto, type UserDto } from '../../common/mappers';
import { PrismaService } from '../../core/database/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('auth')
export class AuthController {
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
