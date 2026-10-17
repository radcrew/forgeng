import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Header,
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
} from '../../common/mappers';
import type { AuthUser } from '../../core/auth/auth.types';
import { CurrentUser } from '../../core/auth/current-user.decorator';
import { PrismaService } from '../../core/database/prisma.service';
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

  // no-store so the browser never revalidates with If-None-Match. A 304 here
  // makes the frontend's auth check (getMe) fail, which stalls the post-login
  // redirect. Authenticated user data should not be cached anyway.
  @Get('me')
  @Header('Cache-Control', 'no-store')
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
    const wallets = dto.wallets.map((w) => ({
      chain: w.chain,
      address: w.address,
    }));
    const { count } = await this.prisma.application.updateMany({
      where: { userId: user.id },
      data: { wallets },
    });
    // Nothing was stored, so don't report the wallet as saved: the student
    // would believe they can be paid when there is no address on file.
    if (count === 0) {
      throw new BadRequestException(
        'Wallets are saved with your application, and this account has none. Please contact an admin to add your wallet.',
      );
    }
    return { wallets };
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

    const SOCIALS_SELECT = {
      linkedin: true,
      twitter: true,
      facebook: true,
      github: true,
      portfolio: true,
      telegram: true,
      whatsapp: true,
    } as const;

    // Social links live on the application. Saving them never creates one,
    // because an application made here would show up as an empty pending
    // application in the admin list.
    const hasApplication =
      (await this.prisma.application.count({ where: { userId: user.id } })) > 0;
    if (hasSocials && !hasApplication) {
      throw new BadRequestException(
        'Social links are saved with your application, and this account has none. Clear the links to save the rest of your profile.',
      );
    }

    const [updated, socials] = await Promise.all([
      this.prisma.user.update({ where: { id: user.id }, data: userFields }),
      hasSocials
        ? this.prisma.application.update({
            where: { userId: user.id },
            data: socialFields,
            select: SOCIALS_SELECT,
          })
        : this.prisma.application.findUnique({
            where: { userId: user.id },
            select: SOCIALS_SELECT,
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
