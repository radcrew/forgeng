import type { UserProfile, UserRole } from "@types";

export interface UserDto {
  id: number;
  email: string;
  name: string | null;
  role: UserRole;
  githubUrl: string | null;
  createdAt: string;
}

export const mapUserDto = (dto: UserDto): UserProfile => ({
  id: dto.id,
  email: dto.email,
  name: dto.name,
  role: dto.role,
  githubUrl: dto.githubUrl,
  createdAt: dto.createdAt,
});
