/**
 * Runs before the e2e test modules are imported. Importing AppModule triggers
 * ConfigModule.forRoot -> validateEnv against process.env, which requires
 * DATABASE_URL. The e2e suite mocks PrismaService, so no real database is used;
 * a dummy connection string is enough to satisfy validation.
 */
process.env.NODE_ENV ??= 'test';
process.env.DATABASE_URL ??= 'postgresql://test:test@localhost:5432/test';
// Keep a local .env from pointing the suite at real Supabase Storage. Values
// already set here win over the .env file.
process.env.SUPABASE_URL = '';
process.env.SUPABASE_SERVICE_ROLE_KEY = '';
// The same for a local Google Calendar setup. The suite expects the feature
// to be off. Google sign-in uses other settings, so it is not affected.
process.env.GOOGLE_CALENDAR_CALLBACK_URL = '';
process.env.GOOGLE_TOKEN_KEY = '';
