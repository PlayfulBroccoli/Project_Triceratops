import { NextResponse } from "next/server";
import { checkBasicAuth } from "@/lib/whatsapp-bridge";
import { readFile } from "fs/promises";
import path from "path";

const LOG_PATH = path.join(process.env.HOME || "/home/nick", ".hermes/whatsapp/bridge.log");

type LogEntry = {
  ts: string;
  level: string;
  msg: string;
};

function parseLine(line: string): LogEntry | null {
  // Multi-line JSON objects are common in pino logs. Only lines starting with "{"
  // are JSON root lines; continuation lines are skipped.
  const trimmed = line.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("{")) {
    try {
      const obj = JSON.parse(trimmed);
      let lvl = "INFO";
      if (typeof obj.level === "number") {
        lvl = obj.level >= 50 ? "ERROR" : obj.level >= 40 ? "WARN" : obj.level >= 30 ? "INFO" : "DEBUG";
      } else if (obj.level) {
        lvl = String(obj.level).toUpperCase();
      } else if (obj.event === "error") {
        lvl = "ERROR";
      }
      const msg =
        typeof obj.msg === "string"
          ? obj.msg
          : obj.msg
            ? JSON.stringify(obj.msg)
            : obj.event
              ? `[${obj.event}] ${obj.reason || ""} ${obj.chatId || ""}`.trim()
              : "";
      return {
        ts: obj.time ? new Date(obj.time).toISOString() : obj.timestamp || "",
        level: lvl,
        msg,
      };
    } catch {
      // JSON parse failed on what looked like a root — skip
      return null;
    }
  }
  // Skip continuation lines (indented JSON inside a root object)
  if (line.startsWith(" ") || line.startsWith("\t")) return null;
  // Plain text fallback
  const m = trimmed.match(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\s+(\w+)\s+(.*)$/);
  if (m) return { ts: m[1], level: m[2].toUpperCase(), msg: m[3] };
  return null;
}

export async function GET(request: Request) {
  const auth = checkBasicAuth(request);
  if (auth) return auth;

  const url = new URL(request.url);
  const tail = Math.min(parseInt(url.searchParams.get("tail") || "200", 10), 2000);
  const filter = (url.searchParams.get("level") || "").toUpperCase();
  const search = (url.searchParams.get("q") || "").toLowerCase();

  try {
    const raw = await readFile(LOG_PATH, "utf8");
    const lines = raw.split("\n").slice(-tail * 3); // over-read to filter
    const entries = lines
      .map(parseLine)
      .filter((e): e is LogEntry => e !== null)
      .filter((e) => (filter ? e.level === filter : true))
      .filter((e) => (search ? e.msg.toLowerCase().includes(search) : true))
      .slice(-tail);

    return NextResponse.json({ entries, total: entries.length, path: LOG_PATH });
  } catch (err) {
    return NextResponse.json(
      { error: `Could not read log: ${(err as Error).message}` },
      { status: 500 },
    );
  }
}