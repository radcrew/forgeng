import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { randomBytes } from 'node:crypto';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import type { AppConfiguration } from '../../config';
import type { AuthUser } from '../../core/auth/auth.types';
import { PrismaService } from '../../core/database/prisma.service';
import { toUserDto, type UserDto } from '../../common/mappers';

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
/** Public Supabase Storage bucket used instead of the disk when configured. */
const STORAGE_BUCKET = 'avatars';

type StorageBucket = ReturnType<SupabaseClient['storage']['from']>;

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
  private readonly logger = new Logger(AvatarService.name);
  private readonly bucket: StorageBucket | null;
  /** URL prefix of avatars this service stored, used to find old ones to delete. */
  private readonly publicPrefix: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<AppConfiguration, true>,
  ) {
    // Serverless hosts (Vercel) have a read-only filesystem, so avatars go to
    // Supabase Storage when it's configured; local dev and tests use the disk.
    const storage = this.config.get('storage', { infer: true });
    if (storage) {
      this.bucket = createClient(storage.supabaseUrl, storage.serviceRoleKey, {
        auth: { persistSession: false },
      }).storage.from(STORAGE_BUCKET);
      this.publicPrefix = `${storage.supabaseUrl.replace(/\/+$/, '')}/storage/v1/object/public/${STORAGE_BUCKET}/`;
    } else {
      this.bucket = null;
      this.publicPrefix = `${PUBLIC_PREFIX}/`;
    }
  }

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

    const filename = `${user.id}-${randomBytes(8).toString('hex')}.${EXT_BY_MIME[mime]}`;
    await this.store(filename, file.buffer, mime);

    const previous = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { avatarUrl: true },
    });

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: { avatarUrl: `${this.publicPrefix}${filename}` },
    });

    await this.removePrevious(previous?.avatarUrl ?? null, filename);

    return toUserDto(updated);
  }

  private async store(
    filename: string,
    buffer: Buffer,
    mime: string,
  ): Promise<void> {
    if (!this.bucket) {
      await mkdir(this.dir, { recursive: true });
      await writeFile(join(this.dir, filename), buffer);
      return;
    }
    const { error } = await this.bucket.upload(filename, buffer, {
      contentType: mime,
    });
    if (error) {
      this.logger.error(`Avatar upload to storage failed: ${error.message}`);
      throw new InternalServerErrorException('Could not store the avatar.');
    }
  }

  /** Best-effort delete of the prior avatar this service stored, if any. */
  private async removePrevious(
    previousUrl: string | null,
    keep: string,
  ): Promise<void> {
    // OAuth avatars (e.g. Google) are external URLs and fail this check.
    if (!previousUrl || !previousUrl.startsWith(this.publicPrefix)) return;
    const name = previousUrl.slice(this.publicPrefix.length);
    // Guard against path traversal and deleting the file we just wrote.
    if (!name || name === keep || name.includes('/') || name.includes('..')) {
      return;
    }
    if (this.bucket) {
      await this.bucket.remove([name]).catch(() => undefined);
      return;
    }
    await rm(join(this.dir, name), { force: true }).catch(() => undefined);
  }
}
