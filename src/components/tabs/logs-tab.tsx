"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { useStore } from "@/components/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/field";
import { levelColor } from "@/lib/types";

export function LogsTab() {
  const { data, refresh } = useStore();
  const { log, audit } = data;
  const [logFilter, setLogFilter] = useState("");
  const [logLevel, setLogLevel] = useState("");
  const [auditFilter, setAuditFilter] = useState("");

  const filteredLog = log
    .filter((e) => (logLevel ? e.level === logLevel : true))
    .filter((e) => (logFilter ? e.msg.toLowerCase().includes(logFilter.toLowerCase()) : true))
    .slice(-80)
    .reverse();

  const filteredAudit = audit
    .filter((e) => (auditFilter ? JSON.stringify(e).toLowerCase().includes(auditFilter.toLowerCase()) : true))
    .slice(-80)
    .reverse();

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Bridge Log</CardTitle>
            <RefreshCw size={14} className="text-muted-foreground cursor-pointer hover:text-foreground" onClick={refresh} />
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-3">
              <Input value={logFilter} onChange={setLogFilter} placeholder="Filter..." className="flex-1" />
              <Select value={logLevel} onChange={setLogLevel} className="w-28 text-xs">
                <option value="">All</option>
                <option>INFO</option>
                <option>WARN</option>
                <option>ERROR</option>
              </Select>
            </div>
            <div className="max-h-80 overflow-y-auto rounded-lg border bg-muted/30 p-3 font-mono text-xs">
              {filteredLog.length === 0 ? (
                <p className="text-muted-foreground italic">No log entries.</p>
              ) : (
                filteredLog.map((e, i) => (
                  <div key={i} className="flex gap-2 py-0.5">
                    <span className="text-muted-foreground shrink-0">{e.ts.slice(11, 19)}</span>
                    <span className={`shrink-0 font-semibold ${levelColor(e.level)}`}>{e.level}</span>
                    <span className="break-all">{e.msg.slice(0, 180)}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Audit Log</CardTitle>
            <span className="text-xs text-muted-foreground">{audit.length} entries</span>
          </CardHeader>
          <CardContent>
            <Input value={auditFilter} onChange={setAuditFilter} placeholder="Filter..." className="mb-3" />
            <div className="max-h-80 overflow-y-auto rounded-lg border bg-muted/30 p-3 font-mono text-xs">
              {filteredAudit.length === 0 ? (
                <p className="text-muted-foreground italic">No audit entries.</p>
              ) : (
                filteredAudit.map((e, i) => (
                  <div key={i} className="flex gap-2 py-0.5">
                    <span className="text-muted-foreground shrink-0">{e.ts.slice(11, 19)}</span>
                    <span className="text-primary font-medium shrink-0">{e.action}</span>
                    <span className="text-muted-foreground break-all">
                      {JSON.stringify(
                        Object.fromEntries(Object.entries(e).filter(([k]) => !["ts", "action", "user"].includes(k))),
                      ).slice(0, 120)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
