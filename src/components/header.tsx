"use client";

import { Menu, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { TABS } from "@/lib/nav";
import type { Health } from "@/lib/types";
import type { TabId } from "@/lib/types";

export function Header({
  active,
  onMenu,
  onRefresh,
  refreshing,
  health,
  error,
}: {
  active: TabId;
  onMenu: () => void;
  onRefresh: () => void;
  refreshing: boolean;
  health: Health | null;
  error: string | null;
}) {
  const online = health?.status === "ok" || health?.status === "online";
  const tab = TABS.find((t) => t.id === active);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-end gap-3 bg-background/80 px-4 pb-3 backdrop-blur sm:px-6 lg:px-8">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenu} title="Open menu">
        <Menu size={18} />
      </Button>

      <div className="flex items-baseline gap-2 min-w-0">
        <h1 className="truncate text-xl font-semibold leading-tight sm:text-2xl">{tab?.label ?? "Admin"}</h1>
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
