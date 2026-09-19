import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 90_000,
  retries: 0,
  use: {
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
});
