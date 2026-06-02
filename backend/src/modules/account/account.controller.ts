import {
  Body,
  Controller,
  Get,
  MaxFileSizeValidator,
  ParseFilePipe,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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
import { AvatarService, type UploadedImage } from './avatar.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2 MB

@ApiTags('account')
@Controller('account')
export class AccountController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly avatar: AvatarService,
  ) {}

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

  @Post('avatar')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_AVATAR_BYTES } }),
  )
  uploadAvatar(
    @CurrentUser() user: AuthUser,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: MAX_AVATAR_BYTES })],
      }),
    )
    file: UploadedImage,
  ): Promise<UserDto> {
    return this.avatar.upload(user, file);
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
