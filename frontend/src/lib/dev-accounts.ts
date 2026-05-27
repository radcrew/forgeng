import type { UserRole } from "@lib/types";

/** Seeded accounts from `backend/prisma/seed.ts` — used for dev header sign-in only. */
export const DEV_SIGN_IN_ACCOUNTS: Partial<
  Record<UserRole, { email: string; name: string }>
> = {
  student: { email: "avery@example.com", name: "Avery Chen" },
  mentor: { email: "sarah@example.com", name: "Sarah Patel" },
  admin: { email: "riley@example.com", name: "Riley Park" },
  applicant: { email: "sam@example.com", name: "Sam Diaz" },
};
