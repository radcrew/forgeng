import { apiClient } from "@lib/api-client";
import { DEV_SIGN_IN_ACCOUNTS } from "@lib/dev-accounts";
import { writeSession } from "@lib/session";
import type { UserProfile, UserRole } from "@lib/types";

interface UserDto {
  id: number;
  email: string;
  name: string | null;
  role: UserRole;
  githubUrl: string | null;
  createdAt: string;
}

function mapUserDto(dto: UserDto): UserProfile {
  return {
    id: dto.id,
    email: dto.email,
    name: dto.name,
    role: dto.role,
    githubUrl: dto.githubUrl,
    createdAt: dto.createdAt,
  };
}

export async function getMe(): Promise<UserProfile> {
  const dto = await apiClient.get<UserDto>("/auth/me");
  return mapUserDto(dto);
}

/** Dev sign-in: set headers from a seeded account, then resolve the real user via `/auth/me`. */
export async function signInWithDevRole(
  role: UserRole,
): Promise<UserProfile | null> {
  const account = DEV_SIGN_IN_ACCOUNTS[role];
  if (!account) return null;

  writeSession({
    id: 0,
    email: account.email,
    name: account.name,
    role,
    githubUrl: null,
    createdAt: new Date().toISOString(),
  });

  const user = await getMe();
  writeSession(user);
  return user;
}
