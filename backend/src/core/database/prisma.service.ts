import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    // The database is reached over a remote pooler, so a multi-query
    // interactive transaction can outlive Prisma's 5s default and fail with
    // "Transaction not found".
    super({ transactionOptions: { maxWait: 10_000, timeout: 20_000 } });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
