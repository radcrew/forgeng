import axios, { type AxiosError } from "axios";
import { API_BASE } from "@lib/config";
import {
  clearAuth,
  readAccessToken,
  writeAccessToken,
} from "@lib/session";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface RefreshSuccess {
  accessToken: string;
}

declare module "axios" {
  export interface AxiosRequestConfig {
    /** Skip the auto-refresh dance — used by the refresh / login calls themselves. */
    skipAuthRetry?: boolean;
  }
}

const http = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

/**
 * One in-flight refresh promise shared by every request that hits a 401.
 * Without this guard a burst of parallel calls would each try to refresh,
 * and reuse-detection on the backend would revoke the whole token family.
 */
let refreshPromise: Promise<string | null> | null = null;

const performRefresh = async (): Promise<string | null> => {
  try {
    const { data } = await axios.post<Partial<RefreshSuccess>>(
      `${API_BASE}/auth/refresh`,
      undefined,
      { withCredentials: true },
    );
    if (typeof data.accessToken !== "string") return null;
    writeAccessToken(data.accessToken);
    return data.accessToken;
  } catch {
    return null;
  }
};

const refreshAccessToken = async (): Promise<string | null> => {
  if (!refreshPromise) {
    refreshPromise = performRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
};

const errorMessage = (body: unknown, fallback: string): string => {
  if (typeof body === "string" && body.length > 0) return body;
  if (body && typeof body === "object" && "message" in body) {
    const message = (body as { message: unknown }).message;
    if (typeof message === "string") return message;
    if (Array.isArray(message) && typeof message[0] === "string") {
      return message.join(", ");
    }
  }
  return fallback;
};

http.interceptors.request.use((config) => {
  const token = readAccessToken();
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

http.interceptors.response.use(
  (response) => {
    // Match fetch's empty-body behaviour (204s parse to undefined, not "").
    if (response.data === "") {
      response.data = undefined;
    }
    return response;
  },
  async (error: AxiosError) => {
    const { config, response } = error;
    if (!response) throw error;

    if (response.status === 401 && config && !config.skipAuthRetry) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        return http.request(config);
      }
      clearAuth();
    }

    throw new ApiError(
      response.status,
      errorMessage(response.data, response.statusText || "Request failed"),
      response.data,
    );
  },
);

interface RequestOptions {
  /** Skip the auto-refresh dance — used by the refresh / login calls themselves. */
  skipAuthRetry?: boolean;
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) =>
    http.get<T>(path, options).then((res) => res.data),
  post: <T>(path: string, body: unknown, options?: RequestOptions) =>
    http.post<T>(path, body, options).then((res) => res.data),
  postForm: <T>(path: string, body: FormData, options?: RequestOptions) =>
    http.post<T>(path, body, options).then((res) => res.data),
  patch: <T>(path: string, body: unknown, options?: RequestOptions) =>
    http.patch<T>(path, body, options).then((res) => res.data),
  delete: <T>(path: string, options?: RequestOptions) =>
    http.delete<T>(path, options).then((res) => res.data),
};
