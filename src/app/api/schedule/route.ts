import { NextResponse } from "next/server";
import { checkBasicAuth } from "@/lib/whatsapp-bridge";
import { readFile } from "fs/promises";
import path from "path";

const MODE_FILE = path.join(process.env.HOME || "/home/nick", ".hermes/whatsapp/current-mode");
const TIMER_FILE = "/home/nick/.config/systemd/user/whatsapp-auto-toggle.timer";
const TOGGLE_SCRIPT = "/home/nick/.hermes/scripts/whatsapp-auto-toggle.sh";

export async function GET(request: Request) {
  const auth = checkBasicAuth(request);
  if (auth) return auth;
  try {
    const [modeRaw, timerRaw, scriptRaw] = await Promise.allSettled([
      readFile(MODE_FILE, "utf8"),
      readFile(TIMER_FILE, "utf8"),
      readFile(TOGGLE_SCRIPT, "utf8"),
    ]);

    // Parse timer interval
    let interval = "unknown";
    if (timerRaw.status === "fulfilled") {
      const m = timerRaw.value.match(/OnUnitActiveSec=(\S+)/);
      if (m) interval = m[1];
    }

    // Extract work-hour windows from the toggle script (raw minutes)
    const schedule: Record<string, string> = {};
    if (scriptRaw.status === "fulfilled") {
      const win = (label: string, re: RegExp) => {
        const m = scriptRaw.value.match(re);
        if (m) schedule[label] = m[1].trim();
      };
      win("work_start", /WORK_START=\$\(\(([^)]+)\)\)/);
      win("work_end", /WORK_END=\$\(\(([^)]+)\)\)/);
      win("lunch_start", /LUNCH_START=\$\(\(([^)]+)\)\)/);
      win("lunch_end", /LUNCH_END=\$\(\(([^)]+)\)\)/);
      win("commute_end", /COMMUTE_END=\$\(\(([^)]+)\)\)/);
    }

    // Parse bash arithmetic like "8 * 60 + 30" -> total minutes
    const bashToMinutes = (expr?: string): number | null => {
      if (!expr) return null;
      try {
        // safe-ish: only digits, spaces, *, +, ()
        if (!/^[\d\s*+()]+$/.test(expr)) return null;
        // eslint-disable-next-line no-new-func
        return Function(`"use strict"; return (${expr});`)();
      } catch {
        return null;
      }
    };

    const humanize = (expr?: string): string | undefined => {
      const m = bashToMinutes(expr ?? undefined);
      if (m === null) return undefined;
      return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
    };

    return NextResponse.json({
      currentMode: modeRaw.status === "fulfilled" ? modeRaw.value.trim() : "unknown",
      toggleInterval: interval,
      schedule: {
        work: { start: humanize(schedule.work_start), end: humanize(schedule.work_end) },
        lunch: { start: humanize(schedule.lunch_start), end: humanize(schedule.lunch_end) },
        commuteEnd: humanize(schedule.commute_end),
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Schedule read failed: ${(err as Error).message}` },
      { status: 500 },
    );
  }
}