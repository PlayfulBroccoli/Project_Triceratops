"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type {
  AnalyticData,
  AutoReply,
  Blocklist,
  BridgeProc,
  CannedRepliesFile,
  Contacts,
  Health,
  LogEntry,
  AuditEntry,
  Override,
  Pic,
  ReplyMode,
  Schedule,
} from "@/lib/types";

type Data = {
  health: Health | null;
  autoReply: AutoReply | null;
  replyMode: ReplyMode | null;
  schedule: Schedule | null;
  override: Override;
  blocklist: Blocklist | null;
  log: LogEntry[];
  audit: AuditEntry[];
  pics: Pic[];
  currentPic: string;
  contacts: Contacts;
  cannedReplies: CannedRepliesFile;
  analytics: AnalyticData | null;
  bridgeProcs: BridgeProc[];
  persona: { content: string; path: string };
};

type Ctx = {
  data: Data;
  error: string | null;
  setError: (e: string | null) => void;
  busy: boolean;
  refresh: () => Promise<void>;
  api: <T = unknown>(path: string, init?: RequestInit) => Promise<T>;
  doApi: (path: string, method: string, body?: unknown) => Promise<unknown>;
  refreshing: boolean;
};

const StoreCtx = createContext<Ctx | null>(null);

export function useStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

const emptyData: Data = {
  health: null,
  autoReply: null,
  replyMode: null,
  schedule: null,
  override: null,
  blocklist: null,
  log: [],
  audit: [],
  pics: [],
  currentPic: "",
  contacts: { vip: [], blocked: [], updatedAt: "" },
  cannedReplies: { replies: [], updatedAt: "" },
  analytics: null,
  bridgeProcs: [],
  persona: { content: "", path: "" },
};

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<Data>(emptyData);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const api = useCallback(async <T = unknown,>(path: string, init?: RequestInit): Promise<T> => {
    const res = await fetch(path, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
      credentials: "include",
    });
    if (res.status === 401) throw new Error("Unauthorized");
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`${res.status}: ${t.slice(0, 200)}`);
    }
    return res.json() as Promise<T>;
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      setError(null);
      const r = await Promise.allSettled([
        api<Health>("/project_triceratops/admin/api/health"),
        api<AutoReply>("/project_triceratops/admin/api/auto-reply"),
        api<ReplyMode>("/project_triceratops/admin/api/reply-mode"),
        api<Schedule>("/project_triceratops/admin/api/schedule"),
        api<{ override: Override }>("/project_triceratops/admin/api/override"),
        api<Blocklist>("/project_triceratops/admin/api/blocklist"),
        api<Contacts>("/project_triceratops/admin/api/contacts"),
        api<{ entries: LogEntry[] }>("/project_triceratops/admin/api/log?tail=50"),
        api<{ entries: AuditEntry[] }>("/project_triceratops/admin/api/audit?tail=100"),
        api<{ pics: Pic[]; currentPic: string }>("/project_triceratops/admin/api/pics"),
        api<CannedRepliesFile>("/project_triceratops/admin/api/canned-replies"),
        api<AnalyticData>("/project_triceratops/admin/api/analytics?days=7"),
        api<{ processes: BridgeProc[] }>("/project_triceratops/admin/api/bridge-control"),
      ]);
      setData((prev) => ({
        health: r[0].status === "fulfilled" ? r[0].value : prev.health,
        autoReply: r[1].status === "fulfilled" ? r[1].value : prev.autoReply,
        replyMode: r[2].status === "fulfilled" ? r[2].value : prev.replyMode,
        schedule: r[3].status === "fulfilled" ? r[3].value : prev.schedule,
        override: r[4].status === "fulfilled" ? (r[4].value?.override ?? null) : prev.override,
        blocklist: r[5].status === "fulfilled" ? r[5].value : prev.blocklist,
        contacts: r[6].status === "fulfilled" ? r[6].value : prev.contacts,
        log: r[7].status === "fulfilled" ? r[7].value.entries || [] : prev.log,
        audit: r[8].status === "fulfilled" ? r[8].value.entries || [] : prev.audit,
        pics: r[9].status === "fulfilled" ? r[9].value.pics || [] : prev.pics,
        currentPic: r[9].status === "fulfilled" ? r[9].value.currentPic || "" : prev.currentPic,
        cannedReplies: r[10].status === "fulfilled" ? r[10].value : prev.cannedReplies,
        analytics: r[11].status === "fulfilled" ? r[11].value : prev.analytics,
        bridgeProcs: r[12].status === "fulfilled" ? r[12].value.processes || [] : prev.bridgeProcs,
        persona: prev.persona,
      }));
      api<{ content: string; path: string }>("/project_triceratops/admin/api/persona")
        .then((p) => setData((s) => ({ ...s, persona: p ?? { content: "", path: "" } })))
        .catch(() => {});
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setRefreshing(false);
    }
  }, [api]);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 15000);
    return () => clearInterval(t);
  }, [refresh]);

  const doApi = useCallback(
    async (path: string, method: string, body?: unknown) => {
      setBusy(true);
      setError(null);
      try {
        return await api(path, { method, body: body ? JSON.stringify(body) : undefined });
      } catch (err) {
        setError((err as Error).message);
        return null;
      } finally {
        setBusy(false);
        setTimeout(refresh, 500);
      }
    },
    [api, refresh],
  );

  return (
    <StoreCtx.Provider value={{ data, error, setError, busy, refresh, api, doApi, refreshing }}>
      {children}
    </StoreCtx.Provider>
  );
}
