import type { Application, UserProfile, UserRole } from "@types";

// The apply form requires a Telegram or WhatsApp contact; every other link
// is optional, so completeness only checks for a way to reach the person.
const hasContact = (record: {
  telegram?: string | null;
  whatsapp?: string | null;
}): boolean => Boolean(record.telegram || record.whatsapp);

export const isProfileComplete = (user: UserProfile): boolean =>
  Boolean(user.name) && hasContact(user);

export const isApplicationComplete = (app: Application): boolean =>
  hasContact(app);

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
