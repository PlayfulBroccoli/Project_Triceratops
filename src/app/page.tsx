"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Activity, Power, Timer, Shield, CalendarDays, User, Image, Server, Zap,
  Send, MessageSquare, ScrollText, BarChart3, Users, Wrench, RefreshCw,
  Plus, X, Trash2, ArrowUpRight,
} from "lucide-react";
import Sidebar from "@/components/sidebar";

/* ─── Types ─── */
type TabId = "Dashboard" | "Contacts" | "Messages" | "Logs" | "Tools" | "Analytics";
type Health = { status: string; queueLength: number; uptime: number };
type AutoReply = { enabled: boolean };
type ReplyMode = { mode: "off" | "immediate" | "delayed" | "commute"; pending: number };
type Schedule = { currentMode: string; toggleInterval: string; schedule: { work: { start?: string; end?: string }; lunch: { start?: string; end?: string }; commuteEnd?: string } };
type Override = { mode: string; expires: string; reason?: string; setBy: string; setAt: string } | null;
type Blocklist = { numbers: string[]; keywords: string[]; updatedAt: string };
type LogEntry = { ts: string; level: string; msg: string };
type AuditEntry = { ts: string; action: string; user: string;[k: string]: unknown };
type Pic = { name: string; path: string; sizeBytes: number; modifiedAt: string };
type Contacts = { vip: { number: string; note?: string; addedAt: string }[]; blocked: string[]; updatedAt: string };
type CannedReply = { id: string; label: string; text: string; variables?: string[]; category?: string; createdAt: string; updatedAt: string };
type CannedRepliesFile = { replies: CannedReply[]; updatedAt: string };
type AnalyticData = { admin: { actions: { action: string; count: number }[]; daily: { date: string; count: number }[]; totalActions: number }; bridge: { events: { action: string; count: number }[]; daily: { date: string; received: number; sent: number; ignored: number }[] } };
type BridgeProc = { name: string; pid: number; pm_id: number; status: string; uptime: number; restarts: number; memory: number; cpu: number };

const MODES: ReplyMode["mode"][] = ["off", "immediate", "delayed", "commute"];
const DURATIONS = [
  { label: "15 min", mins: 15 }, { label: "30 min", mins: 30 }, { label: "1 hour", mins: 60 },
  { label: "2 hours", mins: 120 }, { label: "4 hours", mins: 240 }, { label: "until tomorrow", mins: 1440 },
];

