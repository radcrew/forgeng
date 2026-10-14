import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  MAX_VIDEO_BYTES,
  VideoService,
  type UploadedVideo,
} from '@modules/applications/video.service';

const writeFile = jest.fn().mockResolvedValue(undefined);
const mkdir = jest.fn().mockResolvedValue(undefined);
jest.mock('node:fs/promises', () => ({
  writeFile: (...args: unknown[]): Promise<void> =>
    writeFile(...args) as Promise<void>,
  mkdir: (...args: unknown[]): Promise<void> => mkdir(...args) as Promise<void>,
}));

const createSignedUploadUrl = jest.fn();
const createSignedUrl = jest.fn();
const info = jest.fn();
const remove = jest.fn();
const storageFrom = jest.fn();
jest.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    storage: {
      from: (...args: unknown[]): unknown => {
        storageFrom(...args);
        return {
          createSignedUploadUrl: (...a: unknown[]): unknown =>
            createSignedUploadUrl(...a),
          createSignedUrl: (...a: unknown[]): unknown => createSignedUrl(...a),
          info: (...a: unknown[]): unknown => info(...a),
          remove: (...a: unknown[]): unknown => remove(...a),
        };
      },
    },
  }),
}));

const user = { id: 7 } as never;

// WebM starts with 1A 45 DF A3; MP4/MOV carry 'ftyp' at bytes 4-7.
const WEBM = Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0, 0, 0, 0]);
const MP4 = Buffer.concat([Buffer.from([0, 0, 0, 0]), Buffer.from('ftyp')]);

function makeFile(buffer: Buffer): UploadedVideo {
  return {
    buffer,
    mimetype: 'video/webm',
    originalname: 'intro.webm',
    size: buffer.length,
  };
}

function makeService(storage: unknown = null): VideoService {
  const values: Record<string, unknown> = {
    uploadsDir: '/tmp/uploads',
    storage,
  };
  const config = { get: jest.fn((key: string) => values[key]) };
  return new VideoService(config as unknown as ConfigService);
}

describe('VideoService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('on disk', () => {
    let service: VideoService;

    beforeEach(() => {
      service = makeService();
    });

    it('rejects a buffer whose magic bytes are not a supported video', async () => {
      await expect(
        service.upload(user, makeFile(Buffer.from('not a video'))),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(writeFile).not.toHaveBeenCalled();
    });

    it('accepts a WebM by its magic bytes and returns its public URL', async () => {
      const result = await service.upload(user, makeFile(WEBM));

      expect(writeFile).toHaveBeenCalledTimes(1);
      expect(result.url).toMatch(/^\/api\/uploads\/videos\/7-.*\.webm$/);
    });

    it('detects an MP4 from its ftyp box and stores a .mp4 file', async () => {
      const result = await service.upload(user, makeFile(MP4));

      expect(result.url).toMatch(/\.mp4$/);
    });

    it('returns no upload URL so the browser posts the file', async () => {
      await expect(
        service.createUploadTarget(user, 'video/webm'),
      ).resolves.toEqual({ uploadUrl: null, path: null });
    });

    it('skips the storage checks', async () => {
      await expect(
        service.assertOwnUpload(7, '/api/uploads/videos/7-a.webm'),
      ).resolves.toBeUndefined();
      await expect(
        service.viewUrl('/api/uploads/videos/7-a.webm'),
      ).resolves.toBe('/api/uploads/videos/7-a.webm');
    });
  });

  describe('with Supabase Storage', () => {
    const OWN_PATH = '7/0123456789abcdef.webm';
    let service: VideoService;

    beforeEach(() => {
      service = makeService({
        supabaseUrl: 'https://proj.supabase.co',
        serviceRoleKey: 'service-key',
      });
    });

    it('uses the videos bucket', () => {
      expect(storageFrom).toHaveBeenCalledWith('videos');
    });

    it("creates a signed upload URL inside the user's folder", async () => {
      createSignedUploadUrl.mockImplementation((path: string) =>
        Promise.resolve({
          data: { signedUrl: `https://signed/${path}`, token: 't', path },
          error: null,
        }),
      );

      const target = await service.createUploadTarget(user, 'video/mp4');

      expect(target.path).toMatch(/^7\/[a-f0-9]{16}\.mp4$/);
      expect(target.uploadUrl).toBe(`https://signed/${target.path}`);
    });

    it("rejects a path in another user's folder without asking storage", async () => {
      await expect(
        service.assertOwnUpload(7, '8/0123456789abcdef.webm'),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(info).not.toHaveBeenCalled();
    });

    it('rejects a path that was never uploaded', async () => {
      info.mockResolvedValue({ data: null, error: new Error('not found') });

      await expect(service.assertOwnUpload(7, OWN_PATH)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rejects and removes a video over the size limit', async () => {
      info.mockResolvedValue({
        data: { size: MAX_VIDEO_BYTES + 1 },
        error: null,
      });
      remove.mockResolvedValue({ data: [], error: null });

      await expect(service.assertOwnUpload(7, OWN_PATH)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(remove).toHaveBeenCalledWith([OWN_PATH]);
    });

    it("accepts the user's own uploaded video", async () => {
      info.mockResolvedValue({ data: { size: 1024 }, error: null });

      await expect(
        service.assertOwnUpload(7, OWN_PATH),
      ).resolves.toBeUndefined();
    });

    it('signs a storage path for viewing and leaves old disk URLs alone', async () => {
      createSignedUrl.mockResolvedValue({
        data: { signedUrl: 'https://signed/view' },
        error: null,
      });

      await expect(service.viewUrl(OWN_PATH)).resolves.toBe(
        'https://signed/view',
      );
      expect(createSignedUrl).toHaveBeenCalledWith(OWN_PATH, 3600);
      await expect(
        service.viewUrl('/api/uploads/videos/7-a.webm'),
      ).resolves.toBe('/api/uploads/videos/7-a.webm');
    });
  });
});
