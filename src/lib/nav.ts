import {
  LayoutDashboard,
  Users,
  MessageSquare,
  ScrollText,
  Wrench,
  BarChart3,
  type LucideIcon,
} from "lucide-react";
import type { TabId } from "@/lib/types";

export const TABS: { id: TabId; label: string; icon: LucideIcon; desc: string }[] = [
  { id: "Dashboard", label: "Dashboard", icon: LayoutDashboard, desc: "WhatsApp auto-reply control center · auto-refreshes every 15s" },
  { id: "Contacts", label: "Contacts", icon: Users, desc: "Blocklist and VIP contacts" },
  { id: "Messages", label: "Messages", icon: MessageSquare, desc: "Send ad-hoc messages and manage canned replies" },
  { id: "Logs", label: "Logs", icon: ScrollText, desc: "Bridge events and admin audit trail" },
  { id: "Tools", label: "Tools", icon: Wrench, desc: "Profile pics, PM2 control, and persona preview" },
  { id: "Analytics", label: "Analytics", icon: BarChart3, desc: "7-day activity summary for admin and bridge" },
];

export const NAV_SECTIONS: { section: string; ids: TabId[] }[] = [
  { section: "Overview", ids: ["Dashboard"] },
  { section: "WhatsApp", ids: ["Contacts", "Messages"] },
  { section: "System", ids: ["Logs", "Tools", "Analytics"] },
];
