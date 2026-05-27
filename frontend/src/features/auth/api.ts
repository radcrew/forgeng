import { apiClient } from "@lib/api-client";
import { writeSession } from "@lib/session";
import type { UserProfile, UserRole } from "@types";

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

/**
 * Dev header auth: identify by email, then load the canonical user from the API.
 * Role and profile come from the database via `/auth/me`.
 */
export async function signInWithEmail(email: string): Promise<UserProfile> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) {
    throw new Error("Email is required");
  }

  writeSession({
    id: 0,
    email: normalized,
    name: null,
    role: "applicant",
    githubUrl: null,
    createdAt: new Date().toISOString(),
  });

  const user = await getMe();
  writeSession(user);
  return user;
}
