import { apiClient } from "@lib/api-client";
import { API_BASE } from "@lib/config";
import { clearAuth, sessionVersion, writeSession } from "@lib/session";
import type { UserProfile } from "@types";
import { normalizeEmail } from "@utils/auth";
import { mapUserDto, type UserDto } from "@utils/user";

export type OAuthProvider = "google" | "github";

interface AuthSessionResponse {
  user: UserDto;
}

interface UserResponse {
  user: UserDto;
}

const persistSession = (response: AuthSessionResponse): UserProfile => {
  const profile = mapUserDto(response.user);
  writeSession(profile);
  return profile;
};

export const getMe = async (): Promise<UserProfile> => {
  const dto = await apiClient.get<UserDto>("/account/me");
  const profile = mapUserDto(dto);
  writeSession(profile);
  return profile;
};

export const login = async (
  email: string,
  password: string,
): Promise<UserProfile> => {
  const normalized = normalizeEmail(email);
  const response = await apiClient.post<AuthSessionResponse>(
    "/auth/login",
    { email: normalized, password },
    { skipAuthRetry: true },
  );
  return persistSession(response);
};

export const register = async (
  email: string,
  password: string,
  name?: string,
): Promise<UserResponse> => {
  const normalized = normalizeEmail(email);
  return apiClient.post<UserResponse>(
    "/auth/register",
    { email: normalized, password, ...(name && { name }) },
    { skipAuthRetry: true },
  );
};

export const verifyEmail = async (token: string): Promise<UserProfile> => {
  const response = await apiClient.get<UserResponse>(
    `/auth/verify-email?token=${encodeURIComponent(token)}`,
    { skipAuthRetry: true },
  );
  return mapUserDto(response.user);
};

export const resendVerification = async (email: string): Promise<void> => {
  await apiClient.post<void>(
    "/auth/resend-verification",
    { email: normalizeEmail(email) },
    { skipAuthRetry: true },
  );
};

export const forgotPassword = async (email: string): Promise<void> => {
  await apiClient.post<void>(
    "/auth/forgot-password",
    { email: normalizeEmail(email) },
    { skipAuthRetry: true },
  );
};

export const resetPassword = async (
  token: string,
  password: string,
): Promise<void> => {
  await apiClient.post<void>(
    "/auth/reset-password",
    { token, password },
    { skipAuthRetry: true },
  );
};

export const refresh = async (): Promise<UserProfile | null> => {
  const startedAt = sessionVersion();
  try {
    const response = await apiClient.post<AuthSessionResponse>(
      "/auth/refresh",
      {},
      { skipAuthRetry: true },
    );
    return persistSession(response);
  } catch {
    // Only clear if no sign-in landed while this was in flight.
    if (startedAt === sessionVersion()) clearAuth();
    return null;
  }
};

export const logout = async (): Promise<void> => {
  try {
    await apiClient.post<void>(
      "/auth/logout",
      {},
      { skipAuthRetry: true },
    );
  } catch {
    // Server may already consider the refresh token revoked — clear locally anyway.
  } finally {
    clearAuth();
  }
};

/** Full URL the user navigates to (browser redirect) to start an OAuth flow. */
export const oauthStartUrl = (provider: OAuthProvider): string =>
  `${API_BASE}/auth/${provider}`;
