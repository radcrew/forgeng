import type { Application, UserProfile, UserRole } from "@types";

const REQUIRED_PROFILE_FIELDS: (keyof UserProfile)[] = [
  "name",
  "bio",
  "github",
  "linkedin",
  "twitter",
  "facebook",
  "telegram",
  "whatsapp",
];

export const isProfileComplete = (user: UserProfile): boolean =>
  REQUIRED_PROFILE_FIELDS.every((f) => Boolean(user[f]));

const REQUIRED_APPLICATION_FIELDS: (keyof Application)[] = [
  "linkedin",
  "twitter",
  "facebook",
  "github",
  "telegram",
  "whatsapp",
];

export const isApplicationComplete = (app: Application): boolean =>
  REQUIRED_APPLICATION_FIELDS.every((f) => Boolean(app[f]));

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
});
