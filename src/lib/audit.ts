import "server-only";

import { appendFile, mkdir } from "fs/promises";
import path from "path";

const AUDIT_PATH = path.join(
  process.env.HOME || "/home/nick",
  ".hermes/whatsapp/audit.log",
);

/**
 * Append an entry to the admin audit log.
 * Called from every mutating admin API route.
 *
 * Format: ISO timestamp | action | details JSON
 */
export async function audit(
  action: string,
  details: Record<string, unknown> = {},
): Promise<void> {
  const entry = {
    ts: new Date().toISOString(),
    action,
    user: process.env.TRICERATOPS_ADMIN_USER || "admin",
    ...details,
  };
  try {
    await mkdir(path.dirname(AUDIT_PATH), { recursive: true });
    await appendFile(AUDIT_PATH, JSON.stringify(entry) + "\n", "utf8");
  } catch {
    // Audit failure should not block the action
  }
}

export const AUDIT_LOG_PATH = AUDIT_PATH;