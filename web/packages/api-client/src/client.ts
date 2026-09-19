import { ApiError, type ApiErrorBody, type TokenPair } from "./types";

export interface TokenStore {
  load(): TokenPair | null;
  save(tokens: TokenPair | null): void;
}

export class MemoryTokenStore implements TokenStore {
  private tokens: TokenPair | null = null;
  load(): TokenPair | null {
    return this.tokens;
  }
  save(tokens: TokenPair | null): void {
    this.tokens = tokens;
  }
}

export interface ApiClientOptions {
  baseUrl: string;
  appToken: string;
  store?: TokenStore;
  fetchImpl?: typeof fetch;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  auth?: boolean;
  retry?: boolean;
}

export class ApiClient {
  private baseUrl: string;
  private appToken: string;
  private store: TokenStore;
  private fetchImpl: typeof fetch;
  private refreshPromise: Promise<TokenPair> | null = null;

  constructor(options: ApiClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.appToken = options.appToken;
    this.store = options.store ?? new MemoryTokenStore();
    this.fetchImpl = options.fetchImpl ?? fetch.bind(globalThis);
  }

  get tokens(): TokenPair | null {
    return this.store.load();
  }

  isAuthenticated(): boolean {
    return this.store.load() !== null;
  }

  async login(email: string, password: string): Promise<TokenPair> {
    const tokens = await this.request<TokenPair>("/v1/auth/login", {
      method: "POST",
      body: { email, password },
      auth: false,
    });
    this.store.save(tokens);
    return tokens;
  }

  async refresh(): Promise<TokenPair> {
    if (!this.refreshPromise) {
      this.refreshPromise = this.doRefresh().finally(() => {
        this.refreshPromise = null;
      });
    }
    return this.refreshPromise;
  }

  private async doRefresh(): Promise<TokenPair> {
    const current = this.store.load();
    if (!current) throw new ApiError(401, null, "Not authenticated");
    const tokens = await this.request<TokenPair>(
      "/v1/auth/refresh",
      { method: "POST", body: { refresh_token: current.refresh_token }, auth: false },
      true,
    );
    this.store.save(tokens);
    return tokens;
  }

  async logout(): Promise<void> {
    try {
      await this.request("/v1/auth/logout", { method: "POST" });
    } finally {
      this.store.save(null);
    }
  }

  async request<T>(path: string, options: RequestOptions = {}, _isRefresh = false): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    // Empty when calls go through the same-origin Next.js proxy, which injects
    // the app token server-side so browsers never see it.
    if (this.appToken) headers["X-APP-TOKEN"] = this.appToken;
    if (options.auth !== false) {
      const tokens = this.store.load();
      if (tokens) headers["Authorization"] = `Bearer ${tokens.access_token}`;
    }
    const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
    if (response.status === 204) return undefined as T;
    let data: unknown = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }
    if (!response.ok) {
      if (response.status === 401 && options.auth !== false && !_isRefresh && options.retry !== false) {
        try {
          await this.refresh();
        } catch {
          this.store.save(null);
          throw new ApiError(response.status, data as ApiErrorBody | null, "Unauthorized");
        }
        return this.request<T>(path, { ...options, retry: false });
      }
      throw new ApiError(response.status, data as ApiErrorBody | null, `Request failed: ${path}`);
    }
    return data as T;
  }
}
