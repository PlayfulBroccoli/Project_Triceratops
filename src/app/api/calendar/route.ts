import { NextResponse } from "next/server";
import { checkBasicAuth } from "@/lib/whatsapp-bridge";
import { spawn } from "child_process";
import path from "path";

const CAL_SCRIPT = path.join(
  process.env.HOME || "/home/nick",
  ".hermes/scripts/cal.py",
);

function runCal(args: string[]): Promise<{ ok: boolean; out: string }> {
  return new Promise((resolve) => {
    const proc = spawn("python3", [CAL_SCRIPT, ...args], {
      timeout: 10_000,
      env: { ...process.env, HOME: process.env.HOME || "/home/nick" },
    });
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (d) => (stdout += d.toString()));
    proc.stderr.on("data", (d) => (stderr += d.toString()));
    proc.on("close", (code) => {
      if (code === 0) resolve({ ok: true, out: stdout });
      else resolve({ ok: false, out: stderr || stdout });
    });
  });
}

export async function GET(request: Request) {
  const auth = checkBasicAuth(request);
  if (auth) return auth;

  const url = new URL(request.url);
  const range = url.searchParams.get("range") || "today";
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
  const nextWeek = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);

  let args: string[];
  if (range === "today") args = ["range", today, today];
  else if (range === "tomorrow") args = ["range", tomorrow, tomorrow];
  else if (range === "week") args = ["range", today, nextWeek];
  else args = ["now"];

  const { ok, out } = await runCal(args);
  if (!ok) {
    return NextResponse.json({ error: out || "cal.py failed" }, { status: 502 });
  }
  try {
    return NextResponse.json(JSON.parse(out));
  } catch {
    return NextResponse.json({ raw: out });
  }
}