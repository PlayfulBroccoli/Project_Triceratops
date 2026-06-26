import { NextResponse } from "next/server";
import { bridgeFetch, checkBasicAuth, BridgeError } from "@/lib/whatsapp-bridge";

export async function GET(request: Request) {
  const auth = checkBasicAuth(request);
  if (auth) return auth;
  try {
    const data = await bridgeFetch<{
      status: string;
      queueLength: number;
      uptime: number;
    }>("/health");
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