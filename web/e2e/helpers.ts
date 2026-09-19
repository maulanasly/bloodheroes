export const API_URL = process.env.E2E_API_URL ?? "http://127.0.0.1:8012";
export const APP_TOKEN = process.env.E2E_APP_TOKEN ?? "dev-app-token-change-me";
export const DASH_URL = process.env.E2E_DASH_URL ?? "http://127.0.0.1:3001";
export const CLIENT_URL = process.env.E2E_CLIENT_URL ?? "http://127.0.0.1:3002";

export async function api(path: string, init?: RequestInit, token?: string) {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    "X-APP-TOKEN": APP_TOKEN,
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (token) headers["authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status} ${await res.text()}`);
  return res.status === 204 ? null : await res.json();
}

export async function registerUser(
  email: string,
  overrides: Record<string, unknown> = {},
): Promise<void> {
  await api("/v1/users", {
    method: "POST",
    body: JSON.stringify({
      email,
      password: "password123",
      firstname: email.split("@")[0],
      blood_type: "O+",
      latitude: 37.7749,
      longitude: -122.4194,
      ...overrides,
    }),
  }).catch(() => null);
}

export async function loginUser(email: string): Promise<string> {
  const tokens = (await api("/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password: "password123" }),
  })) as { access_token: string };
  return tokens.access_token;
}
