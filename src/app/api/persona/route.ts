import { NextResponse } from "next/server";
import { checkBasicAuth } from "@/lib/whatsapp-bridge";
import { readFile } from "fs/promises";
import path from "path";

const PERSONA_PATH = path.join(
  process.env.HOME || "/home/nick",
  ".hermes/whatsapp/nick-persona.txt",
);

export async function GET(request: Request) {
  const auth = checkBasicAuth(request);
  if (auth) return auth;
  try {
    const content = await readFile(PERSONA_PATH, "utf8");
    const stat = await import("fs/promises").then((m) => m.stat(PERSONA_PATH));

    // Parse out sections (everything before "RULES:" plus each bullet)
    const lines = content.split("\n");
    const sections: { heading: string; body: string }[] = [];
    let current = { heading: "Persona", body: "" };
    for (const line of lines) {
      if (line.match(/^[A-Z][A-Z\s]+:/)) {
        if (current.body) sections.push(current);
        current = { heading: line.replace(":", "").trim(), body: "" };
      } else {
        current.body += line + "\n";
      }
    }
    if (current.body) sections.push(current);

    return NextResponse.json({
      content,
      sections,
      path: PERSONA_PATH,
      sizeBytes: stat.size,
      modifiedAt: stat.mtime.toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Could not read persona: ${(err as Error).message}` },
      { status: 500 },
    );
  }
}