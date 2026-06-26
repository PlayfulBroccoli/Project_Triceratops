"use client";

import { useStore } from "@/components/store";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, PageHeader } from "./page-header";

export function AnalyticsTab() {
  const { data } = useStore();
  const { analytics } = data;

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" subtitle="7-day activity summary for admin and bridge." />
      {!analytics ? (
        <Card>
          <CardContent className="py-10">
            <EmptyState message="Loading analytics..." />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Admin Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics.admin.actions.map((a) => (
                    <div key={a.action} className="flex justify-between text-sm">
                      <span>{a.action}</span>
                      <Badge>{a.count}</Badge>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-muted-foreground">{analytics.admin.totalActions} total entries</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Bridge Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics.bridge.events.map((e) => (
                    <div key={e.action} className="flex justify-between text-sm">
                      <span>{e.action}</span>
                      <Badge>{e.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Daily Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      {["Date", "Admin", "Received", "Sent", "Ignored"].map((h) => (
                        <th key={h} className="px-3 py-2 font-medium">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.bridge.daily.map((d) => {
                      const adm = analytics.admin.daily.find((a) => a.date === d.date);
                      return (
                        <tr key={d.date} className="border-b last:border-0 hover:bg-muted/40">
                          <td className="px-3 py-2 font-medium">{d.date}</td>
                          <td className="px-3 py-2">{adm?.count || 0}</td>
                          <td className="px-3 py-2">{d.received}</td>
                          <td className="px-3 py-2">{d.sent}</td>
                          <td className="px-3 py-2">{d.ignored}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
