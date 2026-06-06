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
import { UpdateWalletsDto } from './dto/update-wallets.dto';

const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2 MB

@ApiTags('account')
@Controller('account')
export class AccountController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly avatar: AvatarService,
  ) {}

  @Get('me')
  async getMe(@CurrentUser() user: AuthUser): Promise<UserDto> {
    const socials = await this.prisma.application.findUnique({
      where: { userId: user.id },
      select: {
        linkedin: true,
        twitter: true,
        facebook: true,
        github: true,
        portfolio: true,
        telegram: true,
        whatsapp: true,
      },
    });
    return toUserDto(user, socials);
  }

  @Get('wallets')
  async getWallets(
    @CurrentUser() user: AuthUser,
  ): Promise<{ wallets: Array<{ chain: string; address: string }> }> {
    const app = await this.prisma.application.findUnique({
      where: { userId: user.id },
      select: { wallets: true },
    });
    return {
      wallets:
        (app?.wallets as Array<{ chain: string; address: string }> | null) ??
        [],
    };
  }

  @Patch('wallets')
  async updateWallets(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateWalletsDto,
  ): Promise<{ wallets: Array<{ chain: string; address: string }> }> {
    await this.prisma.application.updateMany({
      where: { userId: user.id },
      data: { wallets: dto.wallets },
    });
    return { wallets: dto.wallets };
  }

  @Patch('profile')
  async updateProfile(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateProfileDto,
  ): Promise<UserDto> {
    const {
      linkedin,
      twitter,
      facebook,
      github,
      portfolio,
      telegram,
      whatsapp,
      ...userFields
    } = dto;
    const socialFields = {
      linkedin,
      twitter,
      facebook,
      github,
      portfolio,
      telegram,
      whatsapp,
    };
    const hasSocials = Object.values(socialFields).some((v) => v !== undefined);

    const [updated, socials] = await Promise.all([
      this.prisma.user.update({ where: { id: user.id }, data: userFields }),
      hasSocials
        ? this.prisma.application
            .updateMany({ where: { userId: user.id }, data: socialFields })
            .then(() =>
              this.prisma.application.findUnique({
                where: { userId: user.id },
                select: {
                  linkedin: true,
                  twitter: true,
                  facebook: true,
                  github: true,
                  portfolio: true,
                  telegram: true,
                  whatsapp: true,
                },
              }),
            )
        : this.prisma.application.findUnique({
            where: { userId: user.id },
            select: {
              linkedin: true,
              twitter: true,
              facebook: true,
              github: true,
              portfolio: true,
              telegram: true,
              whatsapp: true,
            },
          }),
    ]);

    return toUserDto(updated, socials);
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
