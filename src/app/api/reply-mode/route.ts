import { NextResponse } from "next/server";
import { bridgeFetch, checkBasicAuth, BridgeError } from "@/lib/whatsapp-bridge";
import { audit } from "@/lib/audit";

const VALID_MODES = ["off", "immediate", "delayed", "commute"] as const;
type Mode = (typeof VALID_MODES)[number];

export async function GET(request: Request) {
  const auth = checkBasicAuth(request);
  if (auth) return auth;
  try {
    const data = await bridgeFetch<{ mode: Mode; pending: number }>("/reply-mode");
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
    if (!VALID_MODES.includes(body.mode)) {
      return NextResponse.json(
        { error: `mode must be one of: ${VALID_MODES.join(", ")}` },
        { status: 400 },
      );
    }
    const data = await bridgeFetch("/reply-mode", { method: "POST", body });
    await audit("reply_mode.set", body);
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