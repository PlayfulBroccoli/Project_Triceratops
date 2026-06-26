import { NextResponse } from "next/server";
import { checkBasicAuth, bridgeFetch, BridgeError } from "@/lib/whatsapp-bridge";
import { audit } from "@/lib/audit";
import { readFile, writeFile } from "fs/promises";
import path from "path";

const REPLIES_PATH = path.join(
  process.env.HOME || "/home/nick",
  ".hermes/whatsapp/canned-replies.json",
);

type CannedReply = {
  id: string;
  label: string;
  text: string;
  // Optional: variables to fill, e.g. ["name", "date"]
  variables?: string[];
  category?: string;
  createdAt: string;
  updatedAt: string;
};

type CannedRepliesFile = {
  replies: CannedReply[];
  updatedAt: string;
};

async function readReplies(): Promise<CannedRepliesFile> {
  try {
    const raw = await readFile(REPLIES_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return {
      replies: Array.isArray(parsed.replies) ? parsed.replies : [],
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    };
  } catch {
    return { replies: [], updatedAt: new Date().toISOString() };
  }
}

export async function GET(request: Request) {
  const auth = checkBasicAuth(request);
  if (auth) return auth;
  return NextResponse.json(await readReplies());
}

export async function POST(request: Request) {
  const auth = checkBasicAuth(request);
  if (auth) return auth;
  try {
    const body = await request.json();
    const { action } = body || {};
    if (action === "send") {
      // Send a reply via bridge
      const { replyId, to, variables } = body;
      if (!replyId || !to) {
        return NextResponse.json({ error: "replyId and to required" }, { status: 400 });
      }
      const file = await readReplies();
      const reply = file.replies.find((r) => r.id === replyId);
      if (!reply) {
        return NextResponse.json({ error: "reply not found" }, { status: 404 });
      }
      // Fill variables with {{name}} syntax
      let text = reply.text;
      if (variables && typeof variables === "object") {
        for (const [k, v] of Object.entries(variables)) {
          text = text.replaceAll(`{{${k}}}`, String(v));
        }
      }
      const data = await bridgeFetch("/send", {
        method: "POST",
        body: { to, message: text },
      });
      await audit("canned_reply.send", { replyId, to });
      return NextResponse.json({ sent: true, text, response: data });
    }
    if (action === "save") {
      const { reply } = body;
      if (!reply || !reply.label || !reply.text) {
        return NextResponse.json(
          { error: "reply.label and reply.text required" },
          { status: 400 },
        );
      }
      const file = await readReplies();
      const id = reply.id || `r_${Date.now().toString(36)}`;
      const idx = file.replies.findIndex((r) => r.id === id);
      const now = new Date().toISOString();
      const newReply: CannedReply = {
        id,
        label: String(reply.label).slice(0, 100),
        text: String(reply.text).slice(0, 4000),
        variables: Array.isArray(reply.variables) ? reply.variables.filter((v: unknown) => typeof v === "string") : undefined,
        category: typeof reply.category === "string" ? reply.category.slice(0, 50) : undefined,
        createdAt: idx === -1 ? now : file.replies[idx].createdAt,
        updatedAt: now,
      };
      if (idx === -1) file.replies.push(newReply);
      else file.replies[idx] = newReply;
      file.updatedAt = now;
      await writeFile(REPLIES_PATH, JSON.stringify(file, null, 2));
      await audit("canned_reply.save", { id, label: newReply.label });
      return NextResponse.json(file);
    }
    if (action === "delete") {
      const { replyId } = body;
      const file = await readReplies();
      file.replies = file.replies.filter((r) => r.id !== replyId);
      file.updatedAt = new Date().toISOString();
      await writeFile(REPLIES_PATH, JSON.stringify(file, null, 2));
      await audit("canned_reply.delete", { replyId });
      return NextResponse.json(file);
    }
    return NextResponse.json({ error: `unknown action: ${action}` }, { status: 400 });
  } catch (err) {
    if (err instanceof BridgeError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}