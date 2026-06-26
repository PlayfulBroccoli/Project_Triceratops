import { NextResponse } from "next/server";
import { checkBasicAuth } from "@/lib/whatsapp-bridge";
import { AUDIT_LOG_PATH } from "@/lib/audit";
import { readFile } from "fs/promises";
import path from "path";

type AuditEntry = {
  ts: string;
  action: string;
  user: string;
  [k: string]: unknown;
};

export async function GET(request: Request) {
  const auth = checkBasicAuth(request);
  if (auth) return auth;

  const url = new URL(request.url);
  const tail = Math.min(parseInt(url.searchParams.get("tail") || "200", 10), 5000);
  const actionFilter = url.searchParams.get("action") || "";
  const search = (url.searchParams.get("q") || "").toLowerCase();

  try {
    const raw = await readFile(AUDIT_LOG_PATH, "utf8").catch(() => "");
    const lines = raw.split("\n").filter(Boolean);
    const entries: AuditEntry[] = lines
      .map((l) => {
        try {
          return JSON.parse(l) as AuditEntry;
        } catch {
          return null;
        }
      })
      .filter((e): e is AuditEntry => e !== null)
      .filter((e) => (actionFilter ? e.action === actionFilter : true))
      .filter((e) =>
        search
          ? JSON.stringify(e).toLowerCase().includes(search)
          : true,
      )
      .slice(-tail);

    return NextResponse.json({
      entries,
      total: entries.length,
      path: AUDIT_LOG_PATH,
      allActions: [...new Set(entries.map((e) => e.action))],
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Could not read audit log: ${(err as Error).message}` },
      { status: 500 },
    );
  }
}