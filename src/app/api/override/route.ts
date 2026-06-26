import { NextResponse } from "next/server";
import { checkBasicAuth } from "@/lib/whatsapp-bridge";
import { audit, AUDIT_LOG_PATH } from "@/lib/audit";
import { readFile, writeFile } from "fs/promises";
import path from "path";

const OVERRIDE_PATH = path.join(
  process.env.HOME || "/home/nick",
  ".hermes/whatsapp/override.json",
);

type Mode = "off" | "immediate" | "delayed" | "commute";
const VALID_MODES: Mode[] = ["off", "immediate", "delayed", "commute"];

type Override = {
  mode: Mode;
  expires: string; // ISO timestamp
  reason?: string;
  setBy: string;
  setAt: string;
};

async function readOverride(): Promise<Override | null> {
  try {
    const raw = await readFile(OVERRIDE_PATH, "utf8");
    const parsed = JSON.parse(raw);
    // Auto-expire on read
    if (parsed.expires && new Date(parsed.expires) <= new Date()) {
      return null;
    }
    return parsed as Override;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const auth = checkBasicAuth(request);
  if (auth) return auth;
  const override = await readOverride();
  return NextResponse.json({ override });
}

export async function POST(request: Request) {
  const auth = checkBasicAuth(request);
  if (auth) return auth;

  try {
    const body = await request.json();
    const { mode, durationMinutes, reason } = body || {};

    // DELETE mode: clear override
    if (mode === "clear" || durationMinutes === 0) {
      try {
        await writeFile(OVERRIDE_PATH, "");
      } catch {
        // ignore
      }
      await audit("override.clear", { previous: await readOverride() });
      return NextResponse.json({ override: null });
    }

    if (!VALID_MODES.includes(mode)) {
      return NextResponse.json(
        { error: `mode must be one of: ${VALID_MODES.join(", ")} or "clear"` },
        { status: 400 },
      );
    }
    const mins = parseInt(durationMinutes, 10);
    if (!Number.isFinite(mins) || mins < 1 || mins > 1440) {
      return NextResponse.json(
        { error: "durationMinutes must be 1-1440" },
        { status: 400 },
      );
    }

    const now = new Date();
    const expires = new Date(now.getTime() + mins * 60_000);
    const override: Override = {
      mode: mode as Mode,
      expires: expires.toISOString(),
      reason: typeof reason === "string" ? reason.slice(0, 200) : undefined,
      setBy: process.env.TRICERATOPS_ADMIN_USER || "admin",
      setAt: now.toISOString(),
    };

    await writeFile(OVERRIDE_PATH, JSON.stringify(override, null, 2));
    await audit("override.set", { mode, durationMinutes: mins, reason });
    return NextResponse.json({ override });
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to set override: ${(err as Error).message}` },
      { status: 500 },
    );
  }
}

export { AUDIT_LOG_PATH, OVERRIDE_PATH };