export default function AdminPage() {
  const [tab, setTab] = useState<TabId>("Dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [health, setHealth] = useState<Health | null>(null);
  const [autoReply, setAutoReply] = useState<AutoReply | null>(null);
  const [replyMode, setReplyMode] = useState<ReplyMode | null>(null);
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [override, setOverride] = useState<Override>(null);
  const [blocklist, setBlocklist] = useState<Blocklist | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [logFilter, setLogFilter] = useState(""); const [logLevel, setLogLevel] = useState("");
  const [audit, setAudit] = useState<AuditEntry[]>([]); const [auditFilter, setAuditFilter] = useState("");
  const [pics, setPics] = useState<Pic[]>([]); const [currentPic, setCurrentPic] = useState("");
  const [contacts, setContacts] = useState<Contacts>({ vip: [], blocked: [], updatedAt: "" });
  const [cannedReplies, setCannedReplies] = useState<CannedRepliesFile>({ replies: [], updatedAt: "" });
  const [analytics, setAnalytics] = useState<AnalyticData | null>(null);
  const [bridgeProcs, setBridgeProcs] = useState<BridgeProc[]>([]);
  const [persona, setPersona] = useState<{ content: string; path: string }>({ content: "", path: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");

  const api = useCallback(async (path: string, init?: RequestInit) => {
    const res = await fetch(path, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers || {}) }, credentials: "include" });
    if (res.status === 401) throw new Error("Unauthorized");
    if (!res.ok) { const t = await res.text(); throw new Error(`${res.status}: ${t.slice(0, 200)}`); }
    return res.json();
  }, []);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const r = await Promise.allSettled([
        api("/project_triceratops/admin/api/health"), api("/project_triceratops/admin/api/auto-reply"),
        api("/project_triceratops/admin/api/reply-mode"), api("/project_triceratops/admin/api/schedule"),
        api("/project_triceratops/admin/api/override"), api("/project_triceratops/admin/api/blocklist"),
        api("/project_triceratops/admin/api/contacts"), api("/project_triceratops/admin/api/log?tail=50"),
        api("/project_triceratops/admin/api/audit?tail=100"), api("/project_triceratops/admin/api/pics"),
        api("/project_triceratops/admin/api/canned-replies"), api("/project_triceratops/admin/api/analytics?days=7"),
        api("/project_triceratops/admin/api/bridge-control"),
      ]);
      if (r[0].status === "fulfilled") setHealth(r[0].value);
      if (r[1].status === "fulfilled") setAutoReply(r[1].value);
      if (r[2].status === "fulfilled") setReplyMode(r[2].value);
      if (r[3].status === "fulfilled") setSchedule(r[3].value);
      if (r[4].status === "fulfilled") setOverride(r[4].value?.override ?? null);
      if (r[5].status === "fulfilled") setBlocklist(r[5].value);
      if (r[6].status === "fulfilled") setContacts(r[6].value);
      if (r[7].status === "fulfilled") setLog(r[7].value.entries || []);
      if (r[8].status === "fulfilled") setAudit(r[8].value.entries || []);
      if (r[9].status === "fulfilled") { setPics(r[9].value.pics || []); setCurrentPic(r[9].value.currentPic || ""); }
      if (r[10].status === "fulfilled") setCannedReplies(r[10].value);
      if (r[11].status === "fulfilled") setAnalytics(r[11].value);
      if (r[12].status === "fulfilled") setBridgeProcs(r[12].value.processes || []);
      api("/project_triceratops/admin/api/persona").then(p => setPersona(p || { content: "", path: "" })).catch(() => {});
    } catch (err) { setError((err as Error).message); }
  }, [api]);

  useEffect(() => { refresh(); const t = setInterval(refresh, 15000); return () => clearInterval(t); }, [refresh]);

  const doApi = async (path: string, method: string, body?: unknown) => {
    setBusy(true); setError(null);
    try { return await api(path, { method, body: body ? JSON.stringify(body) : undefined }); }
    catch (err) { setError((err as Error).message); return null; }
    finally { setBusy(false); setTimeout(refresh, 500); }
  };

  /* ─── Helpers ─── */
  const fmtUptime = (s: number) => `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
  const fmtMem = (b: number) => `${(b / 1e6).toFixed(1)}MB`;
  const fmtDate = (d: string) => new Date(d).toLocaleString();
  const levelColor = (l: string) => l === "ERROR" ? "text-red-600" : l === "WARN" ? "text-amber-600" : "text-muted-foreground";

  /* ─── Component shorthands ─── */
  const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`}>{children}</div>
  );
  const CardHeader = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>{children}</div>;
  const CardTitle = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => <div className={`font-semibold leading-none tracking-tight ${className}`}>{children}</div>;
  const CardContent = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => <div className={`p-6 pt-0 ${className}`}>{children}</div>;
  const StatCard = ({ title, value, sub, icon: Icon }: { title: string; value: string | number; sub?: string; icon: React.ComponentType<{ size?: number; className?: string }> }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle><Icon size={16} className="text-muted-foreground" /></CardHeader>
      <CardContent><div className="text-2xl font-bold">{value}</div>{sub && <p className="text-xs text-muted-foreground">{sub}</p>}</CardContent>
    </Card>
  );
  const Badge = ({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "success" | "destructive" | "warning" }) => {
    const colors = { default: "bg-secondary text-secondary-foreground", success: "bg-emerald-100 text-emerald-700", destructive: "bg-red-100 text-red-700", warning: "bg-amber-100 text-amber-700" };
    return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors[variant]}`}>{children}</span>;
  };
  const Btn = ({ children, variant = "default", size = "default", onClick, disabled, className = "" }: {
    children: React.ReactNode; variant?: "default" | "outline" | "ghost" | "destructive"; size?: "default" | "sm" | "icon"; onClick?: () => void; disabled?: boolean; className?: string;
  }) => {
    const base = "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";
    const vars = {
      default: "bg-primary text-primary-foreground hover:bg-primary/90",
      outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
      ghost: "hover:bg-accent hover:text-accent-foreground",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    };
    const sizes = { default: "h-9 px-4 py-2", sm: "h-8 px-3 text-xs", icon: "h-9 w-9" };
    return <button onClick={onClick} disabled={disabled} className={`${base} ${vars[variant]} ${sizes[size]} ${className}`}>{children}</button>;
  };
  const Input = ({ value, onChange, placeholder, className = "" }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) => (
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={`flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${className}`} />
  );
  const Textarea = ({ value, onChange, rows = 3, placeholder }: { value: string; onChange: (v: string) => void; rows?: number; placeholder?: string }) => (
    <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows} placeholder={placeholder} className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
  );

  /* ─── Dashboard ─── */
  const DashboardTab = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">WhatsApp auto-reply control center. Auto-refreshes every 15s.</p>
      </div>
      {override && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-amber-800">Manual Override Active</p>
              <p className="text-sm text-amber-700">Mode: <b className="capitalize">{override.mode}</b> · Expires: {fmtDate(override.expires)} · {override.reason}</p>
            </div>
            <Btn variant="outline" size="sm" onClick={() => doApi("/project_triceratops/admin/api/override", "POST", { mode: "clear", durationMinutes: 0 })}>Clear</Btn>
          </div>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Bridge Status" value={health?.status ?? "..."} sub={`Queue: ${health?.queueLength ?? 0}`} icon={Activity} />
        <StatCard title="Auto-Reply" value={autoReply?.enabled ? "ON" : "OFF"} sub={autoReply?.enabled ? "Reply mode: " + (replyMode?.mode ?? "") : "Disabled"} icon={Power} />
        <StatCard title="Reply Mode" value={replyMode?.mode ?? "..."} sub={`${replyMode?.pending ?? 0} pending`} icon={Timer} />
        <StatCard title="Uptime" value={health?.uptime ? fmtUptime(health.uptime) : "..."} sub={schedule?.currentMode ?? ""} icon={Shield} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Auto-Reply Control</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Master Switch</span>
              <button onClick={() => doApi("/project_triceratops/admin/api/auto-reply", "POST", { enabled: !autoReply?.enabled })} disabled={busy}
                className={`relative h-7 w-12 rounded-full transition ${autoReply?.enabled ? "bg-primary" : "bg-input"} ${busy ? "opacity-50" : ""}`}>
                <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${autoReply?.enabled ? "left-6" : "left-0.5"}`} />
              </button>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Reply Mode</p>
              <div className="grid grid-cols-2 gap-2">
                {MODES.map(m => (
                  <Btn key={m} variant={replyMode?.mode === m ? "default" : "outline"} size="sm" onClick={() => doApi("/project_triceratops/admin/api/reply-mode", "POST", { mode: m })} className="capitalize">{m}</Btn>
                ))}
              </div>
            </div>
            <div className="border-t pt-4">
              <p className="text-sm font-medium mb-2">Smart Schedule</p>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div className="flex justify-between"><span>Work hours</span><span>{schedule?.schedule.work.start} – {schedule?.schedule.work.end}</span></div>
                <div className="flex justify-between"><span>Lunch</span><span>{schedule?.schedule.lunch.start} – {schedule?.schedule.lunch.end}</span></div>
                <div className="flex justify-between"><span>Commute ends</span><span>{schedule?.schedule.commuteEnd}</span></div>
                <div className="flex justify-between"><span>Toggle interval</span><span>{schedule?.toggleInterval}</span></div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Manual Override</CardTitle></CardHeader>
          <CardContent>
            {override ? (
              <div className="space-y-2">
                <p className="text-sm">Override is active. Clear it above or wait for expiry.</p>
              </div>
            ) : (
              <OverrideForm busy={busy} onSet={(m, d, r) => doApi("/project_triceratops/admin/api/override", "POST", { mode: m, durationMinutes: d, reason: r })} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  /* ─── Override Form ─── */
  const OverrideForm = ({ busy, onSet }: { busy: boolean; onSet: (m: string, d: number, r?: string) => void }) => {
    const [m, setM] = useState("off"); const [d, setD] = useState(30); const [r, setR] = useState("");
    return <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-xs font-medium mb-1 block">Mode</label><select value={m} onChange={e => setM(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">{MODES.map(x => <option key={x} value={x}>{x}</option>)}</select></div>
        <div><label className="text-xs font-medium mb-1 block">Duration</label><select value={d} onChange={e => setD(Number(e.target.value))} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">{DURATIONS.map(x => <option key={x.mins} value={x.mins}>{x.label}</option>)}</select></div>
      </div>
      <div><label className="text-xs font-medium mb-1 block">Reason (optional)</label><Input value={r} onChange={setR} placeholder="in a meeting..." /></div>
      <Btn onClick={() => onSet(m, d, r || undefined)} disabled={busy}>Set Override</Btn>
    </div>;
  };

  /* ─── Contacts ─── */
  const ContactsTab = () => {
    const [nt, setNt] = useState(""); const [kt, setKt] = useState(""); const [vt, setVt] = useState("");
    useEffect(() => { if (blocklist) { setNt(blocklist.numbers.join("\n")); setKt(blocklist.keywords.join("\n")); } if (contacts) setVt(contacts.vip.map(v => v.note ? `${v.number}  # ${v.note}` : v.number).join("\n")); }, [blocklist, contacts]);
    return (
      <div className="space-y-6">
        <div><h1 className="text-3xl font-bold tracking-tight">Contacts</h1><p className="mt-1 text-sm text-muted-foreground">Blocklist and VIP contacts.</p></div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Card><CardHeader><CardTitle className="text-sm">Blocked Numbers</CardTitle></CardHeader><CardContent><Textarea value={nt} onChange={setNt} rows={8} placeholder="60123456789" /></CardContent></Card>
          <Card><CardHeader><CardTitle className="text-sm">Blocked Keywords</CardTitle></CardHeader><CardContent><Textarea value={kt} onChange={setKt} rows={8} placeholder="lottery" /></CardContent></Card>
          <Card><CardHeader><CardTitle className="text-sm">VIP (always reply)</CardTitle></CardHeader><CardContent><Textarea value={vt} onChange={setVt} rows={8} placeholder="60187680113  # Nick" /></CardContent></Card>
        </div>
        <Btn onClick={() => { doApi("/project_triceratops/admin/api/blocklist", "POST", { numbers: nt.split("\n").map(s => s.trim()).filter(Boolean), keywords: kt.split("\n").map(s => s.trim()).filter(Boolean) }); doApi("/project_triceratops/admin/api/contacts", "POST", { vip: vt.split("\n").filter(Boolean).map(s => { const [n, ...rest] = s.trim().split(/\s+#\s+/); return { number: n, note: rest.join(" # ") || undefined }; }), blocked: nt.split("\n").map(s => s.trim()).filter(Boolean) }); }} disabled={busy}>Save All</Btn>
      </div>
    );
  };

  /* ─── Messages ─── */
  const MessagesTab = () => {
    const [to, setTo] = useState(""); const [txt, setTxt] = useState(""); const [lbl, setLbl] = useState(""); const [ntext, setNtext] = useState("");
    return (
      <div className="space-y-6">
        <div><h1 className="text-3xl font-bold tracking-tight">Messages</h1><p className="mt-1 text-sm text-muted-foreground">Send ad-hoc messages and manage canned replies.</p></div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Send size={16} /> Send Message</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Input value={to} onChange={setTo} placeholder="60123456789@s.whatsapp.net" />
              <Textarea value={txt} onChange={setTxt} rows={3} placeholder="Message text..." />
              <Btn onClick={async () => { const r = await api("/project_triceratops/admin/api/send", { method: "POST", body: JSON.stringify({ to, message: txt }) }).catch(e => { setError(e.message); return null; }); if (r) { setToast("Sent!"); setTxt(""); refresh(); } }} disabled={busy}>Send</Btn>
              {toast && <p className="text-xs text-emerald-600">{toast}</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><MessageSquare size={16} /> Canned Replies</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {cannedReplies.replies.length === 0 ? <p className="text-sm text-muted-foreground">No replies yet.</p> : (
                <div className="max-h-48 space-y-1 overflow-y-auto">
                  {cannedReplies.replies.map(r => (
                    <div key={r.id} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
                      <div><p className="font-medium">{r.label}</p><p className="text-xs text-muted-foreground">{r.text.slice(0, 80)}</p></div>
                      <button onClick={() => doApi("/project_triceratops/admin/api/canned-replies", "POST", { action: "delete", replyId: r.id })} className="text-muted-foreground hover:text-destructive"><X size={14} /></button>
                    </div>
                  ))}
                </div>
              )}
              <div className="border-t pt-3 space-y-2">
                <Input value={lbl} onChange={setLbl} placeholder="Label (e.g. In a meeting)" />
                <Textarea value={ntext} onChange={setNtext} rows={2} placeholder="Reply text..." />
                <Btn size="sm" variant="outline" onClick={() => { doApi("/project_triceratops/admin/api/canned-replies", "POST", { action: "save", reply: { label: lbl, text: ntext } }); setLbl(""); setNtext(""); }}><Plus size={14} /> Add Reply</Btn>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  /* ─── Logs ─── */
  const LogsTab = () => (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold tracking-tight">Logs</h1><p className="mt-1 text-sm text-muted-foreground">Bridge events and admin audit trail.</p></div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-sm">Bridge Log</CardTitle><RefreshCw size={14} className="text-muted-foreground cursor-pointer" onClick={refresh} /></CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-3"><Input value={logFilter} onChange={setLogFilter} placeholder="Filter..." className="flex-1" />
              <select value={logLevel} onChange={e => setLogLevel(e.target.value)} className="h-9 rounded-md border border-input bg-transparent px-2 text-xs"><option value="">All</option><option>INFO</option><option>WARN</option><option>ERROR</option></select></div>
            <div className="max-h-80 overflow-y-auto rounded border bg-muted/30 p-2 font-mono text-xs">
              {log.filter(e => logLevel ? e.level === logLevel : true).filter(e => logFilter ? e.msg.toLowerCase().includes(logFilter.toLowerCase()) : true).slice(-80).reverse().map((e, i) => (
                <div key={i} className="flex gap-2 py-0.5"><span className="text-muted-foreground">{e.ts.slice(11, 19)}</span><span className={levelColor(e.level)}>{e.level}</span><span>{e.msg.slice(0, 180)}</span></div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-sm">Audit Log</CardTitle><span className="text-xs text-muted-foreground">{audit.length} entries</span></CardHeader>
          <CardContent>
            <Input value={auditFilter} onChange={setAuditFilter} placeholder="Filter..." className="mb-3" />
            <div className="max-h-80 overflow-y-auto rounded border bg-muted/30 p-2 font-mono text-xs">
              {audit.filter(e => auditFilter ? JSON.stringify(e).toLowerCase().includes(auditFilter.toLowerCase()) : true).slice(-80).reverse().map((e, i) => (
                <div key={i} className="flex gap-2 py-0.5"><span className="text-muted-foreground">{e.ts.slice(11, 19)}</span><span className="text-primary font-medium">{e.action}</span><span className="text-muted-foreground">{JSON.stringify(Object.fromEntries(Object.entries(e).filter(([k]) => !["ts", "action", "user"].includes(k)))).slice(0, 120)}</span></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  /* ─── Tools ─── */
  const ToolsTab = () => (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold tracking-tight">Tools</h1><p className="mt-1 text-sm text-muted-foreground">Profile pics, PM2 control, and persona preview.</p></div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-sm">Profile Pictures</CardTitle><label className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-3 py-1 text-xs font-medium hover:bg-accent cursor-pointer"><UploadIcon /> Upload<input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={async e => { const f = e.target.files?.[0]; if (!f) return; const fd = new FormData(); fd.append("file", f); fd.append("name", f.name); await fetch("/project_triceratops/admin/api/pics", { method: "POST", body: fd, credentials: "include" }); refresh(); }} /></label></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              {pics.map(p => (
                <div key={p.name} className={`rounded border p-2 text-center text-xs ${p.name === currentPic ? "border-primary bg-primary/5" : ""}`}>
                  <p className="font-medium">{p.name}</p><p className="text-muted-foreground">{Math.round(p.sizeBytes / 1024)}KB</p>
                  <div className="mt-1 flex gap-1 justify-center">
                    <button onClick={() => doApi("/project_triceratops/admin/api/pics", "PUT", { filename: p.name })} className="text-primary text-xs hover:underline">set</button>
                    <button onClick={() => doApi("/project_triceratops/admin/api/pics", "DELETE", { filename: p.name })} className="text-destructive text-xs hover:underline">del</button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">PM2 Process Control</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {bridgeProcs.map(p => (
              <div key={p.name} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
                <div><p className="font-medium">{p.name}</p><p className="text-xs text-muted-foreground">PID {p.pid} · {fmtMem(p.memory)} · restarts {p.restarts}</p></div>
                <div className="flex items-center gap-2">
                  <Badge variant={p.status === "online" ? "success" : "destructive"}>{p.status}</Badge>
                  <Btn variant="outline" size="sm" onClick={() => doApi("/project_triceratops/admin/api/bridge-control", "POST", { action: "restart", name: p.name })}>Restart</Btn>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-sm">Persona Preview</CardTitle></CardHeader>
        <CardContent><pre className="max-h-60 overflow-y-auto rounded border bg-muted/30 p-4 text-xs whitespace-pre-wrap">{persona.content || "Loading..."}</pre></CardContent>
      </Card>
    </div>
  );

  /* ─── Analytics ─── */
  const AnalyticsTab = () => (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold tracking-tight">Analytics</h1><p className="mt-1 text-sm text-muted-foreground">7-day activity summary for admin and bridge.</p></div>
      {!analytics ? <p className="text-muted-foreground">Loading...</p> : (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-sm">Admin Actions</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics.admin.actions.map(a => <div key={a.action} className="flex justify-between text-sm"><span>{a.action}</span><Badge>{a.count}</Badge></div>)}
                </div>
                <p className="mt-3 text-xs text-muted-foreground">{analytics.admin.totalActions} total entries</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Bridge Events</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics.bridge.events.map(e => <div key={e.action} className="flex justify-between text-sm"><span>{e.action}</span><Badge>{e.count}</Badge></div>)}
                </div>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader><CardTitle className="text-sm">Daily Breakdown</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b text-left text-muted-foreground">{["Date", "Admin", "Received", "Sent", "Ignored"].map(h => <th key={h} className="px-3 py-2 font-medium">{h}</th>)}</tr></thead>
                  <tbody>
                    {analytics.bridge.daily.map(d => { const adm = analytics.admin.daily.find(a => a.date === d.date); return (
                      <tr key={d.date} className="border-b"><td className="px-3 py-2">{d.date}</td><td className="px-3 py-2">{adm?.count || 0}</td><td className="px-3 py-2">{d.received}</td><td className="px-3 py-2">{d.sent}</td><td className="px-3 py-2">{d.ignored}</td></tr>
                    ); })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );

  return (
    <div className="flex min-h-screen">
      <Sidebar active={tab} onSelect={setTab} collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <main className="flex-1 overflow-auto">
        <div className="p-6 lg:p-8 max-w-6xl">
          {error && <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm text-destructive">{error} <button onClick={() => setError(null)} className="ml-2 underline">dismiss</button></div>}
          {tab === "Dashboard" && <DashboardTab />}
          {tab === "Contacts" && <ContactsTab />}
          {tab === "Messages" && <MessagesTab />}
          {tab === "Logs" && <LogsTab />}
          {tab === "Tools" && <ToolsTab />}
          {tab === "Analytics" && <AnalyticsTab />}
        </div>
      </main>
    </div>
  );
}

function UploadIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>;
}