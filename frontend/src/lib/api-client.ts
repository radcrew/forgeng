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

/**
 * One in-flight refresh promise shared by every request that hits a 401.
 * Without this guard a burst of parallel calls would each try to refresh,
 * and reuse-detection on the backend would revoke the whole token family.
 */
let refreshPromise: Promise<string | null> | null = null;

const performRefresh = async (): Promise<string | null> => {
  try {
    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    if (!response.ok) return null;
    const json = (await response.json()) as Partial<RefreshSuccess>;
    if (typeof json.accessToken !== "string") return null;
    writeAccessToken(json.accessToken);
    return json.accessToken;
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

interface RequestOptions {
  /** Skip the auto-refresh dance — used by the refresh / login calls themselves. */
  skipAuthRetry?: boolean;
}

const buildHeaders = (init: RequestInit | undefined): Headers => {
  const headers = new Headers(init?.headers);
  // Let the browser set the multipart boundary for FormData bodies.
  if (
    !headers.has("Content-Type") &&
    init?.body &&
    !(init.body instanceof FormData)
  ) {
    headers.set("Content-Type", "application/json");
  }
  const token = readAccessToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return headers;
};

const send = async (path: string, init?: RequestInit): Promise<Response> =>
  fetch(`${API_BASE}${path}`, {
    ...init,
    headers: buildHeaders(init),
    credentials: "include",
  });

const parseBody = async (response: Response): Promise<unknown> => {
  if (response.status === 204) return undefined;
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
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

const request = async <T>(
  path: string,
  init?: RequestInit,
  options: RequestOptions = {},
): Promise<T> => {
  let response = await send(path, init);

  if (response.status === 401 && !options.skipAuthRetry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      response = await send(path, init);
    } else {
      clearAuth();
    }
  }

  if (!response.ok) {
    const body = await parseBody(response);
    throw new ApiError(
      response.status,
      errorMessage(body, response.statusText || "Request failed"),
      body,
    );
  }

  return (await parseBody(response)) as T;
};

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, undefined, options),
  post: <T>(path: string, body: unknown, options?: RequestOptions) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }, options),
  postForm: <T>(path: string, body: FormData, options?: RequestOptions) =>
    request<T>(path, { method: "POST", body }, options),
  patch: <T>(path: string, body: unknown, options?: RequestOptions) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }, options),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { method: "DELETE" }, options),
};
