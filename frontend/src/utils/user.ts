import type { UserProfile, UserRole } from "@types";

export interface UserDto {
  id: number;
  email: string;
  emailVerified: boolean;
  name: string | null;
  role: UserRole;
  bio: string | null;
  githubUrl: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

export const mapUserDto = (dto: UserDto): UserProfile => ({
  id: dto.id,
  email: dto.email,
  emailVerified: dto.emailVerified,
  name: dto.name,
  role: dto.role,
  bio: dto.bio,
  githubUrl: dto.githubUrl,
  avatarUrl: dto.avatarUrl,
  createdAt: dto.createdAt,
});
