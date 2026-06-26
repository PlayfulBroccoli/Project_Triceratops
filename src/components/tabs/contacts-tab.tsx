"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { useStore } from "@/components/store";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/field";
import { PageHeader } from "./page-header";

export function ContactsTab() {
  const { data, doApi, busy } = useStore();
  const { toast } = useToast();
  const { blocklist, contacts } = data;

  const [nt, setNt] = useState("");
  const [kt, setKt] = useState("");
  const [vt, setVt] = useState("");

  useEffect(() => {
    if (blocklist) {
      setNt(blocklist.numbers.join("\n"));
      setKt(blocklist.keywords.join("\n"));
    }
    if (contacts) {
      setVt(contacts.vip.map((v) => (v.note ? `${v.number}  # ${v.note}` : v.number)).join("\n"));
    }
  }, [blocklist, contacts]);

  const save = () => {
    const numbers = nt.split("\n").map((s) => s.trim()).filter(Boolean);
    const keywords = kt.split("\n").map((s) => s.trim()).filter(Boolean);
    const vip = vt
      .split("\n")
      .filter(Boolean)
      .map((s) => {
        const [n, ...rest] = s.trim().split(/\s+#\s+/);
        return { number: n, note: rest.join(" # ") || undefined };
      });
    doApi("/project_triceratops/admin/api/blocklist", "POST", { numbers, keywords });
    doApi("/project_triceratops/admin/api/contacts", "POST", { vip, blocked: numbers });
    toast("Contacts saved");
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Contacts" subtitle="Blocklist and VIP contacts." />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Blocked Numbers</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea value={nt} onChange={setNt} rows={8} placeholder="60123456789" className="font-mono" />
            <p className="mt-2 text-xs text-muted-foreground">One number per line.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Blocked Keywords</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea value={kt} onChange={setKt} rows={8} placeholder="lottery" className="font-mono" />
            <p className="mt-2 text-xs text-muted-foreground">One keyword per line.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">VIP (always reply)</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea value={vt} onChange={setVt} rows={8} placeholder="60187680113  # Nick" className="font-mono" />
            <p className="mt-2 text-xs text-muted-foreground">Format: number # note</p>
          </CardContent>
        </Card>
      </div>
      <Button onClick={save} disabled={busy}>
        <Save size={16} /> Save All
      </Button>
    </div>
  );
}
