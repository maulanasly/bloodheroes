import { createBackendProxy } from "@bloodheroes/ui";

const proxy = createBackendProxy(
  process.env.BH_API_BASE_URL ?? "http://localhost:8000",
  process.env.BH_APP_TOKEN ?? "",
);

export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = proxy;
