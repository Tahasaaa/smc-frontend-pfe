import {
  Activity,
  Bell,
  Bot,
  CheckCheck,
  ExternalLink,
  Inbox,
  Mail,
  Radio,
  Settings,
  ShieldAlert,
  Sparkles,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";

import {
  dismissNotification,
  loadNotificationsFromBackend,
  markAllNotificationsRead,
  markNotificationRead,
  useNotifications,
} from "@/stores/notificationStore";
import type {
  AppNotification,
  NotificationFilter,
  NotificationSeverity,
  NotificationSource,
} from "@/types/notifications";

const filters: Array<{ key: NotificationFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "critical", label: "Critical" },
  { key: "incidents", label: "Incidents" },
  { key: "monitoring", label: "Monitoring" },
  { key: "email", label: "Email" },
  { key: "rca", label: "RCA" },
  { key: "ai", label: "AI" },
  { key: "system", label: "System" },
];

type DrawerStyle = {
  top: number;
  right: number;
  bottom: number;
  width: number;
};

export default function NotificationBell() {
  const navigate = useNavigate();
  const notifications = useNotifications();

  const [open, setOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>("all");
  const [drawerStyle, setDrawerStyle] = useState<DrawerStyle | null>(null);

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const drawerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    void loadNotificationsFromBackend();

    function handleNotificationRefresh() {
      void loadNotificationsFromBackend();
    }

    window.addEventListener("notifications:refresh", handleNotificationRefresh);

    return () => {
      window.removeEventListener(
        "notifications:refresh",
        handleNotificationRefresh
      );
    };
  }, []);

  const sortedNotifications = useMemo(() => {
    return [...notifications].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [notifications]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => item.status === "unread").length,
    [notifications]
  );

  const filteredNotifications = useMemo(() => {
    return sortedNotifications.filter((item) => {
      if (activeFilter === "all") return true;
      if (activeFilter === "unread") return item.status === "unread";
      if (activeFilter === "critical") return item.severity === "critical";
      if (activeFilter === "incidents") return item.source === "incident";
      if (activeFilter === "monitoring") return item.source === "monitoring";
      if (activeFilter === "email") return item.source === "email";
      if (activeFilter === "rca") return item.source === "rca";
      if (activeFilter === "ai") return item.source === "ai";
      if (activeFilter === "system") return item.source === "system";
      return true;
    });
  }, [activeFilter, sortedNotifications]);

  const groupedNotifications = useMemo(() => {
    return filteredNotifications.reduce<Record<string, AppNotification[]>>(
      (acc, item) => {
        const group = getNotificationGroup(item.createdAt);
        acc[group] = acc[group] ? [...acc[group], item] : [item];
        return acc;
      },
      {}
    );
  }, [filteredNotifications]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const clickedDrawer = drawerRef.current?.contains(target);
      const clickedTrigger = triggerRef.current?.contains(target);

      if (!clickedDrawer && !clickedTrigger) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    function updateDrawerLayout() {
      const margin = 12;
      const trigger = triggerRef.current;

      const topbarHeader = trigger?.closest("header");
      const topbarRect = topbarHeader?.getBoundingClientRect();

      const top = Math.max(
        margin,
        Math.round((topbarRect?.bottom ?? 92) + margin)
      );

      const availableWidth = window.innerWidth - margin * 2;
      const width = Math.min(468, availableWidth);

      setDrawerStyle({
        top,
        right: margin,
        bottom: margin,
        width,
      });
    }

    updateDrawerLayout();

    window.addEventListener("resize", updateDrawerLayout);
    window.addEventListener("scroll", updateDrawerLayout, true);

    return () => {
      window.removeEventListener("resize", updateDrawerLayout);
      window.removeEventListener("scroll", updateDrawerLayout, true);
    };
  }, [open]);

  function openNotification(item: AppNotification) {
    void markNotificationRead(item.id);

    if (item.action?.href && !item.action.disabled) {
      setOpen(false);
      navigate(item.action.href);
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        onClick={() => setOpen((prev) => !prev)}
        className={[
          "premium-icon-button orange-ring-focus relative",
          open ? "border-orange-400/22 bg-orange-500/10 text-white" : "",
        ].join(" ")}
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell className="h-[18px] w-[18px]" />

        {unreadCount > 0 ? (
          <>
            <span className="absolute right-[8px] top-[8px] h-2.5 w-2.5 rounded-full bg-[#ff7900] shadow-[0_0_12px_rgba(255,121,0,0.55)]" />
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border border-[#19120b] bg-[#ff7900] px-1 text-[10px] font-bold text-black shadow-[0_8px_20px_rgba(255,121,0,0.24)]">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          </>
        ) : null}
      </button>

      {open && drawerStyle
        ? createPortal(
            <>
              <button
                type="button"
                aria-label="Close notification background"
                onClick={() => setOpen(false)}
                style={{
                  top: drawerStyle.top,
                  right: 0,
                  bottom: 0,
                  left: 0,
                  position: "fixed",
                  zIndex: 9996,
                }}
                className="cursor-default bg-[rgba(3,7,12,0.36)] backdrop-blur-[6px] animate-[notificationBackdropIn_160ms_ease-out]"
              />

              <aside
                ref={drawerRef}
                style={{
                  position: "fixed",
                  top: drawerStyle.top,
                  right: drawerStyle.right,
                  bottom: drawerStyle.bottom,
                  width: drawerStyle.width,
                  zIndex: 9998,
                }}
                className="flex overflow-hidden rounded-[1.35rem] border border-white/[0.09] bg-[linear-gradient(180deg,rgba(18,24,31,0.985),rgba(8,13,19,0.985))] shadow-[0_28px_80px_rgba(0,0,0,0.52)] backdrop-blur-xl animate-[notificationDrawerIn_220ms_ease-out]"
              >
                <div className="flex min-h-0 w-full flex-col">
                  <header className="shrink-0 border-b border-white/[0.06] px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/34">
                          Notification Center
                        </p>

                        <h3 className="mt-1 text-base font-semibold tracking-[-0.03em] text-white">
                          Operations Inbox
                        </h3>

                        <p className="mt-1 text-xs leading-5 text-white/42">
                          Incidents, monitoring alerts, AI suggestions, RCA
                          updates, email actions, and system events.
                        </p>
                      </div>

                      <button
                        onClick={() => setOpen(false)}
                        className="orange-ring-focus rounded-xl border border-white/[0.07] bg-white/[0.035] p-2 text-white/54 transition hover:bg-white/[0.07] hover:text-white"
                        aria-label="Close notifications"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                      <div className="inline-flex items-center gap-2 rounded-full border border-orange-400/14 bg-orange-500/10 px-3 py-1.5 text-xs font-medium text-orange-200">
                        <span className="h-2 w-2 rounded-full bg-[#ff7900]" />
                        {unreadCount} unread
                      </div>

                      <button
                        onClick={() => void markAllNotificationsRead()}
                        disabled={unreadCount === 0}
                        className="orange-ring-focus inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.035] px-3 py-1.5 text-xs font-medium text-white/62 transition hover:border-white/[0.12] hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <CheckCheck className="h-3.5 w-3.5" />
                        Mark all read
                      </button>
                    </div>
                  </header>

                  <div className="shrink-0 border-b border-white/[0.06] px-3 py-3">
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {filters.map((filter) => {
                        const active = activeFilter === filter.key;

                        return (
                          <button
                            key={filter.key}
                            onClick={() => setActiveFilter(filter.key)}
                            className={[
                              "orange-ring-focus shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition",
                              active
                                ? "border-orange-400/22 bg-orange-500/12 text-orange-200"
                                : "border-white/[0.07] bg-white/[0.025] text-white/48 hover:bg-white/[0.055] hover:text-white/78",
                            ].join(" ")}
                          >
                            {filter.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="min-h-0 flex-1 overflow-y-auto p-3">
                    {filteredNotifications.length === 0 ? (
                      <div className="flex min-h-[300px] flex-col items-center justify-center rounded-[1.1rem] border border-white/[0.06] bg-white/[0.02] px-4 text-center">
                        <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] border border-white/[0.07] bg-white/[0.035] text-white/44">
                          <Inbox className="h-5 w-5" />
                        </div>

                        <p className="mt-3 text-sm font-medium text-white/72">
                          No notifications here
                        </p>

                        <p className="mt-1 max-w-[280px] text-xs leading-5 text-white/38">
                          This filter has no matching operational events.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {Object.entries(groupedNotifications).map(
                          ([group, items]) => (
                            <section key={group}>
                              <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/28">
                                {group}
                              </p>

                              <div className="space-y-2">
                                {items.map((item) => (
                                  <NotificationItem
                                    key={item.id}
                                    item={item}
                                    onOpen={() => openNotification(item)}
                                    onDismiss={() =>
                                      void dismissNotification(item.id)
                                    }
                                  />
                                ))}
                              </div>
                            </section>
                          )
                        )}
                      </div>
                    )}
                  </div>

                  <footer className="shrink-0 border-t border-white/[0.06] px-4 py-3">
                    <div className="flex items-start gap-2 rounded-[1rem] border border-white/[0.06] bg-white/[0.025] px-3 py-3">
                      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#ff7900]" />

                      <p className="text-xs leading-5 text-white/42">
                        Notification store is connected to the notification
                        microservice. Email, RCA, incident, monitoring, and AI
                        actions can push operational events here.
                      </p>
                    </div>
                  </footer>
                </div>
              </aside>

              <style>{`
                @keyframes notificationDrawerIn {
                  from {
                    opacity: 0;
                    transform: translateX(18px) scale(0.985);
                  }
                  to {
                    opacity: 1;
                    transform: translateX(0) scale(1);
                  }
                }

                @keyframes notificationBackdropIn {
                  from {
                    opacity: 0;
                  }
                  to {
                    opacity: 1;
                  }
                }
              `}</style>
            </>,
            document.body
          )
        : null}
    </>
  );
}

function NotificationItem({
  item,
  onOpen,
  onDismiss,
}: {
  item: AppNotification;
  onOpen: () => void;
  onDismiss: () => void;
}) {
  const severity = severityMeta(item.severity);
  const source = sourceMeta(item.source);
  const unread = item.status === "unread";

  return (
    <div
      className={[
        "group relative overflow-hidden rounded-[1.12rem] border p-3 transition",
        unread
          ? "border-orange-400/14 bg-[linear-gradient(180deg,rgba(255,121,0,0.075),rgba(255,255,255,0.018))] shadow-[0_14px_32px_rgba(255,121,0,0.055)]"
          : "border-white/[0.06] bg-white/[0.022] hover:bg-white/[0.04]",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <div
          className={[
            "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.9rem] border",
            source.iconTone,
          ].join(" ")}
        >
          {source.icon}
        </div>

        <button onClick={onOpen} className="min-w-0 flex-1 text-left">
          <div className="flex flex-wrap items-center gap-2">
            {unread ? (
              <span className="h-2 w-2 rounded-full bg-[#ff7900] shadow-[0_0_10px_rgba(255,121,0,0.45)]" />
            ) : null}

            <span
              className={[
                "inline-flex rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em]",
                severity.className,
              ].join(" ")}
            >
              {severity.label}
            </span>

            <span className="text-[10px] font-semibold uppercase tracking-[0.13em] text-white/28">
              {source.label}
            </span>
          </div>

          <p className="mt-2 line-clamp-1 text-sm font-semibold text-white/90">
            {item.title}
          </p>

          <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/46">
            {item.message}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {item.entityLabel ? (
              <span className="rounded-full border border-white/[0.07] bg-white/[0.035] px-2.5 py-1 text-[10px] font-medium text-white/45">
                {item.entityLabel}
              </span>
            ) : null}

            <span className="text-[10px] text-white/28">
              {formatRelativeTime(item.createdAt)}
            </span>
          </div>
        </button>

        <button
          onClick={(event) => {
            event.stopPropagation();
            onDismiss();
          }}
          className="orange-ring-focus rounded-lg p-1.5 text-white/26 opacity-0 transition hover:bg-white/[0.06] hover:text-white/70 group-hover:opacity-100"
          aria-label="Dismiss notification"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/[0.05] pt-3">
        <span className="text-[10px] text-white/28">
          {unread ? "Unread event" : "Read event"}
        </span>

        {item.action ? (
          <button
            onClick={onOpen}
            disabled={item.action.disabled}
            className={[
              "orange-ring-focus inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[10px] font-semibold transition",
              item.action.disabled
                ? "cursor-not-allowed border-white/[0.06] bg-white/[0.025] text-white/28"
                : "border-orange-400/16 bg-orange-500/10 text-orange-200 hover:bg-orange-500/14",
            ].join(" ")}
          >
            {item.action.label}
            {!item.action.disabled ? (
              <ExternalLink className="h-3 w-3" />
            ) : null}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function sourceMeta(source: NotificationSource): {
  label: string;
  icon: ReactNode;
  iconTone: string;
} {
  if (source === "incident") {
    return {
      label: "Incident",
      icon: <ShieldAlert className="h-4 w-4" />,
      iconTone: "border-red-500/16 bg-red-500/10 text-red-300",
    };
  }

  if (source === "monitoring") {
    return {
      label: "Monitoring",
      icon: <Activity className="h-4 w-4" />,
      iconTone: "border-orange-500/16 bg-orange-500/10 text-orange-300",
    };
  }

  if (source === "email") {
    return {
      label: "Email",
      icon: <Mail className="h-4 w-4" />,
      iconTone: "border-violet-500/16 bg-violet-500/10 text-violet-300",
    };
  }

  if (source === "ai") {
    return {
      label: "AI",
      icon: <Bot className="h-4 w-4" />,
      iconTone: "border-sky-500/16 bg-sky-500/10 text-sky-300",
    };
  }

  if (source === "rca") {
    return {
      label: "RCA",
      icon: <Radio className="h-4 w-4" />,
      iconTone: "border-amber-500/16 bg-amber-500/10 text-amber-200",
    };
  }

  return {
    label: "System",
    icon: <Settings className="h-4 w-4" />,
    iconTone: "border-white/[0.08] bg-white/[0.04] text-white/62",
  };
}

function severityMeta(severity: NotificationSeverity) {
  if (severity === "critical") {
    return {
      label: "Critical",
      className: "border-red-500/20 bg-red-500/12 text-red-300",
    };
  }

  if (severity === "major") {
    return {
      label: "Major",
      className: "border-orange-500/20 bg-orange-500/12 text-orange-300",
    };
  }

  if (severity === "warning") {
    return {
      label: "Warning",
      className: "border-amber-500/20 bg-amber-500/12 text-amber-200",
    };
  }

  if (severity === "success") {
    return {
      label: "Stable",
      className: "border-emerald-500/20 bg-emerald-500/12 text-emerald-300",
    };
  }

  return {
    label: "Info",
    className: "border-sky-500/20 bg-sky-500/12 text-sky-300",
  };
}

function getNotificationGroup(input: string) {
  const date = new Date(input);
  const now = new Date();

  if (Number.isNaN(date.getTime())) return "Earlier";

  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (sameDay) return "Today";

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();

  if (isYesterday) return "Yesterday";

  return "Earlier";
}

function formatRelativeTime(input: string) {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return "Unknown time";

  const diffMs = Math.max(0, Date.now() - date.getTime());
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}