import { expect, test } from "@playwright/test";

import { DASH_URL, api, loginUser, registerUser } from "./helpers";

const OPERATOR = { email: "ops@example.com", password: "password123" };

test.beforeAll(async () => {
  await registerUser(OPERATOR.email);
});

test("operator logs in and the map auto-searches with the octagon overlay", async ({ page }) => {
  await page.goto(`${DASH_URL}/login`);
  await page.getByLabel("Email").fill(OPERATOR.email);
  await page.getByLabel("Password").fill(OPERATOR.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Operations map" })).toBeVisible({ timeout: 15_000 });

  // Auto-search runs on load: no manual search needed.
  await expect(page.getByText(/Origin cell 8828308281fffff/)).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(/Octagons are overlays/)).toBeVisible();

  const map = page.getByTestId("h3-map");
  await expect(map).toBeVisible();
  await expect(map.locator("canvas")).toBeVisible({ timeout: 20_000 });
  await page.waitForTimeout(3000);
  await map.screenshot({ path: "test-results/dashboard-map.png" });
});

test("donor directory paginates", async ({ page }) => {
  for (let i = 0; i < 12; i += 1) {
    await registerUser(`pagedonor${i}@example.com`);
  }
  await page.goto(`${DASH_URL}/login`);
  await page.getByLabel("Email").fill(OPERATOR.email);
  await page.getByLabel("Password").fill(OPERATOR.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Operations map" })).toBeVisible({ timeout: 15_000 });

  await page.getByRole("link", { name: "Donors" }).click();
  await expect(page.getByRole("heading", { name: /Donors \(/ })).toBeVisible();
  const pagination = page.getByRole("navigation", { name: "Pagination" });
  await expect(pagination).toBeVisible({ timeout: 15_000 });
  const firstOnPageOne = await page.locator("main ul li").first().innerText();
  await pagination.getByRole("button", { name: "Page 2" }).click();
  await expect(async () => {
    const firstOnPageTwo = await page.locator("main ul li").first().innerText();
    expect(firstOnPageTwo).not.toBe(firstOnPageOne);
  }).toPass({ timeout: 15_000 });
});

test("offer accept requires confirmation", async ({ page }) => {
  const owner = "confirm-owner@example.com";
  const donor = "confirm-donor@example.com";
  await registerUser(owner);
  await registerUser(donor);
  const ownerToken = await loginUser(owner);
  const donorToken = await loginUser(donor);
  const created = (await api(
    "/v1/donations/requests",
    {
      method: "POST",
      body: JSON.stringify({ blood_type: "O+", requisite_number: 1 }),
    },
    ownerToken,
  )) as { request_id: number };
  const offer = (await api(
    `/v1/donations/requests/${created.request_id}/offers`,
    { method: "POST" },
    donorToken,
  )) as { offer_id: number };

  await page.goto(`${DASH_URL}/login`);
  await page.getByLabel("Email").fill(owner);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Operations map" })).toBeVisible({ timeout: 15_000 });

  await page.goto(`${DASH_URL}/requests/${created.request_id}`);
  await expect(page.getByText(`Offer #${offer.offer_id}`)).toBeVisible({ timeout: 15_000 });
  await page.getByRole("button", { name: "Accept", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Accept", exact: true }).last().click();
  await expect(page.getByText("accepted", { exact: false }).first()).toBeVisible({ timeout: 15_000 });
});

test("expired session redirects to login with a notice", async ({ page }) => {
  await page.goto(`${DASH_URL}/login`);
  await page.evaluate(() => {
    window.localStorage.setItem(
      "bh-dashboard-tokens",
      JSON.stringify({ access_token: "bogus", refresh_token: "bogus", token_type: "bearer", expires_in: 1 }),
    );
  });
  await page.goto(`${DASH_URL}/`);
  await expect(page).toHaveURL(/\/login\?expired=1/, { timeout: 15_000 });
  await expect(page.getByText("Your session expired")).toBeVisible();
});
