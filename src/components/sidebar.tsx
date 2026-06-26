"use client";

import {
  LayoutDashboard, Users, MessageSquare, ScrollText, Wrench, BarChart3,
  ChevronLeft, ChevronRight, Zap,
} from "lucide-react";

type TabId = "Dashboard" | "Contacts" | "Messages" | "Logs" | "Tools" | "Analytics";

const NAV: { section: string; items: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] }[] = [
  {
    section: "Overview",
    items: [
      { id: "Dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    section: "WhatsApp",
    items: [
      { id: "Contacts", label: "Contacts", icon: Users },
      { id: "Messages", label: "Messages", icon: MessageSquare },
    ],
  },
  {
    section: "System",
    items: [
      { id: "Logs", label: "Logs", icon: ScrollText },
      { id: "Tools", label: "Tools", icon: Wrench },
      { id: "Analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
];

export default function Sidebar({
  active, onSelect, collapsed, onToggle,
}: {
  active: TabId;
  onSelect: (t: TabId) => void;
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <aside
      className={`flex flex-col border-r bg-card transition-all duration-200 ${
        collapsed ? "w-14" : "w-56"
      }`}
    >
      {/* Logo — matches Raptor's sidebar header */}
      <div className="flex h-12 items-center gap-2 border-b px-3">
        <Zap className="h-4 w-4 text-primary shrink-0" />
        {!collapsed && <span className="font-semibold text-sm">Triceratops</span>}
      </div>

      {/* Navigation — matches Raptor's AdminNav */}
      <nav className="flex-1 space-y-4 overflow-y-auto p-3">
        {NAV.map((section) => (
          <div key={section.section}>
            {!collapsed && (
              <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {section.section}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = active === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelect(item.id)}
                    title={collapsed ? item.label : undefined}
                    className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors w-full ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    } ${collapsed ? "justify-center" : ""}`}
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

      {/* Collapse toggle */}
      <div className="border-t p-2">
        <button
          onClick={onToggle}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!collapsed && "Collapse"}
        </button>
      </div>
    </aside>
  );
}