import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
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

interface RequestOptions {
  /** Skip the auto-refresh dance — used by the refresh / login calls themselves. */
  skipAuthRetry?: boolean;
}

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

class ApiClient {
  private static instance: ApiClient | null = null;

  private readonly http: AxiosInstance;

  /**
   * One in-flight refresh promise shared by every request that hits a 401.
   * Without this guard a burst of parallel calls would each try to refresh,
   * and reuse-detection on the backend would revoke the whole token family.
   */
  private refreshPromise: Promise<string | null> | null = null;

  private constructor() {
    this.http = axios.create({
      baseURL: API_BASE,
      withCredentials: true,
    });
    this.http.interceptors.request.use(this.attachAuthHeader);
    this.http.interceptors.response.use(this.normalizeEmptyBody, this.handleError);
  }

  static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  private attachAuthHeader = (config: InternalAxiosRequestConfig) => {
    const token = readAccessToken();
    if (token) {
      config.headers.set("Authorization", `Bearer ${token}`);
    }
    return config;
  };

  private normalizeEmptyBody = (response: AxiosResponse) => {
    // Match fetch's empty-body behaviour (204s parse to undefined, not "").
    if (response.data === "") {
      response.data = undefined;
    }
    return response;
  };

  private handleError = async (error: AxiosError) => {
    const { config, response } = error;
    if (!response) throw error;

    if (response.status === 401 && config && !config.skipAuthRetry) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        return this.http.request(config);
      }
      clearAuth();
    }

    throw new ApiError(
      response.status,
      errorMessage(response.data, response.statusText || "Request failed"),
      response.data,
    );
  };

  private async performRefresh(): Promise<string | null> {
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
  }

  private refreshAccessToken(): Promise<string | null> {
    if (!this.refreshPromise) {
      this.refreshPromise = this.performRefresh().finally(() => {
        this.refreshPromise = null;
      });
    }
    return this.refreshPromise;
  }

  get<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.http.get<T>(path, options).then((res) => res.data);
  }

  post<T>(path: string, body: unknown, options?: RequestOptions): Promise<T> {
    return this.http.post<T>(path, body, options).then((res) => res.data);
  }

  postForm<T>(path: string, body: FormData, options?: RequestOptions): Promise<T> {
    return this.http.post<T>(path, body, options).then((res) => res.data);
  }

  patch<T>(path: string, body: unknown, options?: RequestOptions): Promise<T> {
    return this.http.patch<T>(path, body, options).then((res) => res.data);
  }

  delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.http.delete<T>(path, options).then((res) => res.data);
  }
}

export const apiClient = ApiClient.getInstance();
