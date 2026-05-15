import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { addNotification } from "@/stores/notificationStore";
import {
  Activity,
  AlertTriangle,
  Bell,
  Bot,
  CheckCircle2,
  Database,
  Download,
  Eye,
  FileText,
  Gauge,
  Globe2,
  Layers,
  Lock,
  Mail,
  Map as MapIcon,
  Monitor,
  Palette,
  Radio,
  RefreshCcw,
  Save,
  Server,
  Shield,
  SlidersHorizontal,
  Sparkles,
  Wifi,
  Zap,
  type LucideIcon,
} from "lucide-react";

type SectionKey =
  | "notifications"
  | "security"
  | "appearance"
  | "monitoring"
  | "cartography"
  | "assistant"
  | "incidents"
  | "mail"
  | "data"
  | "system";

type SettingsState = {
  criticalAlerts: boolean;
  majorAlerts: boolean;
  minorAlerts: boolean;
  dailyKpiReport: boolean;
  weeklySummary: boolean;
  systemUpdates: boolean;
  emailNotifications: boolean;
  assistantNotifications: boolean;
  incidentNotifications: boolean;
  internalMailNotifications: boolean;

  otpVerification: boolean;
  sessionTimeout: boolean;
  sensitiveActionReauth: boolean;
  loginActivity: boolean;

  themeMode: "noc" | "dark" | "system";
  orangeGlow: "low" | "medium" | "high";
  compactMode: boolean;
  reduceAnimations: boolean;
  dashboardDensity: "comfortable" | "compact" | "dense";

  autoRefresh: boolean;
  refreshInterval: "15s" | "30s" | "60s" | "manual";
  defaultTechnology: "3G" | "4G" | "5G";
  showKpiHealthColors: boolean;
  showWorstSites: boolean;
  showDegradationQueue: boolean;

  defaultMapLayer: "health" | "traffic" | "incidents" | "availability";
  showSiteLabels: boolean;
  degradedSitesOnly: boolean;
  autoOpenSiteDetails: boolean;
  showMapLegend: boolean;

  defaultAssistantMode: "general" | "monitoring" | "incident" | "rca" | "email" | "map";
  includeMonitoringContext: boolean;
  includeIncidentContext: boolean;
  allowRcaDrafts: boolean;
  allowEmailDrafts: boolean;
  saveAssistantHistory: boolean;
  aiNotificationAfterAction: boolean;

  defaultIncidentStatus: "all" | "open" | "in_progress" | "resolved";
  highlightCriticalIncidents: boolean;
  autoSortBySeverity: boolean;
  showRootCauseHint: boolean;
  openLatestIncidentFirst: boolean;

  saveAiDrafts: boolean;
  confirmBeforeSendingEmail: boolean;
  showMailCounters: boolean;
  defaultEmailSignature: "short" | "professional" | "noc";

  exportIncidents: boolean;
  exportKpiReports: boolean;
  exportAssistantHistory: boolean;
  exportRcaPackage: boolean;
};

const STORAGE_KEY = "smc_qos_settings_v3";

const DEFAULT_SETTINGS: SettingsState = {
  criticalAlerts: true,
  majorAlerts: true,
  minorAlerts: false,
  dailyKpiReport: true,
  weeklySummary: true,
  systemUpdates: false,
  emailNotifications: true,
  assistantNotifications: true,
  incidentNotifications: true,
  internalMailNotifications: true,

  otpVerification: true,
  sessionTimeout: true,
  sensitiveActionReauth: true,
  loginActivity: true,

  themeMode: "noc",
  orangeGlow: "medium",
  compactMode: false,
  reduceAnimations: false,
  dashboardDensity: "comfortable",

  autoRefresh: true,
  refreshInterval: "30s",
  defaultTechnology: "3G",
  showKpiHealthColors: true,
  showWorstSites: true,
  showDegradationQueue: true,

  defaultMapLayer: "health",
  showSiteLabels: true,
  degradedSitesOnly: false,
  autoOpenSiteDetails: true,
  showMapLegend: true,

  defaultAssistantMode: "monitoring",
  includeMonitoringContext: true,
  includeIncidentContext: true,
  allowRcaDrafts: true,
  allowEmailDrafts: true,
  saveAssistantHistory: true,
  aiNotificationAfterAction: true,

  defaultIncidentStatus: "all",
  highlightCriticalIncidents: true,
  autoSortBySeverity: true,
  showRootCauseHint: true,
  openLatestIncidentFirst: false,

  saveAiDrafts: true,
  confirmBeforeSendingEmail: true,
  showMailCounters: true,
  defaultEmailSignature: "professional",

  exportIncidents: true,
  exportKpiReports: true,
  exportAssistantHistory: false,
  exportRcaPackage: true,
};

