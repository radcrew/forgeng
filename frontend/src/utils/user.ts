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
  linkedin: string | null;
  twitter: string | null;
  facebook: string | null;
  github: string | null;
  portfolio: string | null;
  telegram: string | null;
  whatsapp: string | null;
  registrationIp: string | null;
  registrationCountry: string | null;
  registrationCity: string | null;
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
  linkedin: dto.linkedin,
  twitter: dto.twitter,
  facebook: dto.facebook,
  github: dto.github,
  portfolio: dto.portfolio,
  telegram: dto.telegram,
  whatsapp: dto.whatsapp,
  registrationIp: dto.registrationIp,
  registrationCountry: dto.registrationCountry,
  registrationCity: dto.registrationCity,
});
