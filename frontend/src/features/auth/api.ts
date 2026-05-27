import { apiClient } from "@lib/api-client";
import { writeSession } from "@lib/session";
import { mapUserDto, type UserDto } from "@utils/user";
import { normalizeEmail } from "@utils/auth";

export const getMe = async () => {
  const dto = await apiClient.get<UserDto>("/account/me");
  return mapUserDto(dto);
};

/**
 * Dev header auth: identify by email, then load the canonical user from the API.
 * Role and profile come from the database via `/account/me`.
 */
export const signInWithEmail = async (email: string) => {
  const normalized = normalizeEmail(email);
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
};
