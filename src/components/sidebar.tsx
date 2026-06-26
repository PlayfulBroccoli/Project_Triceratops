"use client";

import { ChevronLeft, ChevronRight, X, Zap } from "lucide-react";
import { NAV_SECTIONS, TABS } from "@/lib/nav";
import type { TabId } from "@/lib/types";

export function Sidebar({
  active,
  onSelect,
  collapsed,
  onToggle,
  mobileOpen,
  onCloseMobile,
}: {
  active: TabId;
  onSelect: (t: TabId) => void;
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const handleSelect = (t: TabId) => {
    onSelect(t);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden" onClick={onCloseMobile} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-card transition-transform duration-200 lg:static lg:translate-x-0 ${
          collapsed ? "lg:w-14" : "lg:w-60"
        } ${mobileOpen ? "translate-x-0 w-72" : "-translate-x-full w-72 lg:translate-x-0"}`}
      >
        {/* Logo */}
        <div className="flex h-14 items-center gap-2.5 border-b px-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground shrink-0">
            <Zap className="h-4 w-4" />
          </div>
          {!collapsed && <span className="font-semibold text-sm">Triceratops</span>}
          <button
            onClick={onCloseMobile}
            className="ml-auto rounded-md p-1 text-muted-foreground hover:bg-muted lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-5 overflow-y-auto p-3">
          {NAV_SECTIONS.map((section) => (
            <div key={section.section}>
              {!collapsed && (
                <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {section.section}
                </p>
              )}
              <div className="space-y-0.5">
                {section.ids.map((id) => {
                  const item = TABS.find((t) => t.id === id)!;
                  const Icon = item.icon;
                  const isActive = active === id;
                  return (
                    <button
                      key={id}
                      onClick={() => handleSelect(id)}
                      title={collapsed ? item.label : undefined}
                      className={`group flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition-colors w-full ${
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      } ${collapsed ? "lg:justify-center" : ""}`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.label}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Collapse toggle — desktop only */}
        <div className="hidden border-t p-2 lg:block">
          <button
            onClick={onToggle}
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            {!collapsed && "Collapse"}
          </button>
        </div>
      </aside>
    </>
  );
}
