"use client";

import { Menu, RefreshCw, Zap, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { TABS } from "@/lib/nav";
import type { Health } from "@/lib/types";

export function Header({
  active,
  onMenu,
  onRefresh,
  refreshing,
  health,
  error,
}: {
  active: string;
  onMenu: () => void;
  onRefresh: () => void;
  refreshing: boolean;
  health: Health | null;
  error: string | null;
}) {
  const tab = TABS.find((t) => t.id === active);
  const online = health?.status === "ok" || health?.status === "online";

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur lg:px-6">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenu} title="Open menu">
        <Menu size={18} />
      </Button>

      <div className="flex items-center gap-2 lg:gap-3 min-w-0">
        <Zap className="h-5 w-5 text-primary shrink-0 lg:hidden" />
        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold leading-tight sm:text-lg">{tab?.label ?? "Admin"}</h1>
          <p className="hidden truncate text-xs text-muted-foreground sm:block">{tab?.desc}</p>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {error && (
          <span className="hidden items-center gap-1.5 rounded-md border border-destructive/50 bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive sm:inline-flex">
            <AlertCircle size={13} /> Error
          </span>
        )}
        <span
          className={`hidden items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium sm:inline-flex ${
            online
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
              : "bg-muted text-muted-foreground"
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${online ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/50"}`} />
          {online ? "Online" : "Offline"}
        </span>
        <Button variant="outline" size="icon" onClick={onRefresh} disabled={refreshing} title="Refresh now">
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
        </Button>
        <ThemeToggle />
      </div>
    </header>
  );
}
