"use client";

import { useState } from "react";
import { DURATIONS, MODES } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";

export function OverrideForm({ busy, onSet }: { busy: boolean; onSet: (m: string, d: number, r?: string) => void }) {
  const [m, setM] = useState("off");
  const [d, setD] = useState(30);
  const [r, setR] = useState("");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium mb-1.5 block text-muted-foreground">Mode</label>
          <Select value={m} onChange={setM} className="capitalize">
            {MODES.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="text-xs font-medium mb-1.5 block text-muted-foreground">Duration</label>
          <Select value={d} onChange={(v) => setD(Number(v))}>
            {DURATIONS.map((x) => (
              <option key={x.mins} value={x.mins}>
                {x.label}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div>
        <label className="text-xs font-medium mb-1.5 block text-muted-foreground">Reason (optional)</label>
        <Input value={r} onChange={setR} placeholder="in a meeting..." />
      </div>
      <Button onClick={() => onSet(m, d, r || undefined)} disabled={busy} className="w-full sm:w-auto">
        Set Override
      </Button>
    </div>
  );
}
