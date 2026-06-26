"use client";

import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { StoreProvider, useStore } from "@/components/store";
import { DashboardTab } from "@/components/tabs/dashboard-tab";
import { ContactsTab } from "@/components/tabs/contacts-tab";
import { MessagesTab } from "@/components/tabs/messages-tab";
import { LogsTab } from "@/components/tabs/logs-tab";
import { ToolsTab } from "@/components/tabs/tools-tab";
import { AnalyticsTab } from "@/components/tabs/analytics-tab";
import type { TabId } from "@/lib/types";

function AdminShell() {
  const [tab, setTab] = useState<TabId>("Dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data, error, setError, refresh, refreshing } = useStore();

  return (
    <div className="flex min-h-screen">
      <Sidebar
        active={tab}
        onSelect={setTab}
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          active={tab}
          onMenu={() => setMobileOpen(true)}
          onRefresh={refresh}
          refreshing={refreshing}
          health={data.health}
          error={error}
        />
        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-screen-2xl p-4 sm:p-6 lg:p-8">
            {error && (
              <div className="mb-4 flex items-center justify-between rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
                <span className="break-all">{error}</span>
                <button onClick={() => setError(null)} className="ml-3 shrink-0 underline">
                  dismiss
                </button>
              </div>
            )}
            {tab === "Dashboard" && <DashboardTab />}
            {tab === "Contacts" && <ContactsTab />}
            {tab === "Messages" && <MessagesTab />}
            {tab === "Logs" && <LogsTab />}
            {tab === "Tools" && <ToolsTab />}
            {tab === "Analytics" && <AnalyticsTab />}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <StoreProvider>
      <AdminShell />
    </StoreProvider>
  );
}
