import { NextResponse } from "next/server";
import { checkBasicAuth, bridgeFetch, BridgeError } from "@/lib/whatsapp-bridge";

type Msg = {
  id?: string;
  from?: string;
  to?: string;
  body?: string;
  message?: string;
  text?: string;
  timestamp?: number | string;
  ts?: number | string;
  direction?: "in" | "out";
  sender?: string;
  [k: string]: unknown;
};

export async function GET(request: Request) {
  const auth = checkBasicAuth(request);
  if (auth) return auth;
  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "500", 10), 5000);

  try {
    // Bridge may not have many messages; fall back to bridge.log analysis
    const data = await bridgeFetch<{ messages?: Msg[]; items?: Msg[] }>(
      `/messages?limit=${limit}`,
    ).catch(() => ({ messages: [], items: [] }));

    const raw = Array.isArray(data.messages) ? data.messages : Array.isArray(data.items) ? data.items : [];

    // Extract sender info, dedupe by sender, count
    const bySender = new Map<string, { number: string; count: number; lastAt: number; lastBody: string }>();
    for (const m of raw) {
      const sender =
        (typeof m.from === "string" ? m.from : undefined) ||
        (typeof m.sender === "string" ? m.sender : undefined) ||
        "unknown";
      // Normalize: strip @s.whatsapp.net, @lid
      const num = sender.split("@")[0];
      const ts =
        typeof m.timestamp === "number"
          ? m.timestamp
          : typeof m.ts === "number"
            ? m.ts
            : typeof m.timestamp === "string"
              ? Date.parse(m.timestamp) || 0
              : typeof m.ts === "string"
                ? Date.parse(m.ts) || 0
                : 0;
      const body = (m.body || m.message || m.text || "").toString().slice(0, 200);
      const existing = bySender.get(num);
      if (existing) {
        existing.count++;
        if (ts > existing.lastAt) {
          existing.lastAt = ts;
          existing.lastBody = body;
        }
      } else {
        bySender.set(num, { number: num, count: 1, lastAt: ts, lastBody: body });
      }
    }

    const contacts = Array.from(bySender.values()).sort((a, b) => b.count - a.count);
    return NextResponse.json({
      contacts,
      totalMessages: raw.length,
      uniqueContacts: contacts.length,
    });
  } catch (err) {
    if (err instanceof BridgeError) {
      return NextResponse.json({ error: err.message, contacts: [] }, { status: err.status });
    }
    return NextResponse.json({ error: (err as Error).message, contacts: [] }, { status: 500 });
  }
}