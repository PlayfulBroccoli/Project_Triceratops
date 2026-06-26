import { NextResponse } from "next/server";
import { checkBasicAuth } from "@/lib/whatsapp-bridge";
import { audit } from "@/lib/audit";
import { readFile, writeFile } from "fs/promises";
import path from "path";

const CONTACTS_PATH = path.join(
  process.env.HOME || "/home/nick",
  ".hermes/whatsapp/contacts.json",
);

type Contacts = {
  // Numbers to always reply to immediately (override reply-mode delay)
  vip: { number: string; note?: string; addedAt: string }[];
  // Blocked (separate file also exists; mirrored here for convenience)
  blocked: string[];
  updatedAt: string;
};

const empty: Contacts = { vip: [], blocked: [], updatedAt: new Date().toISOString() };

async function readContacts(): Promise<Contacts> {
  try {
    const raw = await readFile(CONTACTS_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return {
      vip: Array.isArray(parsed.vip) ? parsed.vip : [],
      blocked: Array.isArray(parsed.blocked) ? parsed.blocked : [],
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    };
  } catch {
    return { ...empty };
  }
}

export async function GET(request: Request) {
  const auth = checkBasicAuth(request);
  if (auth) return auth;
  return NextResponse.json(await readContacts());
}

export async function POST(request: Request) {
  const auth = checkBasicAuth(request);
  if (auth) return auth;
  try {
    const body = await request.json();
    const current = await readContacts();
    const next: Contacts = {
      vip: Array.isArray(body.vip)
        ? body.vip
            .map((v: unknown) => {
              if (typeof v === "string") {
                return { number: v, addedAt: new Date().toISOString() };
              }
              if (v && typeof v === "object" && "number" in v && typeof (v as Record<string, unknown>).number === "string") {
                const o = v as Record<string, unknown>;
                return {
                  number: o.number as string,
                  note: typeof o.note === "string" ? o.note.slice(0, 200) : undefined,
                  addedAt: typeof o.addedAt === "string" ? o.addedAt : new Date().toISOString(),
                };
              }
              return null;
            })
            .filter((v: unknown): v is Contacts["vip"][number] => v !== null)
        : current.vip,
      blocked: Array.isArray(body.blocked)
        ? body.blocked.filter((s: unknown) => typeof s === "string")
        : current.blocked,
      updatedAt: new Date().toISOString(),
    };
    await writeFile(CONTACTS_PATH, JSON.stringify(next, null, 2));
    await audit("contacts.update", {
      vipCount: next.vip.length,
      blockedCount: next.blocked.length,
    });
    return NextResponse.json(next);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}