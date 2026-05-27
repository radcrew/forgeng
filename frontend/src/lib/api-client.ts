import { API_URL } from "@lib/config";
import { mockUsers } from "@lib/mock-data";

const ACTIVE_USER_STORAGE_KEY = "forgeng.activeUserId";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Dev auth headers matching the NestJS `DevAuthGuard` contract. */
function getDevAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};

  const raw = window.localStorage.getItem(ACTIVE_USER_STORAGE_KEY);
  const id = raw ? Number.parseInt(raw, 10) : Number.NaN;
  if (!Number.isFinite(id)) return {};

  const user = mockUsers.find((u) => u.id === id);
  if (!user) return {};

  return {
    "x-user-id": String(user.id),
    "x-user-email": user.email,
    "x-user-role": user.role,
  };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (!headers.has("Content-Type") && init?.body) {
    headers.set("Content-Type", "application/json");
  }
  for (const [key, value] of Object.entries(getDevAuthHeaders())) {
    headers.set(key, value);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText);
    throw new ApiError(response.status, text || response.statusText);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
};
