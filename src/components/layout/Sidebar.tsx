import {
  LayoutGrid,
  Activity,
  Map,
  FileText,
  Mail,
  User,
  Settings,
  LogOut,
  Pin,
  Bot,
  BrainCircuit,
  BookOpenCheck,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { getStoredUser, logoutUser } from "@/services/auth";

const operationItems = [
  { label: "Dashboard", icon: LayoutGrid, to: "/dashboard" },
  { label: "Monitoring", icon: Activity, to: "/monitoring" },
  { label: "Map", icon: Map, to: "/map" },
  { label: "Incidents", icon: FileText, to: "/incidents" },
];

const intelligenceItems = [
  { label: "Assistant", icon: Bot, to: "/assistant" },
  { label: "RCA", icon: BrainCircuit, to: "/rca" },
  { label: "Runbooks", icon: BookOpenCheck, to: "/runbooks" },
];

const workspaceItems = [
  { label: "Mail", icon: Mail, to: "/mail" },
  { label: "Profile", icon: User, to: "/profile" },
  { label: "Settings", icon: Settings, to: "/settings" },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const [isPinned, setIsPinned] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const expanded = isPinned || isHovered;

  const initials = useMemo(() => {
    if (!user?.fullname) return "U";

    return user.fullname
      .split(" ")
      .map((part: string) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [user]);

  function handleLogout() {
    logoutUser();
    navigate("/login");
  }

  return (
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={[
        "app-surface sticky top-0 flex h-screen shrink-0 flex-col overflow-hidden",
        "border-r border-white/[0.06] text-white",
        "bg-[linear-gradient(180deg,#090c11_0%,#0b1016_42%,#0a0f15_100%)]",
        "shadow-[inset_-1px_0_0_rgba(255,255,255,0.02),18px_0_38px_rgba(0,0,0,0.24)]",
        "transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
        expanded ? "w-[278px]" : "w-[96px]",
      ].join(" ")}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top,rgba(255,121,0,0.10),transparent_62%)]" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-white/[0.04]" />

      <div className="relative flex h-[84px] items-center justify-between border-b border-white/[0.06] px-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.15rem] border border-orange-400/14 bg-[linear-gradient(180deg,#111722_0%,#0d141c_100%)] shadow-[0_12px_28px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.04)]">
            <div className="pointer-events-none absolute inset-0 rounded-[1.15rem] shadow-[inset_0_0_0_1px_rgba(255,121,0,0.06)]" />
            <img
              src="Orange_small.png"
              alt="Orange"
              width={28}
              height={28}
              className="relative z-10"
            />
          </div>

          <div
            className={[
              "min-w-0 overflow-hidden transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]",
              expanded
                ? "max-w-[180px] translate-x-0 opacity-100"
                : "max-w-0 -translate-x-3 opacity-0",
            ].join(" ")}
          >
            <p className="truncate text-[15px] font-semibold tracking-[-0.02em] text-white">
              SMC QoS Cockpit
            </p>
            <p className="truncate text-[11px] text-white/46">
              Orange Tunisia · Network Command
            </p>
          </div>
        </div>

        <div
          className={[
            "overflow-hidden transition-all duration-300",
            expanded ? "max-w-[52px] opacity-100" : "max-w-0 opacity-0",
          ].join(" ")}
        >
          <button
            onClick={() => setIsPinned((prev) => !prev)}
            className={[
              "premium-icon-button orange-ring-focus h-10 w-10 rounded-xl",
              isPinned
                ? "border-orange-400/24 bg-orange-500/12 text-orange-300 shadow-[0_0_0_1px_rgba(255,121,0,0.08),0_10px_22px_rgba(255,121,0,0.10)]"
                : "",
            ].join(" ")}
            aria-label={isPinned ? "Unpin sidebar" : "Pin sidebar"}
          >
            <Pin className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="px-4 pt-5">
        <div className="premium-panel accent-frame rounded-[1.25rem]">
          <div className="premium-panel-body px-3.5 py-3.5">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/35" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </span>

              <span
                className={[
                  "overflow-hidden text-[11px] font-semibold uppercase tracking-[0.14em] text-white/50 transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]",
                  expanded
                    ? "max-w-[170px] translate-x-0 opacity-100"
                    : "max-w-0 -translate-x-2 opacity-0",
                ].join(" ")}
              >
                Operational State
              </span>
            </div>

            <div
              className={[
                "overflow-hidden transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]",
                expanded
                  ? "mt-2.5 max-h-20 translate-y-0 opacity-100"
                  : "mt-0 max-h-0 -translate-y-2 opacity-0",
              ].join(" ")}
            >
              <p className="text-sm font-semibold tracking-[-0.02em] text-white">
                Live Supervision
              </p>
              <p className="mt-1 text-xs text-white/46">
                KPI, incidents, and regional telemetry online
              </p>
            </div>

            {!expanded ? (
              <div className="mt-2 flex justify-center">
                <span
                  className="status-pill good px-0 py-0 text-[0px]"
                  aria-hidden="true"
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-5">
        <SidebarSection title="Operations" expanded={expanded}>
          {operationItems.map((item) => (
            <SidebarNavItem
              key={item.to}
              label={item.label}
              to={item.to}
              expanded={expanded}
              icon={item.icon}
            />
          ))}
        </SidebarSection>

        <SidebarSection title="Intelligence" expanded={expanded}>
          {intelligenceItems.map((item) => (
            <SidebarNavItem
              key={item.to}
              label={item.label}
              to={item.to}
              expanded={expanded}
              icon={item.icon}
            />
          ))}
        </SidebarSection>

        <SidebarSection title="Workspace" expanded={expanded}>
          {workspaceItems.map((item) => (
            <SidebarNavItem
              key={item.to}
              label={item.label}
              to={item.to}
              expanded={expanded}
              icon={item.icon}
            />
          ))}
        </SidebarSection>
      </nav>

      <div className="border-t border-white/[0.06] p-4">
        <div className="premium-panel rounded-[1.25rem]">
          <div className="premium-panel-body px-3.5 py-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[0.95rem] border border-white/[0.07] bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                {initials}
              </div>

              <div
                className={[
                  "min-w-0 overflow-hidden transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]",
                  expanded
                    ? "max-w-[160px] translate-x-0 opacity-100"
                    : "max-w-0 -translate-x-3 opacity-0",
                ].join(" ")}
              >
                <p className="truncate text-sm font-medium text-white">
                  {user?.fullname || "User"}
                </p>
                <p className="truncate text-xs text-white/46">
                  {user?.role || "NOC Engineer"}
                </p>
              </div>
            </div>

            <div
              className={[
                "overflow-hidden transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]",
                expanded
                  ? "mt-3 max-h-16 translate-y-0 opacity-100"
                  : "mt-0 max-h-0 -translate-y-2 opacity-0",
              ].join(" ")}
            >
              <button
                onClick={handleLogout}
                className="premium-button-ghost orange-ring-focus flex w-full items-center justify-center gap-2 rounded-xl border-white/[0.08] text-white/80 hover:text-white"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function SidebarSection({
  title,
  expanded,
  children,
}: {
  title: string;
  expanded: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6 space-y-2">
      {expanded ? (
        <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/28">
          {title}
        </p>
      ) : null}

      {children}
    </div>
  );
}

function SidebarNavItem({
  label,
  to,
  expanded,
  icon: Icon,
}: {
  label: string;
  to: string;
  expanded: boolean;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <NavLink to={to}>
      {({ isActive }) => (
        <div
          className={[
            "group relative flex items-center gap-3 overflow-hidden rounded-[1.15rem] border px-3 py-3 transition-all duration-200",
            isActive
              ? "border-orange-400/14 bg-[linear-gradient(90deg,rgba(255,121,0,0.14),rgba(255,121,0,0.05))] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_10px_22px_rgba(255,121,0,0.08)]"
              : "border-transparent text-white/62 hover:border-white/[0.06] hover:bg-white/[0.035] hover:text-white",
          ].join(" ")}
        >
          <div
            className={[
              "absolute inset-y-[11px] left-0 w-[3px] rounded-r-full transition-all duration-200",
              isActive
                ? "bg-[#ff7900] opacity-100"
                : "bg-[#ff7900]/0 opacity-0 group-hover:bg-[#ff7900]/70 group-hover:opacity-100",
            ].join(" ")}
          />

          <div
            className={[
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.95rem] border transition-all duration-200",
              isActive
                ? "border-white/[0.08] bg-white/[0.07] text-white"
                : "border-white/[0.04] bg-white/[0.025] text-white/72 group-hover:border-white/[0.08] group-hover:bg-white/[0.05] group-hover:text-white",
            ].join(" ")}
          >
            <Icon className="h-[18px] w-[18px]" />
          </div>

          <span
            className={[
              "whitespace-nowrap text-sm font-medium tracking-[-0.01em] transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]",
              expanded
                ? "max-w-[160px] translate-x-0 opacity-100"
                : "max-w-0 -translate-x-3 overflow-hidden opacity-0",
            ].join(" ")}
          >
            {label}
          </span>

          {isActive && expanded ? (
            <span className="ml-auto hidden text-[10px] font-semibold uppercase tracking-[0.14em] text-orange-300/85 xl:inline">
              Active
            </span>
          ) : null}
        </div>
      )}
    </NavLink>
  );
}