import { NextResponse } from "next/server";
import { checkBasicAuth, bridgeFetch, BridgeError } from "@/lib/whatsapp-bridge";
import { audit } from "@/lib/audit";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

const PICS_DIR = path.join(process.env.HOME || "/home/nick", ".hermes/whatsapp/profile-pics");

export async function GET(request: Request) {
  const auth = checkBasicAuth(request);
  if (auth) return auth;
  try {
    const { readdir, stat } = await import("fs/promises");
    const files = await readdir(PICS_DIR);
    const pics = await Promise.all(
      files
        .filter((f) => /\.(png|jpg|jpeg|webp)$/i.test(f))
        .map(async (f) => {
          const s = await stat(path.join(PICS_DIR, f));
          return {
            name: f,
            path: path.join(PICS_DIR, f),
            sizeBytes: s.size,
            modifiedAt: s.mtime.toISOString(),
          };
        }),
    );
    pics.sort((a, b) => a.name.localeCompare(b.name));
    let currentPic: string | null = null;
    try {
      currentPic = (await readFile(path.join(process.env.HOME || "/home/nick", ".hermes/whatsapp/current-mode"), "utf8")).trim() + ".png";
    } catch { /* ignore */ }
    return NextResponse.json({ pics, currentPic });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const auth = checkBasicAuth(request);
  if (auth) return auth;

  const contentType = request.headers.get("content-type") || "";
  let filename: string;
  let data: Uint8Array;

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const file = form.get("file");
    const providedName = form.get("name");
    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }
    const ext = (file instanceof File ? file.name : "upload.png").match(/\.(png|jpg|jpeg|webp)$/i)?.[1] || "png";
    const base = (typeof providedName === "string" && providedName) ? providedName : (file instanceof File ? file.name.replace(/\.[^.]+$/, "") : "upload");
    filename = `${base.replace(/[^a-zA-Z0-9_-]/g, "_")}.${ext.toLowerCase()}`;
    data = new Uint8Array(await file.arrayBuffer());
  } else {
    return NextResponse.json(
      { error: "Use multipart/form-data with file and optional name" },
      { status: 400 },
    );
  }

  try {
    await mkdir(PICS_DIR, { recursive: true });
    const dest = path.join(PICS_DIR, filename);
    await writeFile(dest, data);
    await audit("profile_pic.upload", { filename, sizeBytes: data.byteLength });
    return NextResponse.json({ filename, path: dest, sizeBytes: data.byteLength });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  const auth = checkBasicAuth(request);
  if (auth) return auth;
  // Set current profile pic via bridge
  try {
    const body = await request.json();
    if (!body.filename) {
      return NextResponse.json({ error: "filename required" }, { status: 400 });
    }
    const filePath = path.join(PICS_DIR, body.filename);
    const data = await bridgeFetch("/profile-picture", {
      method: "POST",
      body: { filePath },
    });
    await audit("profile_pic.set_current", { filename: body.filename });
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof BridgeError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = checkBasicAuth(request);
  if (auth) return auth;
  try {
    const body = await request.json();
    if (!body.filename) {
      return NextResponse.json({ error: "filename required" }, { status: 400 });
    }
    const filePath = path.join(PICS_DIR, body.filename);
    const { unlink } = await import("fs/promises");
    await unlink(filePath);
    await audit("profile_pic.delete", { filename: body.filename });
    return NextResponse.json({ deleted: body.filename });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}