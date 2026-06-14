import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
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

describe('VideoService', () => {
  let service: VideoService;

  beforeEach(() => {
    jest.clearAllMocks();
    const config = { get: jest.fn().mockReturnValue('/tmp/uploads') };
    service = new VideoService(config as unknown as ConfigService);
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
});
