import { expect, test } from "@playwright/test";

const CLIENT_URL = process.env.E2E_CLIENT_URL ?? "http://127.0.0.1:3002";

const stamp = Date.now();
const EMAIL = `e2e-${stamp}@example.com`;

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
