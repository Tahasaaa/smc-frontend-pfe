import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  Bell,
  Lock,
  Monitor,
  Palette,
  Shield,
  User,
  Wifi,
  Database,
} from "lucide-react";

type SettingsState = {
  criticalAlerts: boolean;
  majorAlerts: boolean;
  minorAlerts: boolean;
  dailyKpiReport: boolean;
  weeklySummary: boolean;
  systemUpdates: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  darkMode: boolean;
  compactMode: boolean;
  autoRefresh: boolean;
  defaultTechnology: string;
};

const STORAGE_KEY = "smc_qos_settings_v2";

const DEFAULT_SETTINGS: SettingsState = {
  criticalAlerts: true,
  majorAlerts: true,
  minorAlerts: false,
  dailyKpiReport: true,
  weeklySummary: true,
  systemUpdates: false,
  emailNotifications: true,
  smsNotifications: false,
  darkMode: false,
  compactMode: false,
  autoRefresh: true,
  defaultTechnology: "3G",
};

const settingsNav = [
  { key: "profile", label: "Profile", icon: User, active: false },
  { key: "notifications", label: "Notifications", icon: Bell, active: true },
  { key: "security", label: "Security", icon: Shield, active: false },
  { key: "appearance", label: "Appearance", icon: Palette, active: false },
  { key: "network", label: "Network Config", icon: Wifi, active: false },
  { key: "data", label: "Data & Export", icon: Database, active: false },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);
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

    setTimeout(() => {
      setSaved(false);
    }, 2000);
  }

  return (
    <AppShell>
      <div className="space-y-5">
        <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-[2rem] font-semibold tracking-[-0.03em] text-slate-900">
              Settings
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Control alerts, workspace behavior, and notification preferences
            </p>
          </div>

          <div className="flex items-center gap-2">
            {saved && (
              <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
                Settings saved
              </span>
            )}

            <button
              onClick={handleSave}
              className="rounded-2xl bg-[#ff7900] px-5 py-3 text-sm font-medium text-white shadow-[0_10px_24px_rgba(255,121,0,0.25)] hover:opacity-95"
            >
              Save Changes
            </button>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-[280px_1fr]">
          <aside className="rounded-[28px] border border-black/5 bg-white p-4 shadow-[0_8px_25px_rgba(15,23,42,0.04)]">
            <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
              Settings
            </p>

            <div className="space-y-2">
              {settingsNav.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.key}
                    type="button"
                    className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${
                      item.active
                        ? "border border-orange-200 bg-orange-50 text-[#ff7900]"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="space-y-5">
            <div className="rounded-[28px] border border-black/5 bg-white p-6 shadow-[0_8px_25px_rgba(15,23,42,0.04)]">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    Notification Preferences
                  </h2>
                  <p className="text-sm text-slate-500">
                    Control what alerts you receive
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <ToggleSetting
                  title="Critical Alarms"
                  description="Immediate notification for critical severity events"
                  checked={settings.criticalAlerts}
                  color="red"
                  onChange={(value) => updateSetting("criticalAlerts", value)}
                />
                <ToggleSetting
                  title="Major Alarms"
                  description="Notification for major severity incidents"
                  checked={settings.majorAlerts}
                  color="orange"
                  onChange={(value) => updateSetting("majorAlerts", value)}
                />
                <ToggleSetting
                  title="Minor Alarms"
                  description="Low priority notification for minor events"
                  checked={settings.minorAlerts}
                  color="yellow"
                  onChange={(value) => updateSetting("minorAlerts", value)}
                />
                <ToggleSetting
                  title="Daily KPI Report"
                  description="Automated daily performance summary email"
                  checked={settings.dailyKpiReport}
                  color="slate"
                  onChange={(value) => updateSetting("dailyKpiReport", value)}
                />
                <ToggleSetting
                  title="Weekly Summary Report"
                  description="Comprehensive weekly network analysis"
                  checked={settings.weeklySummary}
                  color="slate"
                  onChange={(value) => updateSetting("weeklySummary", value)}
                />
                <ToggleSetting
                  title="System Updates"
                  description="Platform updates and maintenance notifications"
                  checked={settings.systemUpdates}
                  color="slate"
                  onChange={(value) => updateSetting("systemUpdates", value)}
                />
                <ToggleSetting
                  title="Email Notifications"
                  description="Send alerts to your registered email address"
                  checked={settings.emailNotifications}
                  color="slate"
                  onChange={(value) => updateSetting("emailNotifications", value)}
                />
                <ToggleSetting
                  title="SMS Notifications"
                  description="Send alerts to your configured mobile number"
                  checked={settings.smsNotifications}
                  color="slate"
                  onChange={(value) => updateSetting("smsNotifications", value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <div className="rounded-[28px] border border-black/5 bg-white p-6 shadow-[0_8px_25px_rgba(15,23,42,0.04)]">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-[#ff7900]">
                    <Palette className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      Appearance
                    </h3>
                    <p className="text-sm text-slate-500">
                      Interface display behavior
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <ToggleSimple
                    label="Dark Mode"
                    checked={settings.darkMode}
                    onChange={(value) => updateSetting("darkMode", value)}
                  />
                  <ToggleSimple
                    label="Compact Mode"
                    checked={settings.compactMode}
                    onChange={(value) => updateSetting("compactMode", value)}
                  />
                </div>
              </div>

              <div className="rounded-[28px] border border-black/5 bg-white p-6 shadow-[0_8px_25px_rgba(15,23,42,0.04)]">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                    <Monitor className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      Workspace
                    </h3>
                    <p className="text-sm text-slate-500">
                      Default monitoring preferences
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <ToggleSimple
                    label="Auto Refresh"
                    checked={settings.autoRefresh}
                    onChange={(value) => updateSetting("autoRefresh", value)}
                  />

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-800">
                      Default Technology
                    </label>
                    <select
                      value={settings.defaultTechnology}
                      onChange={(e) =>
                        updateSetting("defaultTechnology", e.target.value)
                      }
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none focus:border-[#ff7900]"
                    >
                      <option value="3G">3G</option>
                      <option value="4G">4G</option>
                      <option value="5G">5G</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-orange-200 bg-orange-50 p-5 shadow-[0_8px_25px_rgba(255,121,0,0.06)]">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-[#ff7900]">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-orange-900">
                    Security & persistence note
                  </h3>
                  <p className="mt-1 text-sm text-orange-800">
                    These settings are currently stored locally for the demo and can later be connected to a backend user-preferences service.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function ToggleSetting({
  title,
  description,
  checked,
  onChange,
  color,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  color: "red" | "orange" | "yellow" | "slate";
}) {
  const dotClass =
    color === "red"
      ? "bg-gradient-to-br from-rose-400 to-red-600"
      : color === "orange"
      ? "bg-gradient-to-br from-orange-300 to-orange-500"
      : color === "yellow"
      ? "bg-gradient-to-br from-yellow-300 to-amber-500"
      : "bg-slate-300";

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 px-4 py-4 transition hover:bg-slate-50/70">
      <div className="flex items-start gap-3">
        <span className={`mt-1.5 h-3.5 w-3.5 rounded-full ${dotClass}`} />
        <div>
          <p className="text-sm font-medium text-slate-900">{title}</p>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
      </div>

      <ToggleSwitch checked={checked} onChange={onChange} />
    </div>
  );
}

function ToggleSimple({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
      <p className="text-sm font-medium text-slate-900">{label}</p>
      <ToggleSwitch checked={checked} onChange={onChange} />
    </div>
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
      className={`relative h-7 w-12 rounded-full transition ${
        checked ? "bg-[#ff7900] shadow-[0_6px_14px_rgba(255,121,0,0.25)]" : "bg-slate-300"
      }`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
          checked ? "left-6" : "left-1"
        }`}
      />
    </button>
  );
}