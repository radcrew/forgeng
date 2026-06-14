import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@core/database/prisma.service';
import {
  AvatarService,
  type UploadedImage,
} from '@modules/account/avatar.service';

const writeFile = jest.fn().mockResolvedValue(undefined);
const mkdir = jest.fn().mockResolvedValue(undefined);
const rm = jest.fn().mockResolvedValue(undefined);
jest.mock('node:fs/promises', () => ({
  writeFile: (...args: unknown[]): Promise<void> =>
    writeFile(...args) as Promise<void>,
  mkdir: (...args: unknown[]): Promise<void> => mkdir(...args) as Promise<void>,
  rm: (...args: unknown[]): Promise<void> => rm(...args) as Promise<void>,
}));

const DATE = new Date('2026-01-15T10:30:00.000Z');
const user = { id: 7 } as never;

// Magic-byte prefixes the service sniffs for, padded to satisfy length checks.
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0]);
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0, 0, 0, 0, 0]);

function makeFile(buffer: Buffer): UploadedImage {
  return {
    buffer,
    mimetype: 'image/png',
    originalname: 'a.png',
    size: buffer.length,
  };
}

describe('AvatarService', () => {
  let service: AvatarService;
  let prisma: { user: { findUnique: jest.Mock; update: jest.Mock } };

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({ avatarUrl: null }),
        update: jest.fn().mockResolvedValue({
          id: 7,
          email: 'ada@example.com',
          role: 'student',
          createdAt: DATE,
          avatarUrl: '/api/uploads/avatars/x.png',
        }),
      },
    };
    const config = { get: jest.fn().mockReturnValue('/tmp/uploads') };

    service = new AvatarService(
      prisma as unknown as PrismaService,
      config as unknown as ConfigService,
    );
  });

  it('rejects a buffer whose magic bytes are not a supported image', async () => {
    await expect(
      service.upload(user, makeFile(Buffer.from('not an image'))),
    ).rejects.toBeInstanceOf(BadRequestException);
    // Nothing is written when the type check fails.
    expect(writeFile).not.toHaveBeenCalled();
  });

  it('accepts a PNG by its magic bytes and stores a .png file', async () => {
    await service.upload(user, makeFile(PNG));

    expect(writeFile).toHaveBeenCalledTimes(1);
    const [path] = writeFile.mock.calls[0] as [string];
    expect(path).toMatch(/\.png$/);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 7 } }),
    );
  });

  it('detects a JPEG regardless of the declared mimetype', async () => {
    // Declared mimetype says png, but the magic bytes are JPEG — trust the bytes.
    await service.upload(user, { ...makeFile(JPEG), mimetype: 'image/png' });

    const [path] = writeFile.mock.calls[0] as [string];
    expect(path).toMatch(/\.jpg$/);
  });
});
