import { describe, expect, it, vi } from "vitest";

import { ApiClient, MemoryTokenStore } from "./client.js";
import type { TokenPair } from "./types.js";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const TOKENS_A: TokenPair = {
  access_token: "access-a",
  refresh_token: "refresh-a",
  token_type: "bearer",
  expires_in: 1800,
};

const TOKENS_B: TokenPair = {
  access_token: "access-b",
  refresh_token: "refresh-b",
  token_type: "bearer",
  expires_in: 1800,
};

describe("ApiClient", () => {
  it("sends the app token and stores login tokens", async () => {
    const fetchImpl = vi.fn(
      async (_url: string | URL | Request, _init?: RequestInit): Promise<Response> =>
        jsonResponse(200, TOKENS_A),
    );
    const client = new ApiClient({ baseUrl: "http://api.test", appToken: "app-123", fetchImpl });
    await client.login("a@example.com", "password123");
    expect(fetchImpl).toHaveBeenCalledOnce();
    const sentHeaders = new Headers(fetchImpl.mock.calls[0]?.[1]?.headers);
    expect(sentHeaders.get("X-APP-TOKEN")).toBe("app-123");
    expect(client.tokens).toEqual(TOKENS_A);
  });

  it("refreshes once on 401 and retries the request", async () => {
    const fetchImpl = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      const auth = headers.get("authorization");
      if (String(url).endsWith("/v1/auth/refresh")) return jsonResponse(200, TOKENS_B);
      if (auth === "Bearer access-a") {
        return jsonResponse(401, { code: 130, reason: "UnAuthorized User", extra_info: {} });
      }
      return jsonResponse(200, { ok: true, auth });
    });
    const store = new MemoryTokenStore();
    store.save(TOKENS_A);
    const client = new ApiClient({ baseUrl: "http://api.test", appToken: "app-123", store, fetchImpl });
    const result = await client.request<{ ok: boolean; auth: string }>("/v1/users/me");
    expect(result).toEqual({ ok: true, auth: "Bearer access-b" });
    expect(client.tokens).toEqual(TOKENS_B);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it("clears tokens when refresh fails", async () => {
    const fetchImpl = vi.fn(async (url: string | URL | Request) =>
      String(url).endsWith("/v1/auth/refresh")
        ? jsonResponse(401, { code: 132, reason: "session has expired", extra_info: {} })
        : jsonResponse(401, { code: 130, reason: "UnAuthorized User", extra_info: {} }),
    );
    const store = new MemoryTokenStore();
    store.save(TOKENS_A);
    const client = new ApiClient({ baseUrl: "http://api.test", appToken: "app-123", store, fetchImpl });
    await expect(client.request("/v1/users/me")).rejects.toMatchObject({ status: 401 });
    expect(client.tokens).toBeNull();
  });
});
