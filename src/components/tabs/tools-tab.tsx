"use client";

import { Upload } from "lucide-react";
import { useStore } from "@/components/store";
import { useToast } from "@/components/ui/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, PageHeader } from "./page-header";
import { fmtMem } from "@/lib/types";

export function ToolsTab() {
  const { data, doApi, refresh } = useStore();
  const { toast } = useToast();
  const { pics, currentPic, bridgeProcs, persona } = data;

  return (
    <div className="space-y-6">
      <PageHeader title="Tools" subtitle="Profile pics, PM2 control, and persona preview." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Profile Pictures</CardTitle>
            <label className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent cursor-pointer">
              <Upload size={13} /> Upload
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const fd = new FormData();
                  fd.append("file", f);
                  fd.append("name", f.name);
                  await fetch("/project_triceratops/admin/api/pics", { method: "POST", body: fd, credentials: "include" });
                  toast("Uploaded");
                  refresh();
                }}
              />
            </label>
          </CardHeader>
          <CardContent>
            {pics.length === 0 ? (
              <EmptyState message="No profile pictures uploaded." />
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {pics.map((p) => (
                  <div
                    key={p.name}
                    className={`rounded-lg border p-3 text-center text-xs ${
                      p.name === currentPic ? "border-primary bg-primary/5 ring-1 ring-primary/30" : ""
                    }`}
                  >
                    <p className="font-medium truncate">{p.name}</p>
                    <p className="text-muted-foreground">{Math.round(p.sizeBytes / 1024)}KB</p>
                    {p.name === currentPic && (
                      <Badge variant="info" className="mt-1">
                        current
                      </Badge>
                    )}
                    <div className="mt-2 flex gap-2 justify-center">
                      <button
                        onClick={() => doApi("/project_triceratops/admin/api/pics", "PUT", { filename: p.name })}
                        className="text-primary hover:underline"
                      >
                        set
                      </button>
                      <button
                        onClick={() => doApi("/project_triceratops/admin/api/pics", "DELETE", { filename: p.name })}
                        className="text-destructive hover:underline"
                      >
                        del
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">PM2 Process Control</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {bridgeProcs.length === 0 ? (
              <EmptyState message="No processes found." />
            ) : (
              bridgeProcs.map((p) => (
                <div key={p.name} className="flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      PID {p.pid} · {fmtMem(p.memory)} · restarts {p.restarts}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={p.status === "online" ? "success" : "destructive"}>{p.status}</Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        doApi("/project_triceratops/admin/api/bridge-control", "POST", { action: "restart", name: p.name });
                        toast("Restarting " + p.name);
                      }}
                    >
                      Restart
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Persona Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="max-h-60 overflow-y-auto rounded-lg border bg-muted/30 p-4 text-xs whitespace-pre-wrap">
            {persona.content || "Loading..."}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
