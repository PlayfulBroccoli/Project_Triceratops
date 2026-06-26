import { NextResponse } from "next/server";
import { bridgeFetch, checkBasicAuth, BridgeError } from "@/lib/whatsapp-bridge";
import { audit } from "@/lib/audit";

export async function GET(request: Request) {
  const auth = checkBasicAuth(request);
  if (auth) return auth;
  try {
    const data = await bridgeFetch<{ enabled: boolean }>("/auto-reply");
    return NextResponse.json(data);
  } catch (err) {
    return bridgeErrorResponse(err);
  }
}

export async function POST(request: Request) {
  const auth = checkBasicAuth(request);
  if (auth) return auth;
  try {
    const body = await request.json();
    if (typeof body.enabled !== "boolean") {
      return NextResponse.json({ error: "enabled (boolean) required" }, { status: 400 });
    }
    const data = await bridgeFetch("/auto-reply", { method: "POST", body });
    await audit("auto_reply.toggle", body);
    return NextResponse.json(data);
  } catch (err) {
    return bridgeErrorResponse(err);
  }
}

function bridgeErrorResponse(err: unknown) {
  if (err instanceof BridgeError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  return NextResponse.json({ error: "Internal error" }, { status: 500 });
}