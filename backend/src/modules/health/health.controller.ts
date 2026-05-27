import { Controller, Get } from '@nestjs/common';
import { Public } from '../../core/auth/public.decorator';
import { PrismaService } from '../../core/database/prisma.service';

@Controller('healthz')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  async healthCheck(): Promise<{ status: string; database: string }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', database: 'up' };
    } catch {
      return { status: 'degraded', database: 'down' };
    }
  }
}