const settingsNav: Array<{
  key: SectionKey;
  label: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    key: "notifications",
    label: "Notifications",
    description: "Alert channels and toast behavior",
    icon: Bell,
  },
  {
    key: "security",
    label: "Security",
    description: "OTP, sessions, and access protection",
    icon: Shield,
  },
  {
    key: "appearance",
    label: "Appearance",
    description: "NOC visual density and motion",
    icon: Palette,
  },
  {
    key: "monitoring",
    label: "Monitoring",
    description: "KPI workbench defaults",
    icon: Activity,
  },
  {
    key: "cartography",
    label: "Map & Cartography",
    description: "Site map and health layer behavior",
    icon: MapIcon,
  },
  {
    key: "assistant",
    label: "Assistant AI",
    description: "Context, history, and AI actions",
    icon: Bot,
  },
  {
    key: "incidents",
    label: "Incident Workflow",
    description: "Filters, severity, and RCA hints",
    icon: AlertTriangle,
  },
  {
    key: "mail",
    label: "Internal Mail",
    description: "Drafts, signatures, and send safety",
    icon: Mail,
  },
  {
    key: "data",
    label: "Data & Export",
    description: "Reports, RCA packages, and snapshots",
    icon: Database,
  },
  {
    key: "system",
    label: "System",
    description: "Microservices and runtime status",
    icon: Server,
  },
];

