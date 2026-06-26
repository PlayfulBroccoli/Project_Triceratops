import "server-only";

/**
 * Server-only helper to call the local Hermes WhatsApp bridge.
 * Bridge runs at 127.0.0.1:3000 — only reachable from this machine.
 * Used by /project_triceratops/admin API routes.
 */

const BRIDGE_URL = process.env.WHATSAPP_BRIDGE_URL || "http://127.0.0.1:3000";
const BRIDGE_TOKEN = process.env.WHATSAPP_BRIDGE_TOKEN || "";

type FetchOpts = {
  method?: "GET" | "POST";
  body?: unknown;
  timeoutMs?: number;
};

export class BridgeError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "BridgeError";
  }
}

export async function bridgeFetch<T = unknown>(
  path: string,
  opts: FetchOpts = {},
): Promise<T> {
  const { method = "GET", body, timeoutMs = 5000 } = opts;

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (BRIDGE_TOKEN) headers["Authorization"] = `Bearer ${BRIDGE_TOKEN}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${BRIDGE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new BridgeError(res.status, text || `Bridge ${res.status}`);
    }

    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return (await res.json()) as T;
    }
    return (await res.text()) as unknown as T;
  } catch (err) {
    if (err instanceof BridgeError) throw err;
    if ((err as Error).name === "AbortError") {
      throw new BridgeError(504, "Bridge timeout");
    }
    throw new BridgeError(502, `Bridge unreachable: ${(err as Error).message}`);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Verify HTTP Basic Auth header against env-configured admin credentials.
 * Returns null on success, or a 401 NextResponse on failure.
 */
import { NextResponse } from "next/server";

export function checkBasicAuth(request: Request): NextResponse | null {
  const user = process.env.TRICERATOPS_ADMIN_USER || "admin";
  const pass = process.env.TRICERATOPS_ADMIN_PASSWORD || "";
  if (!pass) {
    return NextResponse.json(
      { error: "TRICERATOPS_ADMIN_PASSWORD not set in .env" },
      { status: 500 },
    );
  }

  const header = request.headers.get("authorization") || "";
  if (!header.toLowerCase().startsWith("basic ")) {
    return unauthorizedResponse();
  }

  try {
    const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
    const idx = decoded.indexOf(":");
    if (idx === -1) return unauthorizedResponse();
    const u = decoded.slice(0, idx);
    const p = decoded.slice(idx + 1);
    if (u !== user || p !== pass) return unauthorizedResponse();
    return null;
  } catch {
    return unauthorizedResponse();
  }
}

function unauthorizedResponse() {
  return new NextResponse("Unauthorized", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Project Triceratops Admin"' },
  });
}