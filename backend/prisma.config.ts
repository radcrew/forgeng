import path from 'node:path';

// A Prisma config file disables Prisma's automatic .env loading, so load it
// ourselves to keep `DATABASE_URL` (and friends) available to the CLI.
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// Replaces the deprecated `package.json#prisma` block (removed in Prisma 7).
export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  migrations: {
    // Run after `prisma migrate dev` / `migrate reset` apply migrations.
    seed: 'ts-node prisma/seed.ts',
  },
});