const microservices = [
  { name: "Auth Service", port: "8000", db: "orange_auth", status: "online" },
  { name: "KPI Service", port: "8001", db: "orange_kpis", status: "online" },
  {
    name: "Incident Service",
    port: "8002",
    db: "orange_incidents",
    status: "online",
  },
  {
    name: "Assistant Service",
    port: "8003",
    db: "orange_assistant",
    status: "online",
  },
  {
    name: "Profile Service",
    port: "8004",
    db: "orange_profiles",
    status: "online",
  },
  {
    name: "Notification Service",
    port: "8005",
    db: "orange_notifications",
    status: "online",
  },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] =
    useState<SectionKey>("notifications");
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);

  const activeMeta = useMemo(
    () => settingsNav.find((item) => item.key === activeSection) ?? settingsNav[0],
    [activeSection]
  );

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as Partial<SettingsState>;
      setSettings({ ...DEFAULT_SETTINGS, ...parsed });
    } catch {
      setSettings(DEFAULT_SETTINGS);
    }
  }, []);

  function updateSetting<K extends keyof SettingsState>(
    key: K,
    value: SettingsState[K]
  ) {
    setSaved(false);
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    setSaved(true);

    addNotification({
      title: "Settings saved",
      message:
        "Your local SMC workspace preferences were saved successfully for this browser.",
      severity: "success",
      source: "system",
      entityLabel: "Settings",
    });

    window.setTimeout(() => {
      setSaved(false);
    }, 2200);
  }

  return (
    <AppShell>
      <div className="relative overflow-hidden rounded-[32px] border border-white/[0.08] bg-[#05070b] p-4 shadow-[0_30px_90px_rgba(0,0,0,0.38)] md:p-5">
        <div className="pointer-events-none absolute inset-0 opacity-80">
          <div className="absolute left-[-12%] top-[-18%] h-[360px] w-[360px] rounded-full bg-[#ff7900]/15 blur-[90px]" />
          <div className="absolute right-[-10%] top-[8%] h-[360px] w-[360px] rounded-full bg-sky-500/10 blur-[100px]" />
          <div className="absolute bottom-[-22%] left-[34%] h-[320px] w-[320px] rounded-full bg-violet-500/10 blur-[100px]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:52px_52px]" />
        </div>

        <div className="relative z-10 space-y-5">
          <section className="flex flex-col gap-4 rounded-[28px] border border-white/[0.08] bg-white/[0.035] p-5 backdrop-blur-xl md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#ff7900]/20 bg-[#ff7900]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#ffb36a]">
                <Sparkles className="h-3.5 w-3.5" />
                NOC Control Center
              </div>

              <h1 className="text-[2.15rem] font-semibold tracking-[-0.04em] text-white md:text-[2.55rem]">
                Settings
              </h1>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-white/54">
                Configure alerts, visual behavior, monitoring defaults, AI
                context, incident workflow, and system visibility for the SMC
                QoS platform.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {saved && (
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs font-medium text-emerald-200">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Settings saved
                </span>
              )}

              <button
                onClick={handleSave}
                className="orange-ring-focus inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#ff7900] to-[#ff9f1a] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(255,121,0,0.28)] transition hover:translate-y-[-1px] hover:shadow-[0_22px_48px_rgba(255,121,0,0.34)]"
              >
                <Save className="h-4 w-4" />
                Save Changes
              </button>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-5 xl:grid-cols-[320px_1fr]">
            <aside className="rounded-[30px] border border-white/[0.08] bg-white/[0.045] p-4 backdrop-blur-xl shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
              <div className="mb-4 flex items-center justify-between px-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/36">
                    Settings Menu
                  </p>
                  <p className="mt-1 text-sm text-white/58">
                    Local browser preferences
                  </p>
                </div>
                <SlidersHorizontal className="h-5 w-5 text-[#ff9f1a]" />
              </div>

              <div className="space-y-2">
                {settingsNav.map((item) => {
                  const Icon = item.icon;
                  const active = item.key === activeSection;

                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setActiveSection(item.key)}
                      className={[
                        "group flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left transition",
                        active
                          ? "border-[#ff7900]/35 bg-[#ff7900]/12 text-white shadow-[0_14px_32px_rgba(255,121,0,0.12)]"
                          : "border-white/[0.06] bg-black/10 text-white/54 hover:border-white/[0.12] hover:bg-white/[0.06] hover:text-white",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition",
                          active
                            ? "border-[#ff7900]/30 bg-[#ff7900]/15 text-[#ffb36a]"
                            : "border-white/[0.07] bg-white/[0.035] text-white/44 group-hover:text-[#ffb36a]",
                        ].join(" ")}
                      >
                        <Icon className="h-4.5 w-4.5" />
                      </span>

                      <span className="min-w-0">
                        <span className="block text-sm font-semibold">
                          {item.label}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-white/38">
                          {item.description}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </aside>

            <main className="space-y-5">
              <div className="rounded-[30px] border border-white/[0.08] bg-white/[0.045] p-5 backdrop-blur-xl shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
                <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#ff7900]/25 bg-[#ff7900]/12 text-[#ffb36a]">
                      <activeMeta.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold tracking-[-0.02em] text-white">
                        {activeMeta.label}
                      </h2>
                      <p className="text-sm text-white/46">
                        {activeMeta.description}
                      </p>
                    </div>
                  </div>

                  <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/[0.08] bg-black/20 px-3 py-2 text-xs font-medium text-white/54">
                    <Lock className="h-3.5 w-3.5 text-[#ff9f1a]" />
                    Stored locally, no backend required
                  </span>
                </div>

                {activeSection === "notifications" && (
                  <NotificationsSection
                    settings={settings}
                    updateSetting={updateSetting}
                  />
                )}

                {activeSection === "security" && (
                  <SecuritySection
                    settings={settings}
                    updateSetting={updateSetting}
                  />
                )}

                {activeSection === "appearance" && (
                  <AppearanceSection
                    settings={settings}
                    updateSetting={updateSetting}
                  />
                )}

                {activeSection === "monitoring" && (
                  <MonitoringSection
                    settings={settings}
                    updateSetting={updateSetting}
                  />
                )}

                {activeSection === "cartography" && (
                  <CartographySection
                    settings={settings}
                    updateSetting={updateSetting}
                  />
                )}

                {activeSection === "assistant" && (
                  <AssistantSection
                    settings={settings}
                    updateSetting={updateSetting}
                  />
                )}

                {activeSection === "incidents" && (
                  <IncidentsSection
                    settings={settings}
                    updateSetting={updateSetting}
                  />
                )}

                {activeSection === "mail" && (
                  <MailSection
                    settings={settings}
                    updateSetting={updateSetting}
                  />
                )}

                {activeSection === "data" && (
                  <DataSection
                    settings={settings}
                    updateSetting={updateSetting}
                  />
                )}

                {activeSection === "system" && <SystemSection />}
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <InsightCard
                  icon={Zap}
                  title="JWT-secured"
                  value="Bearer access"
                  description="All backend microservices validate Auth Service tokens."
                  tone="orange"
                />
                <InsightCard
                  icon={Database}
                  title="Split databases"
                  value="6 PostgreSQL DBs"
                  description="Every service owns its operational persistence layer."
                  tone="blue"
                />
                <InsightCard
                  icon={Bot}
                  title="AI workflow"
                  value="Context-aware"
                  description="Assistant uses monitoring and incident context for drafts."
                  tone="purple"
                />
              </div>
            </main>
          </section>
        </div>
      </div>
    </AppShell>
  );
}

function NotificationsSection({
  settings,
  updateSetting,
}: SectionProps) {
  return (
    <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
      <ToggleCard
        icon={AlertTriangle}
        title="Critical Alarms"
        description="Immediate notification for critical QoS degradation."
        checked={settings.criticalAlerts}
        severity="critical"
        onChange={(value) => updateSetting("criticalAlerts", value)}
      />
      <ToggleCard
        icon={Radio}
        title="Major Alarms"
        description="Notify operators when major network incidents appear."
        checked={settings.majorAlerts}
        severity="major"
        onChange={(value) => updateSetting("majorAlerts", value)}
      />
      <ToggleCard
        icon={Bell}
        title="Minor Alarms"
        description="Low-priority visibility for minor operational events."
        checked={settings.minorAlerts}
        severity="warning"
        onChange={(value) => updateSetting("minorAlerts", value)}
      />
      <ToggleCard
        icon={Gauge}
        title="Daily KPI Report"
        description="Daily performance summary for the active 3G scope."
        checked={settings.dailyKpiReport}
        onChange={(value) => updateSetting("dailyKpiReport", value)}
      />
      <ToggleCard
        icon={FileText}
        title="Weekly Summary Report"
        description="Weekly operational digest for QoS supervision."
        checked={settings.weeklySummary}
        onChange={(value) => updateSetting("weeklySummary", value)}
      />
      <ToggleCard
        icon={Bot}
        title="Assistant Notifications"
        description="Notify after AI drafts, RCA suggestions, and chat actions."
        checked={settings.assistantNotifications}
        tone="purple"
        onChange={(value) => updateSetting("assistantNotifications", value)}
      />
      <ToggleCard
        icon={AlertTriangle}
        title="Incident Updates"
        description="Notify when an incident changes severity or status."
        checked={settings.incidentNotifications}
        onChange={(value) => updateSetting("incidentNotifications", value)}
      />
      <ToggleCard
        icon={Mail}
        title="Internal Mail Notifications"
        description="Show toasts for sent emails, drafts, and AI-prepared messages."
        checked={settings.internalMailNotifications}
        onChange={(value) =>
          updateSetting("internalMailNotifications", value)
        }
      />
      <ToggleCard
        icon={Server}
        title="System Updates"
        description="Platform maintenance and microservice status updates."
        checked={settings.systemUpdates}
        onChange={(value) => updateSetting("systemUpdates", value)}
      />
      <ToggleCard
        icon={Mail}
        title="Email Notifications"
        description="Send important operational alerts to your registered email."
        checked={settings.emailNotifications}
        onChange={(value) => updateSetting("emailNotifications", value)}
      />
    </div>
  );
}

function SecuritySection({ settings, updateSetting }: SectionProps) {
  return (
    <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
      <ToggleCard
        icon={Lock}
        title="Email OTP Verification"
        description="Require verification code after valid login credentials."
        checked={settings.otpVerification}
        severity="success"
        onChange={(value) => updateSetting("otpVerification", value)}
      />
      <ToggleCard
        icon={RefreshCcw}
        title="Session Timeout"
        description="Expire inactive sessions to protect operational access."
        checked={settings.sessionTimeout}
        onChange={(value) => updateSetting("sessionTimeout", value)}
      />
      <ToggleCard
        icon={Shield}
        title="Sensitive Action Re-authentication"
        description="Ask for confirmation before critical changes."
        checked={settings.sensitiveActionReauth}
        onChange={(value) => updateSetting("sensitiveActionReauth", value)}
      />
      <ToggleCard
        icon={Eye}
        title="Login Activity Visibility"
        description="Show recent authentication activity in system panels."
        checked={settings.loginActivity}
        onChange={(value) => updateSetting("loginActivity", value)}
      />
      <InfoPanel
        icon={Shield}
        title="Security model"
        description="The platform uses Auth Service JWT tokens. Each microservice validates the same bearer token without sharing user tables."
      />
      <InfoPanel
        icon={Lock}
        title="Local preference mode"
        description="These toggles control frontend behavior for now. Backend persistence can be added later through a user-preferences service."
      />
    </div>
  );
}

function AppearanceSection({ settings, updateSetting }: SectionProps) {
  return (
    <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
      <SelectCard
        icon={Palette}
        title="Theme Mode"
        description="Choose the preferred visual mode for the workspace."
        value={settings.themeMode}
        options={[
          { label: "Dark NOC", value: "noc" },
          { label: "Classic Dark", value: "dark" },
          { label: "Follow System", value: "system" },
        ]}
        onChange={(value) =>
          updateSetting("themeMode", value as SettingsState["themeMode"])
        }
      />
      <SelectCard
        icon={Sparkles}
        title="Orange Glow Intensity"
        description="Control the intensity of Orange-branded glow effects."
        value={settings.orangeGlow}
        options={[
          { label: "Low", value: "low" },
          { label: "Medium", value: "medium" },
          { label: "High", value: "high" },
        ]}
        onChange={(value) =>
          updateSetting("orangeGlow", value as SettingsState["orangeGlow"])
        }
      />
      <ToggleCard
        icon={Layers}
        title="Compact Mode"
        description="Reduce spacing for dense supervision screens."
        checked={settings.compactMode}
        onChange={(value) => updateSetting("compactMode", value)}
      />
      <ToggleCard
        icon={Activity}
        title="Reduce Animations"
        description="Limit transitions for lower motion and better performance."
        checked={settings.reduceAnimations}
        onChange={(value) => updateSetting("reduceAnimations", value)}
      />
      <SelectCard
        icon={Monitor}
        title="Dashboard Density"
        description="Choose how much information appears in each dashboard zone."
        value={settings.dashboardDensity}
        options={[
          { label: "Comfortable", value: "comfortable" },
          { label: "Compact", value: "compact" },
          { label: "Dense", value: "dense" },
        ]}
        onChange={(value) =>
          updateSetting(
            "dashboardDensity",
            value as SettingsState["dashboardDensity"]
          )
        }
      />
      <PreviewPanel />
    </div>
  );
}

function MonitoringSection({ settings, updateSetting }: SectionProps) {
  return (
    <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
      <SelectCard
        icon={Wifi}
        title="Default Technology"
        description="Current live operational scope for the platform."
        value={settings.defaultTechnology}
        options={[
          { label: "3G - Live", value: "3G" },
          { label: "4G - Coming Soon", value: "4G" },
          { label: "5G - Coming Soon", value: "5G" },
        ]}
        onChange={(value) =>
          updateSetting(
            "defaultTechnology",
            value as SettingsState["defaultTechnology"]
          )
        }
      />
      <SelectCard
        icon={RefreshCcw}
        title="Refresh Interval"
        description="Default update rhythm for monitoring widgets."
        value={settings.refreshInterval}
        options={[
          { label: "15 seconds", value: "15s" },
          { label: "30 seconds", value: "30s" },
          { label: "60 seconds", value: "60s" },
          { label: "Manual refresh", value: "manual" },
        ]}
        onChange={(value) =>
          updateSetting(
            "refreshInterval",
            value as SettingsState["refreshInterval"]
          )
        }
      />
      <ToggleCard
        icon={RefreshCcw}
        title="Auto-refresh Monitoring Data"
        description="Automatically update KPIs and operational panels."
        checked={settings.autoRefresh}
        onChange={(value) => updateSetting("autoRefresh", value)}
      />
      <ToggleCard
        icon={Gauge}
        title="KPI Health Colors"
        description="Use health-score coloring across monitoring widgets."
        checked={settings.showKpiHealthColors}
        onChange={(value) => updateSetting("showKpiHealthColors", value)}
      />
      <ToggleCard
        icon={AlertTriangle}
        title="Worst Sites Table"
        description="Show the most degraded sites in the workbench."
        checked={settings.showWorstSites}
        onChange={(value) => updateSetting("showWorstSites", value)}
      />
      <ToggleCard
        icon={Activity}
        title="Degradation Queue"
        description="Keep the operational degradation queue visible."
        checked={settings.showDegradationQueue}
        onChange={(value) => updateSetting("showDegradationQueue", value)}
      />
    </div>
  );
}

function CartographySection({ settings, updateSetting }: SectionProps) {
  return (
    <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
      <SelectCard
        icon={MapIcon}
        title="Default Map Layer"
        description="Choose the first cartography layer shown on map load."
        value={settings.defaultMapLayer}
        options={[
          { label: "Health Score", value: "health" },
          { label: "Traffic", value: "traffic" },
          { label: "Incidents", value: "incidents" },
          { label: "Availability", value: "availability" },
        ]}
        onChange={(value) =>
          updateSetting(
            "defaultMapLayer",
            value as SettingsState["defaultMapLayer"]
          )
        }
      />
      <ToggleCard
        icon={Eye}
        title="Show Site Labels"
        description="Display NodeB/site names directly on the map."
        checked={settings.showSiteLabels}
        onChange={(value) => updateSetting("showSiteLabels", value)}
      />
      <ToggleCard
        icon={AlertTriangle}
        title="Degraded Sites Only"
        description="Filter cartography to warning and critical sites."
        checked={settings.degradedSitesOnly}
        onChange={(value) => updateSetting("degradedSitesOnly", value)}
      />
      <ToggleCard
        icon={Layers}
        title="Auto-open Site Details"
        description="Open the site detail panel when selecting a site."
        checked={settings.autoOpenSiteDetails}
        onChange={(value) => updateSetting("autoOpenSiteDetails", value)}
      />
      <ToggleCard
        icon={MapIcon}
        title="Show Legend by Default"
        description="Keep the cartography legend visible on map load."
        checked={settings.showMapLegend}
        onChange={(value) => updateSetting("showMapLegend", value)}
      />
      <InfoPanel
        icon={Globe2}
        title="Cartography scope"
        description="This affects frontend behavior only. KPI and cartography APIs remain unchanged."
      />
    </div>
  );
}

function AssistantSection({ settings, updateSetting }: SectionProps) {
  return (
    <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
      <SelectCard
        icon={Bot}
        title="Default Assistant Mode"
        description="Choose which mode opens first in the NOC assistant."
        value={settings.defaultAssistantMode}
        options={[
          { label: "General", value: "general" },
          { label: "Monitoring", value: "monitoring" },
          { label: "Incident", value: "incident" },
          { label: "RCA", value: "rca" },
          { label: "Email", value: "email" },
          { label: "Map", value: "map" },
        ]}
        onChange={(value) =>
          updateSetting(
            "defaultAssistantMode",
            value as SettingsState["defaultAssistantMode"]
          )
        }
      />
      <ToggleCard
        icon={Gauge}
        title="Include Monitoring Context"
        description="Attach KPI, site, and scope context to assistant prompts."
        checked={settings.includeMonitoringContext}
        tone="purple"
        onChange={(value) => updateSetting("includeMonitoringContext", value)}
      />
      <ToggleCard
        icon={AlertTriangle}
        title="Include Incident Context"
        description="Attach selected incident context to assistant prompts."
        checked={settings.includeIncidentContext}
        tone="purple"
        onChange={(value) => updateSetting("includeIncidentContext", value)}
      />
      <ToggleCard
        icon={FileText}
        title="Allow RCA Draft Generation"
        description="Enable structured RCA draft output from the assistant."
        checked={settings.allowRcaDrafts}
        tone="purple"
        onChange={(value) => updateSetting("allowRcaDrafts", value)}
      />
      <ToggleCard
        icon={Mail}
        title="Allow Email Draft Generation"
        description="Enable stakeholder-ready email draft generation."
        checked={settings.allowEmailDrafts}
        tone="purple"
        onChange={(value) => updateSetting("allowEmailDrafts", value)}
      />
      <ToggleCard
        icon={Bell}
        title="Notify After AI Actions"
        description="Create notifications after AI draft or RCA preparation."
        checked={settings.aiNotificationAfterAction}
        tone="purple"
        onChange={(value) =>
          updateSetting("aiNotificationAfterAction", value)
        }
      />
      <ToggleCard
        icon={Database}
        title="Save Assistant History"
        description="Keep assistant conversations available in history."
        checked={settings.saveAssistantHistory}
        tone="purple"
        onChange={(value) => updateSetting("saveAssistantHistory", value)}
      />
    </div>
  );
}

function IncidentsSection({ settings, updateSetting }: SectionProps) {
  return (
    <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
      <SelectCard
        icon={AlertTriangle}
        title="Default Incident Filter"
        description="Choose the default status filter on incident page load."
        value={settings.defaultIncidentStatus}
        options={[
          { label: "All incidents", value: "all" },
          { label: "Open", value: "open" },
          { label: "In progress", value: "in_progress" },
          { label: "Resolved", value: "resolved" },
        ]}
        onChange={(value) =>
          updateSetting(
            "defaultIncidentStatus",
            value as SettingsState["defaultIncidentStatus"]
          )
        }
      />
      <ToggleCard
        icon={AlertTriangle}
        title="Highlight Critical Incidents"
        description="Use stronger contrast for critical operational incidents."
        checked={settings.highlightCriticalIncidents}
        severity="critical"
        onChange={(value) =>
          updateSetting("highlightCriticalIncidents", value)
        }
      />
      <ToggleCard
        icon={SlidersHorizontal}
        title="Auto-sort by Severity"
        description="Prioritize critical and major incidents by default."
        checked={settings.autoSortBySeverity}
        onChange={(value) => updateSetting("autoSortBySeverity", value)}
      />
      <ToggleCard
        icon={Bot}
        title="Show Root Cause Hint"
        description="Display AI-compatible root-cause hints when available."
        checked={settings.showRootCauseHint}
        onChange={(value) => updateSetting("showRootCauseHint", value)}
      />
      <ToggleCard
        icon={Eye}
        title="Open Latest Incident First"
        description="Focus on the newest incident when entering the page."
        checked={settings.openLatestIncidentFirst}
        onChange={(value) => updateSetting("openLatestIncidentFirst", value)}
      />
      <InfoPanel
        icon={FileText}
        title="RCA workflow"
        description="Incident context can be passed into the Assistant Service for RCA draft generation."
      />
    </div>
  );
}

function MailSection({ settings, updateSetting }: SectionProps) {
  return (
    <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
      <ToggleCard
        icon={Mail}
        title="Save AI-generated Drafts"
        description="Keep assistant-generated emails in draft state before sending."
        checked={settings.saveAiDrafts}
        onChange={(value) => updateSetting("saveAiDrafts", value)}
      />
      <ToggleCard
        icon={Shield}
        title="Confirm Before Sending"
        description="Ask for confirmation before sending internal emails."
        checked={settings.confirmBeforeSendingEmail}
        onChange={(value) => updateSetting("confirmBeforeSendingEmail", value)}
      />
      <ToggleCard
        icon={Gauge}
        title="Show Mail Counters"
        description="Display inbox, drafts, and sent counters in the mail page."
        checked={settings.showMailCounters}
        onChange={(value) => updateSetting("showMailCounters", value)}
      />
      <ToggleCard
        icon={Bell}
        title="Mail Notifications"
        description="Show toast notifications for email sent and draft saved."
        checked={settings.internalMailNotifications}
        onChange={(value) =>
          updateSetting("internalMailNotifications", value)
        }
      />
      <SelectCard
        icon={FileText}
        title="Default Email Signature"
        description="Choose the signature style for operational emails."
        value={settings.defaultEmailSignature}
        options={[
          { label: "Short", value: "short" },
          { label: "Professional", value: "professional" },
          { label: "NOC Operations", value: "noc" },
        ]}
        onChange={(value) =>
          updateSetting(
            "defaultEmailSignature",
            value as SettingsState["defaultEmailSignature"]
          )
        }
      />
      <InfoPanel
        icon={Mail}
        title="Internal Mail status"
        description="These controls prepare the page behavior. Backend mail persistence can be added later if needed."
      />
    </div>
  );
}

function DataSection({ settings, updateSetting }: SectionProps) {
  return (
    <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
      <ToggleCard
        icon={Download}
        title="Export Incidents"
        description="Allow incident list and detail exports for reporting."
        checked={settings.exportIncidents}
        onChange={(value) => updateSetting("exportIncidents", value)}
      />
      <ToggleCard
        icon={Gauge}
        title="Export KPI Reports"
        description="Allow KPI snapshots and performance summaries to be exported."
        checked={settings.exportKpiReports}
        onChange={(value) => updateSetting("exportKpiReports", value)}
      />
      <ToggleCard
        icon={Bot}
        title="Export Assistant Conversations"
        description="Allow assistant history export for audit and training review."
        checked={settings.exportAssistantHistory}
        onChange={(value) => updateSetting("exportAssistantHistory", value)}
      />
      <ToggleCard
        icon={FileText}
        title="Export RCA Package"
        description="Prepare incident, KPI, RCA, and email draft package export."
        checked={settings.exportRcaPackage}
        onChange={(value) => updateSetting("exportRcaPackage", value)}
      />
      <InfoPanel
        icon={Database}
        title="Export readiness"
        description="Export controls are frontend preferences for now. They can later map to dedicated export endpoints."
      />
      <InfoPanel
        icon={Shield}
        title="Privacy note"
        description="No export is executed from this settings screen. It only stores local export preferences."
      />
    </div>
  );
}

function SystemSection() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        {microservices.map((service) => (
          <div
            key={service.name}
            className="rounded-2xl border border-white/[0.08] bg-black/20 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.7)]" />
                  <h3 className="text-sm font-semibold text-white">
                    {service.name}
                  </h3>
                </div>
                <p className="mt-2 text-xs text-white/42">
                  Port {service.port} · PostgreSQL database
                </p>
              </div>
              <StatusPill label={service.status} />
            </div>

            <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.035] px-3 py-2">
              <p className="text-[11px] uppercase tracking-[0.14em] text-white/30">
                Database
              </p>
              <p className="mt-1 font-mono text-xs text-[#ffb36a]">
                {service.db}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-[#ff7900]/20 bg-[#ff7900]/10 p-4">
        <div className="flex gap-3">
          <Server className="mt-0.5 h-5 w-5 shrink-0 text-[#ffb36a]" />
          <div>
            <h3 className="text-sm font-semibold text-white">
              Microservices architecture checkpoint
            </h3>
            <p className="mt-1 text-sm leading-6 text-white/52">
              The platform is currently structured as separated Django REST
              services with dedicated PostgreSQL databases. This panel is a
              frontend status overview for the demo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

type SectionProps = {
  settings: SettingsState;
  updateSetting: <K extends keyof SettingsState>(
    key: K,
    value: SettingsState[K]
  ) => void;
};

function ToggleCard({
  icon: Icon,
  title,
  description,
  checked,
  onChange,
  severity,
  tone = "blue",
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  severity?: "critical" | "major" | "warning" | "success";
  tone?: "blue" | "purple";
}) {
  const dotClass =
    severity === "critical"
      ? "bg-rose-400 shadow-[0_0_16px_rgba(251,113,133,0.7)]"
      : severity === "major"
      ? "bg-orange-400 shadow-[0_0_16px_rgba(251,146,60,0.7)]"
      : severity === "warning"
      ? "bg-amber-300 shadow-[0_0_16px_rgba(252,211,77,0.6)]"
      : severity === "success"
      ? "bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.6)]"
      : "bg-sky-300 shadow-[0_0_16px_rgba(125,211,252,0.45)]";

  const iconClass =
    tone === "purple"
      ? "border-violet-400/20 bg-violet-400/10 text-violet-200"
      : "border-sky-400/20 bg-sky-400/10 text-sky-200";

  return (
    <div className="group rounded-2xl border border-white/[0.08] bg-black/20 p-4 transition hover:border-[#ff7900]/20 hover:bg-white/[0.055]">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${iconClass}`}
          >
            <Icon className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${dotClass}`} />
              <p className="truncate text-sm font-semibold text-white">
                {title}
              </p>
            </div>
            <p className="mt-1.5 text-sm leading-5 text-white/44">
              {description}
            </p>
          </div>
        </div>

        <ToggleSwitch checked={checked} onChange={onChange} />
      </div>
    </div>
  );
}

function SelectCard({
  icon: Icon,
  title,
  description,
  value,
  options,
  onChange,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  value: string;
  options: Array<{ label: string; value: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-4 transition hover:border-[#ff7900]/20 hover:bg-white/[0.055]">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#ff7900]/20 bg-[#ff7900]/10 text-[#ffb36a]">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="mt-1 text-sm leading-5 text-white/44">{description}</p>
        </div>
      </div>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-2xl border border-white/[0.08] bg-[#0b1018] px-4 text-sm font-medium text-white outline-none transition focus:border-[#ff7900]/50 focus:ring-4 focus:ring-[#ff7900]/10"
      >
        {options.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function InfoPanel({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4">
      <div className="flex gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.045] text-white/60">
          <Icon className="h-4.5 w-4.5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="mt-1 text-sm leading-5 text-white/44">{description}</p>
        </div>
      </div>
    </div>
  );
}

function PreviewPanel() {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-black/20 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-white">NOC Theme Preview</p>
        <span className="rounded-full bg-[#ff7900]/15 px-2.5 py-1 text-[11px] font-semibold text-[#ffb36a]">
          Option B
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="h-16 rounded-2xl border border-[#ff7900]/20 bg-[#ff7900]/10" />
        <div className="h-16 rounded-2xl border border-sky-400/20 bg-sky-400/10" />
        <div className="h-16 rounded-2xl border border-violet-400/20 bg-violet-400/10" />
      </div>

      <p className="mt-3 text-xs leading-5 text-white/42">
        Dark glass panels, Orange accent glow, and high-contrast NOC controls.
      </p>
    </div>
  );
}

function InsightCard({
  icon: Icon,
  title,
  value,
  description,
  tone,
}: {
  icon: LucideIcon;
  title: string;
  value: string;
  description: string;
  tone: "orange" | "blue" | "purple";
}) {
  const toneClass =
    tone === "orange"
      ? "border-[#ff7900]/20 bg-[#ff7900]/10 text-[#ffb36a]"
      : tone === "purple"
      ? "border-violet-400/20 bg-violet-400/10 text-violet-200"
      : "border-sky-400/20 bg-sky-400/10 text-sky-200";

  return (
    <div className="rounded-[26px] border border-white/[0.08] bg-white/[0.04] p-5 backdrop-blur-xl">
      <div
        className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border ${toneClass}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/32">
        {title}
      </p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
      <p className="mt-1 text-sm leading-5 text-white/42">{description}</p>
    </div>
  );
}

function StatusPill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-200">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
      {label}
    </span>
  );
}

function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={[
        "relative h-7 w-12 shrink-0 rounded-full border transition",
        checked
          ? "border-[#ff7900]/30 bg-[#ff7900] shadow-[0_0_22px_rgba(255,121,0,0.35)]"
          : "border-white/[0.08] bg-white/[0.12]",
      ].join(" ")}
      aria-pressed={checked}
    >
      <span
        className={[
          "absolute top-1 h-5 w-5 rounded-full bg-white shadow transition",
          checked ? "left-6" : "left-1",
        ].join(" ")}
      />
    </button>
  );
}