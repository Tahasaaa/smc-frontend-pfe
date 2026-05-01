import type { AppNotification } from "@/types/notifications";

function minutesAgo(minutes: number) {
  return new Date(Date.now() - minutes * 60 * 1000).toISOString();
}

export const mockNotifications: AppNotification[] = [
  {
    id: "ntf-inc-001",
    title: "Critical incident detected",
    message:
      "High-impact 3G service degradation detected. Operator inspection is recommended.",
    severity: "critical",
    source: "incident",
    status: "unread",
    createdAt: minutesAgo(6),
    entityLabel: "INC-3G-1042",
    action: {
      label: "Open incident",
      href: "/incidents?incident=1",
    },
  },
  {
    id: "ntf-mon-001",
    title: "Threshold breach",
    message:
      "IUB congestion crossed the configured watch threshold in the active 3G scope.",
    severity: "major",
    source: "monitoring",
    status: "unread",
    createdAt: minutesAgo(18),
    entityLabel: "Monitoring · 3G",
    action: {
      label: "Open monitoring",
      href: "/monitoring",
    },
  },
  {
    id: "ntf-ai-001",
    title: "AI draft preparation queued",
    message:
      "A stakeholder communication draft can be generated once the internal email system is enabled.",
    severity: "info",
    source: "ai",
    status: "unread",
    createdAt: minutesAgo(42),
    entityLabel: "AI Assistant",
    action: {
      label: "Coming later",
      disabled: true,
    },
  },
  {
    id: "ntf-rca-001",
    title: "RCA package placeholder ready",
    message:
      "Future RCA reporting will support impact summary, root cause, action plan, and email-ready export.",
    severity: "warning",
    source: "rca",
    status: "read",
    createdAt: minutesAgo(140),
    entityLabel: "RCA Reporting",
    action: {
      label: "Open incidents",
      href: "/incidents",
    },
  },
  {
    id: "ntf-email-001",
    title: "Internal email system planned",
    message:
      "Inbox, sent, drafts, templates, compose, and AI-generated email actions will be added in Phase 2.",
    severity: "info",
    source: "email",
    status: "read",
    createdAt: minutesAgo(250),
    entityLabel: "Internal Mail",
    action: {
      label: "Coming later",
      disabled: true,
    },
  },
  {
    id: "ntf-system-001",
    title: "3G scope is active",
    message:
      "4G and 5G should remain clean Coming Soon states until their operational data is ready.",
    severity: "success",
    source: "system",
    status: "read",
    createdAt: minutesAgo(360),
    entityLabel: "Scope Control",
    action: {
      label: "Open dashboard",
      href: "/dashboard",
    },
  },
];