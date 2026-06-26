import { NextResponse } from "next/server";
import { checkBasicAuth } from "@/lib/whatsapp-bridge";
import { audit } from "@/lib/audit";
import { spawn } from "child_process";

function runPm2(args: string[]): Promise<{ ok: boolean; stdout: string; stderr: string; code: number }> {
  return new Promise((resolve) => {
    const proc = spawn("/home/nick/.hermes/node/bin/pm2", args, {
      timeout: 10_000,
      env: { ...process.env, PATH: "/home/nick/.hermes/node/bin:/usr/local/bin:/usr/bin:/bin" },
    });
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (d) => (stdout += d.toString()));
    proc.stderr.on("data", (d) => (stderr += d.toString()));
    proc.on("close", (code) => {
      resolve({ ok: code === 0, stdout, stderr, code: code ?? 0 });
    });
  });
}

export async function GET(request: Request) {
  const auth = checkBasicAuth(request);
  if (auth) return auth;
  const result = await runPm2(["jlist"]);
  if (!result.ok) {
    return NextResponse.json({ error: result.stderr || result.stdout, processes: [] }, { status: 502 });
  }
  try {
    const procs = (JSON.parse(result.stdout || "[]") as Record<string, unknown>[]).map((p) => {
      const env = (p.pm2_env as Record<string, unknown> | undefined) || {};
      const monit = (p.monit as Record<string, unknown> | undefined) || {};
      return {
        name: String(p.name || ""),
        pid: Number(p.pid) || 0,
        pm_id: Number(p.pm_id) || 0,
        status: String(env.status || "unknown"),
        uptime: Number(env.pm_uptime) || 0,
        restarts: Number(env.restart_time) || 0,
        memory: Number(monit.memory) || 0,
        cpu: Number(monit.cpu) || 0,
        version: String(env.version || ""),
      };
    });
    return NextResponse.json({ processes: procs });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message, raw: result.stdout }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = checkBasicAuth(request);
  if (auth) return auth;
  try {
    const body = await request.json();
    const { action, name } = body || {};
    if (!action || !name) {
      return NextResponse.json({ error: "action and name required" }, { status: 400 });
    }
    let args: string[] = [];
    if (action === "restart") args = ["restart", name];
    else if (action === "stop") args = ["stop", name];
    else if (action === "start") args = ["start", name];
    else if (action === "reload") args = ["reload", name];
    else {
      return NextResponse.json({ error: `unknown action: ${action}` }, { status: 400 });
    }
    const result = await runPm2(args);
    await audit(`bridge.${action}`, { name, ok: result.ok, code: result.code });
    return NextResponse.json({
      ok: result.ok,
      stdout: result.stdout,
      stderr: result.stderr,
      code: result.code,
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}