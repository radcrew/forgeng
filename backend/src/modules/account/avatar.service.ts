import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'node:crypto';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import type { AppConfiguration } from '@config';
import type { AuthUser } from '@core/auth/auth.types';
import { PrismaService } from '@core/database/prisma.service';
import { toUserDto, type UserDto } from '@common/mappers';

/** Minimal shape of a Multer memory-storage file — avoids a @types/multer dep. */
export interface UploadedImage {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

const AVATAR_SUBDIR = 'avatars';
/** Public URL prefix; mirrors the static mount in `main.ts` (`/api/uploads`). */
const PUBLIC_PREFIX = `/api/uploads/${AVATAR_SUBDIR}`;

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/**
 * Sniff the real image type from magic bytes rather than trusting the declared
 * mimetype (which the client controls and can spoof).
 */
function detectImageMime(buffer: Buffer): string | null {
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return 'image/jpeg';
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return 'image/png';
  }
  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp';
  }
  return null;
}

@Injectable()
export class AvatarService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<AppConfiguration, true>,
  ) {}

  private get dir(): string {
    return join(this.config.get('uploadsDir', { infer: true }), AVATAR_SUBDIR);
  }

  async upload(user: AuthUser, file: UploadedImage): Promise<UserDto> {
    const mime = detectImageMime(file.buffer);
    if (!mime) {
      throw new BadRequestException(
        'Unsupported image type. Upload a JPEG, PNG, or WebP file.',
      );
    }

    await mkdir(this.dir, { recursive: true });
    const filename = `${user.id}-${randomBytes(8).toString('hex')}.${EXT_BY_MIME[mime]}`;
    await writeFile(join(this.dir, filename), file.buffer);

    const previous = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { avatarUrl: true },
    });

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: { avatarUrl: `${PUBLIC_PREFIX}/${filename}` },
    });

    await this.removePrevious(previous?.avatarUrl ?? null, filename);

    return toUserDto(updated);
  }

  /** Best-effort delete of the prior locally-stored avatar, if any. */
  private async removePrevious(
    previousUrl: string | null,
    keep: string,
  ): Promise<void> {
    if (!previousUrl || !previousUrl.startsWith(`${PUBLIC_PREFIX}/`)) return;
    const name = previousUrl.slice(`${PUBLIC_PREFIX}/`.length);
    // Guard against path traversal and deleting the file we just wrote.
    if (!name || name === keep || name.includes('/') || name.includes('..')) {
      return;
    }
    await rm(join(this.dir, name), { force: true }).catch(() => undefined);
  }
}
