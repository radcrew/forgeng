/**
 * Create (or promote) an admin account you can actually log in with.
 *
 * Usage:
 *   ts-node prisma/create-admin.ts <email> <password> [name]
 *
 * Sets role=admin, hashes the password, and marks the email verified so the
 * normal email/password login flow accepts it.
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const BCRYPT_ROUNDS = 12;

async function main(): Promise<void> {
  const [email, password, name] = process.argv.slice(2);
  if (!email || !password) {
    console.error(
      'Usage: ts-node prisma/create-admin.ts <email> <password> [name]',
    );
    process.exit(1);
  }

  const normalized = email.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const user = await prisma.user.upsert({
    where: { email: normalized },
    update: { role: 'admin', passwordHash, emailVerified: true },
    create: {
      email: normalized,
      name: name ?? 'Admin',
      role: 'admin',
      passwordHash,
      emailVerified: true,
    },
  });

  console.log(`✅ Admin ready: ${user.email} (id=${user.id}, role=${user.role})`);
}

main()
  .catch((e: unknown) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
