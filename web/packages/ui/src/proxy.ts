import { NextResponse, type NextRequest } from "next/server";

/**
 * Same-origin backend proxy. Browsers call `/api/backend/...`; this handler
 * forwards to the FastAPI service and injects `X-APP-TOKEN` server-side so the
 * app token is never exposed to the browser. The user's bearer token passes
 * through untouched.
 */
export function createBackendProxy(apiBaseUrl: string, appToken: string) {
  const base = apiBaseUrl.replace(/\/$/, "");

  async function handler(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
    const { path } = await ctx.params;
    const target = `${base}/${(path ?? []).join("/")}${req.nextUrl.search}`;
    const headers = new Headers();
    const authorization = req.headers.get("authorization");
    if (authorization) headers.set("authorization", authorization);
    headers.set("X-APP-TOKEN", appToken);
    const contentType = req.headers.get("content-type");
    if (contentType) headers.set("content-type", contentType);
    const body =
      req.method === "GET" || req.method === "HEAD" ? undefined : await req.arrayBuffer();
    let upstream: Response;
    try {
      upstream = await fetch(target, { method: req.method, headers, body });
    } catch (error) {
      return NextResponse.json(
        { code: 700, reason: "Backend unreachable", extra_info: { detail: String(error) } },
        { status: 502 },
      );
    }
    const responseContentType = upstream.headers.get("content-type") ?? "application/json";
    if (upstream.status === 204) {
      return new NextResponse(null, { status: 204 });
    }
    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: { "content-type": responseContentType },
    });
  }

  return { GET: handler, POST: handler, PUT: handler, PATCH: handler, DELETE: handler, OPTIONS: handler };
}
