import { PrismaService } from '@core/database/prisma.service';
import { HealthController } from '@modules/health/health.controller';

describe('HealthController', () => {
  it('reports the database up when the probe query succeeds', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    };
    const controller = new HealthController(prisma as unknown as PrismaService);

    await expect(controller.healthCheck()).resolves.toEqual({
      status: 'ok',
      database: 'up',
    });
  });

  it('reports degraded when the probe query throws', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockRejectedValue(new Error('no connection')),
    };
    const controller = new HealthController(prisma as unknown as PrismaService);

    await expect(controller.healthCheck()).resolves.toEqual({
      status: 'degraded',
      database: 'down',
    });
  });
});
