"use client";

import { Activity, Power, Timer, Shield } from "lucide-react";
import { useStore } from "@/components/store";
import { useToast } from "@/components/ui/toast";
import { Badge, StatCard } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "./page-header";
import { OverrideForm } from "./override-form";
import { MODES, fmtDate, fmtUptime } from "@/lib/types";

export function DashboardTab() {
  const { data, doApi, busy } = useStore();
  const { toast } = useToast();
  const { health, autoReply, replyMode, schedule, override } = data;

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" subtitle="WhatsApp auto-reply control center. Auto-refreshes every 15s." />

      {override && (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-300/60 bg-amber-50 p-4 dark:border-amber-500/40 dark:bg-amber-500/10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-amber-800 dark:text-amber-300">Manual Override Active</p>
            <p className="mt-0.5 text-sm text-amber-700 dark:text-amber-400/90">
              Mode: <b className="capitalize">{override.mode}</b> · Expires: {fmtDate(override.expires)}
              {override.reason && ` · ${override.reason}`}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-amber-400 text-amber-800 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-500/20"
            onClick={() =>
              doApi("/project_triceratops/admin/api/override", "POST", { mode: "clear", durationMinutes: 0 })
            }
          >
            Clear
          </Button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Bridge Status" value={health?.status ?? "—"} sub={`Queue: ${health?.queueLength ?? 0}`} icon={Activity} />
        <StatCard
          title="Auto-Reply"
          value={autoReply?.enabled ? "ON" : "OFF"}
          sub={autoReply?.enabled ? "Mode: " + (replyMode?.mode ?? "") : "Disabled"}
          icon={Power}
        />
        <StatCard title="Reply Mode" value={replyMode?.mode ?? "—"} sub={`${replyMode?.pending ?? 0} pending`} icon={Timer} />
        <StatCard title="Uptime" value={health?.uptime ? fmtUptime(health.uptime) : "—"} sub={schedule?.currentMode ?? ""} icon={Shield} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Auto-Reply Control</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium">Master Switch</span>
                <p className="text-xs text-muted-foreground">{autoReply?.enabled ? "Auto-reply is enabled" : "Auto-reply is off"}</p>
              </div>
              <button
                onClick={() => doApi("/project_triceratops/admin/api/auto-reply", "POST", { enabled: !autoReply?.enabled })}
                disabled={busy}
                aria-label="Toggle auto-reply"
                className={`relative h-7 w-12 rounded-full transition-colors ${autoReply?.enabled ? "bg-primary" : "bg-input"} ${busy ? "opacity-50" : ""}`}
              >
                <span
                  className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                    autoReply?.enabled ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Reply Mode</p>
              <div className="grid grid-cols-2 gap-2">
                {MODES.map((m) => (
                  <Button
                    key={m}
                    variant={replyMode?.mode === m ? "default" : "outline"}
                    size="sm"
                    className="capitalize"
                    onClick={() => doApi("/project_triceratops/admin/api/reply-mode", "POST", { mode: m })}
                  >
                    {m}
                  </Button>
                ))}
              </div>
            </div>

            {schedule && (
              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-2.5">Smart Schedule</p>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Work hours</span>
                    <span className="font-medium">{schedule.schedule.work.start} – {schedule.schedule.work.end}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Lunch</span>
                    <span className="font-medium">{schedule.schedule.lunch.start} – {schedule.schedule.lunch.end}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Commute ends</span>
                    <span className="font-medium">{schedule.schedule.commuteEnd}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Toggle interval</span>
                    <span className="font-medium">{schedule.toggleInterval}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Manual Override
              {override && <Badge variant="warning">active</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {override ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Override is active. Clear it above or wait for expiry.</p>
                <dl className="grid grid-cols-2 gap-y-2 text-sm">
                  <dt className="text-muted-foreground">Set by</dt>
                  <dd className="font-medium">{override.setBy}</dd>
                  <dt className="text-muted-foreground">Set at</dt>
                  <dd className="font-medium">{fmtDate(override.setAt)}</dd>
                </dl>
              </div>
            ) : (
              <OverrideForm
                busy={busy}
                onSet={(m, d, r) => {
                  doApi("/project_triceratops/admin/api/override", "POST", { mode: m, durationMinutes: d, reason: r });
                  toast("Override set");
                }}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
