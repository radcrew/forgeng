import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { randomBytes } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import type { AppConfiguration } from '../../config';
import type { AuthUser } from '../../core/auth/auth.types';

export interface UploadedVideo {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

/** Upload target for the browser; both null when videos are stored on disk. */
export interface VideoUploadTarget {
  uploadUrl: string | null;
  path: string | null;
}

export const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50 MB
export const VIDEO_CONTENT_TYPES = ['video/webm', 'video/mp4'] as const;
export type VideoContentType = (typeof VIDEO_CONTENT_TYPES)[number];

const VIDEO_SUBDIR = 'videos';
const PUBLIC_PREFIX = `/api/uploads/${VIDEO_SUBDIR}`;
/** Private Supabase Storage bucket; admins watch through short-lived links. */
const STORAGE_BUCKET = 'videos';
const VIEW_URL_TTL_SECONDS = 60 * 60;

type StorageBucket = ReturnType<SupabaseClient['storage']['from']>;

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

/** Disk uploads are stored as URLs; storage uploads as `<userId>/<name>`. */
const isStoragePath = (value: string): boolean =>
  !value.startsWith('/') && !/^https?:\/\//i.test(value);

@Injectable()
export class VideoService {
  private readonly logger = new Logger(VideoService.name);
  private readonly bucket: StorageBucket | null;

  constructor(private readonly config: ConfigService<AppConfiguration, true>) {
    // Vercel has a read-only filesystem and a 4.5 MB request limit, so when
    // Supabase is configured the browser uploads straight to Storage.
    const storage = this.config.get('storage', { infer: true });
    this.bucket = storage
      ? createClient(storage.supabaseUrl, storage.serviceRoleKey, {
          auth: { persistSession: false },
        }).storage.from(STORAGE_BUCKET)
      : null;
  }

  private get dir(): string {
    return join(this.config.get('uploadsDir', { infer: true }), VIDEO_SUBDIR);
  }

  /** Signed one-time upload URL for a new file in the applicant's folder. */
  async createUploadTarget(
    user: AuthUser,
    contentType: VideoContentType,
  ): Promise<VideoUploadTarget> {
    if (!this.bucket) return { uploadUrl: null, path: null };

    const path = `${user.id}/${randomBytes(8).toString('hex')}.${EXT_BY_MIME[contentType]}`;
    const { data, error } = await this.bucket.createSignedUploadUrl(path);
    if (error) {
      this.logger.error(`Video upload URL failed: ${error.message}`);
      throw new InternalServerErrorException('Could not prepare the upload.');
    }
    return { uploadUrl: data.signedUrl, path: data.path };
  }

  /** Reject a storage path that isn't this user's uploaded, size-capped file. */
  async assertOwnUpload(userId: number, videoUrl: string): Promise<void> {
    if (!this.bucket) return;

    const ownPath = new RegExp(`^${userId}/[a-f0-9]{16}\\.(webm|mp4)$`);
    if (!ownPath.test(videoUrl)) {
      throw new BadRequestException('Please record and upload your video.');
    }
    const { data, error } = await this.bucket.info(videoUrl);
    if (error || !data) {
      throw new BadRequestException('Please record and upload your video.');
    }
    if ((data.size ?? 0) > MAX_VIDEO_BYTES) {
      await this.bucket.remove([videoUrl]).catch(() => undefined);
      throw new BadRequestException('The video is larger than 50 MB.');
    }
  }

  /** A playable URL: storage paths get a short-lived signed link. */
  async viewUrl(videoUrl: string | null): Promise<string | null> {
    if (!videoUrl || !this.bucket || !isStoragePath(videoUrl)) return videoUrl;

    const { data, error } = await this.bucket.createSignedUrl(
      videoUrl,
      VIEW_URL_TTL_SECONDS,
    );
    if (error) {
      this.logger.warn(`Video view URL failed: ${error.message}`);
      return null;
    }
    return data.signedUrl;
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
