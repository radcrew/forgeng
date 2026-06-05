import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import type { AppConfiguration } from '@config';
import type { AuthUser } from '@core/auth/auth.types';

export interface UploadedVideo {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

const VIDEO_SUBDIR = 'videos';
const PUBLIC_PREFIX = `/api/uploads/${VIDEO_SUBDIR}`;

const EXT_BY_MIME: Record<string, string> = {
  'video/webm': 'webm',
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
};

function detectVideoMime(buffer: Buffer): string | null {
  // WebM: 1A 45 DF A3
  if (
    buffer.length >= 4 &&
    buffer[0] === 0x1a &&
    buffer[1] === 0x45 &&
    buffer[2] === 0xdf &&
    buffer[3] === 0xa3
  ) {
    return 'video/webm';
  }
  // MP4 / MOV: bytes 4-7 = 'ftyp'
  if (buffer.length >= 8 && buffer.toString('ascii', 4, 8) === 'ftyp') {
    return 'video/mp4';
  }
  return null;
}

@Injectable()
export class VideoService {
  constructor(private readonly config: ConfigService<AppConfiguration, true>) {}

  private get dir(): string {
    return join(this.config.get('uploadsDir', { infer: true }), VIDEO_SUBDIR);
  }

  async upload(user: AuthUser, file: UploadedVideo): Promise<{ url: string }> {
    const mime = detectVideoMime(file.buffer);
    if (!mime) {
      throw new BadRequestException(
        'Unsupported video type. Upload a WebM or MP4 file.',
      );
    }

    await mkdir(this.dir, { recursive: true });
    const ext = EXT_BY_MIME[mime] ?? 'webm';
    const filename = `${user.id}-${randomBytes(8).toString('hex')}.${ext}`;
    await writeFile(join(this.dir, filename), file.buffer);

    return { url: `${PUBLIC_PREFIX}/${filename}` };
  }
}
