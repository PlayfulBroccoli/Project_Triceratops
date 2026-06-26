import { NextResponse } from "next/server";
import { checkBasicAuth } from "@/lib/whatsapp-bridge";
import { audit } from "@/lib/audit";
import { readFile, writeFile } from "fs/promises";
import path from "path";

const BLOCKLIST_PATH = path.join(
  process.env.HOME || "/home/nick",
  ".hermes/whatsapp/blocklist.json",
);

type Blocklist = {
  // phone numbers (E.164 or JID) and short keywords to block
  numbers: string[];
  keywords: string[];
  updatedAt: string;
};

async function readBlocklist(): Promise<Blocklist> {
  try {
    const raw = await readFile(BLOCKLIST_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return {
      numbers: Array.isArray(parsed.numbers) ? parsed.numbers : [],
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    };
  } catch {
    return { numbers: [], keywords: [], updatedAt: new Date().toISOString() };
  }
}

export async function GET(request: Request) {
  const auth = checkBasicAuth(request);
  if (auth) return auth;
  return NextResponse.json(await readBlocklist());
}

export async function POST(request: Request) {
  const auth = checkBasicAuth(request);
  if (auth) return auth;
  try {
    const body = await request.json();
    const current = await readBlocklist();
    const next: Blocklist = {
      numbers: Array.isArray(body.numbers) ? body.numbers.filter((s: unknown) => typeof s === "string") : current.numbers,
      keywords: Array.isArray(body.keywords) ? body.keywords.filter((s: unknown) => typeof s === "string") : current.keywords,
      updatedAt: new Date().toISOString(),
    };
    await writeFile(BLOCKLIST_PATH, JSON.stringify(next, null, 2));
    await audit("blocklist.update", { numbers: next.numbers.length, keywords: next.keywords.length });
    return NextResponse.json(next);
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to save: ${(err as Error).message}` },
      { status: 500 },
    );
  }
}