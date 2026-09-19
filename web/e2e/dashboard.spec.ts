import { expect, test } from "@playwright/test";

const API_URL = process.env.E2E_API_URL ?? "http://127.0.0.1:8012";
const APP_TOKEN = process.env.E2E_APP_TOKEN ?? "dev-app-token-change-me";
const DASH_URL = process.env.E2E_DASH_URL ?? "http://127.0.0.1:3001";

const OPERATOR = { email: "ops@example.com", password: "password123" };

async function api(path: string, init?: RequestInit) {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "content-type": "application/json", "X-APP-TOKEN": APP_TOKEN, ...(init?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status} ${await res.text()}`);
  return res.status === 204 ? null : res.json();
}

test.beforeAll(async () => {
  await api("/v1/users", {
    method: "POST",
    body: JSON.stringify({
      email: OPERATOR.email,
      password: OPERATOR.password,
      firstname: "Ops",
      blood_type: "O+",
      latitude: 37.7749,
      longitude: -122.4194,
    }),
  }).catch(() => null);
});

test("operator logs in and sees the H3 octagon overlay on the map", async ({ page }) => {
  await page.goto(`${DASH_URL}/login`);
  await page.getByLabel("Email").fill(OPERATOR.email);
  await page.getByLabel("Password").fill(OPERATOR.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Operations map" })).toBeVisible({ timeout: 15_000 });

  await page.getByLabel("Latitude").fill("37.7749");
  await page.getByLabel("Longitude").fill("-122.4194");
  await page.getByLabel("Distance (m)").fill("1000");
  await page.getByRole("button", { name: "Search" }).click();

  await expect(page.getByText(/Origin cell 8828308281fffff/)).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(/Octagons are overlays/)).toBeVisible();

  const map = page.getByTestId("h3-map");
  await expect(map).toBeVisible();
  await expect(map.locator("canvas")).toBeVisible({ timeout: 20_000 });
  await page.waitForTimeout(3000);
  await map.screenshot({ path: "test-results/dashboard-map.png" });
});
