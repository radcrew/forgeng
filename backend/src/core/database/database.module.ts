import { Global, Module } from '@nestjs/common';

import { PrismaService } from './prisma.service';

/** Global PostgreSQL access via Prisma (schema: `prisma/schema.prisma`). */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {}
