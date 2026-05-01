export type NotificationSeverity =
  | "critical"
  | "major"
  | "warning"
  | "info"
  | "success";

export type NotificationSource =
  | "incident"
  | "monitoring"
  | "rca"
  | "ai"
  | "email"
  | "system";

export type NotificationStatus = "unread" | "read";

export type NotificationAction = {
  label: string;
  href?: string;
  disabled?: boolean;
};

export type AppNotification = {
  id: string;
  title: string;
  message: string;
  severity: NotificationSeverity;
  source: NotificationSource;
  status: NotificationStatus;
  createdAt: string;
  entityLabel?: string;
  action?: NotificationAction;
};

export type NotificationFilter =
  | "all"
  | "unread"
  | "critical"
  | "incidents"
  | "monitoring"
  | "email"
  | "rca"
  | "ai"
  | "system";