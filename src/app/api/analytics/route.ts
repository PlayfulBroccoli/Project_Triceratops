import { NextResponse } from "next/server";
import { checkBasicAuth } from "@/lib/whatsapp-bridge";
import { readFile } from "fs/promises";
import path from "path";

const AUDIT_PATH = path.join(process.env.HOME || "/home/nick", ".hermes/whatsapp/audit.log");
const BRIDGE_LOG = path.join(process.env.HOME || "/home/nick", ".hermes/whatsapp/bridge.log");

type DailyCount = { date: string; count: number };
type ActionCount = { action: string; count: number };

export async function GET(request: Request) {
  const auth = checkBasicAuth(request);
  if (auth) return auth;
  const url = new URL(request.url);
  const days = Math.min(parseInt(url.searchParams.get("days") || "7", 10), 90);

  try {
    // ── Admin actions from audit log ──
    let auditRaw = "";
    try { auditRaw = await readFile(AUDIT_PATH, "utf8"); } catch { /* no audit yet */ }
    const auditLines = auditRaw.split("\n").filter(Boolean);
    const cutoff = Date.now() - days * 86_400_000;

    const actionCounts = new Map<string, number>();
    const dailyActions = new Map<string, number>();
    for (const line of auditLines) {
      try {
        const e = JSON.parse(line);
        if (new Date(e.ts).getTime() < cutoff) continue;
        const day = e.ts.slice(0, 10);
        actionCounts.set(e.action, (actionCounts.get(e.action) || 0) + 1);
        dailyActions.set(day, (dailyActions.get(day) || 0) + 1);
      } catch { /* skip */ }
    }

    const actions: ActionCount[] = Array.from(actionCounts.entries())
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count);

    const dailyAudit: DailyCount[] = Array.from(dailyActions.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // ── Bridge log: parse event JSON lines for message counts ──
    let bridgeRaw = "";
    try { bridgeRaw = await readFile(BRIDGE_LOG, "utf8"); } catch { /* ignore */ }
    const bridgeLines = bridgeRaw.split("\n").filter(Boolean).slice(-5000);

    const eventCounts = new Map<string, number>();
    const dailyMessages = new Map<string, { received: number; sent: number; ignored: number }>();
    for (const line of bridgeLines) {
      try {
        const e = JSON.parse(line);
        if (!e.event) continue;
        if (new Date((e.time || e.ts || Date.now())).getTime() < cutoff) continue;
        eventCounts.set(e.event, (eventCounts.get(e.event) || 0) + 1);
        const day = (e.time || e.ts || new Date().toISOString()).slice(0, 10);
        const cur = dailyMessages.get(day) || { received: 0, sent: 0, ignored: 0 };
        if (e.event.includes("received") || e.event === "message") cur.received++;
        else if (e.event.includes("sent") || e.event === "replied") cur.sent++;
        else if (e.event === "ignored") cur.ignored++;
        dailyMessages.set(day, cur);
      } catch { /* skip non-JSON */ }
    }

    const events: ActionCount[] = Array.from(eventCounts.entries())
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    const dailyBridge: { date: string; received: number; sent: number; ignored: number }[] =
      Array.from(dailyMessages.entries())
        .map(([date, counts]) => ({ date, ...counts }))
        .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      days,
      admin: { actions, daily: dailyAudit, totalActions: auditLines.length },
      bridge: { events, daily: dailyBridge },
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}