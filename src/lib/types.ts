export type TabId = "Dashboard" | "Contacts" | "Messages" | "Logs" | "Tools" | "Analytics";

export type Health = { status: string; queueLength: number; uptime: number };
export type AutoReply = { enabled: boolean };
export type ReplyMode = { mode: "off" | "immediate" | "delayed" | "commute"; pending: number };
export type Schedule = {
  currentMode: string;
  toggleInterval: string;
  schedule: {
    work: { start?: string; end?: string };
    lunch: { start?: string; end?: string };
    commuteEnd?: string;
  };
};
export type Override = { mode: string; expires: string; reason?: string; setBy: string; setAt: string } | null;
export type Blocklist = { numbers: string[]; keywords: string[]; updatedAt: string };
export type LogEntry = { ts: string; level: string; msg: string };
export type AuditEntry = { ts: string; action: string; user: string; [k: string]: unknown };
export type Pic = { name: string; path: string; sizeBytes: number; modifiedAt: string };
export type Contacts = { vip: { number: string; note?: string; addedAt: string }[]; blocked: string[]; updatedAt: string };
export type CannedReply = {
  id: string;
  label: string;
  text: string;
  variables?: string[];
  category?: string;
  createdAt: string;
  updatedAt: string;
};
export type CannedRepliesFile = { replies: CannedReply[]; updatedAt: string };
export type AnalyticData = {
  admin: { actions: { action: string; count: number }[]; daily: { date: string; count: number }[]; totalActions: number };
  bridge: { events: { action: string; count: number }[]; daily: { date: string; received: number; sent: number; ignored: number }[] };
};
export type BridgeProc = { name: string; pid: number; pm_id: number; status: string; uptime: number; restarts: number; memory: number; cpu: number };

export const MODES: ReplyMode["mode"][] = ["off", "immediate", "delayed", "commute"];

export const DURATIONS = [
  { label: "15 min", mins: 15 },
  { label: "30 min", mins: 30 },
  { label: "1 hour", mins: 60 },
  { label: "2 hours", mins: 120 },
  { label: "4 hours", mins: 240 },
  { label: "until tomorrow", mins: 1440 },
];

export const fmtUptime = (s: number) => `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
export const fmtMem = (b: number) => `${(b / 1e6).toFixed(1)}MB`;
export const fmtDate = (d: string) => new Date(d).toLocaleString();
export const levelColor = (l: string) =>
  l === "ERROR" ? "text-red-600 dark:text-red-400" : l === "WARN" ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground";
