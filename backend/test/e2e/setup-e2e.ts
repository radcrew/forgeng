/**
 * Runs before the e2e test modules are imported. Importing AppModule triggers
 * ConfigModule.forRoot -> validateEnv against process.env, which requires
 * DATABASE_URL. The e2e suite mocks PrismaService, so no real database is used;
 * a dummy connection string is enough to satisfy validation.
 */
process.env.NODE_ENV ??= 'test';
process.env.DATABASE_URL ??= 'postgresql://test:test@localhost:5432/test';
