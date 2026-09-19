import { expect, test } from "@playwright/test";

import { CLIENT_URL, registerUser } from "./helpers";

const stamp = Date.now();
const EMAIL = `e2e-${stamp}@example.com`;
const AUTO_EMAIL = `e2e-auto-${stamp}@example.com`;

test.beforeAll(async () => {
  await registerUser(AUTO_EMAIL, { firstname: "Auto", blood_type: "O+" });
});

test("discovery auto-searches on load", async ({ page }) => {
  await page.goto(`${CLIENT_URL}/login`);
  await page.getByLabel("Email").fill(AUTO_EMAIL);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Find help near you")).toBeVisible({ timeout: 15_000 });
  // No manual search: the page searches from the profile location by itself.
  await expect(page.getByText(/H3 cells as octagon overlays/)).toBeVisible({ timeout: 20_000 });
});

test("donor registers, discovers, and publishes a request", async ({ page }) => {
  await page.goto(`${CLIENT_URL}/register`);
  await page.getByLabel("Email").fill(EMAIL);
  await page.getByLabel(/Password/).fill("password123");
  await page.getByLabel("First name").fill("E2E");
  await page.getByLabel("Blood type").selectOption("A+");
  await page.getByLabel("Latitude").fill("37.7749");
  await page.getByLabel("Longitude").fill("-122.4194");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText("Find help near you")).toBeVisible({ timeout: 15_000 });

  await page.getByLabel("Distance (m)").fill("5000");
  await page.getByRole("button", { name: "Search" }).click();
  await expect(page.getByText(/H3 cells as octagon overlays/)).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("h3-map").locator("canvas")).toBeVisible({ timeout: 20_000 });

  await page.getByRole("link", { name: "Request blood" }).click();
  await page.getByLabel("Blood type needed").selectOption("A+");
  await page.getByLabel("Units needed").fill("2");
  await page.getByLabel("Notes for donors").fill("E2E playwright request");
  await page.getByRole("button", { name: "Publish request" }).click();
  await expect(page.getByText("E2E playwright request")).toBeVisible({ timeout: 15_000 });

  await page.getByRole("link", { name: "History" }).click();
  await expect(page.getByText("My donation history")).toBeVisible();
});
