"use client";

import { useState } from "react";
import { Send, MessageSquare, Plus, X } from "lucide-react";
import { useStore } from "@/components/store";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/field";
import { EmptyState, PageHeader } from "./page-header";

export function MessagesTab() {
  const { data, doApi, api, busy, refresh } = useStore();
  const { toast } = useToast();
  const { cannedReplies } = data;

  const [to, setTo] = useState("");
  const [txt, setTxt] = useState("");
  const [lbl, setLbl] = useState("");
  const [ntext, setNtext] = useState("");

  const send = async () => {
    const r = await api("/project_triceratops/admin/api/send", {
      method: "POST",
      body: JSON.stringify({ to, message: txt }),
    }).catch((e: Error) => {
      toast(e.message, "error");
      return null;
    });
    if (r) {
      toast("Message sent");
      setTxt("");
      refresh();
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Messages" subtitle="Send ad-hoc messages and manage canned replies." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Send size={16} /> Send Message
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input value={to} onChange={setTo} placeholder="60123456789@s.whatsapp.net" />
            <Textarea value={txt} onChange={setTxt} rows={3} placeholder="Message text..." />
            <Button onClick={send} disabled={busy || !to || !txt}>
              <Send size={15} /> Send
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <MessageSquare size={16} /> Canned Replies
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {cannedReplies.replies.length === 0 ? (
              <EmptyState message="No replies yet." />
            ) : (
              <div className="max-h-48 space-y-1.5 overflow-y-auto">
                {cannedReplies.replies.map((r) => (
                  <div key={r.id} className="flex items-start justify-between gap-3 rounded-lg border px-3 py-2 text-sm">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{r.label}</p>
                      <p className="text-xs text-muted-foreground truncate">{r.text.slice(0, 80)}</p>
                    </div>
                    <button
                      onClick={() => doApi("/project_triceratops/admin/api/canned-replies", "POST", { action: "delete", replyId: r.id })}
                      className="text-muted-foreground hover:text-destructive shrink-0"
                      title="Delete"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="border-t pt-3 space-y-2">
              <Input value={lbl} onChange={setLbl} placeholder="Label (e.g. In a meeting)" />
              <Textarea value={ntext} onChange={setNtext} rows={2} placeholder="Reply text..." />
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  doApi("/project_triceratops/admin/api/canned-replies", "POST", { action: "save", reply: { label: lbl, text: ntext } });
                  setLbl("");
                  setNtext("");
                  toast("Reply added");
                }}
              >
                <Plus size={14} /> Add Reply
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
