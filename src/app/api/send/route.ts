import { NextResponse } from "next/server";
import { checkBasicAuth, bridgeFetch, BridgeError } from "@/lib/whatsapp-bridge";
import { audit } from "@/lib/audit";

export async function POST(request: Request) {
  const auth = checkBasicAuth(request);
  if (auth) return auth;
  try {
    const body = await request.json();
    const { to, message } = body || {};
    if (!to || !message) {
      return NextResponse.json({ error: "to and message required" }, { status: 400 });
    }
    if (typeof message !== "string" || message.length > 4000) {
      return NextResponse.json({ error: "message must be string, max 4000 chars" }, { status: 400 });
    }
    const data = await bridgeFetch("/send", {
      method: "POST",
      body: { to, message },
    });
    await audit("message.send", { to, len: message.length });
    return NextResponse.json({ sent: true, response: data });
  } catch (err) {
    if (err instanceof BridgeError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}